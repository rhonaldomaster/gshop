import { IsString, IsNumber, IsEnum, IsOptional, Min, IsObject, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import { RewardTier } from '../token.entity';

export class CreateWalletDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  cashbackRate?: number;
}

// P2P Transfer DTOs

export class SearchUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  query: string; // Email or phone number
}

export class SearchUserResponseDto {
  userId: string;
  firstName: string;
  lastName: string;
  maskedEmail: string;
  maskedPhone?: string;
}

export class TransferPreviewDto {
  @IsString()
  @IsNotEmpty()
  toUserId: string;

  @IsNumber()
  @Min(100) // Minimum $100 COP
  amount: number;
}

export class TransferPreviewResponseDto {
  amountSent: number;         // What sender pays
  amountReceived: number;     // What recipient receives (full amount)
  platformFee: number;        // Fee charged to recipient after receipt
  recipientNetAmount: number; // What recipient keeps after fee
  feePercentage: string;      // e.g., "0.2%"
  recipientName: string;      // Recipient's name for confirmation
}

export class ExecuteTransferDto {
  @IsString()
  @IsNotEmpty()
  toUserId: string;

  @IsNumber()
  @Min(100) // Minimum $100 COP
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}

export class TransferResultDto {
  success: boolean;
  transferId: string;
  transactions: {
    type: string;
    amount: number;
    userId: string;
    description: string;
  }[];
  summary: {
    amountSent: number;
    feeCharged: number;
    recipientNetBalance: number;
    senderNewBalance: number;
  };
  timestamp: Date;
}

export class TransferLimitsResponseDto {
  level: string;
  levelName: string;
  limits: {
    minPerTransaction: number;
    maxPerTransaction: number;
    dailyLimit: number;
    monthlyLimit: number;
  };
  usage: {
    dailyTransferred: number;
    dailyRemaining: number;
    monthlyTransferred: number;
    monthlyRemaining: number;
    dailyTransferCount: number;
    monthlyTransferCount: number;
  };
  canUpgrade: boolean;
  nextLevel?: string;
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

  @IsEnum(RewardTier)
  rewardType: RewardTier;

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