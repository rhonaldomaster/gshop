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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GshopWallet,
      GshopTransaction,
      TokenReward,
      WalletTopup,
      TokenCirculation,
    ]),
  ],
  controllers: [TokenController],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}