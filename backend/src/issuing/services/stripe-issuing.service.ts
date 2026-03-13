import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeIssuingService {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeIssuingService.name);

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-08-27.basil',
    });
  }

  getClient(): Stripe {
    return this.stripe;
  }

  constructEvent(rawBody: Buffer, signature: string, secret: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(rawBody, signature, secret);
  }

  isIssuingEnabled(): boolean {
    return process.env.STRIPE_ISSUING_ENABLED === 'true';
  }
}
