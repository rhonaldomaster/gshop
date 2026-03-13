import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cardholder, CardholderStatus } from '../entities/cardholder.entity';
import { User } from '../../database/entities/user.entity';
import { StripeIssuingService } from './stripe-issuing.service';
import { CreateCardholderDto } from '../dto/create-cardholder.dto';

@Injectable()
export class CardholdersService {
  private readonly logger = new Logger(CardholdersService.name);

  constructor(
    @InjectRepository(Cardholder)
    private cardholderRepo: Repository<Cardholder>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private stripeIssuing: StripeIssuingService,
  ) {}

  async createCardholder(userId: string, dto: CreateCardholderDto): Promise<Cardholder> {
    // Check if user already has a cardholder
    const existing = await this.cardholderRepo.findOne({ where: { userId } });
    if (existing) {
      throw new ConflictException('User already has a cardholder profile');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const stripe = this.stripeIssuing.getClient();

    // Create cardholder in Stripe
    const stripeCardholder = await stripe.issuing.cardholders.create({
      name: dto.name,
      email: user.email,
      phone_number: dto.phoneNumber || user.phone || undefined,
      billing: {
        address: {
          line1: dto.billingAddress.line1,
          line2: dto.billingAddress.line2 || undefined,
          city: dto.billingAddress.city,
          state: dto.billingAddress.state,
          postal_code: dto.billingAddress.postalCode,
          country: dto.billingAddress.country,
        },
      },
      type: 'individual',
      metadata: {
        gshop_user_id: userId,
      },
    });

    // Save to database
    const cardholder = this.cardholderRepo.create({
      userId,
      stripeCardholderId: stripeCardholder.id,
      status: stripeCardholder.status === 'active'
        ? CardholderStatus.ACTIVE
        : CardholderStatus.PENDING,
      phoneNumber: dto.phoneNumber,
      billingAddress: dto.billingAddress,
      metadata: { stripeType: stripeCardholder.type },
    });

    return this.cardholderRepo.save(cardholder);
  }

  async getCardholderByUserId(userId: string): Promise<Cardholder | null> {
    return this.cardholderRepo.findOne({
      where: { userId },
      relations: ['cards'],
    });
  }

  async ensureCardholder(userId: string, dto: CreateCardholderDto): Promise<Cardholder> {
    const existing = await this.getCardholderByUserId(userId);
    if (existing) return existing;
    return this.createCardholder(userId, dto);
  }

  async syncCardholderStatus(stripeCardholderId: string): Promise<Cardholder> {
    const cardholder = await this.cardholderRepo.findOne({
      where: { stripeCardholderId },
    });
    if (!cardholder) {
      throw new NotFoundException(`Cardholder not found for Stripe ID: ${stripeCardholderId}`);
    }

    const stripe = this.stripeIssuing.getClient();
    const stripeCardholder = await stripe.issuing.cardholders.retrieve(stripeCardholderId);

    const statusMap: Record<string, CardholderStatus> = {
      active: CardholderStatus.ACTIVE,
      inactive: CardholderStatus.INACTIVE,
      blocked: CardholderStatus.INACTIVE,
    };

    cardholder.status = statusMap[stripeCardholder.status] || CardholderStatus.PENDING;
    return this.cardholderRepo.save(cardholder);
  }

  // Bridge v2 future stubs
  async createConnectedAccount(_userId: string): Promise<string | null> {
    throw new BadRequestException('Bridge v2 connected accounts not yet available');
  }

  async createFinancialAccount(_connectedAccountId: string): Promise<string | null> {
    throw new BadRequestException('Bridge v2 financial accounts not yet available');
  }
}
