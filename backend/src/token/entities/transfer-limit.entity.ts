import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { VerificationLevel, getLimitsForLevel } from '../constants/transfer-limits';

@Entity('transfer_limits')
@Index(['userId'], { unique: true })
export class TransferLimit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  // Current verification level (cached from UserVerification)
  @Column({
    type: 'enum',
    enum: VerificationLevel,
    default: VerificationLevel.NONE,
  })
  verificationLevel: VerificationLevel;

  // Daily tracking
  @Column('decimal', { precision: 18, scale: 2, default: 0 })
  dailyTransferred: number;

  @Column({ type: 'date' })
  lastDailyReset: Date;

  // Monthly tracking
  @Column('decimal', { precision: 18, scale: 2, default: 0 })
  monthlyTransferred: number;

  @Column({ type: 'date' })
  lastMonthlyReset: Date;

  // Total lifetime transferred (for analytics)
  @Column('decimal', { precision: 18, scale: 2, default: 0 })
  totalLifetimeTransferred: number;

  // Transfer count
  @Column('int', { default: 0 })
  dailyTransferCount: number;

  @Column('int', { default: 0 })
  monthlyTransferCount: number;

  @Column('int', { default: 0 })
  totalTransferCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Get current limits based on verification level
   */
  getLimits() {
    return getLimitsForLevel(this.verificationLevel);
  }

  /**
   * Get remaining daily limit
   */
  getDailyRemaining(): number {
    const limits = this.getLimits();
    const remaining = limits.dailyLimit - Number(this.dailyTransferred);
    return Math.max(0, remaining);
  }

  /**
   * Get remaining monthly limit
   */
  getMonthlyRemaining(): number {
    const limits = this.getLimits();
    const remaining = limits.monthlyLimit - Number(this.monthlyTransferred);
    return Math.max(0, remaining);
  }

  /**
   * Check if a transfer amount is allowed
   */
  canTransfer(amount: number): { allowed: boolean; reason?: string } {
    const limits = this.getLimits();

    // Check minimum
    if (amount < limits.minPerTransaction) {
      return {
        allowed: false,
        reason: `Minimum transfer amount is $${limits.minPerTransaction.toLocaleString()} COP`,
      };
    }

    // Check maximum per transaction
    if (amount > limits.maxPerTransaction) {
      return {
        allowed: false,
        reason: `Maximum transfer amount is $${limits.maxPerTransaction.toLocaleString()} COP. Upgrade your verification level for higher limits.`,
      };
    }

    // Check daily limit
    const dailyRemaining = this.getDailyRemaining();
    if (amount > dailyRemaining) {
      return {
        allowed: false,
        reason: `Daily limit exceeded. Remaining: $${dailyRemaining.toLocaleString()} COP`,
      };
    }

    // Check monthly limit
    const monthlyRemaining = this.getMonthlyRemaining();
    if (amount > monthlyRemaining) {
      return {
        allowed: false,
        reason: `Monthly limit exceeded. Remaining: $${monthlyRemaining.toLocaleString()} COP`,
      };
    }

    return { allowed: true };
  }

  /**
   * Record a transfer (updates counters)
   */
  recordTransfer(amount: number): void {
    this.dailyTransferred = Number(this.dailyTransferred) + amount;
    this.monthlyTransferred = Number(this.monthlyTransferred) + amount;
    this.totalLifetimeTransferred = Number(this.totalLifetimeTransferred) + amount;
    this.dailyTransferCount += 1;
    this.monthlyTransferCount += 1;
    this.totalTransferCount += 1;
  }

  /**
   * Reset daily counters
   */
  resetDaily(): void {
    this.dailyTransferred = 0;
    this.dailyTransferCount = 0;
    this.lastDailyReset = new Date();
  }

  /**
   * Reset monthly counters
   */
  resetMonthly(): void {
    this.monthlyTransferred = 0;
    this.monthlyTransferCount = 0;
    this.lastMonthlyReset = new Date();
  }

  /**
   * Check and reset if needed based on current date
   */
  checkAndResetIfNeeded(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let wasReset = false;

    // Check daily reset
    const lastDaily = new Date(this.lastDailyReset);
    lastDaily.setHours(0, 0, 0, 0);
    if (today > lastDaily) {
      this.resetDaily();
      wasReset = true;
    }

    // Check monthly reset
    const lastMonthly = new Date(this.lastMonthlyReset);
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const lastMonth = lastMonthly.getMonth();
    const lastYear = lastMonthly.getFullYear();

    if (currentYear > lastYear || (currentYear === lastYear && currentMonth > lastMonth)) {
      this.resetMonthly();
      wasReset = true;
    }

    return wasReset;
  }
}
