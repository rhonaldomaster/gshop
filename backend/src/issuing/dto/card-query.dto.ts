import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { CardTransactionType, CardTransactionStatus } from '../entities/card-transaction.entity';

export class CardTransactionQueryDto {
  @IsOptional()
  @IsEnum(CardTransactionType)
  @ApiProperty({ enum: CardTransactionType, required: false })
  type?: CardTransactionType;

  @IsOptional()
  @IsEnum(CardTransactionStatus)
  @ApiProperty({ enum: CardTransactionStatus, required: false })
  status?: CardTransactionStatus;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'ISO date string', example: '2026-01-01' })
  startDate?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'ISO date string', example: '2026-12-31' })
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ required: false, default: 1 })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({ required: false, default: 20 })
  limit?: number;
}
