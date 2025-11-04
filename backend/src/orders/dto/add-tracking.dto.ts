import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddTrackingDto {
  @ApiProperty({
    description: 'URL del link de rastreo',
    example: 'https://servientrega.com/rastrear?guia=123456789',
  })
  @IsUrl()
  @IsNotEmpty()
  shippingTrackingUrl: string;

  @ApiProperty({
    description: 'Número de guía de rastreo',
    example: '123456789',
  })
  @IsString()
  @IsNotEmpty()
  shippingTrackingNumber: string;

  @ApiProperty({
    description: 'Empresa de mensajería',
    example: 'Servientrega',
  })
  @IsString()
  @IsNotEmpty()
  shippingCarrier: string;

  @ApiProperty({
    description: 'Notas adicionales sobre el envío (opcional)',
    example: 'El paquete será entregado en 2-3 días hábiles',
    required: false,
  })
  @IsString()
  @IsOptional()
  shippingNotes?: string;
}
