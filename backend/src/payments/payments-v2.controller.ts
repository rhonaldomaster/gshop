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
} from '@nestjs/common';
import { PaymentsV2Service } from './payments-v2.service';
import { CreatePaymentV2Dto, ProcessCryptoPaymentDto, CreatePaymentMethodDto, CreateInvoiceDto, UpdateInvoiceStatusDto, PaymentStatsQueryDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments-v2')
export class PaymentsV2Controller {
  constructor(private readonly paymentsV2Service: PaymentsV2Service) {}

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