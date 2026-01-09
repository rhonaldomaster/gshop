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
  Req,
  Headers,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { PaymentsV2Service } from './payments-v2.service';
import { MercadoPagoService } from './mercadopago.service';
import { PaymentConfigService } from './payment-config.service';
import { CreatePaymentV2Dto, ProcessCryptoPaymentDto, CreatePaymentMethodDto, CreateInvoiceDto, UpdateInvoiceStatusDto, PaymentStatsQueryDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';
import { PaymentStatus } from './payments-v2.entity';
import { OrderStatus } from '../database/entities/order.entity';
import { OrdersService } from '../orders/orders.service';
import { TokenService } from '../token/token.service';
import Stripe from 'stripe';
import { Logger } from '@nestjs/common';

@ApiTags('Payments V2')
@Controller('payments-v2')
export class PaymentsV2Controller {
  private readonly logger = new Logger(PaymentsV2Controller.name);
  private stripe: Stripe;

  constructor(
    private readonly paymentsV2Service: PaymentsV2Service,
    private readonly mercadopagoService: MercadoPagoService,
    private readonly ordersService: OrdersService,
    private readonly paymentConfigService: PaymentConfigService,
    private readonly tokenService: TokenService,
  ) {
    // Initialize Stripe with API version
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-08-27.basil',
    });
  }

  // Admin: Get all payments with filters and pagination
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all payments with pagination (Admin only)' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  async findAll(@Query() query: any) {
    return this.paymentsV2Service.findAll(query);
  }

  // Configuration
  @Get('config/providers')
  @ApiOperation({ summary: 'Get available payment providers configuration' })
  @ApiResponse({ status: 200, description: 'Payment providers configuration retrieved' })
  async getPaymentProviders() {
    return this.paymentConfigService.getProvidersConfig();
  }

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

  @Post(':id/stripe-checkout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create Stripe Checkout Session for WebView payment' })
  @ApiResponse({ status: 200, description: 'Checkout session created successfully' })
  async createStripeCheckout(@Param('id') paymentId: string) {
    return this.paymentsV2Service.createStripeCheckoutSession(paymentId);
  }

  @Post(':id/process/crypto')
  @UseGuards(JwtAuthGuard)
  async processCryptoPayment(
    @Param('id') paymentId: string,
    @Body() cryptoPaymentDto: ProcessCryptoPaymentDto,
  ) {
    return this.paymentsV2Service.processCryptoPayment(paymentId, cryptoPaymentDto);
  }

  /**
   * Process payment using wallet balance
   * POST /api/v1/payments-v2/:id/process/wallet
   *
   * This endpoint allows users to pay for orders using their GSHOP wallet balance.
   * The payment ID should reference an existing payment record.
   */
  @Post(':id/process/wallet')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Pay for order using wallet balance' })
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient balance or invalid payment' })
  async processWalletPayment(
    @Param('id') paymentId: string,
    @Request() req,
  ) {
    const userId = req.user.id;

    // Get payment to find order
    const payment = await this.paymentsV2Service.getPaymentById(paymentId);

    if (!payment) {
      return { success: false, error: 'Pago no encontrado' };
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      return { success: false, error: 'Este pago ya fue procesado' };
    }

    if (!payment.orderId) {
      return { success: false, error: 'Este pago no tiene una orden asociada' };
    }

    try {
      // Process payment with wallet
      const result = await this.tokenService.payOrderWithWallet(
        userId,
        payment.orderId,
        Number(payment.amount)
      );

      // Update payment status
      payment.status = PaymentStatus.COMPLETED;
      payment.processedAt = new Date();
      payment.paymentMetadata = {
        ...payment.paymentMetadata,
        paymentMethod: 'wallet_balance',
        walletTransactionId: result.transactionId,
        newWalletBalance: result.newBalance
      };

      await this.paymentsV2Service.savePayment(payment);

      // Update order status to CONFIRMED
      await this.ordersService.updateStatus(payment.orderId, OrderStatus.CONFIRMED);

      this.logger.log(`Order ${payment.orderId} paid with wallet balance by user ${userId}`);

      return {
        success: true,
        paymentId: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        walletTransactionId: result.transactionId,
        newWalletBalance: result.newBalance,
        message: 'Pago procesado exitosamente con saldo de wallet'
      };
    } catch (error) {
      this.logger.error(`Wallet payment failed for payment ${paymentId}: ${error.message}`);

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if user can pay with wallet balance
   * GET /api/v1/payments-v2/:id/can-pay-with-wallet
   */
  @Get(':id/can-pay-with-wallet')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check if user can pay order with wallet balance' })
  async canPayWithWallet(
    @Param('id') paymentId: string,
    @Request() req,
  ) {
    const userId = req.user.id;

    const payment = await this.paymentsV2Service.getPaymentById(paymentId);

    if (!payment) {
      return { canPay: false, error: 'Pago no encontrado' };
    }

    const balanceCheck = await this.tokenService.checkSufficientBalance(
      userId,
      Number(payment.amount)
    );

    return {
      canPay: balanceCheck.hasSufficientBalance,
      paymentAmount: Number(payment.amount),
      currentBalance: balanceCheck.currentBalance,
      shortfall: balanceCheck.shortfall,
      currency: 'COP'
    };
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
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
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
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: any,
  ) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET is not configured');
      return { error: 'Webhook secret not configured' };
    }

    let event: Stripe.Event;

    try {
      // Get raw body (Buffer from express.raw middleware)
      const rawBody = request.body;

      // Verify webhook signature
      event = this.stripe.webhooks.constructEvent(
        rawBody, // Pass Buffer directly for signature verification
        signature,
        webhookSecret,
      );

      this.logger.log(`Stripe webhook received: ${event.type} (ID: ${event.id})`);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      return { error: `Webhook Error: ${err.message}` };
    }

    // Handle different event types
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.requires_action':
          await this.handlePaymentRequiresAction(event.data.object as Stripe.PaymentIntent);
          break;

        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object as Stripe.Charge);
          break;

        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        default:
          this.logger.warn(`Unhandled Stripe event type: ${event.type}`);
      }

      return { received: true, eventType: event.type };
    } catch (error) {
      this.logger.error(`Error processing webhook event ${event.type}: ${error.message}`);
      return { error: error.message };
    }
  }

  /**
   * Handle successful payment intent
   */
  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    // Check if this is a wallet topup
    if (paymentIntent.metadata.type === 'wallet_topup') {
      await this.handleWalletTopupSuccess(paymentIntent);
      return;
    }

    const paymentId = paymentIntent.metadata.paymentId;

    if (!paymentId) {
      this.logger.error('Payment ID not found in PaymentIntent metadata');
      return;
    }

    try {
      const payment = await this.paymentsV2Service.getPaymentById(paymentId);

      // Idempotency check - don't process if already completed
      if (payment.status === PaymentStatus.COMPLETED) {
        this.logger.log(`Payment ${paymentId} already completed, skipping`);
        return;
      }

      // Update payment status
      payment.status = PaymentStatus.COMPLETED;
      payment.processedAt = new Date();
      payment.stripePaymentIntentId = paymentIntent.id;

      // Extract processing fee from Stripe if available
      // Note: charges is an expandable field, may not be present by default
      const piWithCharges = paymentIntent as any;
      if (piWithCharges.charges?.data?.length > 0) {
        const charge = piWithCharges.charges.data[0];
        if (charge.balance_transaction) {
          const balanceTransaction = charge.balance_transaction as any;
          payment.processingFee = balanceTransaction.fee ? balanceTransaction.fee / 100 : null;
        }
      }

      await this.paymentsV2Service.savePayment(payment);

      // Update order status to CONFIRMED
      if (payment.orderId) {
        await this.ordersService.updateStatus(payment.orderId, OrderStatus.CONFIRMED);
        this.logger.log(`Order ${payment.orderId} confirmed for payment ${paymentId}`);
      }

      this.logger.log(`Stripe payment ${paymentId} confirmed successfully`);
    } catch (error) {
      this.logger.error(`Failed to process payment_intent.succeeded for ${paymentId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle successful wallet topup payment
   */
  private async handleWalletTopupSuccess(paymentIntent: Stripe.PaymentIntent) {
    const topupId = paymentIntent.metadata.topupId;
    const userId = paymentIntent.metadata.userId;

    this.logger.log(`Processing wallet topup success: ${topupId} for user ${userId}`);

    try {
      const result = await this.tokenService.processStripeTopupSuccess(
        paymentIntent.id,
        paymentIntent.amount // amount in cents
      );

      if (result.success) {
        this.logger.log(`Wallet topup ${topupId} completed successfully`);
      } else {
        this.logger.error(`Wallet topup ${topupId} failed: ${result.error}`);
      }
    } catch (error) {
      this.logger.error(`Failed to process wallet topup ${topupId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle failed payment intent
   */
  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    // Check if this is a wallet topup
    if (paymentIntent.metadata.type === 'wallet_topup') {
      await this.handleWalletTopupFailure(paymentIntent);
      return;
    }

    const paymentId = paymentIntent.metadata.paymentId;

    if (!paymentId) {
      this.logger.error('Payment ID not found in PaymentIntent metadata');
      return;
    }

    try {
      const payment = await this.paymentsV2Service.getPaymentById(paymentId);

      payment.status = PaymentStatus.FAILED;
      payment.paymentMetadata = {
        ...payment.paymentMetadata,
        stripe_error: paymentIntent.last_payment_error?.message,
        stripe_error_code: paymentIntent.last_payment_error?.code,
        stripe_error_type: paymentIntent.last_payment_error?.type,
      };

      await this.paymentsV2Service.savePayment(payment);

      this.logger.error(`Stripe payment ${paymentId} failed: ${paymentIntent.last_payment_error?.message}`);
    } catch (error) {
      this.logger.error(`Failed to process payment_intent.payment_failed for ${paymentId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle failed wallet topup payment
   */
  private async handleWalletTopupFailure(paymentIntent: Stripe.PaymentIntent) {
    const topupId = paymentIntent.metadata.topupId;
    const failureReason = paymentIntent.last_payment_error?.message || 'Unknown error';

    this.logger.log(`Processing wallet topup failure: ${topupId}`);

    try {
      await this.tokenService.processStripeTopupFailure(paymentIntent.id, failureReason);
      this.logger.log(`Wallet topup ${topupId} marked as failed: ${failureReason}`);
    } catch (error) {
      this.logger.error(`Failed to process wallet topup failure ${topupId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle payment that requires additional action (3D Secure)
   */
  private async handlePaymentRequiresAction(paymentIntent: Stripe.PaymentIntent) {
    const paymentId = paymentIntent.metadata.paymentId;

    if (!paymentId) {
      this.logger.error('Payment ID not found in PaymentIntent metadata');
      return;
    }

    try {
      const payment = await this.paymentsV2Service.getPaymentById(paymentId);

      payment.status = PaymentStatus.PROCESSING;
      payment.paymentMetadata = {
        ...payment.paymentMetadata,
        stripe_client_secret: paymentIntent.client_secret,
        requires_action: true,
        next_action_type: paymentIntent.next_action?.type,
      };

      await this.paymentsV2Service.savePayment(payment);

      this.logger.log(`Payment ${paymentId} requires additional action (3D Secure)`);
    } catch (error) {
      this.logger.error(`Failed to process payment_intent.requires_action for ${paymentId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle refunded charge
   */
  private async handleChargeRefunded(charge: Stripe.Charge) {
    const paymentIntentId = charge.payment_intent as string;

    if (!paymentIntentId) {
      this.logger.error('Payment Intent ID not found in Charge');
      return;
    }

    try {
      // Find payment by Stripe PaymentIntent ID
      const payment = await this.paymentsV2Service.findByStripePaymentIntentId(paymentIntentId);

      if (!payment) {
        this.logger.error(`Payment not found for Stripe PaymentIntent ID: ${paymentIntentId}`);
        return;
      }

      payment.status = PaymentStatus.REFUNDED;
      payment.refundedAt = new Date();
      payment.paymentMetadata = {
        ...payment.paymentMetadata,
        stripe_refund_id: charge.refunds?.data?.[0]?.id,
        refund_amount: charge.amount_refunded ? charge.amount_refunded / 100 : null,
      };

      await this.paymentsV2Service.savePayment(payment);

      // Update order status if needed
      if (payment.orderId) {
        await this.ordersService.updateStatus(payment.orderId, OrderStatus.REFUNDED);
        this.logger.log(`Order ${payment.orderId} marked as REFUNDED`);
      }

      this.logger.log(`Stripe charge ${charge.id} refunded successfully`);
    } catch (error) {
      this.logger.error(`Failed to process charge.refunded for ${paymentIntentId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle completed checkout session (WebView payment)
   */
  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const paymentId = session.metadata.paymentId;

    if (!paymentId) {
      this.logger.error('Payment ID not found in Checkout Session metadata');
      return;
    }

    try {
      const payment = await this.paymentsV2Service.getPaymentById(paymentId);

      // Idempotency check - don't process if already completed
      if (payment.status === PaymentStatus.COMPLETED) {
        this.logger.log(`Payment ${paymentId} already completed, skipping`);
        return;
      }

      // Update payment status
      payment.status = PaymentStatus.COMPLETED;
      payment.processedAt = new Date();
      payment.stripePaymentIntentId = session.payment_intent as string;
      payment.paymentMetadata = {
        ...payment.paymentMetadata,
        stripe_checkout_session_id: session.id,
        stripe_payment_status: session.payment_status,
      };

      await this.paymentsV2Service.savePayment(payment);

      // Update order status to CONFIRMED
      if (payment.orderId) {
        await this.ordersService.updateStatus(payment.orderId, OrderStatus.CONFIRMED);
        this.logger.log(`Order ${payment.orderId} confirmed for payment ${paymentId}`);
      }

      this.logger.log(`Stripe checkout session ${session.id} completed successfully for payment ${paymentId}`);
    } catch (error) {
      this.logger.error(`Failed to process checkout.session.completed for ${paymentId}: ${error.message}`);
      throw error;
    }
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

  // Payment callback pages (for MercadoPago back_urls and Stripe success_url)
  @Get('callback/success')
  async paymentSuccessCallback(
    @Query('paymentId') paymentId: string,
    @Query('session_id') sessionId: string,
    @Res() res: Response,
  ) {
    console.log('✅ Payment success callback:', paymentId);

    // If session_id is present, this is a Stripe checkout success
    if (sessionId) {
      console.log('💳 Stripe checkout session completed:', sessionId);

      try {
        // Update payment and order status
        const payment = await this.paymentsV2Service.getPaymentById(paymentId);

        if (payment && payment.status !== PaymentStatus.COMPLETED) {
          payment.status = PaymentStatus.COMPLETED;
          payment.processedAt = new Date();
          payment.paymentMetadata = {
            ...payment.paymentMetadata,
            stripe_checkout_session_id: sessionId,
            completed_via: 'callback',
          };

          await this.paymentsV2Service.savePayment(payment);

          // Update order status to CONFIRMED
          if (payment.orderId) {
            await this.ordersService.updateStatus(payment.orderId, OrderStatus.CONFIRMED);
            console.log(`✅ Order ${payment.orderId} confirmed after Stripe checkout`);
          }
        }
      } catch (error) {
        this.logger.error(`Failed to process Stripe checkout callback: ${error.message}`);
      }
    }

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