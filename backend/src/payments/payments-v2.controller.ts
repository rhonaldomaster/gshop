import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Headers,
} from '@nestjs/common';
import { PaymentsV2Service } from './payments-v2.service';
import { MercadoPagoService } from './mercadopago.service';
import { CreatePaymentV2Dto, ProcessCryptoPaymentDto, CreatePaymentMethodDto, CreateInvoiceDto, UpdateInvoiceStatusDto, PaymentStatsQueryDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentStatus } from './payments-v2.entity';
import { OrderStatus } from '../database/entities/order.entity';

@Controller('payments-v2')
export class PaymentsV2Controller {
  constructor(
    private readonly paymentsV2Service: PaymentsV2Service,
    private readonly mercadopagoService: MercadoPagoService,
  ) {}

  // Payment Processing
  @Post()
  @UseGuards(JwtAuthGuard)
  async createPayment(@Body() createPaymentDto: CreatePaymentV2Dto) {
    return this.paymentsV2Service.createPayment(createPaymentDto);
  }

  @Post(':id/process/stripe')
  @UseGuards(JwtAuthGuard)
  async processStripePayment(
    @Param('id') paymentId: string,
    @Body('paymentMethodId') paymentMethodId: string,
  ) {
    return this.paymentsV2Service.processStripePayment(paymentId, paymentMethodId);
  }

  @Post(':id/process/crypto')
  @UseGuards(JwtAuthGuard)
  async processCryptoPayment(
    @Param('id') paymentId: string,
    @Body() cryptoPaymentDto: ProcessCryptoPaymentDto,
  ) {
    return this.paymentsV2Service.processCryptoPayment(paymentId, cryptoPaymentDto);
  }

  @Post('crypto/verify/:id')
  @UseGuards(JwtAuthGuard)
  async verifyCryptoTransaction(@Param('id') cryptoTxId: string) {
    await this.paymentsV2Service.verifyCryptoTransaction(cryptoTxId);
    return { message: 'Transaction verification initiated' };
  }

  // Specific routes MUST come before generic :id route
  @Get('user/payments')
  @UseGuards(JwtAuthGuard)
  async getUserPayments(@Request() req) {
    return this.paymentsV2Service.getUserPayments(req.user.id);
  }

  // Payment Methods
  @Post('methods')
  @UseGuards(JwtAuthGuard)
  async createPaymentMethod(@Request() req, @Body() createPaymentMethodDto: CreatePaymentMethodDto) {
    return this.paymentsV2Service.createPaymentMethod(req.user.id, createPaymentMethodDto);
  }

  @Get('methods')
  @UseGuards(JwtAuthGuard)
  async getUserPaymentMethods(@Request() req) {
    return this.paymentsV2Service.getUserPaymentMethods(req.user.id);
  }

  @Delete('methods/:id')
  @UseGuards(JwtAuthGuard)
  async deletePaymentMethod(@Request() req, @Param('id') paymentMethodId: string) {
    await this.paymentsV2Service.deletePaymentMethod(paymentMethodId, req.user.id);
    return { message: 'Payment method removed successfully' };
  }

  // Generic :id route MUST come after all specific routes
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getPayment(@Param('id') paymentId: string) {
    return this.paymentsV2Service.getPayment(paymentId);
  }

  // Invoice Management
  @Post('invoices')
  @UseGuards(JwtAuthGuard)
  async createInvoice(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.paymentsV2Service.createInvoice(createInvoiceDto);
  }

  @Get('invoices/:id')
  async getInvoice(@Param('id') invoiceId: string) {
    return this.paymentsV2Service.getInvoice(invoiceId);
  }

  @Put('invoices/:id/status')
  @UseGuards(JwtAuthGuard)
  async updateInvoiceStatus(
    @Param('id') invoiceId: string,
    @Body() updateStatusDto: UpdateInvoiceStatusDto,
  ) {
    return this.paymentsV2Service.updateInvoiceStatus(invoiceId, updateStatusDto.status);
  }

  @Get('invoices/:id/pdf')
  async getInvoicePDF(@Param('id') invoiceId: string) {
    const invoice = await this.paymentsV2Service.getInvoice(invoiceId);
    // Redirect to PDF URL or serve PDF directly
    return { pdfUrl: invoice.pdfUrl };
  }

  // Analytics
  @Get('stats/overview')
  @UseGuards(JwtAuthGuard)
  async getPaymentStats(@Query() query: PaymentStatsQueryDto) {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    return this.paymentsV2Service.getPaymentStats(startDate, endDate);
  }

  // Webhooks
  @Post('webhooks/stripe')
  async handleStripeWebhook(@Body() body: any) {
    // Handle Stripe webhook events
    // This would typically verify the webhook signature and process events
    console.log('Stripe webhook received:', body);
    return { received: true };
  }

  @Post('webhooks/polygon')
  async handlePolygonWebhook(@Body() body: any) {
    // Handle Polygon blockchain webhook events
    // This could be used for real-time transaction confirmations
    console.log('Polygon webhook received:', body);
    return { received: true };
  }

  @Post('webhooks/mercadopago')
  async handleMercadoPagoWebhook(@Body() body: any, @Headers() headers: any) {
    console.log('MercadoPago Webhook received:', body);

    try {
      // MercadoPago sends different types of notifications
      // We're interested in 'payment' type
      if (body.type === 'payment' || body.topic === 'payment') {
        const paymentId = body.data?.id || body.id;

        if (!paymentId) {
          console.warn('No payment ID in webhook body');
          return { received: true, status: 'no_payment_id' };
        }

        // Get payment details from MercadoPago
        const mpPayment = await this.mercadopagoService.getPayment(paymentId);

        // Find our payment by external_reference
        const payment = await this.paymentsV2Service.getPaymentByExternalRef(
          mpPayment.external_reference
        );

        if (!payment) {
          console.warn('Payment not found for external_reference:', mpPayment.external_reference);
          return { received: true, status: 'payment_not_found' };
        }

        // Update payment status based on MercadoPago status
        switch (mpPayment.status) {
          case 'approved':
            payment.status = PaymentStatus.COMPLETED;
            payment.processedAt = new Date();
            payment.mercadopagoPaymentId = String(paymentId);

            // Update order to confirmed
            const order = await this.paymentsV2Service['orderRepository'].findOne({
              where: { id: payment.orderId },
            });

            if (order) {
              order.status = OrderStatus.CONFIRMED;
              await this.paymentsV2Service['orderRepository'].save(order);
              console.log('Order status updated to CONFIRMED:', order.id);
            }
            break;

          case 'rejected':
          case 'cancelled':
            payment.status = PaymentStatus.FAILED;
            payment.failureReason = mpPayment.status_detail || mpPayment.status;
            break;

          case 'in_process':
          case 'pending':
            payment.status = PaymentStatus.PROCESSING;
            break;

          case 'refunded':
          case 'charged_back':
            payment.status = PaymentStatus.REFUNDED;
            payment.refundedAt = new Date();
            break;
        }

        await this.paymentsV2Service['paymentRepository'].save(payment);
        console.log('Payment status updated:', payment.id, payment.status);

        return { received: true, status: 'processed', paymentId: payment.id };
      }

      return { received: true, status: 'ignored_event_type' };
    } catch (error) {
      console.error('Error processing MercadoPago webhook:', error);
      return { received: true, status: 'error', message: error.message };
    }
  }

  // Utility endpoints
  @Get('exchange-rates/usdc-usd')
  async getUSDCExchangeRate() {
    // In a real implementation, this would fetch from a price oracle
    return {
      pair: 'USDC/USD',
      rate: 0.9998, // USDC is approximately $1
      timestamp: new Date(),
      source: 'coinbase',
    };
  }

  @Get('gas-price/polygon')
  async getPolygonGasPrice() {
    // Fetch current gas price from Polygon network
    return {
      network: 'polygon',
      gasPrice: '30', // in gwei
      timestamp: new Date(),
    };
  }
}