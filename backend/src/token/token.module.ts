import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenController } from './token.controller';
import { TokenService } from './token.service';
import {
  GshopWallet,
  GshopTransaction,
  TokenReward,
  WalletTopup,
  TokenCirculation
} from './token.entity';
import { UserVerification } from './entities/user-verification.entity';
import { TransferLimit } from './entities/transfer-limit.entity';
import { User } from '../users/user.entity';
import { PaymentsV2Module } from '../payments/payments-v2.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GshopWallet,
      GshopTransaction,
      TokenReward,
      WalletTopup,
      TokenCirculation,
      UserVerification,
      TransferLimit,
      User, // For searching users by email/phone
    ]),
    forwardRef(() => PaymentsV2Module), // For CurrencyService (COP → USD conversion)
  ],
  controllers: [TokenController],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}