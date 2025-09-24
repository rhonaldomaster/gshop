import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsV2Controller } from './payments-v2.controller';
import { PaymentsV2Service } from './payments-v2.service';
import { PaymentV2, Invoice, PaymentMethodEntity, CryptoTransaction } from './payments-v2.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentV2,
      Invoice,
      PaymentMethodEntity,
      CryptoTransaction,
    ]),
  ],
  controllers: [PaymentsV2Controller],
  providers: [PaymentsV2Service],
  exports: [PaymentsV2Service],
})
export class PaymentsV2Module {}