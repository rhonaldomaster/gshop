import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, ILike } from 'typeorm';
import {
  GshopWallet,
  GshopTransaction,
  TokenReward,
  WalletTopup,
  TokenCirculation,
  TransactionType,
  RewardType,
  TopupStatus,
  TokenTransactionType,
  TokenTransactionStatus
} from './token.entity';
import {
  CreateWalletDto,
  TransferTokensDto,
  RewardUserDto,
  TopupWalletDto,
  TokenStatsQueryDto,
  SearchUserResponseDto,
  TransferPreviewResponseDto,
  TransferResultDto,
  TransferLimitsResponseDto,
  StripeTopupResponseDto,
  TopupStatusDto,
  AdminTransactionFilterDto,
  AdminTransactionStatsDto,
  AdminTransactionResponseDto
} from './dto';
import { User } from '../users/user.entity';
import { TransferLimit } from './entities/transfer-limit.entity';
import { UserVerification } from './entities/user-verification.entity';
import {
  VerificationLevel,
  TRANSFER_LIMITS,
  calculatePlatformFee,
  getTransferPreview,
  PLATFORM_FEE_RATE
} from './constants/transfer-limits';
import { CurrencyService } from '../payments/currency.service';
import Stripe from 'stripe';
import { generateUniqueDynamicCode } from './utils/dynamic-code.generator';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private stripe: Stripe;

  constructor(
    @InjectRepository(GshopWallet)
    private walletRepository: Repository<GshopWallet>,
    @InjectRepository(GshopTransaction)
    private transactionRepository: Repository<GshopTransaction>,
    @InjectRepository(TokenReward)
    private rewardRepository: Repository<TokenReward>,
    @InjectRepository(WalletTopup)
    private topupRepository: Repository<WalletTopup>,
    @InjectRepository(TokenCirculation)
    private circulationRepository: Repository<TokenCirculation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TransferLimit)
    private transferLimitRepository: Repository<TransferLimit>,
    @InjectRepository(UserVerification)
    private userVerificationRepository: Repository<UserVerification>,
    private dataSource: DataSource,
    private currencyService: CurrencyService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-08-27.basil',
    });
  }

  // Wallet Management
  async createWallet(userId: string, createWalletDto?: CreateWalletDto): Promise<GshopWallet> {
    const existingWallet = await this.walletRepository.findOne({ where: { userId } });
    if (existingWallet) {
      throw new BadRequestException('Wallet already exists for this user');
    }

    const wallet = this.walletRepository.create({
      userId,
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      cashbackRate: createWalletDto?.cashbackRate || 0.05,
      isActive: true,
    });

    const savedWallet = await this.walletRepository.save(wallet);

    // Update circulation stats
    await this.updateCirculation('WALLET_CREATED', 0);

    return savedWallet;
  }

  async getUserWallet(userId: string): Promise<GshopWallet> {
    const wallet = await this.walletRepository.findOne({
      where: { userId, isActive: true },
      // Removed relations that don't exist in entity
      // relations: ['transactions', 'rewards', 'topups'],
    });

    if (!wallet) {
      // Auto-create wallet if it doesn't exist
      return this.createWallet(userId);
    }

    return wallet;
  }

  async updateWalletBalance(
    userId: string,
    amount: number,
    transactionType: TokenTransactionType,
    metadata?: any
  ): Promise<GshopWallet> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(GshopWallet, {
        where: { userId, isActive: true },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      // Check sufficient balance for debit transactions
      if (amount < 0 && wallet.balance < Math.abs(amount)) {
        throw new BadRequestException('Insufficient balance');
      }

      // Update wallet balance
      wallet.balance = Number(wallet.balance) + amount;

      if (amount > 0) {
        wallet.totalEarned = Number(wallet.totalEarned) + amount;
      } else {
        wallet.totalSpent = Number(wallet.totalSpent) + Math.abs(amount);
      }

      wallet.lastTransactionAt = new Date();

      // Create transaction record
      const transaction = queryRunner.manager.create(GshopTransaction, {
        userId,
        walletId: wallet.id,
        type: transactionType,
        amount,
        balanceBefore: Number(wallet.balance) - amount,
        balanceAfter: wallet.balance,
        metadata,
      });

      await queryRunner.manager.save(GshopWallet, wallet);
      await queryRunner.manager.save(GshopTransaction, transaction);

      // Update circulation
      await this.updateCirculation(transactionType, amount);

      await queryRunner.commitTransaction();
      return wallet;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Token Transfer
  async transferTokens(transferDto: TransferTokensDto): Promise<{ success: boolean; transactionId: string }> {
    const { fromUserId, toUserId, amount, note } = transferDto;

    if (fromUserId === toUserId) {
      throw new BadRequestException('Cannot transfer to the same wallet');
    }

    if (amount <= 0) {
      throw new BadRequestException('Transfer amount must be positive');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Debit from sender
      await this.updateWalletBalance(fromUserId, -amount, TransactionType.TRANSFER_OUT, {
        toUserId,
        note,
      });

      // Credit to receiver
      await this.updateWalletBalance(toUserId, amount, TransactionType.TRANSFER_IN, {
        fromUserId,
        note,
      });

      const transactionId = `transfer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      await queryRunner.commitTransaction();
      return { success: true, transactionId };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Rewards System
  async processReward(rewardDto: RewardUserDto): Promise<TokenReward> {
    const { userId, rewardType, amount, orderId, metadata } = rewardDto;

    // Create reward record
    const reward = this.rewardRepository.create({
      name: `Reward for user ${userId}`,
      description: `Reward of ${amount} tokens`,
      rewardType: TokenTransactionType.REWARD,
      rewardAmount: amount,
      userId,
      isActive: true,
    });

    const savedReward = await this.rewardRepository.save(reward);
    const rewardEntity = Array.isArray(savedReward) ? savedReward[0] : savedReward;

    // Update wallet balance
    await this.updateWalletBalance(userId, amount, TransactionType.REWARD, {
      rewardId: rewardEntity.id,
      rewardType,
      orderId,
    });

    return rewardEntity;
  }

  async processCashback(userId: string, orderAmount: number, orderId: string): Promise<TokenReward> {
    const wallet = await this.getUserWallet(userId);
    const cashbackAmount = orderAmount * wallet.cashbackRate;

    return this.processReward({
      userId,
      rewardType: RewardType.CASHBACK,
      amount: cashbackAmount,
      orderId,
      metadata: {
        originalAmount: orderAmount,
        cashbackRate: wallet.cashbackRate,
      },
    });
  }

  // Wallet Topup
  async createTopup(userId: string, topupDto: TopupWalletDto): Promise<WalletTopup> {
    const topup = this.topupRepository.create({
      userId,
      ...topupDto,
      status: TopupStatus.PENDING,
    });

    return this.topupRepository.save(topup);
  }

  async processTopup(topupId: string, status: TokenTransactionStatus): Promise<WalletTopup> {
    const topup = await this.topupRepository.findOne({ where: { id: topupId } });

    if (!topup) {
      throw new NotFoundException('Topup not found');
    }

    topup.status = status;
    topup.processedAt = new Date();

    if (status === TopupStatus.COMPLETED) {
      // Credit wallet
      await this.updateWalletBalance(topup.userId, topup.amount, TransactionType.TOPUP, {
        topupId: topup.id,
        paymentMethod: topup.paymentMethod,
      });
    }

    return this.topupRepository.save(topup);
  }

  // Analytics & Stats
  async getUserTransactions(userId: string, limit = 50): Promise<GshopTransaction[]> {
    return this.transactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getUserRewards(userId: string, limit = 20): Promise<TokenReward[]> {
    return this.rewardRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getTokenStats(query?: TokenStatsQueryDto): Promise<any> {
    const { startDate, endDate } = query || {};

    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Total wallets
    const totalWallets = await this.walletRepository.count({ where: { isActive: true } });

    // Active wallets (with transactions in last 30 days)
    const activeWallets = await this.walletRepository
      .createQueryBuilder('wallet')
      .where('wallet.lastTransactionAt > :date', { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) })
      .getCount();

    // Total circulation
    const totalCirculation = await this.walletRepository
      .createQueryBuilder('wallet')
      .select('SUM(wallet.balance)', 'total')
      .getRawOne();

    // Total rewards distributed
    const totalRewards = await this.rewardRepository
      .createQueryBuilder('reward')
      .select('SUM(reward.amount)', 'total')
      .getRawOne();

    // Transaction volume
    const transactionStats = await this.transactionRepository
      .createQueryBuilder('tx')
      .select([
        'COUNT(tx.id) as totalTransactions',
        'SUM(CASE WHEN tx.amount > 0 THEN tx.amount ELSE 0 END) as totalCredits',
        'SUM(CASE WHEN tx.amount < 0 THEN ABS(tx.amount) ELSE 0 END) as totalDebits',
      ])
      .where(whereClause.createdAt ? 'tx.createdAt BETWEEN :start AND :end' : '1=1', {
        start: whereClause.createdAt?.$gte,
        end: whereClause.createdAt?.$lte,
      })
      .getRawOne();

    return {
      totalWallets,
      activeWallets,
      totalCirculation: Number(totalCirculation?.total) || 0,
      totalRewardsDistributed: Number(totalRewards?.total) || 0,
      transactionStats: {
        totalTransactions: Number(transactionStats?.totalTransactions) || 0,
        totalCredits: Number(transactionStats?.totalCredits) || 0,
        totalDebits: Number(transactionStats?.totalDebits) || 0,
      },
    };
  }

  private async updateCirculation(event: string, amount: number): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let circulation = await this.circulationRepository.findOne({
        where: { date: today },
      });

      if (!circulation) {
        circulation = this.circulationRepository.create({
          date: today,
          totalSupply: 0,
          totalWallets: 0,
          totalTransactions: 0,
          dailyVolume: 0,
        });
      }

      circulation.totalSupply += amount;
      circulation.totalTransactions += 1;
      circulation.dailyVolume += Math.abs(amount);

      if (event === 'WALLET_CREATED') {
        circulation.totalWallets += 1;
      }

      await this.circulationRepository.save(circulation);
    } catch (error) {
      // Log error but don't fail the main operation
      console.warn('Failed to update token circulation metrics:', error.message);
    }
  }

  // Admin functions
  async getCirculationData(days = 30): Promise<TokenCirculation[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.circulationRepository.find({
      where: { date: { $gte: startDate } as any },
      order: { date: 'ASC' },
    });
  }

  async burnTokens(userId: string, amount: number, reason: string): Promise<GshopWallet> {
    return this.updateWalletBalance(userId, -amount, TransactionType.BURN, {
      reason,
      burnedAt: new Date(),
    });
  }

  async mintTokens(userId: string, amount: number, reason: string): Promise<GshopWallet> {
    return this.updateWalletBalance(userId, amount, TransactionType.MINT, {
      reason,
      mintedAt: new Date(),
    });
  }

  // ==========================================
  // P2P Transfer Methods (Option A - Fee Separado)
  // ==========================================

  /**
   * Search for a user by email or phone number for P2P transfer
   * Returns masked information for privacy
   */
  async searchUserByEmailOrPhone(query: string, currentUserId: string): Promise<SearchUserResponseDto | null> {
    // Normalize query
    const normalizedQuery = query.trim().toLowerCase();

    // Search by email or phone
    const user = await this.userRepository.findOne({
      where: [
        { email: ILike(normalizedQuery) },
        { phone: normalizedQuery }
      ]
    });

    if (!user) {
      return null;
    }

    // Cannot transfer to yourself
    if (user.id === currentUserId) {
      throw new BadRequestException('No puedes transferir a tu propia cuenta');
    }

    // Mask email (show first 2 chars + ***@domain)
    const maskedEmail = this.maskEmail(user.email);

    // Mask phone if exists
    const maskedPhone = user.phone ? this.maskPhone(user.phone) : undefined;

    return {
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      maskedEmail,
      maskedPhone
    };
  }

  /**
   * Mask email for privacy (jo***@gmail.com)
   */
  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
      return `${localPart[0]}***@${domain}`;
    }
    return `${localPart.substring(0, 2)}***@${domain}`;
  }

  /**
   * Mask phone for privacy (***1234)
   */
  private maskPhone(phone: string): string {
    if (phone.length <= 4) {
      return '***' + phone;
    }
    return '***' + phone.slice(-4);
  }

  /**
   * Get or create transfer limit record for a user
   */
  async getOrCreateTransferLimit(userId: string): Promise<TransferLimit> {
    let transferLimit = await this.transferLimitRepository.findOne({
      where: { userId }
    });

    if (!transferLimit) {
      // Check user's verification level
      const verification = await this.userVerificationRepository.findOne({
        where: { userId }
      });

      const verificationLevel = verification?.level || VerificationLevel.NONE;

      // Create new transfer limit record
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      transferLimit = this.transferLimitRepository.create({
        userId,
        verificationLevel,
        dailyTransferred: 0,
        monthlyTransferred: 0,
        totalLifetimeTransferred: 0,
        dailyTransferCount: 0,
        monthlyTransferCount: 0,
        totalTransferCount: 0,
        lastDailyReset: today,
        lastMonthlyReset: today
      });

      await this.transferLimitRepository.save(transferLimit);
    } else {
      // Check and reset if needed
      if (transferLimit.checkAndResetIfNeeded()) {
        await this.transferLimitRepository.save(transferLimit);
      }
    }

    return transferLimit;
  }

  /**
   * Get user's current transfer limits and usage
   */
  async getUserTransferLimits(userId: string): Promise<TransferLimitsResponseDto> {
    const transferLimit = await this.getOrCreateTransferLimit(userId);
    const limits = transferLimit.getLimits();

    // Map verification level to friendly name
    const levelNames: Record<string, string> = {
      [VerificationLevel.NONE]: 'Sin verificar',
      [VerificationLevel.LEVEL_1]: 'Verificacion Basica',
      [VerificationLevel.LEVEL_2]: 'Verificacion Completa'
    };

    const canUpgrade = transferLimit.verificationLevel !== VerificationLevel.LEVEL_2;
    const nextLevelMap: Record<string, string> = {
      [VerificationLevel.NONE]: VerificationLevel.LEVEL_1,
      [VerificationLevel.LEVEL_1]: VerificationLevel.LEVEL_2
    };

    return {
      level: transferLimit.verificationLevel,
      levelName: levelNames[transferLimit.verificationLevel],
      limits: {
        minPerTransaction: limits.minPerTransaction,
        maxPerTransaction: limits.maxPerTransaction,
        dailyLimit: limits.dailyLimit,
        monthlyLimit: limits.monthlyLimit
      },
      usage: {
        dailyTransferred: Number(transferLimit.dailyTransferred),
        dailyRemaining: transferLimit.getDailyRemaining(),
        monthlyTransferred: Number(transferLimit.monthlyTransferred),
        monthlyRemaining: transferLimit.getMonthlyRemaining(),
        dailyTransferCount: transferLimit.dailyTransferCount,
        monthlyTransferCount: transferLimit.monthlyTransferCount
      },
      canUpgrade,
      nextLevel: canUpgrade ? nextLevelMap[transferLimit.verificationLevel] : undefined
    };
  }

  /**
   * Validate if a transfer is allowed based on user's limits
   */
  async validateTransferLimits(userId: string, amount: number): Promise<{ valid: boolean; error?: string }> {
    const transferLimit = await this.getOrCreateTransferLimit(userId);
    const canTransferResult = transferLimit.canTransfer(amount);

    if (!canTransferResult.allowed) {
      return { valid: false, error: canTransferResult.reason };
    }

    return { valid: true };
  }

  /**
   * Get transfer preview showing fee breakdown (Option A model)
   */
  async getTransferPreview(
    fromUserId: string,
    toUserId: string,
    amount: number
  ): Promise<TransferPreviewResponseDto> {
    // Validate recipient exists
    const recipient = await this.userRepository.findOne({ where: { id: toUserId } });
    if (!recipient) {
      throw new NotFoundException('Destinatario no encontrado');
    }

    // Validate sender has sufficient balance
    const senderWallet = await this.getUserWallet(fromUserId);
    if (Number(senderWallet.balance) < amount) {
      throw new BadRequestException('Saldo insuficiente para realizar la transferencia');
    }

    // Validate transfer limits
    const limitValidation = await this.validateTransferLimits(fromUserId, amount);
    if (!limitValidation.valid) {
      throw new ForbiddenException(limitValidation.error);
    }

    // Calculate fee preview (Option A)
    const preview = getTransferPreview(amount);

    return {
      ...preview,
      recipientName: `${recipient.firstName} ${recipient.lastName}`
    };
  }

  /**
   * Execute P2P transfer with fee (Option A model)
   *
   * Flow:
   * 1. Sender sends full amount -> Sender balance decreases by amount
   * 2. Recipient receives full amount -> Recipient balance increases by amount
   * 3. Platform fee deducted from recipient -> Recipient balance decreases by fee
   * 4. Result: Recipient has (amount - fee), Sender has (balance - amount)
   */
  async executeTransferWithFee(
    fromUserId: string,
    toUserId: string,
    amount: number,
    note?: string
  ): Promise<TransferResultDto> {
    // Validate recipient exists
    const recipient = await this.userRepository.findOne({ where: { id: toUserId } });
    if (!recipient) {
      throw new NotFoundException('Destinatario no encontrado');
    }

    // Validate sender wallet and balance
    const senderWallet = await this.getUserWallet(fromUserId);
    if (Number(senderWallet.balance) < amount) {
      throw new BadRequestException('Saldo insuficiente para realizar la transferencia');
    }

    // Validate transfer limits
    const limitValidation = await this.validateTransferLimits(fromUserId, amount);
    if (!limitValidation.valid) {
      throw new ForbiddenException(limitValidation.error);
    }

    // Cannot transfer to yourself
    if (fromUserId === toUserId) {
      throw new BadRequestException('No puedes transferir a tu propia cuenta');
    }

    // Generate unique transfer ID
    const transferId = `TRF_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Generate unique dynamic code for this transfer
    const dynamicCode = await generateUniqueDynamicCode(this.transactionRepository);
    const executedAt = new Date();

    // Calculate fee
    const platformFee = calculatePlatformFee(amount);

    // Start transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const transactions: TransferResultDto['transactions'] = [];

    try {
      // Step 1: Debit sender (full amount)
      const senderWalletEntity = await queryRunner.manager.findOne(GshopWallet, {
        where: { userId: fromUserId, isActive: true }
      });

      if (!senderWalletEntity) {
        throw new NotFoundException('Wallet del remitente no encontrada');
      }

      const senderBalanceBefore = Number(senderWalletEntity.balance);
      senderWalletEntity.balance = senderBalanceBefore - amount;
      senderWalletEntity.totalSpent = Number(senderWalletEntity.totalSpent) + amount;
      senderWalletEntity.lastTransactionAt = new Date();

      await queryRunner.manager.save(GshopWallet, senderWalletEntity);

      // Create TRANSFER_OUT transaction for sender
      const senderTx = queryRunner.manager.create(GshopTransaction, {
        userId: fromUserId,
        walletId: senderWalletEntity.id,
        type: TokenTransactionType.TRANSFER_OUT,
        status: TokenTransactionStatus.COMPLETED,
        amount: -amount,
        description: `Transferencia a ${recipient.firstName} ${recipient.lastName}`,
        reference: transferId,
        toUserId,
        dynamicCode,
        executedAt,
        metadata: { note, transferId, dynamicCode, executedAt: executedAt.toISOString() }
      });
      await queryRunner.manager.save(GshopTransaction, senderTx);

      transactions.push({
        type: 'TRANSFER_OUT',
        amount: -amount,
        userId: fromUserId,
        description: `Enviaste $${amount.toLocaleString()} a ${recipient.firstName}`
      });

      // Step 2: Credit recipient (full amount)
      let recipientWallet = await queryRunner.manager.findOne(GshopWallet, {
        where: { userId: toUserId, isActive: true }
      });

      if (!recipientWallet) {
        // Auto-create wallet for recipient
        recipientWallet = queryRunner.manager.create(GshopWallet, {
          userId: toUserId,
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
          cashbackRate: 0.05,
          isActive: true
        });
        recipientWallet = await queryRunner.manager.save(GshopWallet, recipientWallet);
      }

      const recipientBalanceBefore = Number(recipientWallet.balance);
      recipientWallet.balance = recipientBalanceBefore + amount;
      recipientWallet.totalEarned = Number(recipientWallet.totalEarned) + amount;
      recipientWallet.lastTransactionAt = new Date();

      await queryRunner.manager.save(GshopWallet, recipientWallet);

      // Create TRANSFER_IN transaction for recipient
      const sender = await queryRunner.manager.findOne(User, { where: { id: fromUserId } });
      const senderName = sender ? `${sender.firstName} ${sender.lastName}` : 'Usuario';

      const recipientTx = queryRunner.manager.create(GshopTransaction, {
        userId: toUserId,
        walletId: recipientWallet.id,
        type: TokenTransactionType.TRANSFER_IN,
        status: TokenTransactionStatus.COMPLETED,
        amount: amount,
        description: `Recibiste de ${senderName}`,
        reference: transferId,
        fromUserId,
        dynamicCode,
        executedAt,
        metadata: { note, transferId, dynamicCode, executedAt: executedAt.toISOString() }
      });
      await queryRunner.manager.save(GshopTransaction, recipientTx);

      transactions.push({
        type: 'TRANSFER_IN',
        amount: amount,
        userId: toUserId,
        description: `Recibiste $${amount.toLocaleString()} de ${senderName}`
      });

      // Step 3: Charge platform fee to recipient (if applicable)
      if (platformFee > 0) {
        recipientWallet.balance = Number(recipientWallet.balance) - platformFee;
        recipientWallet.totalSpent = Number(recipientWallet.totalSpent) + platformFee;

        await queryRunner.manager.save(GshopWallet, recipientWallet);

        // Create PLATFORM_FEE transaction
        const feeTx = queryRunner.manager.create(GshopTransaction, {
          userId: toUserId,
          walletId: recipientWallet.id,
          type: TokenTransactionType.PLATFORM_FEE,
          status: TokenTransactionStatus.COMPLETED,
          amount: -platformFee,
          fee: platformFee,
          description: 'Comision de servicio GSHOP',
          reference: transferId,
          dynamicCode,
          executedAt,
          metadata: {
            transferId,
            feeRate: PLATFORM_FEE_RATE,
            originalAmount: amount,
            relatedTransferCode: dynamicCode,
            executedAt: executedAt.toISOString()
          }
        });
        await queryRunner.manager.save(GshopTransaction, feeTx);

        transactions.push({
          type: 'PLATFORM_FEE',
          amount: -platformFee,
          userId: toUserId,
          description: `Comision de servicio GSHOP (${PLATFORM_FEE_RATE * 100}%)`
        });
      }

      // Step 4: Update sender's transfer limits
      const transferLimit = await this.getOrCreateTransferLimit(fromUserId);
      transferLimit.recordTransfer(amount);
      await queryRunner.manager.save(TransferLimit, transferLimit);

      // Commit transaction
      await queryRunner.commitTransaction();

      // Update circulation stats (outside transaction)
      await this.updateCirculation('P2P_TRANSFER', amount);

      return {
        success: true,
        transferId,
        dynamicCode,
        executedAt: executedAt.toISOString(),
        transactions,
        summary: {
          amountSent: amount,
          feeCharged: platformFee,
          recipientNetBalance: amount - platformFee,
          senderNewBalance: Number(senderWalletEntity.balance)
        },
        timestamp: new Date()
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ==========================================
  // Stripe Topup Methods (Wallet Recharge)
  // ==========================================

  /**
   * Create a Stripe Payment Intent for wallet topup
   * Creates a pending transaction and returns clientSecret for mobile Stripe SDK
   */
  async createStripeTopupIntent(userId: string, amountCOP: number): Promise<StripeTopupResponseDto> {
    // Validate minimum amount
    if (amountCOP < 1000) {
      throw new BadRequestException('El monto minimo de recarga es $1,000 COP');
    }

    // Maximum topup amount: $50,000,000 COP
    if (amountCOP > 50000000) {
      throw new BadRequestException('El monto maximo de recarga es $50,000,000 COP');
    }

    // Ensure user has a wallet
    const wallet = await this.getUserWallet(userId);

    // Convert COP to USD for Stripe
    const { amountUSD, rate } = await this.currencyService.convertCOPtoUSD(amountCOP);

    // Stripe minimum is $0.50 USD
    if (amountUSD < 0.5) {
      throw new BadRequestException('El monto es muy bajo para procesar. Minimo $1,000 COP');
    }

    // Generate unique topup ID
    const topupId = `TOPUP_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    try {
      // Create pending transaction record
      const pendingTx = this.transactionRepository.create({
        userId,
        walletId: wallet.id,
        type: TokenTransactionType.TOPUP,
        status: TokenTransactionStatus.PENDING,
        amount: amountCOP,
        reference: topupId,
        description: 'Recarga de saldo via Stripe',
        metadata: {
          topupId,
          amountCOP,
          amountUSD,
          exchangeRate: rate,
          paymentMethod: 'stripe',
          createdAt: new Date().toISOString()
        }
      });
      const savedTx = await this.transactionRepository.save(pendingTx);

      // Create Stripe Payment Intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amountUSD * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          topupId,
          transactionId: savedTx.id,
          userId,
          amountCOP: amountCOP.toString(),
          type: 'wallet_topup'
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Update transaction with Stripe PaymentIntent ID
      savedTx.metadata = {
        ...savedTx.metadata,
        stripePaymentIntentId: paymentIntent.id
      };
      await this.transactionRepository.save(savedTx);

      this.logger.log(`Created Stripe topup intent ${topupId} for user ${userId}: $${amountCOP} COP = $${amountUSD} USD`);

      // Set expiration time (30 minutes)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);

      return {
        topupId,
        clientSecret: paymentIntent.client_secret,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
        amountCOP,
        amountUSD,
        exchangeRate: rate,
        expiresAt
      };

    } catch (error) {
      this.logger.error(`Failed to create Stripe topup intent: ${error.message}`);
      throw new BadRequestException(`Error al crear la recarga: ${error.message}`);
    }
  }

  /**
   * Get topup status by topup ID or transaction ID
   */
  async getTopupStatus(topupIdOrTxId: string): Promise<TopupStatusDto> {
    // Try to find by reference (topupId) first, then by id
    let transaction = await this.transactionRepository.findOne({
      where: { reference: topupIdOrTxId, type: TokenTransactionType.TOPUP }
    });

    if (!transaction) {
      transaction = await this.transactionRepository.findOne({
        where: { id: topupIdOrTxId, type: TokenTransactionType.TOPUP }
      });
    }

    if (!transaction) {
      throw new NotFoundException('Recarga no encontrada');
    }

    return {
      topupId: transaction.reference || transaction.id,
      status: transaction.status,
      amount: Number(transaction.amount),
      currency: 'COP',
      stripePaymentIntentId: transaction.metadata?.stripePaymentIntentId,
      processedAt: transaction.processedAt,
      createdAt: transaction.createdAt
    };
  }

  /**
   * Process completed Stripe topup (called from webhook handler)
   * This credits the user's wallet after successful payment
   */
  async processStripeTopupSuccess(
    stripePaymentIntentId: string,
    amountUSDCents: number
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    // Find the pending transaction by Stripe Payment Intent ID
    const transactions = await this.transactionRepository.find({
      where: { type: TokenTransactionType.TOPUP, status: TokenTransactionStatus.PENDING }
    });

    const transaction = transactions.find(
      tx => tx.metadata?.stripePaymentIntentId === stripePaymentIntentId
    );

    if (!transaction) {
      this.logger.warn(`No pending topup found for PaymentIntent: ${stripePaymentIntentId}`);
      return { success: false, error: 'Transaction not found' };
    }

    // Prevent double processing
    if (transaction.status === TokenTransactionStatus.COMPLETED) {
      this.logger.warn(`Topup ${transaction.reference} already completed`);
      return { success: true, transactionId: transaction.id };
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const amountCOP = Number(transaction.amount);

      // Get user's wallet
      const wallet = await queryRunner.manager.findOne(GshopWallet, {
        where: { userId: transaction.userId, isActive: true }
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Credit wallet
      wallet.balance = Number(wallet.balance) + amountCOP;
      wallet.totalEarned = Number(wallet.totalEarned) + amountCOP;
      wallet.lastTransactionAt = new Date();

      await queryRunner.manager.save(GshopWallet, wallet);

      // Update transaction status
      transaction.status = TokenTransactionStatus.COMPLETED;
      transaction.processedAt = new Date();
      transaction.metadata = {
        ...transaction.metadata,
        stripeAmountUSDCents: amountUSDCents,
        completedAt: new Date().toISOString()
      };

      await queryRunner.manager.save(GshopTransaction, transaction);

      await queryRunner.commitTransaction();

      // Update circulation stats
      await this.updateCirculation('TOPUP', amountCOP);

      this.logger.log(`Successfully processed topup ${transaction.reference}: +$${amountCOP} COP to user ${transaction.userId}`);

      return { success: true, transactionId: transaction.id };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to process topup: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Handle failed Stripe topup (called from webhook handler)
   */
  async processStripeTopupFailure(
    stripePaymentIntentId: string,
    failureReason: string
  ): Promise<void> {
    const transactions = await this.transactionRepository.find({
      where: { type: TokenTransactionType.TOPUP, status: TokenTransactionStatus.PENDING }
    });

    const transaction = transactions.find(
      tx => tx.metadata?.stripePaymentIntentId === stripePaymentIntentId
    );

    if (!transaction) {
      this.logger.warn(`No pending topup found for failed PaymentIntent: ${stripePaymentIntentId}`);
      return;
    }

    transaction.status = TokenTransactionStatus.FAILED;
    transaction.metadata = {
      ...transaction.metadata,
      failureReason,
      failedAt: new Date().toISOString()
    };

    await this.transactionRepository.save(transaction);

    this.logger.log(`Marked topup ${transaction.reference} as failed: ${failureReason}`);
  }

  // ==========================================
  // Order Payment with Wallet Balance
  // ==========================================

  /**
   * Pay for an order using wallet balance
   * @param userId - The user making the payment
   * @param orderId - The order to pay for
   * @param amount - The total amount to pay (in COP)
   * @returns Payment result with transaction ID
   */
  async payOrderWithWallet(
    userId: string,
    orderId: string,
    amount: number
  ): Promise<{ success: boolean; transactionId: string; newBalance: number }> {
    // Validate amount
    if (amount <= 0) {
      throw new BadRequestException('El monto debe ser mayor a cero');
    }

    // Get user's wallet
    const wallet = await this.walletRepository.findOne({
      where: { userId, isActive: true }
    });

    if (!wallet) {
      throw new NotFoundException('Wallet no encontrado. Por favor cree una wallet primero.');
    }

    // Check sufficient balance
    if (Number(wallet.balance) < amount) {
      throw new BadRequestException(
        `Saldo insuficiente. Balance actual: $${Number(wallet.balance).toLocaleString()} COP, ` +
        `Monto requerido: $${amount.toLocaleString()} COP`
      );
    }

    // Process the payment using updateWalletBalance with PURCHASE type
    const updatedWallet = await this.updateWalletBalance(
      userId,
      -amount, // Negative for debit
      TokenTransactionType.PURCHASE,
      {
        orderId,
        description: `Pago de orden #${orderId.slice(-8).toUpperCase()}`,
        paymentMethod: 'wallet_balance'
      }
    );

    // Get the transaction ID (most recent transaction for this order)
    const transaction = await this.transactionRepository.findOne({
      where: { userId, type: TokenTransactionType.PURCHASE },
      order: { createdAt: 'DESC' }
    });

    this.logger.log(`Order ${orderId} paid with wallet balance: $${amount} COP by user ${userId}`);

    return {
      success: true,
      transactionId: transaction?.id || 'unknown',
      newBalance: Number(updatedWallet.balance)
    };
  }

  /**
   * Check if user has sufficient balance for an order
   * @param userId - The user ID
   * @param amount - The amount to check
   * @returns Whether user has sufficient balance
   */
  async checkSufficientBalance(userId: string, amount: number): Promise<{
    hasSufficientBalance: boolean;
    currentBalance: number;
    requiredAmount: number;
    shortfall: number;
  }> {
    const wallet = await this.walletRepository.findOne({
      where: { userId, isActive: true }
    });

    const currentBalance = wallet ? Number(wallet.balance) : 0;
    const hasSufficientBalance = currentBalance >= amount;
    const shortfall = hasSufficientBalance ? 0 : amount - currentBalance;

    return {
      hasSufficientBalance,
      currentBalance,
      requiredAmount: amount,
      shortfall
    };
  }

  // ==========================================
  // Admin Transaction Methods
  // ==========================================

  /**
   * Get all transactions with filters for admin panel
   */
  async getAdminTransactions(filters: AdminTransactionFilterDto): Promise<{
    data: AdminTransactionResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      type,
      status,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20
    } = filters;

    const queryBuilder = this.transactionRepository
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.user', 'user')
      .orderBy('tx.createdAt', 'DESC');

    // Filter by type
    if (type && type !== 'all') {
      queryBuilder.andWhere('tx.type = :type', { type });
    }

    // Filter by status
    if (status && status !== 'all') {
      queryBuilder.andWhere('tx.status = :status', { status });
    }

    // Filter by date range
    if (startDate) {
      queryBuilder.andWhere('tx.createdAt >= :startDate', {
        startDate: new Date(startDate)
      });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('tx.createdAt <= :endDate', { endDate: end });
    }

    // Search by user email or reference
    if (search) {
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR tx.reference ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const transactions = await queryBuilder.getMany();

    // Fetch fromUser and toUser info for transfers
    const userIds = new Set<string>();
    transactions.forEach(tx => {
      if (tx.fromUserId) userIds.add(tx.fromUserId);
      if (tx.toUserId) userIds.add(tx.toUserId);
    });

    const users = userIds.size > 0
      ? await this.userRepository.find({
          where: [...userIds].map(id => ({ id }))
        })
      : [];

    const userMap = new Map(users.map(u => [u.id, u]));

    // Map to response DTOs
    const data: AdminTransactionResponseDto[] = transactions.map(tx => {
      const fromUser = tx.fromUserId ? userMap.get(tx.fromUserId) : undefined;
      const toUser = tx.toUserId ? userMap.get(tx.toUserId) : undefined;

      return {
        id: tx.id,
        type: tx.type,
        status: tx.status,
        amount: Number(tx.amount),
        fee: Number(tx.fee) || 0,
        reference: tx.reference || '',
        description: tx.description || '',
        dynamicCode: tx.dynamicCode || undefined,
        executedAt: tx.executedAt || undefined,
        createdAt: tx.createdAt,
        processedAt: tx.processedAt,
        user: tx.user ? {
          id: tx.user.id,
          firstName: tx.user.firstName,
          lastName: tx.user.lastName,
          email: tx.user.email
        } : null,
        fromUser: fromUser ? {
          id: fromUser.id,
          firstName: fromUser.firstName,
          lastName: fromUser.lastName,
          email: fromUser.email
        } : undefined,
        toUser: toUser ? {
          id: toUser.id,
          firstName: toUser.firstName,
          lastName: toUser.lastName,
          email: toUser.email
        } : undefined,
        metadata: tx.metadata
      };
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get transaction statistics for admin dashboard
   */
  async getAdminTransactionStats(): Promise<AdminTransactionStatsDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Total transactions
    const totalTransactions = await this.transactionRepository.count();

    // Total volume (sum of absolute amounts)
    const volumeResult = await this.transactionRepository
      .createQueryBuilder('tx')
      .select('SUM(ABS(tx.amount))', 'volume')
      .getRawOne();
    const totalVolume = Number(volumeResult?.volume) || 0;

    // Total platform fees collected
    const feesResult = await this.transactionRepository
      .createQueryBuilder('tx')
      .select('SUM(ABS(tx.amount))', 'fees')
      .where('tx.type = :type', { type: TokenTransactionType.PLATFORM_FEE })
      .andWhere('tx.status = :status', { status: TokenTransactionStatus.COMPLETED })
      .getRawOne();
    const totalFees = Number(feesResult?.fees) || 0;

    // Transfers (in + out)
    const transfersResult = await this.transactionRepository
      .createQueryBuilder('tx')
      .select('COUNT(*)', 'count')
      .addSelect('SUM(ABS(tx.amount))', 'volume')
      .where('tx.type IN (:...types)', {
        types: [TokenTransactionType.TRANSFER_IN, TokenTransactionType.TRANSFER_OUT]
      })
      .andWhere('tx.status = :status', { status: TokenTransactionStatus.COMPLETED })
      .getRawOne();
    const transfersCount = Number(transfersResult?.count) || 0;
    const transfersVolume = Number(transfersResult?.volume) || 0;

    // Topups
    const topupsResult = await this.transactionRepository
      .createQueryBuilder('tx')
      .select('COUNT(*)', 'count')
      .addSelect('SUM(tx.amount)', 'volume')
      .where('tx.type = :type', { type: TokenTransactionType.TOPUP })
      .andWhere('tx.status = :status', { status: TokenTransactionStatus.COMPLETED })
      .getRawOne();
    const topupsCount = Number(topupsResult?.count) || 0;
    const topupsVolume = Number(topupsResult?.volume) || 0;

    // Purchases
    const purchasesResult = await this.transactionRepository
      .createQueryBuilder('tx')
      .select('COUNT(*)', 'count')
      .addSelect('SUM(ABS(tx.amount))', 'volume')
      .where('tx.type = :type', { type: TokenTransactionType.PURCHASE })
      .andWhere('tx.status = :status', { status: TokenTransactionStatus.COMPLETED })
      .getRawOne();
    const purchasesCount = Number(purchasesResult?.count) || 0;
    const purchasesVolume = Number(purchasesResult?.volume) || 0;

    // Pending transactions
    const pendingTransactions = await this.transactionRepository.count({
      where: { status: TokenTransactionStatus.PENDING }
    });

    // Today's transactions
    const todayResult = await this.transactionRepository
      .createQueryBuilder('tx')
      .select('COUNT(*)', 'count')
      .addSelect('SUM(ABS(tx.amount))', 'volume')
      .where('tx.createdAt >= :today', { today })
      .getRawOne();
    const todayTransactions = Number(todayResult?.count) || 0;
    const todayVolume = Number(todayResult?.volume) || 0;

    return {
      totalTransactions,
      totalVolume,
      totalFees,
      transfersCount,
      transfersVolume,
      topupsCount,
      topupsVolume,
      purchasesCount,
      purchasesVolume,
      pendingTransactions,
      todayTransactions,
      todayVolume
    };
  }

  /**
   * Get a single transaction by ID for admin
   */
  async getAdminTransactionById(transactionId: string): Promise<AdminTransactionResponseDto | null> {
    const tx = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['user']
    });

    if (!tx) {
      return null;
    }

    // Fetch fromUser and toUser if applicable
    let fromUser = null;
    let toUser = null;

    if (tx.fromUserId) {
      fromUser = await this.userRepository.findOne({ where: { id: tx.fromUserId } });
    }
    if (tx.toUserId) {
      toUser = await this.userRepository.findOne({ where: { id: tx.toUserId } });
    }

    return {
      id: tx.id,
      type: tx.type,
      status: tx.status,
      amount: Number(tx.amount),
      fee: Number(tx.fee) || 0,
      reference: tx.reference || '',
      description: tx.description || '',
      dynamicCode: tx.dynamicCode || undefined,
      executedAt: tx.executedAt || undefined,
      createdAt: tx.createdAt,
      processedAt: tx.processedAt,
      user: tx.user ? {
        id: tx.user.id,
        firstName: tx.user.firstName,
        lastName: tx.user.lastName,
        email: tx.user.email
      } : null,
      fromUser: fromUser ? {
        id: fromUser.id,
        firstName: fromUser.firstName,
        lastName: fromUser.lastName,
        email: fromUser.email
      } : undefined,
      toUser: toUser ? {
        id: toUser.id,
        firstName: toUser.firstName,
        lastName: toUser.lastName,
        email: toUser.email
      } : undefined,
      metadata: tx.metadata
    };
  }

  // ==========================================
  // Transaction Verification by Dynamic Code
  // ==========================================

  /**
   * Verify a transaction by dynamic code (User endpoint)
   * User must be part of the transaction to view it
   */
  async verifyTransactionByCode(code: string, userId: string) {
    const transactions = await this.transactionRepository.find({
      where: { dynamicCode: code },
      relations: ['user'],
      order: { createdAt: 'ASC' }
    });

    if (transactions.length === 0) {
      throw new NotFoundException('Transaccion no encontrada con ese codigo');
    }

    // Verify user is part of the transaction
    const userInvolved = transactions.some(
      tx => tx.userId === userId || tx.fromUserId === userId || tx.toUserId === userId
    );

    if (!userInvolved) {
      throw new ForbiddenException('No tienes acceso a esta transaccion');
    }

    return {
      dynamicCode: code,
      verified: true,
      transactions: transactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        status: tx.status,
        amount: Number(tx.amount),
        fee: Number(tx.fee) || 0,
        description: tx.description || '',
        executedAt: tx.executedAt,
        user: tx.user ? {
          id: tx.user.id,
          firstName: tx.user.firstName,
          lastName: tx.user.lastName,
          email: tx.user.email
        } : null
      }))
    };
  }

  /**
   * Verify a transaction by dynamic code (Admin endpoint)
   * Shows full details including sender/receiver summary
   */
  async adminVerifyTransactionByCode(code: string) {
    const transactions = await this.transactionRepository.find({
      where: { dynamicCode: code },
      relations: ['user'],
      order: { createdAt: 'ASC' }
    });

    if (transactions.length === 0) {
      throw new NotFoundException('Transaccion no encontrada con ese codigo');
    }

    // Find sender and receiver transactions
    const transferOut = transactions.find(tx => tx.type === TokenTransactionType.TRANSFER_OUT);
    const transferIn = transactions.find(tx => tx.type === TokenTransactionType.TRANSFER_IN);
    const platformFee = transactions.find(tx => tx.type === TokenTransactionType.PLATFORM_FEE);

    // Load sender and receiver users
    let sender = null;
    let receiver = null;

    if (transferOut?.userId) {
      sender = await this.userRepository.findOne({ where: { id: transferOut.userId } });
    }
    if (transferIn?.userId) {
      receiver = await this.userRepository.findOne({ where: { id: transferIn.userId } });
    }

    return {
      dynamicCode: code,
      verified: true,
      transactions: transactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        status: tx.status,
        amount: Number(tx.amount),
        fee: Number(tx.fee) || 0,
        description: tx.description || '',
        executedAt: tx.executedAt,
        user: tx.user ? {
          id: tx.user.id,
          firstName: tx.user.firstName,
          lastName: tx.user.lastName,
          email: tx.user.email
        } : null
      })),
      summary: {
        sender: sender ? {
          name: `${sender.firstName} ${sender.lastName}`,
          email: sender.email
        } : { name: 'Desconocido', email: '' },
        receiver: receiver ? {
          name: `${receiver.firstName} ${receiver.lastName}`,
          email: receiver.email
        } : { name: 'Desconocido', email: '' },
        amountSent: Math.abs(Number(transferOut?.amount) || 0),
        platformFee: Math.abs(Number(platformFee?.amount) || 0),
        netReceived: Number(transferIn?.amount || 0) - Math.abs(Number(platformFee?.amount) || 0),
        executedAt: transferOut?.executedAt?.toISOString() || ''
      }
    };
  }
}