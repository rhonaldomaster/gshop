import { IsString, IsEnum, IsOptional, IsNumber, IsDateString, IsObject } from 'class-validator';
import { CampaignType, CampaignStatus } from '../ads.entity';

export class CreateCampaignDto {
  @IsString()
  name: string;

  @IsEnum(CampaignType)
  type: CampaignType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  budget: number;

  @IsNumber()
  dailyBudget: number;

  @IsOptional()
  @IsObject()
  targetAudience?: any;

  @IsOptional()
  @IsObject()
  creative?: any;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsNumber()
  dailyBudget?: number;

  @IsOptional()
  @IsObject()
  targetAudience?: any;

  @IsOptional()
  @IsObject()
  creative?: any;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CampaignMetricsDto {
  @IsNumber()
  impressions: number;

  @IsNumber()
  clicks: number;

  @IsNumber()
  conversions: number;

  @IsNumber()
  spend: number;

  @IsNumber()
  revenue: number;

  @IsDateString()
  date: string;
}