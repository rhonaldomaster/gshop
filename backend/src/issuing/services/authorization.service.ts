import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { VirtualCard, CardStatus } from '../entities/virtual-card.entity';
import {
  CardTransaction,
  CardTransactionStatus,
  CardTransactionType,
} from '../entities/card-transaction.entity';
import { StripeIssuingService } from './stripe-issuing.service';

@Injectable()
export class AuthorizationService {
  private readonly logger = new Logger(AuthorizationService.name);

  constructor(
    @InjectRepository(VirtualCard)
    private cardRepo: Repository<VirtualCard>,
    @InjectRepository(CardTransaction)
    private txRepo: Repository<CardTransaction>,
    private stripeIssuing: StripeIssuingService,
  ) {}

  /**
   * Handle real-time authorization request from Stripe.
   * Must respond within ~2 seconds.
   * Stripe auto-approves based on spending_controls if this webhook is not configured.
   */
  async handleAuthorizationRequest(
    authorization: Stripe.Issuing.Authorization,
  ): Promise<{ approved: boolean }> {
    const stripe = this.stripeIssuing.getClient();
    const stripeCardId = typeof authorization.card === 'string'
      ? authorization.card
      : authorization.card.id;

    const card = await this.cardRepo.findOne({
      where: { stripeCardId },
    });

    if (!card) {
      this.logger.warn(`Authorization request for unknown card: ${stripeCardId}`);
      await stripe.issuing.authorizations.decline(authorization.id);
      return { approved: false };
    }

    if (card.status !== CardStatus.ACTIVE) {
      this.logger.warn(`Authorization request for non-active card: ${card.id} (${card.status})`);
      await stripe.issuing.authorizations.decline(authorization.id);
      return { approved: false };
    }

    // Approve — Stripe spending_controls handle the balance checks
    await stripe.issuing.authorizations.approve(authorization.id);
    return { approved: true };
  }

  /**
   * Record an authorization after it has been decided (approved or declined).
   * Called from issuing_authorization.created webhook event.
   */
  async recordAuthorization(
    authorization: Stripe.Issuing.Authorization,
  ): Promise<CardTransaction> {
    // Idempotency check
    const existing = await this.txRepo.findOne({
      where: { stripeAuthorizationId: authorization.id },
    });
    if (existing) return existing;

    const stripeCardId = typeof authorization.card === 'string'
      ? authorization.card
      : authorization.card.id;

    const card = await this.cardRepo.findOne({
      where: { stripeCardId },
    });

    if (!card) {
      this.logger.warn(`Cannot record authorization — card not found: ${stripeCardId}`);
      return null;
    }

    const merchantData = authorization.merchant_data;

    const tx = this.txRepo.create({
      cardId: card.id,
      userId: card.userId,
      stripeAuthorizationId: authorization.id,
      type: CardTransactionType.AUTHORIZATION,
      status: authorization.approved
        ? CardTransactionStatus.APPROVED
        : CardTransactionStatus.DECLINED,
      amountCents: Math.abs(authorization.amount),
      currency: authorization.currency,
      merchantName: merchantData?.name || null,
      merchantCategory: merchantData?.category || null,
      merchantCategoryCode: merchantData?.category_code || null,
      merchantCity: merchantData?.city || null,
      merchantCountry: merchantData?.country || null,
      declineReason: !authorization.approved
        ? (authorization as any).request_history?.[0]?.reason || 'declined'
        : null,
    });

    return this.txRepo.save(tx);
  }
}
