import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  GshopWallet,
  GshopTransaction,
  TokenReward,
  WalletTopup,
  TokenCirculation,
  TransactionType,
  RewardType,
  TopupStatus
} from './token.entity';
import { CreateWalletDto, TransferTokensDto, RewardUserDto, TopupWalletDto, TokenStatsQueryDto } from './dto';

@Injectable()
export class TokenService {
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
    private dataSource: DataSource,
  ) {}

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
      relations: ['transactions', 'rewards', 'topups'],
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
    transactionType: TransactionType,
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
      userId,
      rewardType,
      amount,
      orderId,
      metadata,
    });

    const savedReward = await this.rewardRepository.save(reward);

    // Update wallet balance
    await this.updateWalletBalance(userId, amount, TransactionType.REWARD, {
      rewardId: savedReward.id,
      rewardType,
      orderId,
    });

    return savedReward;
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

  async processTopup(topupId: string, status: TopupStatus): Promise<WalletTopup> {
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
}