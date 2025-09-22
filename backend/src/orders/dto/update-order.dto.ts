
import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

export class UpdateOrderDto {
  @ApiProperty({ example: 'UPS123456789', required: false })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiProperty({ example: 'UPS', required: false })
  @IsOptional()
  @IsString()
  shippingCarrier?: string;

  @ApiProperty({ example: '2024-01-15T10:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  estimatedDeliveryDate?: Date;

  @ApiProperty({
    example: 'Order has been shipped and is on the way',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
