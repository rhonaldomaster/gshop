
import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsNumber,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { PaymentMethod } from '../../database/entities/payment.entity';

export class CreatePaymentDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID()
  orderId: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CREDIT_CARD })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({
    example: 1,
    required: false,
    description: 'Number of installments (1-12)',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  installments?: number;

  @ApiProperty({
    example: 'card_token_from_mercadopago',
    required: false,
    description: 'Card token from MercadoPago SDK',
  })
  @IsOptional()
  @IsString()
  cardToken?: string;
}
