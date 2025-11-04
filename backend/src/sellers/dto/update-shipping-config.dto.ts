import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateShippingConfigDto {
  @ApiProperty({
    description: 'Precio de envío local (misma ciudad)',
    example: 5000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  shippingLocalPrice: number;

  @ApiProperty({
    description: 'Precio de envío nacional (otras ciudades)',
    example: 15000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  shippingNationalPrice: number;

  @ApiProperty({
    description: '¿Ofrece envío gratis?',
    example: false,
  })
  @IsBoolean()
  shippingFreeEnabled: boolean;

  @ApiProperty({
    description: 'Monto mínimo para envío gratis (opcional)',
    example: 50000,
    required: false,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  shippingFreeMinAmount?: number;
}
