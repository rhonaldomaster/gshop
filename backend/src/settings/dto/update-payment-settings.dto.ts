import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class UpdatePaymentSettingsDto {
  @ApiProperty({ example: 'client_id_here', description: 'MercadoPago client ID' })
  @IsOptional()
  @IsString()
  mercadoPagoClientId?: string;

  @ApiProperty({ example: 'client_secret_here', description: 'MercadoPago client secret' })
  @IsOptional()
  @IsString()
  mercadoPagoClientSecret?: string;

  @ApiProperty({ example: 'access_token_here', description: 'MercadoPago access token' })
  @IsOptional()
  @IsString()
  mercadoPagoAccessToken?: string;

  @ApiProperty({ example: 7, description: 'Default commission rate (%)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  defaultCommissionRate?: number;

  @ApiProperty({ example: 100000, description: 'Minimum withdrawal amount (COP)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minWithdrawalAmount?: number;

  @ApiProperty({ example: 'weekly', description: 'Withdrawal frequency (weekly, monthly)' })
  @IsOptional()
  @IsString()
  withdrawalFrequency?: string;
}
