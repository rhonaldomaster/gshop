import { IsBoolean, IsNumber, IsOptional, IsString, IsEnum, Min, Max } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export enum AffiliateProductStatusUpdate {
  ACTIVE = 'active',
  PAUSED = 'paused',
}

export class UpdateAffiliateProductDto {
  @ApiPropertyOptional({ description: 'Custom commission rate (1-50%)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  customCommissionRate?: number

  @ApiPropertyOptional({ description: 'Status (active or paused)' })
  @IsOptional()
  @IsEnum(AffiliateProductStatusUpdate)
  status?: AffiliateProductStatusUpdate

  @ApiPropertyOptional({ description: 'Special price for affiliate promotions' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  specialPrice?: number

  @ApiPropertyOptional({ description: 'Promotional text for affiliate' })
  @IsOptional()
  @IsString()
  promotionalText?: string
}

export class ApproveAffiliateProductDto {
  @ApiProperty({ description: 'Approve (true) or reject (false)' })
  @IsBoolean()
  approved: boolean

  @ApiPropertyOptional({ description: 'Optional notes (required if rejected)' })
  @IsOptional()
  @IsString()
  notes?: string
}

export class UpdateCommissionDto {
  @ApiProperty({ description: 'Commission rate percentage (1-50%)' })
  @IsNumber()
  @Min(1)
  @Max(50)
  rate: number
}

export class UpdateStatusDto {
  @ApiProperty({ description: 'New status (active or paused)' })
  @IsEnum(AffiliateProductStatusUpdate)
  status: AffiliateProductStatusUpdate
}
