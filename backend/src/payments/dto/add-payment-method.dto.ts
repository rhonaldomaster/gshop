import { IsString, IsBoolean, IsOptional, IsObject, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../payments-v2.entity';

export class AddPaymentMethodDto {
  @ApiProperty({ enum: PaymentMethod, description: 'Type of payment method' })
  @IsEnum(PaymentMethod)
  type: PaymentMethod;

  @ApiProperty({ description: 'Payment method details (card info, crypto address, etc.)' })
  @IsObject()
  details: {
    brand?: string;
    last4?: string;
    expiryMonth?: number;
    expiryYear?: number;
    holderName?: string;
    stripePaymentMethodId?: string;
    polygonAddress?: string;
  };

  @ApiProperty({ description: 'Set as default payment method', default: false })
  @IsBoolean()
  @IsOptional()
  setAsDefault?: boolean;
}
