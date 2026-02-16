import { IsString, IsNumber, IsEnum, IsOptional, Min, IsObject, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import { Transform, Type } from 'class-transformer';
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
  @Min(0.50) // Minimum $0.50 USD
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
  @Min(0.50) // Minimum $0.50 USD
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}

export class TransferResultDto {
  success: boolean;
  transferId: string;
  dynamicCode: string;      // Unique verification code (e.g., "GS-7K3M9P")
  executedAt: string;       // ISO timestamp of execution
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

// Stripe Topup DTOs

export class CreateStripeTopupDto {
  @IsNumber()
  @Min(0.50) // Minimum $0.50 USD
  amount: number; // Amount in USD
}

export class StripeTopupResponseDto {
  topupId: string;
  clientSecret: string;
  publishableKey: string;
  amountUSD: number;
  expiresAt: Date;
}

export class TopupStatusDto {
  topupId: string;
  status: string;
  amount: number;
  currency: string;
  stripePaymentIntentId?: string;
  processedAt?: Date;
  createdAt: Date;
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

// Admin Transaction DTOs

export class AdminTransactionFilterDto {
  @IsOptional()
  @IsString()
  type?: string; // transfer_in, transfer_out, platform_fee, topup, purchase, etc.

  @IsOptional()
  @IsString()
  status?: string; // pending, completed, failed, cancelled

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  search?: string; // Search by user email or transaction reference

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}

export class AdminTransactionStatsDto {
  totalTransactions: number;
  totalVolume: number;
  totalFees: number;
  transfersCount: number;
  transfersVolume: number;
  topupsCount: number;
  topupsVolume: number;
  purchasesCount: number;
  purchasesVolume: number;
  pendingTransactions: number;
  todayTransactions: number;
  todayVolume: number;
}

export class AdminTransactionResponseDto {
  id: string;
  type: string;
  status: string;
  amount: number;
  fee: number;
  reference: string;
  description: string;
  dynamicCode?: string;     // Unique verification code for transfers (e.g., "GS-7K3M9P")
  executedAt?: Date;        // Exact execution timestamp for transfers
  createdAt: Date;
  processedAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  fromUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  toUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  metadata?: any;
}

// Transaction Verification DTOs (for dynamic code lookup)

export class VerifyTransactionByCodeDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(9)  // "GS-" + 6 chars
  @MaxLength(10)
  code: string;
}

export class TransactionDetailDto {
  id: string;
  type: string;
  status: string;
  amount: number;
  fee: number;
  description: string;
  executedAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export class TransactionVerificationResponseDto {
  dynamicCode: string;
  verified: boolean;
  transactions: TransactionDetailDto[];
}

export class AdminTransactionVerificationResponseDto {
  dynamicCode: string;
  verified: boolean;
  transactions: TransactionDetailDto[];
  summary: {
    sender: {
      name: string;
      email: string;
    };
    receiver: {
      name: string;
      email: string;
    };
    amountSent: number;
    platformFee: number;
    netReceived: number;
    executedAt: string;
  };
}