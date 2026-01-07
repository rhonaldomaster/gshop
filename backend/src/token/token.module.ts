import { Module } from '@nestjs/common';
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
  ],
  controllers: [TokenController],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}