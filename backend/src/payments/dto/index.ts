import { IsString, IsNumber, IsEnum, IsOptional, IsArray, IsObject, Min } from 'class-validator';
import { PaymentMethod, PaymentStatus, InvoiceStatus } from '../payments-v2.entity';

export class CreatePaymentDto {
  @IsString()
  orderId: string;

  @IsString()
  userId: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cryptoAmount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  cryptoCurrency?: string;

  @IsOptional()
  @IsObject()
  paymentMetadata?: any;
}

export class ProcessCryptoPaymentDto {
  @IsString()
  txHash: string;

  @IsString()
  fromAddress: string;

  @IsString()
  toAddress: string;

  @IsNumber()
  @Min(0)
  amount: number;
}

export class CreatePaymentMethodDto {
  @IsEnum(PaymentMethod)
  type: PaymentMethod;

  @IsString()
  displayName: string;

  @IsOptional()
  @IsString()
  stripePaymentMethodId?: string;

  @IsOptional()
  @IsString()
  polygonAddress?: string;

  @IsOptional()
  @IsString()
  lastFourDigits?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsNumber()
  expiryMonth?: number;

  @IsOptional()
  @IsNumber()
  expiryYear?: number;

  @IsOptional()
  @IsString()
  isDefault?: boolean;
}

export class CreateInvoiceDto {
  @IsString()
  orderId: string;

  @IsString()
  sellerId: string;

  @IsString()
  buyerId: string;

  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCost?: number;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsObject()
  billingAddress: any;

  @IsArray()
  items: any[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateInvoiceStatusDto {
  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;
}

export class PaymentStatsQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}