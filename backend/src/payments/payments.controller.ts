
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  UseGuards,
  Request,
  Headers,
  Query,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { MercadoPagoService } from './mercadopago.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { AddPaymentMethodDto } from './dto/add-payment-method.dto';
import { PaymentStatsDto } from './dto/payment-stats.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../database/entities/user.entity';
import { rateLimitConfig } from '../common/config/rate-limit.config';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  @Public()
  @Post()
  @Throttle({ default: rateLimitConfig.endpoints.payments.create })
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiResponse({ status: 400, description: 'Payment creation failed' })
  @ApiResponse({ status: 429, description: 'Too many payment attempts' })
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.createPayment(createPaymentDto);
  }

  @Post('webhooks/mercadopago')
  @SkipThrottle()
  @ApiOperation({ summary: 'MercadoPago webhook handler' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleMercadoPagoWebhook(
    @Body() body: any,
    @Headers('x-signature') xSignature?: string,
    @Headers('x-request-id') xRequestId?: string,
  ) {
    // Validate webhook signature
    if (xSignature && xRequestId && body.data?.id) {
      const isValid = this.mercadoPagoService.validateWebhookSignature(
        xSignature,
        xRequestId,
        body.data.id,
      );
      if (!isValid) {
        this.logger.error('Webhook signature validation failed');
        return { error: 'Invalid signature' };
      }
    }

    await this.paymentsService.handleWebhook(body);
    return { status: 'ok' };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get payment statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Payment statistics retrieved successfully',
    type: PaymentStatsDto,
  })
  getStats(): Promise<PaymentStatsDto> {
    return this.paymentsService.getPaymentStats();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all payments with pagination (Admin only)' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  findAll(@Query() query: any) {
    return this.paymentsService.findAll(query);
  }

  @Get('methods')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get user payment methods' })
  @ApiResponse({ status: 200, description: 'Payment methods retrieved successfully' })
  getPaymentMethods(@Request() req) {
    return this.paymentsService.getUserPaymentMethods(req.user.id);
  }

  @Post('methods')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add new payment method' })
  @ApiResponse({ status: 201, description: 'Payment method added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment method data' })
  addPaymentMethod(@Request() req, @Body() addPaymentMethodDto: AddPaymentMethodDto) {
    return this.paymentsService.addPaymentMethod(req.user.id, addPaymentMethodDto);
  }

  @Put('methods/:id/default')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Set payment method as default' })
  @ApiResponse({ status: 200, description: 'Default payment method updated' })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  setDefaultPaymentMethod(@Request() req, @Param('id') id: string) {
    return this.paymentsService.setDefaultPaymentMethod(req.user.id, id);
  }

  @Delete('methods/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete payment method' })
  @ApiResponse({ status: 200, description: 'Payment method deleted successfully' })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  async deletePaymentMethod(@Request() req, @Param('id') id: string) {
    await this.paymentsService.deletePaymentMethod(req.user.id, id);
    return { message: 'Payment method deleted successfully' };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Get('transaction/:transactionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get payment by transaction ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  findByTransactionId(@Param('transactionId') transactionId: string) {
    return this.paymentsService.findByTransactionId(transactionId);
  }

  @Patch(':id/refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Refund payment (Admin only)' })
  @ApiResponse({ status: 200, description: 'Payment refunded successfully' })
  @ApiResponse({ status: 400, description: 'Refund failed' })
  refund(@Param('id') id: string, @Body() body: { amount?: number }) {
    return this.paymentsService.refundPayment(id, body.amount);
  }
}
