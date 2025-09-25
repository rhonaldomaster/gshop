import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentV2, Invoice, PaymentMethodEntity, CryptoTransaction, PaymentMethod, PaymentStatus, InvoiceStatus } from './payments-v2.entity';
import { CreatePaymentDto, CreateInvoiceDto, CreatePaymentMethodDto, ProcessCryptoPaymentDto } from './dto';
import Stripe from 'stripe';
import { ethers } from 'ethers';

@Injectable()
export class PaymentsV2Service {
  private stripe: Stripe;
  private polygonProvider: ethers.JsonRpcProvider;
  private usdcContractAddress = '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'; // USDC on Polygon

  constructor(
    @InjectRepository(PaymentV2)
    private paymentRepository: Repository<PaymentV2>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(PaymentMethodEntity)
    private paymentMethodRepository: Repository<PaymentMethodEntity>,
    @InjectRepository(CryptoTransaction)
    private cryptoTransactionRepository: Repository<CryptoTransaction>,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-08-27.basil',
    });

    this.polygonProvider = new ethers.JsonRpcProvider(
      process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com'
    );
  }

  // Payment Processing
  async createPayment(createPaymentDto: CreatePaymentDto): Promise<PaymentV2> {
    const payment = this.paymentRepository.create(createPaymentDto);
    return this.paymentRepository.save(payment);
  }

  async processStripePayment(paymentId: string, paymentMethodId: string): Promise<PaymentV2> {
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    try {
      payment.status = PaymentStatus.PROCESSING;
      await this.paymentRepository.save(payment);

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(payment.amount * 100), // Convert to cents
        currency: payment.currency.toLowerCase(),
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        return_url: `${process.env.APP_URL}/payment/complete`,
      });

      payment.stripePaymentIntentId = paymentIntent.id;

      if (paymentIntent.status === 'succeeded') {
        payment.status = PaymentStatus.COMPLETED;
        payment.processedAt = new Date();
      } else if (paymentIntent.status === 'requires_action') {
        payment.status = PaymentStatus.PENDING;
      } else {
        payment.status = PaymentStatus.FAILED;
        payment.failureReason = 'Payment failed at Stripe';
      }

      return this.paymentRepository.save(payment);
    } catch (error) {
      payment.status = PaymentStatus.FAILED;
      payment.failureReason = error.message;
      return this.paymentRepository.save(payment);
    }
  }

  async processCryptoPayment(paymentId: string, cryptoPaymentDto: ProcessCryptoPaymentDto): Promise<PaymentV2> {
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    try {
      payment.status = PaymentStatus.PROCESSING;
      payment.polygonTxHash = cryptoPaymentDto.txHash;
      payment.polygonFromAddress = cryptoPaymentDto.fromAddress;
      payment.polygonToAddress = cryptoPaymentDto.toAddress;
      payment.cryptoAmount = cryptoPaymentDto.amount;
      payment.cryptoCurrency = 'USDC';

      await this.paymentRepository.save(payment);

      // Create crypto transaction record
      const cryptoTx = this.cryptoTransactionRepository.create({
        paymentId: payment.id,
        txHash: cryptoPaymentDto.txHash,
        fromAddress: cryptoPaymentDto.fromAddress,
        toAddress: cryptoPaymentDto.toAddress,
        amount: cryptoPaymentDto.amount,
        currency: 'USDC',
        status: PaymentStatus.PROCESSING,
      });

      await this.cryptoTransactionRepository.save(cryptoTx);

      // Verify transaction on blockchain
      await this.verifyCryptoTransaction(cryptoTx.id);

      return this.paymentRepository.findOne({ where: { id: paymentId } });
    } catch (error) {
      payment.status = PaymentStatus.FAILED;
      payment.failureReason = error.message;
      return this.paymentRepository.save(payment);
    }
  }

  async verifyCryptoTransaction(cryptoTxId: string): Promise<void> {
    const cryptoTx = await this.cryptoTransactionRepository.findOne({
      where: { id: cryptoTxId },
      relations: ['payment'],
    });

    if (!cryptoTx) {
      throw new NotFoundException('Crypto transaction not found');
    }

    try {
      const tx = await this.polygonProvider.getTransaction(cryptoTx.txHash);
      if (!tx) {
        throw new Error('Transaction not found on blockchain');
      }

      const receipt = await this.polygonProvider.getTransactionReceipt(cryptoTx.txHash);
      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      cryptoTx.blockNumber = receipt.blockNumber;
      const confirmations = typeof receipt.confirmations === 'function'
        ? await receipt.confirmations()
        : (receipt.confirmations || 0);
      cryptoTx.confirmations = Number(confirmations);
      cryptoTx.gasFee = Number(ethers.formatEther(receipt.gasUsed * receipt.gasPrice));

      if (receipt.status === 1) {
        cryptoTx.status = PaymentStatus.COMPLETED;
        cryptoTx.confirmedAt = new Date();

        // Update main payment status
        cryptoTx.payment.status = PaymentStatus.COMPLETED;
        cryptoTx.payment.processedAt = new Date();
        await this.paymentRepository.save(cryptoTx.payment);
      } else {
        cryptoTx.status = PaymentStatus.FAILED;
        cryptoTx.payment.status = PaymentStatus.FAILED;
        cryptoTx.payment.failureReason = 'Transaction failed on blockchain';
        await this.paymentRepository.save(cryptoTx.payment);
      }

      await this.cryptoTransactionRepository.save(cryptoTx);
    } catch (error) {
      cryptoTx.status = PaymentStatus.FAILED;
      cryptoTx.payment.status = PaymentStatus.FAILED;
      cryptoTx.payment.failureReason = error.message;

      await this.cryptoTransactionRepository.save(cryptoTx);
      await this.paymentRepository.save(cryptoTx.payment);
    }
  }

  async getPayment(paymentId: string): Promise<PaymentV2> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['user'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async getUserPayments(userId: string): Promise<PaymentV2[]> {
    return this.paymentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  // Payment Methods
  async createPaymentMethod(userId: string, createPaymentMethodDto: CreatePaymentMethodDto): Promise<PaymentMethodEntity> {
    const paymentMethod = this.paymentMethodRepository.create({
      ...createPaymentMethodDto,
      userId,
    });

    return this.paymentMethodRepository.save(paymentMethod);
  }

  async getUserPaymentMethods(userId: string): Promise<PaymentMethodEntity[]> {
    return this.paymentMethodRepository.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async deletePaymentMethod(paymentMethodId: string, userId: string): Promise<void> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: paymentMethodId, userId },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    paymentMethod.isActive = false;
    await this.paymentMethodRepository.save(paymentMethod);
  }

  // Invoice Management
  async createInvoice(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    const invoiceNumber = this.generateInvoiceNumber();

    const invoice = this.invoiceRepository.create({
      ...createInvoiceDto,
      invoiceNumber,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);

    // Generate PDF
    await this.generateInvoicePDF(savedInvoice.id);

    return savedInvoice;
  }

  async getInvoice(invoiceId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['buyer'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async updateInvoiceStatus(invoiceId: string, status: InvoiceStatus): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({ where: { id: invoiceId } });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    invoice.status = status;

    if (status === InvoiceStatus.PAID) {
      invoice.paidDate = new Date();
    }

    return this.invoiceRepository.save(invoice);
  }

  private generateInvoiceNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `INV-${timestamp}-${random}`.toUpperCase();
  }

  private async generateInvoicePDF(invoiceId: string): Promise<void> {
    // Implementation would use a PDF library like puppeteer or jsPDF
    // For now, we'll just set a placeholder URL
    const invoice = await this.invoiceRepository.findOne({ where: { id: invoiceId } });
    if (invoice) {
      invoice.pdfUrl = `${process.env.APP_URL}/api/invoices/${invoiceId}/pdf`;
      await this.invoiceRepository.save(invoice);
    }
  }

  // Payment Analytics
  async getPaymentStats(startDate?: Date, endDate?: Date): Promise<any> {
    const whereClause: any = { status: PaymentStatus.COMPLETED };

    if (startDate && endDate) {
      whereClause.processedAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const payments = await this.paymentRepository.find({ where: whereClause });

    const totalVolume = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const stripeVolume = payments
      .filter(p => p.paymentMethod === PaymentMethod.STRIPE_CARD)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const cryptoVolume = payments
      .filter(p => p.paymentMethod === PaymentMethod.USDC_POLYGON)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalFees = payments.reduce((sum, p) => sum + Number(p.processingFee) + Number(p.platformFee), 0);

    return {
      totalTransactions: payments.length,
      totalVolume,
      stripeVolume,
      cryptoVolume,
      totalFees,
      avgTransactionValue: totalVolume / payments.length || 0,
      paymentMethodBreakdown: {
        stripe: payments.filter(p => p.paymentMethod === PaymentMethod.STRIPE_CARD).length,
        crypto: payments.filter(p => p.paymentMethod === PaymentMethod.USDC_POLYGON).length,
        mercadopago: payments.filter(p => p.paymentMethod === PaymentMethod.MERCADOPAGO).length,
      },
    };
  }
}