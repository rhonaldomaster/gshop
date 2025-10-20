import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsV2Controller } from './payments-v2.controller';
import { PaymentsV2Service } from './payments-v2.service';
import { PaymentSchedulerService } from './payment-scheduler.service';
import { PaymentV2, Invoice, PaymentMethodEntity, CryptoTransaction } from './payments-v2.entity';
import { Order } from '../database/entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentV2,
      Invoice,
      PaymentMethodEntity,
      CryptoTransaction,
      Order,
    ]),
  ],
  controllers: [PaymentsV2Controller],
  providers: [PaymentsV2Service, PaymentSchedulerService],
  exports: [PaymentsV2Service],
})
export class PaymentsV2Module {}