import {
  Controller,
  Post,
  Headers,
  Req,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { StripeIssuingService } from './services/stripe-issuing.service';
import { AuthorizationService } from './services/authorization.service';
import { CardsService } from './services/cards.service';
import { CardholdersService } from './services/cardholders.service';
import { CardTransactionsService } from './services/card-transactions.service';
import Stripe from 'stripe';

@ApiTags('Webhooks')
@Controller('webhooks/stripe')
export class IssuingWebhookController {
  private readonly logger = new Logger(IssuingWebhookController.name);

  constructor(
    private stripeIssuing: StripeIssuingService,
    private authorizationService: AuthorizationService,
    private cardsService: CardsService,
    private cardholdersService: CardholdersService,
    private cardTransactionsService: CardTransactionsService,
  ) {}

  @Post('issuing')
  @ApiExcludeEndpoint()
  async handleIssuingWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: any,
  ) {
    const webhookSecret = process.env.STRIPE_ISSUING_WEBHOOK_SECRET;
    if (!webhookSecret) {
      this.logger.error('STRIPE_ISSUING_WEBHOOK_SECRET is not configured');
      throw new BadRequestException('Webhook not configured');
    }

    let event: Stripe.Event;
    try {
      event = this.stripeIssuing.constructEvent(
        request.body,
        signature,
        webhookSecret,
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Received issuing webhook: ${event.type}`);

    try {
      switch (event.type) {
        case 'issuing_authorization.request':
          return this.authorizationService.handleAuthorizationRequest(
            event.data.object as Stripe.Issuing.Authorization,
          );

        case 'issuing_authorization.created':
          await this.authorizationService.recordAuthorization(
            event.data.object as Stripe.Issuing.Authorization,
          );
          break;

        case 'issuing_transaction.created':
          await this.cardTransactionsService.recordTransaction(
            event.data.object as Stripe.Issuing.Transaction,
          );
          break;

        case 'issuing_transaction.updated':
          await this.cardTransactionsService.updateTransaction(
            event.data.object as Stripe.Issuing.Transaction,
          );
          break;

        case 'issuing_card.created':
        case 'issuing_card.updated': {
          const card = event.data.object as Stripe.Issuing.Card;
          await this.cardsService.syncCardFromStripe(card.id);
          break;
        }

        case 'issuing_cardholder.created':
        case 'issuing_cardholder.updated': {
          const cardholder = event.data.object as Stripe.Issuing.Cardholder;
          await this.cardholdersService.syncCardholderStatus(cardholder.id);
          break;
        }

        default:
          this.logger.log(`Unhandled issuing event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error processing ${event.type}: ${error.message}`, error.stack);
      // Don't throw — return 200 so Stripe doesn't retry
    }

    return { received: true };
  }
}
