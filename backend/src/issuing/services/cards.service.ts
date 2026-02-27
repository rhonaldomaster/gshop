import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VirtualCard, CardStatus, CardType } from '../entities/virtual-card.entity';
import { Cardholder, CardholderStatus } from '../entities/cardholder.entity';
import { StripeIssuingService } from './stripe-issuing.service';
import { CreateCardDto } from '../dto/create-card.dto';
import { UpdateCardDto } from '../dto/update-card.dto';
import { DEFAULT_SPENDING_LIMIT_CENTS } from '../constants';

@Injectable()
export class CardsService {
  private readonly logger = new Logger(CardsService.name);

  constructor(
    @InjectRepository(VirtualCard)
    private cardRepo: Repository<VirtualCard>,
    @InjectRepository(Cardholder)
    private cardholderRepo: Repository<Cardholder>,
    private stripeIssuing: StripeIssuingService,
  ) {}

  async createCard(userId: string, dto: CreateCardDto): Promise<VirtualCard> {
    // Verify cardholder exists and is active
    const cardholder = await this.cardholderRepo.findOne({ where: { userId } });
    if (!cardholder) {
      throw new BadRequestException('You must create a cardholder profile first');
    }
    if (cardholder.status !== CardholderStatus.ACTIVE) {
      throw new BadRequestException(`Cardholder is not active (status: ${cardholder.status})`);
    }

    const stripe = this.stripeIssuing.getClient();
    const cardType = dto.type || CardType.VIRTUAL;

    // Build spending controls
    const spendingLimits = dto.spendingControls?.spendingLimits?.map((limit) => ({
      amount: limit.amount,
      interval: limit.interval as any,
    })) || [{
      amount: DEFAULT_SPENDING_LIMIT_CENTS,
      interval: 'all_time' as const,
    }];

    // Create card in Stripe
    const stripeCard = await stripe.issuing.cards.create({
      cardholder: cardholder.stripeCardholderId,
      currency: 'usd',
      type: cardType,
      spending_controls: {
        spending_limits: spendingLimits,
      },
      metadata: {
        gshop_user_id: userId,
        gshop_cardholder_id: cardholder.id,
      },
    });

    // Save to database
    const card = this.cardRepo.create({
      userId,
      cardholderId: cardholder.id,
      stripeCardId: stripeCard.id,
      status: stripeCard.status === 'active' ? CardStatus.ACTIVE : CardStatus.PENDING,
      type: cardType,
      last4: stripeCard.last4,
      expMonth: String(stripeCard.exp_month).padStart(2, '0'),
      expYear: String(stripeCard.exp_year),
      brand: stripeCard.brand || 'visa',
      currency: stripeCard.currency,
      spendingControls: dto.spendingControls || {
        spendingLimits: [{ amount: DEFAULT_SPENDING_LIMIT_CENTS, interval: 'all_time' }],
      },
    });

    return this.cardRepo.save(card);
  }

  async getUserCards(userId: string): Promise<VirtualCard[]> {
    return this.cardRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getCardById(userId: string, cardId: string): Promise<VirtualCard> {
    const card = await this.cardRepo.findOne({ where: { id: cardId, userId } });
    if (!card) {
      throw new NotFoundException('Card not found');
    }
    return card;
  }

  async getCardSensitiveDetails(
    userId: string,
    cardId: string,
  ): Promise<{ number: string; cvc: string; expMonth: string; expYear: string }> {
    const card = await this.getCardById(userId, cardId);

    const stripe = this.stripeIssuing.getClient();

    // Retrieve full card number and CVC from Stripe
    const stripeCard = await stripe.issuing.cards.retrieve(card.stripeCardId, {
      expand: ['number', 'cvc'],
    });

    return {
      number: (stripeCard as any).number || '',
      cvc: (stripeCard as any).cvc || '',
      expMonth: card.expMonth,
      expYear: card.expYear,
    };
  }

  async updateCard(userId: string, cardId: string, dto: UpdateCardDto): Promise<VirtualCard> {
    const card = await this.getCardById(userId, cardId);

    if (card.status === CardStatus.CANCELED) {
      throw new BadRequestException('Cannot update a canceled card');
    }

    const stripe = this.stripeIssuing.getClient();
    const updateParams: any = {};

    if (dto.status) {
      updateParams.status = dto.status;
    }

    if (dto.spendingControls?.spendingLimits) {
      updateParams.spending_controls = {
        spending_limits: dto.spendingControls.spendingLimits.map((limit) => ({
          amount: limit.amount,
          interval: limit.interval,
        })),
      };
    }

    // Update on Stripe
    await stripe.issuing.cards.update(card.stripeCardId, updateParams);

    // Update locally
    if (dto.status) {
      card.status = dto.status;
    }
    if (dto.spendingControls) {
      card.spendingControls = dto.spendingControls;
    }

    return this.cardRepo.save(card);
  }

  async cancelCard(userId: string, cardId: string): Promise<VirtualCard> {
    const card = await this.getCardById(userId, cardId);

    if (card.status === CardStatus.CANCELED) {
      throw new BadRequestException('Card is already canceled');
    }

    const stripe = this.stripeIssuing.getClient();
    await stripe.issuing.cards.update(card.stripeCardId, { status: 'canceled' });

    card.status = CardStatus.CANCELED;
    card.canceledAt = new Date();

    return this.cardRepo.save(card);
  }

  async syncCardFromStripe(stripeCardId: string): Promise<VirtualCard | null> {
    const card = await this.cardRepo.findOne({ where: { stripeCardId } });
    if (!card) {
      this.logger.warn(`Card not found locally for Stripe ID: ${stripeCardId}`);
      return null;
    }

    const stripe = this.stripeIssuing.getClient();
    const stripeCard = await stripe.issuing.cards.retrieve(stripeCardId);

    const statusMap: Record<string, CardStatus> = {
      active: CardStatus.ACTIVE,
      inactive: CardStatus.INACTIVE,
      canceled: CardStatus.CANCELED,
    };

    card.status = statusMap[stripeCard.status] || CardStatus.PENDING;
    return this.cardRepo.save(card);
  }

  async findByStripeCardId(stripeCardId: string): Promise<VirtualCard | null> {
    return this.cardRepo.findOne({ where: { stripeCardId } });
  }
}
