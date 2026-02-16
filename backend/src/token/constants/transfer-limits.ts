/**
 * Transfer Limits Configuration
 *
 * Defines transaction limits based on user verification level (KYC).
 * All amounts are in USD.
 */

export enum VerificationLevel {
  NONE = 'none',           // No verification - basic limits
  LEVEL_1 = 'level_1',     // Name + Document + Selfie
  LEVEL_2 = 'level_2',     // + Address + Source of Funds
}

export interface TransferLimitConfig {
  minPerTransaction: number;
  maxPerTransaction: number;
  dailyLimit: number;
  monthlyLimit: number;
}

export const TRANSFER_LIMITS: Record<VerificationLevel, TransferLimitConfig> = {
  [VerificationLevel.NONE]: {
    minPerTransaction: 0.50,          // $0.50 USD minimum
    maxPerTransaction: 250,           // $250 USD per transaction
    dailyLimit: 300,                  // $300 USD daily
    monthlyLimit: 1_000,             // $1,000 USD monthly
  },
  [VerificationLevel.LEVEL_1]: {
    minPerTransaction: 0.50,
    maxPerTransaction: 1_250,         // $1,250 USD per transaction
    dailyLimit: 2_000,               // $2,000 USD daily
    monthlyLimit: 10_000,            // $10,000 USD monthly
  },
  [VerificationLevel.LEVEL_2]: {
    minPerTransaction: 0.50,
    maxPerTransaction: 5_000,         // $5,000 USD per transaction
    dailyLimit: 10_000,              // $10,000 USD daily
    monthlyLimit: 50_000,            // $50,000 USD monthly
  },
};

/**
 * Platform fee charged to the recipient on each transfer
 * 0.2% = 0.002
 */
export const PLATFORM_FEE_RATE = 0.002;

/**
 * Minimum amount for platform fee to be applied
 * Below this amount, no fee is charged
 */
export const PLATFORM_FEE_MIN_AMOUNT = 1; // $1 USD

/**
 * Get limits for a specific verification level
 */
export function getLimitsForLevel(level: VerificationLevel): TransferLimitConfig {
  return TRANSFER_LIMITS[level] || TRANSFER_LIMITS[VerificationLevel.NONE];
}

/**
 * Calculate platform fee for a given amount
 * Fee is charged to the recipient AFTER receiving the full amount (Option A)
 *
 * Option A Flow:
 * 1. Sender sends $100 → Sender balance -$100
 * 2. Recipient receives $100 → Recipient balance +$100
 * 3. Platform fee charged → Recipient balance -$0.20 (0.2%)
 * 4. Final: Recipient has $99.80
 */
export function calculatePlatformFee(amount: number): number {
  if (amount < PLATFORM_FEE_MIN_AMOUNT) {
    return 0;
  }
  return Math.round(amount * PLATFORM_FEE_RATE);
}

/**
 * Get transfer preview for UI display (Option A model)
 * Shows breakdown: amount sent, amount received, fee charged, final balance
 */
export function getTransferPreview(amount: number): {
  amountSent: number;
  amountReceived: number;
  platformFee: number;
  recipientNetAmount: number;
  feePercentage: string;
} {
  const fee = calculatePlatformFee(amount);
  return {
    amountSent: amount,           // What sender pays
    amountReceived: amount,       // What recipient receives (full amount)
    platformFee: fee,             // Fee charged to recipient after receipt
    recipientNetAmount: amount - fee,  // What recipient keeps after fee
    feePercentage: `${PLATFORM_FEE_RATE * 100}%`,
  };
}
