import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { VirtualCard, CardStatus } from '../entities/virtual-card.entity';
import {
  CardTransaction,
  CardTransactionStatus,
  CardTransactionType,
} from '../entities/card-transaction.entity';
import { GshopWallet, GshopTransaction, TokenTransactionType, TokenTransactionStatus } from '../../token/token.entity';
import { StripeIssuingService } from './stripe-issuing.service';
import { FundCardDto } from '../dto/fund-card.dto';

@Injectable()
export class FundingService {
  private readonly logger = new Logger(FundingService.name);

  constructor(
    @InjectRepository(VirtualCard)
    private cardRepo: Repository<VirtualCard>,
    @InjectRepository(CardTransaction)
    private txRepo: Repository<CardTransaction>,
    @InjectRepository(GshopWallet)
    private walletRepo: Repository<GshopWallet>,
    @InjectRepository(GshopTransaction)
    private walletTxRepo: Repository<GshopTransaction>,
    private stripeIssuing: StripeIssuingService,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  /**
   * Fund a virtual card from the user's GshopWallet balance.
   * Deducts from wallet, increases card spending limit on Stripe.
   */
  async fundCardFromWallet(
    userId: string,
    cardId: string,
    dto: FundCardDto,
  ): Promise<CardTransaction> {
    const card = await this.cardRepo.findOne({ where: { id: cardId, userId } });
    if (!card) {
      throw new NotFoundException('Card not found');
    }
    if (card.status !== CardStatus.ACTIVE) {
      throw new BadRequestException('Card must be active to fund');
    }

    const amountCents = Math.round(dto.amountUSD * 100);

    // Use a transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock wallet row for update
      const wallet = await queryRunner.manager
        .createQueryBuilder(GshopWallet, 'w')
        .setLock('pessimistic_write')
        .where('w.userId = :userId', { userId })
        .getOne();

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      const walletBalance = Number(wallet.balance);
      if (walletBalance < dto.amountUSD) {
        throw new BadRequestException(
          `Insufficient wallet balance. Available: $${walletBalance.toFixed(2)}, Requested: $${dto.amountUSD.toFixed(2)}`,
        );
      }

      // Deduct from wallet
      wallet.balance = walletBalance - dto.amountUSD;
      wallet.totalSpent = Number(wallet.totalSpent) + dto.amountUSD;
      wallet.lastTransactionAt = new Date();
      await queryRunner.manager.save(wallet);

      // Create wallet transaction record
      const walletTx = queryRunner.manager.create(GshopTransaction, {
        walletId: wallet.id,
        userId,
        type: TokenTransactionType.CARD_FUNDING,
        status: TokenTransactionStatus.COMPLETED,
        amount: dto.amountUSD,
        fee: 0,
        description: `Fund virtual card ****${card.last4}`,
        reference: `card_fund_${card.id}_${Date.now()}`,
        metadata: { cardId: card.id, stripeCardId: card.stripeCardId },
      });
      const savedWalletTx = await queryRunner.manager.save(walletTx);

      // Update spending limit on Stripe
      const stripe = this.stripeIssuing.getClient();
      const currentLimit = card.spendingControls?.spendingLimits?.[0]?.amount || 0;
      const newLimit = currentLimit + amountCents;

      await stripe.issuing.cards.update(card.stripeCardId, {
        spending_controls: {
          spending_limits: [{
            amount: newLimit,
            interval: 'all_time',
          }],
        },
      });

      // Update local spending controls
      card.spendingControls = {
        ...card.spendingControls,
        spendingLimits: [{ amount: newLimit, interval: 'all_time' }],
      };
      await queryRunner.manager.save(card);

      // Create card transaction record
      const cardTx = queryRunner.manager.create(CardTransaction, {
        cardId: card.id,
        userId,
        type: CardTransactionType.FUNDING,
        status: CardTransactionStatus.SETTLED,
        amountCents,
        currency: 'usd',
        walletTransactionId: savedWalletTx.id,
        merchantName: 'GSHOP Wallet',
        metadata: { walletTransactionId: savedWalletTx.id },
      });
      const savedCardTx = await queryRunner.manager.save(cardTx);

      await queryRunner.commitTransaction();
      return savedCardTx;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Withdraw card balance back to wallet.
   * Reduces card spending limit on Stripe, credits wallet.
   */
  async withdrawToWallet(
    userId: string,
    cardId: string,
    dto: FundCardDto,
  ): Promise<CardTransaction> {
    const card = await this.cardRepo.findOne({ where: { id: cardId, userId } });
    if (!card) {
      throw new NotFoundException('Card not found');
    }

    const currentLimitCents = card.spendingControls?.spendingLimits?.[0]?.amount || 0;
    const withdrawCents = Math.round(dto.amountUSD * 100);

    if (withdrawCents > currentLimitCents) {
      throw new BadRequestException(
        `Cannot withdraw more than available card limit. Available: $${(currentLimitCents / 100).toFixed(2)}`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock wallet row
      const wallet = await queryRunner.manager
        .createQueryBuilder(GshopWallet, 'w')
        .setLock('pessimistic_write')
        .where('w.userId = :userId', { userId })
        .getOne();

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      // Credit wallet
      wallet.balance = Number(wallet.balance) + dto.amountUSD;
      wallet.totalEarned = Number(wallet.totalEarned) + dto.amountUSD;
      wallet.lastTransactionAt = new Date();
      await queryRunner.manager.save(wallet);

      // Create wallet transaction
      const walletTx = queryRunner.manager.create(GshopTransaction, {
        walletId: wallet.id,
        userId,
        type: TokenTransactionType.CARD_WITHDRAWAL,
        status: TokenTransactionStatus.COMPLETED,
        amount: dto.amountUSD,
        fee: 0,
        description: `Withdraw from virtual card ****${card.last4}`,
        reference: `card_withdraw_${card.id}_${Date.now()}`,
        metadata: { cardId: card.id, stripeCardId: card.stripeCardId },
      });
      const savedWalletTx = await queryRunner.manager.save(walletTx);

      // Reduce spending limit on Stripe
      const stripe = this.stripeIssuing.getClient();
      const newLimit = Math.max(0, currentLimitCents - withdrawCents);

      await stripe.issuing.cards.update(card.stripeCardId, {
        spending_controls: {
          spending_limits: [{
            amount: newLimit,
            interval: 'all_time',
          }],
        },
      });

      // Update local
      card.spendingControls = {
        ...card.spendingControls,
        spendingLimits: [{ amount: newLimit, interval: 'all_time' }],
      };
      await queryRunner.manager.save(card);

      // Create card transaction record
      const cardTx = queryRunner.manager.create(CardTransaction, {
        cardId: card.id,
        userId,
        type: CardTransactionType.WITHDRAWAL,
        status: CardTransactionStatus.SETTLED,
        amountCents: withdrawCents,
        currency: 'usd',
        walletTransactionId: savedWalletTx.id,
        merchantName: 'GSHOP Wallet',
        metadata: { walletTransactionId: savedWalletTx.id },
      });
      const savedCardTx = await queryRunner.manager.save(cardTx);

      await queryRunner.commitTransaction();
      return savedCardTx;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
