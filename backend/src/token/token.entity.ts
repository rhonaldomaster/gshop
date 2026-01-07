import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

export enum TokenTransactionType {
  REWARD = 'reward',
  CASHBACK = 'cashback',
  REFERRAL = 'referral',
  PURCHASE = 'purchase',
  WITHDRAWAL = 'withdrawal',
  TRANSFER = 'transfer',
  TRANSFER_OUT = 'transfer_out',
  TRANSFER_IN = 'transfer_in',
  PLATFORM_FEE = 'platform_fee',  // Fee charged to recipient on P2P transfers (0.2%)
  BONUS = 'bonus',
  PENALTY = 'penalty',
  TOPUP = 'topup',
  BURN = 'burn',
  MINT = 'mint'
}

export enum TokenTransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum RewardTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
  CASHBACK = 'cashback'
}

@Entity('gshop_wallets')
export class GshopWallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { unique: true })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('decimal', { precision: 18, scale: 8, default: 0 })
  balance: number;

  @Column('decimal', { precision: 18, scale: 8, default: 0 })
  lockedBalance: number;

  @Column('decimal', { precision: 18, scale: 8, default: 0 })
  totalEarned: number;

  @Column('decimal', { precision: 18, scale: 8, default: 0 })
  totalSpent: number;

  @Column({ type: 'enum', enum: RewardTier, default: RewardTier.BRONZE })
  tier: RewardTier;

  @Column('int', { default: 0 })
  tierPoints: number;

  @Column('decimal', { precision: 5, scale: 4, default: 0.05 })
  cashbackRate: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastTransactionAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('gshop_transactions')
export class GshopTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  walletId: string;

  @ManyToOne(() => GshopWallet)
  @JoinColumn({ name: 'walletId' })
  wallet: GshopWallet;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: TokenTransactionType })
  type: TokenTransactionType;

  @Column({ type: 'enum', enum: TokenTransactionStatus, default: TokenTransactionStatus.PENDING })
  status: TokenTransactionStatus;

  @Column('decimal', { precision: 18, scale: 8 })
  amount: number;

  @Column('decimal', { precision: 18, scale: 8, default: 0 })
  fee: number;

  @Column('varchar', { length: 100, nullable: true })
  reference: string;

  @Column('uuid', { nullable: true })
  orderId: string;

  @Column('uuid', { nullable: true })
  fromUserId: string;

  @Column('uuid', { nullable: true })
  toUserId: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('json', { nullable: true })
  metadata: any;

  @Column({ nullable: true })
  txHash: string;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ nullable: true })
  paymentMethod: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('reward_campaigns')
export class RewardCampaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column({ type: 'enum', enum: TokenTransactionType })
  rewardType: TokenTransactionType;

  @Column('decimal', { precision: 18, scale: 8 })
  rewardAmount: number;

  @Column('decimal', { precision: 5, scale: 4, nullable: true })
  rewardPercentage: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  minPurchaseAmount: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  maxRewardAmount: number;

  @Column('json', { nullable: true })
  conditions: any;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column('int', { default: 0 })
  usageCount: number;

  @Column('int', { nullable: true })
  usageLimit: number;

  @Column({ nullable: true })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('referral_rewards')
export class ReferralReward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  referrerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'referrerId' })
  referrer: User;

  @Column('uuid')
  referredId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'referredId' })
  referred: User;

  @Column()
  referralCode: string;

  @Column('decimal', { precision: 18, scale: 8, default: 0 })
  referrerReward: number;

  @Column('decimal', { precision: 18, scale: 8, default: 0 })
  referredReward: number;

  @Column({ default: false })
  isFirstPurchaseCompleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  firstPurchaseAt: Date;

  @Column({ default: false })
  rewardsPaid: boolean;

  @Column({ type: 'timestamp', nullable: true })
  rewardsPaidAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('token_metrics')
export class TokenMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column('decimal', { precision: 18, scale: 8, default: 0 })
  totalSupply: number;

  @Column('decimal', { precision: 18, scale: 8, default: 0 })
  circulatingSupply: number;

  @Column('decimal', { precision: 18, scale: 8, default: 0 })
  totalRewardsDistributed: number;

  @Column('decimal', { precision: 18, scale: 8, default: 0 })
  totalCashbackPaid: number;

  @Column('int', { default: 0 })
  activeWallets: number;

  @Column('int', { default: 0 })
  dailyTransactions: number;

  @Column('int', { default: 0 })
  totalTransactions: number;

  @Column('int', { default: 0 })
  totalWallets: number;

  @Column('decimal', { precision: 18, scale: 8, default: 0 })
  dailyVolume: number;

  @Column('decimal', { precision: 10, scale: 8, default: 1 })
  tokenPrice: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Add missing entity aliases for imports
export class TokenReward extends RewardCampaign {}
export class WalletTopup extends GshopTransaction {}
export class TokenCirculation extends TokenMetrics {}

// Add missing enums/types
export const TransactionType = TokenTransactionType;
export const RewardType = RewardTier;
export const TopupStatus = TokenTransactionStatus;