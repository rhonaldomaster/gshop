import { IsString, IsNumber, IsEnum, IsOptional, Min, IsObject } from 'class-validator';
import { RewardType } from '../token.entity';

export class CreateWalletDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  cashbackRate?: number;
}

export class TransferTokensDto {
  @IsString()
  fromUserId: string;

  @IsString()
  toUserId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class RewardUserDto {
  @IsString()
  userId: string;

  @IsEnum(RewardType)
  rewardType: RewardType;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class TopupWalletDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  paymentMethod: string;

  @IsString()
  paymentIntentId: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class BurnTokensDto {
  @IsString()
  userId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  reason: string;
}

export class MintTokensDto {
  @IsString()
  userId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  reason: string;
}

export class TokenStatsQueryDto {
  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}