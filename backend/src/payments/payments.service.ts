
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus, PaymentMethod } from '../database/entities/payment.entity';
import { Order, OrderStatus } from '../database/entities/order.entity';
import { Commission, CommissionType } from '../database/entities/commission.entity';
import { PaymentMethodEntity } from './payments-v2.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MercadoPagoService } from './mercadopago.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Commission)
    private commissionRepository: Repository<Commission>,
    @InjectRepository(PaymentMethodEntity)
    private paymentMethodRepository: Repository<PaymentMethodEntity>,
    private mercadoPagoService: MercadoPagoService,
  ) {}

  async createPayment(createPaymentDto: CreatePaymentDto): Promise<any> {
    // Find the order
    const order = await this.orderRepository.findOne({
      where: { id: createPaymentDto.orderId },
      relations: ['user', 'items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if payment already exists
    const existingPayment = await this.paymentRepository.findOne({
      where: { orderId: order.id },
    });

    if (existingPayment) {
      throw new BadRequestException('Payment already exists for this order');
    }

    // Calculate commission
    const commission = await this.calculateCommission(order.totalAmount);

    // Create payment record
    const transactionId = this.generateTransactionId();
    
    const payment = this.paymentRepository.create({
      transactionId,
      orderId: order.id,
      status: PaymentStatus.PENDING,
      method: createPaymentDto.method,
      amount: order.totalAmount,
      commissionAmount: commission,
      currency: 'ARS', // Default currency
    });

    const savedPayment = await this.paymentRepository.save(payment);

    try {
      // Create MercadoPago payment
      const mercadoPagoPayment = await this.mercadoPagoService.createPayment({
        transactionId,
        orderId: order.id,
        amount: order.totalAmount,
        description: `GSHOP Order #${order.orderNumber}`,
        payerEmail: order.user.email,
        items: order.items.map(item => ({
          id: item.product.id,
          title: item.product.name,
          quantity: item.quantity,
          unit_price: item.unitPrice,
        })),
        shippingAddress: order.shippingAddress,
        method: createPaymentDto.method,
        installments: createPaymentDto.installments,
        cardToken: createPaymentDto.cardToken,
      });

      // Update payment with MercadoPago response
      await this.paymentRepository.update(savedPayment.id, {
        mercadoPagoPaymentId: mercadoPagoPayment.id,
        status: this.mapMercadoPagoStatus(mercadoPagoPayment.status),
        gatewayResponse: mercadoPagoPayment,
        paymentDetails: {
          payerEmail: mercadoPagoPayment.payer?.email,
          payerPhone: mercadoPagoPayment.payer?.phone?.number,
          installments: mercadoPagoPayment.installments,
        },
      });

      return {
        paymentId: savedPayment.id,
        transactionId: savedPayment.transactionId,
        mercadoPagoPayment,
        status: this.mapMercadoPagoStatus(mercadoPagoPayment.status),
      };

    } catch (error) {
      // Update payment status to failed
      await this.paymentRepository.update(savedPayment.id, {
        status: PaymentStatus.FAILED,
        failureReason: error.message,
      });

      throw new BadRequestException('Payment processing failed: ' + error.message);
    }
  }

  async handleWebhook(webhookData: any): Promise<void> {
    try {
      const paymentId = webhookData.data?.id;
      if (!paymentId) return;

      // Get payment details from MercadoPago
      const mercadoPagoPayment = await this.mercadoPagoService.getPayment(paymentId);
      
      // Find payment in our database
      const payment = await this.paymentRepository.findOne({
        where: { mercadoPagoPaymentId: paymentId.toString() },
        relations: ['order'],
      });

      if (!payment) {
        console.log('Payment not found for MercadoPago ID:', paymentId);
        return;
      }

      // Update payment status
      const newStatus = this.mapMercadoPagoStatus(mercadoPagoPayment.status);
      const updateData: any = {
        status: newStatus,
        gatewayResponse: mercadoPagoPayment,
      };

      if (newStatus === PaymentStatus.COMPLETED) {
        updateData.processedAt = new Date();
        
        // Update order status
        await this.orderRepository.update(payment.order.id, {
          status: OrderStatus.CONFIRMED,
        });
      } else if (newStatus === PaymentStatus.FAILED) {
        updateData.failureReason = mercadoPagoPayment.status_detail;
        
        // Update order status
        await this.orderRepository.update(payment.order.id, {
          status: OrderStatus.CANCELLED,
        });
      }

      await this.paymentRepository.update(payment.id, updateData);

    } catch (error) {
      console.error('Webhook processing error:', error);
    }
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['order', 'order.user'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async findByTransactionId(transactionId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { transactionId },
      relations: ['order', 'order.user'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async refundPayment(id: string, amount?: number): Promise<Payment> {
    const payment = await this.findOne(id);

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Can only refund completed payments');
    }

    const refundAmount = amount || payment.amount;

    if (refundAmount > (payment.amount - payment.refundedAmount)) {
      throw new BadRequestException('Refund amount exceeds available amount');
    }

    try {
      // Process refund with MercadoPago
      const refund = await this.mercadoPagoService.refundPayment(
        payment.mercadoPagoPaymentId,
        refundAmount,
      );

      // Update payment
      const newRefundedAmount = payment.refundedAmount + refundAmount;
      const newStatus = newRefundedAmount >= payment.amount 
        ? PaymentStatus.REFUNDED 
        : PaymentStatus.PARTIALLY_REFUNDED;

      await this.paymentRepository.update(id, {
        refundedAmount: newRefundedAmount,
        status: newStatus,
        refundedAt: new Date(),
        gatewayResponse: { ...payment.gatewayResponse, refund },
      });

      return this.findOne(id);

    } catch (error) {
      throw new BadRequestException('Refund processing failed: ' + error.message);
    }
  }

  async getPaymentStats() {
    const [
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      refundedPayments,
    ] = await Promise.all([
      this.paymentRepository.count(),
      this.paymentRepository.count({ where: { status: PaymentStatus.COMPLETED } }),
      this.paymentRepository.count({ where: { status: PaymentStatus.PENDING } }),
      this.paymentRepository.count({ where: { status: PaymentStatus.FAILED } }),
      this.paymentRepository.count({ where: { status: PaymentStatus.REFUNDED } }),
    ]);

    // Calculate total revenue
    const revenueResult = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount - payment.refundedAmount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .getRawOne();

    const totalRevenue = parseFloat(revenueResult.total) || 0;

    // Calculate total commissions
    const commissionResult = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.commissionAmount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .getRawOne();

    const totalCommissions = parseFloat(commissionResult.total) || 0;

    return {
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      refundedPayments,
      totalRevenue,
      totalCommissions,
    };
  }

  private async calculateCommission(amount: number): Promise<number> {
    // Get platform commission rate
    const platformCommission = await this.commissionRepository.findOne({
      where: { type: CommissionType.PLATFORM, isActive: true },
    });

    const rate = platformCommission?.rate || 7; // Default 7%
    return (amount * rate) / 100;
  }

  private mapMercadoPagoStatus(status: string): PaymentStatus {
    switch (status) {
      case 'approved':
        return PaymentStatus.COMPLETED;
      case 'pending':
      case 'in_process':
        return PaymentStatus.PROCESSING;
      case 'authorized':
        return PaymentStatus.PENDING;
      case 'rejected':
      case 'cancelled':
        return PaymentStatus.FAILED;
      case 'refunded':
        return PaymentStatus.REFUNDED;
      case 'charged_back':
        return PaymentStatus.REFUNDED;
      default:
        return PaymentStatus.PENDING;
    }
  }

  private generateTransactionId(): string {
    const prefix = 'TXN';
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${timestamp}${random}`;
  }

  async getUserPaymentMethods(userId: string): Promise<PaymentMethodEntity[]> {
    return this.paymentMethodRepository.find({
      where: { userId, isActive: true },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async addPaymentMethod(userId: string, dto: any): Promise<PaymentMethodEntity> {
    // If setAsDefault is true, unset all other default methods
    if (dto.setAsDefault) {
      await this.paymentMethodRepository.update(
        { userId, isDefault: true },
        { isDefault: false }
      );
    }

    // Generate display name based on type
    let displayName = '';
    if (dto.type === 'stripe_card' || dto.type === 'card') {
      displayName = `${dto.details.brand || 'Card'} •••• ${dto.details.last4}`;
    } else if (dto.type === 'usdc_polygon') {
      displayName = `USDC ${dto.details.polygonAddress?.substring(0, 6)}...${dto.details.polygonAddress?.substring(38)}`;
    } else {
      displayName = dto.type;
    }

    const paymentMethod = this.paymentMethodRepository.create({
      userId,
      type: dto.type,
      displayName,
      stripePaymentMethodId: dto.details.stripePaymentMethodId,
      polygonAddress: dto.details.polygonAddress,
      lastFourDigits: dto.details.last4,
      brand: dto.details.brand,
      expiryMonth: dto.details.expiryMonth,
      expiryYear: dto.details.expiryYear,
      isDefault: dto.setAsDefault || false,
      isActive: true,
    });

    return this.paymentMethodRepository.save(paymentMethod);
  }

  async setDefaultPaymentMethod(userId: string, id: string): Promise<PaymentMethodEntity> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id, userId },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    // Unset all other default methods
    await this.paymentMethodRepository.update(
      { userId, isDefault: true },
      { isDefault: false }
    );

    // Set this one as default
    paymentMethod.isDefault = true;
    return this.paymentMethodRepository.save(paymentMethod);
  }

  async deletePaymentMethod(userId: string, id: string): Promise<void> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id, userId },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    // Soft delete by setting isActive to false
    paymentMethod.isActive = false;
    await this.paymentMethodRepository.save(paymentMethod);
  }
}
