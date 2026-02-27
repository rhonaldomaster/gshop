import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import Stripe from 'stripe';
import {
  CardTransaction,
  CardTransactionStatus,
  CardTransactionType,
} from '../entities/card-transaction.entity';
import { VirtualCard } from '../entities/virtual-card.entity';
import { CardTransactionQueryDto } from '../dto/card-query.dto';

@Injectable()
export class CardTransactionsService {
  private readonly logger = new Logger(CardTransactionsService.name);

  constructor(
    @InjectRepository(CardTransaction)
    private txRepo: Repository<CardTransaction>,
    @InjectRepository(VirtualCard)
    private cardRepo: Repository<VirtualCard>,
  ) {}

  async getCardTransactions(
    userId: string,
    cardId: string,
    query: CardTransactionQueryDto,
  ): Promise<{ data: CardTransaction[]; total: number }> {
    // Verify card belongs to user
    const card = await this.cardRepo.findOne({ where: { id: cardId, userId } });
    if (!card) {
      throw new NotFoundException('Card not found');
    }

    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);

    const where: FindOptionsWhere<CardTransaction> = { cardId };
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;

    if (query.startDate && query.endDate) {
      where.createdAt = Between(new Date(query.startDate), new Date(query.endDate));
    }

    const [data, total] = await this.txRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async recordTransaction(stripeTransaction: Stripe.Issuing.Transaction): Promise<CardTransaction> {
    // Check idempotency
    const existing = await this.txRepo.findOne({
      where: { stripeTransactionId: stripeTransaction.id },
    });
    if (existing) return existing;

    const stripeCardId = typeof stripeTransaction.card === 'string'
      ? stripeTransaction.card
      : stripeTransaction.card.id;

    const card = await this.cardRepo.findOne({
      where: { stripeCardId },
    });
    if (!card) {
      this.logger.warn(`Card not found for Stripe transaction: ${stripeTransaction.id}`);
      return null;
    }

    const merchantData = stripeTransaction.merchant_data;

    const tx = this.txRepo.create({
      cardId: card.id,
      userId: card.userId,
      stripeTransactionId: stripeTransaction.id,
      stripeAuthorizationId: (stripeTransaction as any).authorization || null,
      type: CardTransactionType.CAPTURE,
      status: CardTransactionStatus.SETTLED,
      amountCents: Math.abs(stripeTransaction.amount),
      currency: stripeTransaction.currency,
      merchantName: merchantData?.name || null,
      merchantCategory: merchantData?.category || null,
      merchantCategoryCode: merchantData?.category_code || null,
      merchantCity: merchantData?.city || null,
      merchantCountry: merchantData?.country || null,
    });

    return this.txRepo.save(tx);
  }

  async updateTransaction(stripeTransaction: Stripe.Issuing.Transaction): Promise<CardTransaction | null> {
    const tx = await this.txRepo.findOne({
      where: { stripeTransactionId: stripeTransaction.id },
    });

    if (!tx) {
      // If we don't have the transaction yet, record it
      return this.recordTransaction(stripeTransaction);
    }

    // Update status based on type
    if (stripeTransaction.type === 'refund') {
      tx.status = CardTransactionStatus.REVERSED;
      tx.type = CardTransactionType.REFUND;
    }

    return this.txRepo.save(tx);
  }
}
