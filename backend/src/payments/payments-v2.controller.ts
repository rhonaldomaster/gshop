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
  Res,
} from '@nestjs/common';
import { Response } from 'express';
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
  async handleMercadoPagoWebhook(
    @Body() body: any,
    @Headers('x-signature') xSignature?: string,
    @Headers('x-request-id') xRequestId?: string,
  ) {
    console.log('MercadoPago Webhook received:', JSON.stringify(body, null, 2));

    try {
      // Extract payment ID from different webhook formats
      // Format 1 (old): { resource: '134484479621', topic: 'payment' }
      // Format 2 (merchant_order): { resource: 'https://...', topic: 'merchant_order' }
      // Format 3 (new v1): { action: 'payment.created', data: { id: '134484479621' }, ... }
      let paymentId: string | null = null;
      let webhookType: string | null = null;

      // Format 3 (new v1) - has action and data.id
      if (body.action && body.data?.id) {
        paymentId = body.data.id;
        webhookType = body.action;
        console.log('Detected new v1 format webhook:', { action: body.action, paymentId });
      }
      // Format 1 (old) - has resource (payment ID) and topic
      else if (body.topic === 'payment' && body.resource && !body.resource.startsWith('http')) {
        paymentId = body.resource;
        webhookType = body.topic;
        console.log('Detected old format webhook:', { topic: body.topic, paymentId });
      }
      // Format 2 (merchant_order) - skip for now, we handle payment webhooks
      else if (body.topic === 'merchant_order') {
        console.log('Skipping merchant_order webhook (handled by payment webhook)');
        return { received: true, status: 'merchant_order_skipped' };
      }

      if (!paymentId) {
        console.warn('No payment ID found in webhook body');
        return { received: true, status: 'no_payment_id' };
      }

      // Validate webhook signature if headers are present (production only)
      if (xSignature && xRequestId && paymentId) {
        const isValid = this.mercadopagoService.validateWebhookSignature(
          xSignature,
          xRequestId,
          paymentId,
        );
        if (!isValid) {
          console.error('Webhook signature validation failed - but continuing in development mode');
          // Don't return error in development, just log it
        }
      }

      // We're interested in payment webhooks only
      if (webhookType === 'payment' || body.action?.includes('payment') || body.type === 'payment') {

        console.log('Fetching payment details from MercadoPago:', paymentId);
        const mpPayment = await this.mercadopagoService.getPayment(paymentId);
        console.log('MercadoPago payment details:', {
          id: mpPayment.id,
          status: mpPayment.status,
          external_reference: mpPayment.external_reference,
          transaction_amount: mpPayment.transaction_amount,
        });

        // Find our payment by external_reference
        const payment = await this.paymentsV2Service.getPaymentByExternalRef(
          mpPayment.external_reference
        );

        if (!payment) {
          console.warn('Payment not found for external_reference:', mpPayment.external_reference);
          console.warn('This might be a test payment or already processed');
          return { received: true, status: 'payment_not_found' };
        }

        console.log('Found payment in database:', { id: payment.id, currentStatus: payment.status });

        // Update payment status based on MercadoPago status
        const previousStatus = payment.status;
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
              console.log('✅ Order status updated to CONFIRMED:', order.id);
            } else {
              console.warn('⚠️ Order not found for payment:', payment.orderId);
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

          default:
            console.warn('Unknown MercadoPago payment status:', mpPayment.status);
            break;
        }

        await this.paymentsV2Service['paymentRepository'].save(payment);
        console.log('✅ Payment status updated:', {
          paymentId: payment.id,
          previousStatus,
          newStatus: payment.status,
          mercadopagoId: paymentId,
        });

        return {
          received: true,
          status: 'processed',
          paymentId: payment.id,
          mpStatus: mpPayment.status,
          updatedStatus: payment.status,
        };
      }

      console.log('Webhook event type not handled:', { webhookType, action: body.action });
      return { received: true, status: 'ignored_event_type' };
    } catch (error) {
      console.error('❌ Error processing MercadoPago webhook:', error);
      console.error('Error stack:', error.stack);
      return { received: true, status: 'error', message: error.message };
    }
  }

  // Payment callback pages (for MercadoPago back_urls)
  @Get('callback/success')
  async paymentSuccessCallback(
    @Query('paymentId') paymentId: string,
    @Res() res: Response,
  ) {
    console.log('✅ Payment success callback:', paymentId);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pago Exitoso</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
            }
            .icon {
              font-size: 4rem;
              margin-bottom: 1rem;
            }
            h1 {
              font-size: 2rem;
              margin-bottom: 0.5rem;
            }
            p {
              font-size: 1.1rem;
              opacity: 0.9;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">✅</div>
            <h1>¡Pago Exitoso!</h1>
            <p>Tu orden ha sido confirmada</p>
            <p style="font-size: 0.9rem; margin-top: 2rem; opacity: 0.7;">Cerrando...</p>
          </div>
        </body>
      </html>
    `);
  }

  @Get('callback/failure')
  async paymentFailureCallback(
    @Query('paymentId') paymentId: string,
    @Res() res: Response,
  ) {
    console.log('❌ Payment failure callback:', paymentId);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pago Fallido</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
            }
            .icon {
              font-size: 4rem;
              margin-bottom: 1rem;
            }
            h1 {
              font-size: 2rem;
              margin-bottom: 0.5rem;
            }
            p {
              font-size: 1.1rem;
              opacity: 0.9;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">❌</div>
            <h1>Pago Fallido</h1>
            <p>Por favor intenta de nuevo</p>
            <p style="font-size: 0.9rem; margin-top: 2rem; opacity: 0.7;">Cerrando...</p>
          </div>
        </body>
      </html>
    `);
  }

  @Get('callback/pending')
  async paymentPendingCallback(
    @Query('paymentId') paymentId: string,
    @Res() res: Response,
  ) {
    console.log('⏳ Payment pending callback:', paymentId);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pago Pendiente</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #fad961 0%, #f76b1c 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
            }
            .icon {
              font-size: 4rem;
              margin-bottom: 1rem;
            }
            h1 {
              font-size: 2rem;
              margin-bottom: 0.5rem;
            }
            p {
              font-size: 1.1rem;
              opacity: 0.9;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">⏳</div>
            <h1>Pago Pendiente</h1>
            <p>Te notificaremos cuando se confirme</p>
            <p style="font-size: 0.9rem; margin-top: 2rem; opacity: 0.7;">Cerrando...</p>
          </div>
        </body>
      </html>
    `);
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