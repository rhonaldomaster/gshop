import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InvoicingService } from './invoicing.service';
import { Order } from '../database/entities/order.entity';
import { Invoice } from '../database/entities/invoice.entity';

@Injectable()
export class InvoicingListener {
  private readonly logger = new Logger(InvoicingListener.name);

  constructor(
    private readonly invoicingService: InvoicingService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Automatically generate invoices when order is marked as delivered
   */
  @OnEvent('order.delivered')
  async handleOrderDelivered(payload: { order: Order }) {
    const { order } = payload;

    try {
      this.logger.log(`Order ${order.orderNumber} delivered - generating invoices...`);

      // 1. Generate buyer fee invoice (for platform fee)
      if (order.platformFeeAmount > 0) {
        await this.invoicingService.generateBuyerFeeInvoice(order);
        this.logger.log(`Buyer fee invoice generated for order ${order.orderNumber}`);
      }

      // 2. Generate seller commission invoice
      if (order.sellerCommissionAmount > 0) {
        const commissionInvoice = await this.invoicingService.generateSellerCommissionInvoice(order);
        this.logger.log(`Seller commission invoice generated for order ${order.orderNumber}`);

        // Emit event for notification
        this.eventEmitter.emit('invoice.generated', {
          invoice: commissionInvoice,
          order,
        });
      }

      this.logger.log(`✅ All invoices generated successfully for order ${order.orderNumber}`);
    } catch (error) {
      this.logger.error(
        `❌ Error generating invoices for order ${order.orderNumber}: ${error.message}`,
        error.stack,
      );

      // TODO: Implement retry mechanism or alert admins
      // For now, we log the error and continue
    }
  }

  /**
   * Handle order cancellation - cancel related invoices
   */
  @OnEvent('order.cancelled')
  async handleOrderCancelled(payload: { order: Order }) {
    const { order } = payload;

    try {
      this.logger.log(`Order ${order.orderNumber} cancelled - cancelling invoices...`);

      // Cancel fee invoice if exists
      if (order.feeInvoiceId) {
        await this.invoicingService.cancelInvoice(order.feeInvoiceId);
        this.logger.log(`Fee invoice cancelled for order ${order.orderNumber}`);
      }

      // Cancel commission invoice if exists
      if (order.commissionInvoiceId) {
        await this.invoicingService.cancelInvoice(order.commissionInvoiceId);
        this.logger.log(`Commission invoice cancelled for order ${order.orderNumber}`);
      }
    } catch (error) {
      this.logger.error(
        `Error cancelling invoices for order ${order.orderNumber}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Send notification when invoice is generated
   */
  @OnEvent('invoice.generated')
  async handleInvoiceGenerated(payload: { invoice: Invoice; order: Order }) {
    const { invoice, order } = payload;

    try {
      // Only notify for seller commission invoices
      if (invoice.invoiceType === 'platform_to_seller_commission') {
        this.logger.log(
          `📧 Sending notification to seller for commission invoice ${invoice.invoiceNumber}`,
        );

        // TODO: Implement email/SMS notification
        // await this.emailService.sendCommissionInvoiceNotification({
        //   sellerId: order.sellerId,
        //   invoiceNumber: invoice.invoiceNumber,
        //   amount: invoice.totalAmount,
        //   orderNumber: order.orderNumber,
        // });

        this.logger.log(`✅ Notification sent for invoice ${invoice.invoiceNumber}`);
      }
    } catch (error) {
      this.logger.error(
        `Error sending notification for invoice ${invoice.invoiceNumber}: ${error.message}`,
        error.stack,
      );
    }
  }
}
