import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment, PaymentRefund } from 'mercadopago';
import * as crypto from 'crypto';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly client: MercadoPagoConfig;
  private readonly preferenceClient: Preference;
  private readonly paymentClient: Payment;
  private readonly refundClient: PaymentRefund;
  private readonly accessToken: string;
  private readonly webhookSecret: string;

  constructor(private configService: ConfigService) {
    this.accessToken = this.configService.get('MERCAPAGO_ACCESS_TOKEN');
    this.webhookSecret = this.configService.get('MERCAPAGO_WEBHOOK_SECRET') || '';

    if (!this.accessToken) {
      this.logger.warn('⚠️ MercadoPago access token not configured');
    }

    if (!this.webhookSecret || this.webhookSecret === 'dummy') {
      this.logger.warn('⚠️ MercadoPago webhook secret not configured - webhook signature validation will be SKIPPED');
      this.logger.warn('This is OK for development, but REQUIRED for production');
      this.logger.warn('Get your secret from: MercadoPago Dashboard > Developers > Webhooks');
    } else {
      this.logger.log('✅ MercadoPago webhook secret configured - signature validation ENABLED');
    }

    // Initialize MercadoPago SDK client
    this.client = new MercadoPagoConfig({
      accessToken: this.accessToken,
      options: {
        timeout: 5000,
        idempotencyKey: 'unique-key', // Will be overridden per request
      }
    });

    // Initialize API clients
    this.preferenceClient = new Preference(this.client);
    this.paymentClient = new Payment(this.client);
    this.refundClient = new PaymentRefund(this.client);
  }

  async createPreference(preferenceData: {
    items: Array<{
      id?: string;
      title: string;
      quantity: number;
      currency_id: string;
      unit_price: number;
    }>;
    back_urls?: {
      success: string;
      failure: string;
      pending: string;
    };
    auto_return?: 'approved' | 'all';
    external_reference?: string;
    notification_url?: string;
  }): Promise<any> {
    this.logger.log('Creating MercadoPago preference');
    this.logger.debug('Preference data:', JSON.stringify(preferenceData, null, 2));

    if (!this.accessToken) {
      throw new BadRequestException('MercadoPago access token is missing');
    }

    try {
      const preference = await this.preferenceClient.create({
        body: preferenceData as any,
      });

      this.logger.log(`MercadoPago preference created: ${preference.id}`);
      return preference;
    } catch (error) {
      this.logger.error('MercadoPago preference creation error:', error);

      // Better error handling
      if (error.cause) {
        this.logger.error('Error cause:', JSON.stringify(error.cause, null, 2));
      }

      throw new BadRequestException(
        `Failed to create MercadoPago preference: ${error.message || 'Unknown error'}`
      );
    }
  }

  async createPayment(paymentData: {
    transactionId: string;
    orderId: string;
    amount: number;
    description: string;
    payerEmail: string;
    items: Array<{
      id: string;
      title: string;
      quantity: number;
      unit_price: number;
    }>;
    shippingAddress?: any;
    method: string;
    paymentMethodId?: string; // Dynamic payment method from frontend (visa, mastercard, amex, etc.)
    installments?: number;
    cardToken?: string;
  }): Promise<any> {
    this.logger.log('Creating MercadoPago payment');
    this.logger.debug('Payment data:', {
      transactionId: paymentData.transactionId,
      orderId: paymentData.orderId,
      amount: paymentData.amount,
      method: paymentData.method,
      paymentMethodId: paymentData.paymentMethodId,
    });

    if (!this.accessToken) {
      throw new BadRequestException('MercadoPago access token is missing');
    }

    try {
      // Use payment_method_id from frontend if provided, otherwise fallback to method mapping
      const paymentMethodId = paymentData.paymentMethodId || this.getPaymentMethodId(paymentData.method);

      const payment = await this.paymentClient.create({
        body: {
          transaction_amount: paymentData.amount,
          description: paymentData.description,
          payment_method_id: paymentMethodId,
          payer: {
            email: paymentData.payerEmail,
          },
          external_reference: paymentData.transactionId,
          installments: paymentData.installments || 1,
          token: paymentData.cardToken,
          additional_info: {
            items: paymentData.items.map(item => ({
              id: item.id,
              title: item.title,
              quantity: item.quantity,
              unit_price: item.unit_price,
            })),
            shipments: paymentData.shippingAddress ? {
              receiver_address: {
                zip_code: paymentData.shippingAddress.postalCode,
                state_name: paymentData.shippingAddress.state,
                city_name: paymentData.shippingAddress.city,
                street_name: paymentData.shippingAddress.address1,
              },
            } : undefined,
          },
        },
        requestOptions: {
          idempotencyKey: paymentData.transactionId,
        }
      } as any);

      this.logger.log(`MercadoPago payment created: ${payment.id}`);
      return payment;
    } catch (error) {
      this.logger.error('MercadoPago payment creation error:', error);

      if (error.cause) {
        this.logger.error('Error cause:', JSON.stringify(error.cause, null, 2));
      }

      throw new BadRequestException(
        `Failed to create payment: ${error.message || 'Unknown error'}`
      );
    }
  }

  async getPayment(paymentId: string): Promise<any> {
    this.logger.log(`Getting MercadoPago payment: ${paymentId}`);

    if (!this.accessToken) {
      throw new BadRequestException('MercadoPago access token is missing');
    }

    try {
      const payment = await this.paymentClient.get({ id: paymentId });
      this.logger.log(`Payment retrieved: ${paymentId}, status: ${payment.status}`);
      return payment;
    } catch (error) {
      this.logger.error('MercadoPago get payment error:', error);

      if (error.cause) {
        this.logger.error('Error cause:', JSON.stringify(error.cause, null, 2));
      }

      throw new BadRequestException(
        `Failed to get payment: ${error.message || 'Unknown error'}`
      );
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<any> {
    this.logger.log(`Refunding MercadoPago payment: ${paymentId}, amount: ${amount || 'full'}`);

    if (!this.accessToken) {
      throw new BadRequestException('MercadoPago access token is missing');
    }

    try {
      const refundBody: any = {};
      if (amount) {
        refundBody.amount = amount;
      }

      const refund = await this.refundClient.create({
        payment_id: paymentId,
        body: refundBody,
      } as any);

      this.logger.log(`Refund created: ${refund.id} for payment ${paymentId}`);
      return refund;
    } catch (error) {
      this.logger.error('MercadoPago refund error:', error);

      if (error.cause) {
        this.logger.error('Error cause:', JSON.stringify(error.cause, null, 2));
      }

      throw new BadRequestException(
        `Failed to process refund: ${error.message || 'Unknown error'}`
      );
    }
  }

  validateWebhookSignature(
    xSignature: string,
    xRequestId: string,
    dataId: string,
  ): boolean {
    this.logger.debug('Validating MercadoPago webhook signature');

    // If webhook secret is not configured or is placeholder, skip validation (development mode)
    if (!this.webhookSecret || this.webhookSecret === 'dummy' || this.webhookSecret.trim() === '') {
      this.logger.warn('⚠️ Webhook secret not configured - SKIPPING signature validation (development mode)');
      return true; // Allow webhook in development
    }

    try {
      // Parse x-signature header: "ts=123456789,v1=hash_signature"
      const signatureParts = this.parseXSignature(xSignature);
      if (!signatureParts) {
        this.logger.error('❌ Invalid x-signature header format');
        return false;
      }

      const { ts, v1 } = signatureParts;

      // Build signature template: "id:{data.id};request-id:{x-request-id};ts:{ts};"
      const signatureTemplate = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

      // Calculate HMAC-SHA256 signature
      const calculatedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(signatureTemplate)
        .digest('hex');

      // Compare signatures (constant-time comparison to prevent timing attacks)
      const isValid = crypto.timingSafeEqual(
        Buffer.from(calculatedSignature),
        Buffer.from(v1),
      );

      if (!isValid) {
        this.logger.error('❌ Webhook signature validation failed', {
          expected: calculatedSignature,
          received: v1,
          template: signatureTemplate,
        });
        this.logger.warn('TIP: Make sure MERCAPAGO_WEBHOOK_SECRET matches your MercadoPago webhook secret');
      } else {
        this.logger.log('✅ Webhook signature validated successfully');
      }

      return isValid;
    } catch (error) {
      this.logger.error('❌ Error validating webhook signature:', error);
      // In production, this should return false
      // In development, we allow it to continue
      return !this.webhookSecret || this.webhookSecret === 'dummy';
    }
  }

  private parseXSignature(xSignature: string): { ts: string; v1: string } | null {
    try {
      // Format: "ts=123456789,v1=hash_signature"
      const parts = xSignature.split(',');
      const result: any = {};

      for (const part of parts) {
        const [key, value] = part.split('=');
        result[key] = value;
      }

      if (!result.ts || !result.v1) {
        return null;
      }

      return { ts: result.ts, v1: result.v1 };
    } catch (error) {
      this.logger.error('Error parsing x-signature header:', error);
      return null;
    }
  }

  private getPaymentMethodId(method: string): string {
    const methodMap: Record<string, string> = {
      credit_card: 'visa', // Should be dynamic based on card
      debit_card: 'maestro',
      bank_transfer: 'pse', // For Colombia
      wallet: 'account_money',
      pix: 'pix', // For Brazil
    };

    return methodMap[method] || 'visa';
  }
}
