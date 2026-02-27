import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cardholder } from './entities/cardholder.entity';
import { VirtualCard } from './entities/virtual-card.entity';
import { CardTransaction } from './entities/card-transaction.entity';
import { User } from '../database/entities/user.entity';
import { GshopWallet, GshopTransaction } from '../token/token.entity';
import { IssuingController } from './issuing.controller';
import { IssuingWebhookController } from './issuing-webhook.controller';
import { StripeIssuingService } from './services/stripe-issuing.service';
import { CardholdersService } from './services/cardholders.service';
import { CardsService } from './services/cards.service';
import { CardTransactionsService } from './services/card-transactions.service';
import { AuthorizationService } from './services/authorization.service';
import { FundingService } from './services/funding.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cardholder,
      VirtualCard,
      CardTransaction,
      User,
      GshopWallet,
      GshopTransaction,
    ]),
  ],
  controllers: [IssuingController, IssuingWebhookController],
  providers: [
    StripeIssuingService,
    CardholdersService,
    CardsService,
    CardTransactionsService,
    AuthorizationService,
    FundingService,
  ],
  exports: [CardsService, FundingService],
})
export class IssuingModule {}
