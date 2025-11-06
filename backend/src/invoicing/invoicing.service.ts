import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Invoice, InvoiceType, InvoiceStatus } from '../database/entities/invoice.entity';
import { Order } from '../database/entities/order.entity';
import { ConfigService } from '../config/config.service';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class InvoicingService {
  private readonly logger = new Logger(InvoicingService.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Generate invoice: Platform → Buyer (for platform fee)
   */
  async generateBuyerFeeInvoice(order: Order): Promise<Invoice> {
    try {
      const invoiceNumber = await this.generateInvoiceNumber('FEE');

      const invoice = this.invoiceRepo.create({
        invoiceNumber,
        invoiceType: InvoiceType.PLATFORM_TO_BUYER_FEE,
        orderId: order.id,
        buyerId: order.userId,

        // Platform as issuer
        issuerName: 'GSHOP SAS',
        issuerDocument: 'NIT 900.XXX.XXX-X',
        issuerAddress: 'Dirección de la plataforma GSHOP',

        // Buyer as recipient
        recipientName: order.shippingAddress?.firstName + ' ' + order.shippingAddress?.lastName,
        recipientDocument: order.customerDocument?.number || 'N/A',
        recipientAddress: `${order.shippingAddress?.address1}, ${order.shippingAddress?.city}, ${order.shippingAddress?.state}`,

        // Amounts (platform fee includes VAT)
        subtotal: order.platformFeeAmount,
        vatAmount: order.platformFeeAmount * 0.19, // 19% VAT on platform fee
        totalAmount: order.platformFeeAmount * 1.19,

        status: InvoiceStatus.ISSUED,
        issuedAt: new Date(),
      });

      await this.invoiceRepo.save(invoice);

      // Update order with invoice reference
      order.feeInvoiceId = invoice.id;
      await this.orderRepo.save(order);

      this.logger.log(`Buyer fee invoice generated: ${invoiceNumber} for order ${order.orderNumber}`);

      return invoice;
    } catch (error) {
      this.logger.error(`Failed to generate buyer fee invoice for order ${order.id}`, error);
      throw error;
    }
  }

  /**
   * Generate invoice: Platform → Seller (for commission)
   */
  async generateSellerCommissionInvoice(order: Order): Promise<Invoice> {
    try {
      // Load seller relation if not loaded
      if (!order.user) {
        order = await this.orderRepo.findOne({
          where: { id: order.id },
          relations: ['user'],
        });
      }

      const invoiceNumber = await this.generateInvoiceNumber('COM');

      const invoice = this.invoiceRepo.create({
        invoiceNumber,
        invoiceType: InvoiceType.PLATFORM_TO_SELLER_COMMISSION,
        orderId: order.id,
        sellerId: order.userId, // Assuming seller is the user

        // Platform as issuer
        issuerName: 'GSHOP SAS',
        issuerDocument: 'NIT 900.XXX.XXX-X',
        issuerAddress: 'Dirección de la plataforma GSHOP',

        // Seller as recipient
        recipientName: order.user?.businessName || `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || 'Seller',
        recipientDocument: order.user?.email || 'N/A', // Should be seller's document
        recipientAddress: 'Dirección del vendedor',

        // Amounts (commission without VAT - business service)
        subtotal: order.sellerCommissionAmount,
        vatAmount: 0, // Business services don't have VAT
        totalAmount: order.sellerCommissionAmount,

        status: InvoiceStatus.ISSUED,
        issuedAt: new Date(),
      });

      await this.invoiceRepo.save(invoice);

      // Update order with invoice reference and mark as invoiced
      order.commissionInvoiceId = invoice.id;
      order.commissionStatus = 'invoiced';
      await this.orderRepo.save(order);

      this.logger.log(
        `Seller commission invoice generated: ${invoiceNumber} for order ${order.orderNumber}`,
      );

      return invoice;
    } catch (error) {
      this.logger.error(`Failed to generate seller commission invoice for order ${order.id}`, error);
      throw error;
    }
  }

  /**
   * Generate sequential invoice number
   */
  private async generateInvoiceNumber(type: string): Promise<string> {
    const sequence = await this.configService.getInvoiceNumberingSequence();
    const current = await this.configService.incrementInvoiceSequence();

    const invoiceNumber = `${sequence.prefix}-${type}-${String(current).padStart(sequence.padding, '0')}`;

    return invoiceNumber; // e.g., GSHOP-FEE-00000123
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ['order', 'seller', 'buyer'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }

    return invoice;
  }

  /**
   * Get invoice by number
   */
  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { invoiceNumber },
      relations: ['order', 'seller', 'buyer'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceNumber} not found`);
    }

    return invoice;
  }

  /**
   * Get invoices by order
   */
  async getInvoicesByOrder(orderId: string): Promise<Invoice[]> {
    return this.invoiceRepo.find({
      where: { orderId },
      relations: ['order'],
    });
  }

  /**
   * Get invoices by seller
   */
  async getInvoicesBySeller(
    sellerId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      status?: InvoiceStatus;
    },
  ): Promise<Invoice[]> {
    const query = this.invoiceRepo
      .createQueryBuilder('invoice')
      .where('invoice.sellerId = :sellerId', { sellerId })
      .andWhere('invoice.invoiceType = :type', {
        type: InvoiceType.PLATFORM_TO_SELLER_COMMISSION,
      });

    if (options?.startDate) {
      query.andWhere('invoice.issuedAt >= :startDate', { startDate: options.startDate });
    }

    if (options?.endDate) {
      query.andWhere('invoice.issuedAt <= :endDate', { endDate: options.endDate });
    }

    if (options?.status) {
      query.andWhere('invoice.status = :status', { status: options.status });
    }

    return query.getMany();
  }

  /**
   * Generate PDF invoice
   */
  async generateInvoicePDF(invoiceId: string): Promise<Buffer> {
    const invoice = await this.getInvoiceById(invoiceId);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header
        doc
          .fontSize(20)
          .text('FACTURA ELECTRÓNICA', { align: 'center' })
          .moveDown();

        doc
          .fontSize(12)
          .text(`Número de Factura: ${invoice.invoiceNumber}`, { align: 'right' })
          .text(`Fecha de Emisión: ${invoice.issuedAt.toLocaleDateString('es-CO')}`, {
            align: 'right',
          })
          .moveDown();

        // Issuer info
        doc
          .fontSize(14)
          .text('EMISOR', { underline: true })
          .fontSize(10)
          .text(`Razón Social: ${invoice.issuerName}`)
          .text(`Documento: ${invoice.issuerDocument}`)
          .text(`Dirección: ${invoice.issuerAddress}`)
          .moveDown();

        // Recipient info
        doc
          .fontSize(14)
          .text('RECEPTOR', { underline: true })
          .fontSize(10)
          .text(`Nombre: ${invoice.recipientName}`)
          .text(`Documento: ${invoice.recipientDocument}`)
          .text(`Dirección: ${invoice.recipientAddress}`)
          .moveDown();

        // Invoice type
        const typeLabel =
          invoice.invoiceType === InvoiceType.PLATFORM_TO_BUYER_FEE
            ? 'Cargo por Uso de Plataforma'
            : 'Comisión por Venta';

        doc
          .fontSize(14)
          .text('DETALLE', { underline: true })
          .fontSize(10)
          .text(`Concepto: ${typeLabel}`)
          .text(`Orden: ${invoice.order?.orderNumber || 'N/A'}`)
          .moveDown();

        // Amounts
        doc
          .fontSize(12)
          .text(`Subtotal: $${invoice.subtotal.toLocaleString('es-CO')}`, { align: 'right' })
          .text(`IVA (19%): $${invoice.vatAmount.toLocaleString('es-CO')}`, { align: 'right' })
          .moveDown();

        doc
          .fontSize(14)
          .text(`TOTAL: $${invoice.totalAmount.toLocaleString('es-CO')}`, {
            align: 'right',
            underline: true,
          })
          .moveDown();

        // Footer
        doc
          .fontSize(8)
          .text('Documento generado por GSHOP - Plataforma de Comercio Electrónico', {
            align: 'center',
          })
          .text(`CUFE: ${invoice.cufe || 'N/A'}`, { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(invoiceId: string, status: InvoiceStatus): Promise<Invoice> {
    const invoice = await this.getInvoiceById(invoiceId);
    invoice.status = status;
    invoice.updatedAt = new Date();

    await this.invoiceRepo.save(invoice);

    this.logger.log(`Invoice ${invoice.invoiceNumber} status updated to ${status}`);

    return invoice;
  }

  /**
   * Mark invoice as paid
   */
  async markInvoiceAsPaid(
    invoiceId: string,
    paymentMethod: string,
  ): Promise<Invoice> {
    const invoice = await this.getInvoiceById(invoiceId);
    invoice.status = InvoiceStatus.PAID;
    invoice.paymentMethod = paymentMethod;
    invoice.updatedAt = new Date();

    await this.invoiceRepo.save(invoice);

    this.logger.log(`Invoice ${invoice.invoiceNumber} marked as paid via ${paymentMethod}`);

    return invoice;
  }

  /**
   * Cancel invoice
   */
  async cancelInvoice(invoiceId: string): Promise<Invoice> {
    const invoice = await this.getInvoiceById(invoiceId);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new Error('Cannot cancel a paid invoice');
    }

    invoice.status = InvoiceStatus.CANCELLED;
    invoice.updatedAt = new Date();

    await this.invoiceRepo.save(invoice);

    this.logger.log(`Invoice ${invoice.invoiceNumber} cancelled`);

    return invoice;
  }
}
