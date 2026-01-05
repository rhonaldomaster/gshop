import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { PaymentsV2Controller } from './payments-v2.controller';
import { PaymentsV2Service } from './payments-v2.service';
import { PaymentSchedulerService } from './payment-scheduler.service';
import { MercadoPagoService } from './mercadopago.service';
import { CurrencyService } from './currency.service';
import { PaymentConfigService } from './payment-config.service';
import { PaymentV2, Invoice, PaymentMethodEntity, CryptoTransaction } from './payments-v2.entity';
import { Order } from '../database/entities/order.entity';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentV2,
      Invoice,
      PaymentMethodEntity,
      CryptoTransaction,
      Order,
    ]),
    HttpModule, // For CurrencyService to fetch exchange rates
    OrdersModule, // For OrdersService in webhook handler
  ],
  controllers: [PaymentsV2Controller],
  providers: [
    PaymentsV2Service,
    PaymentSchedulerService,
    MercadoPagoService,
    CurrencyService,
    PaymentConfigService,
  ],
  exports: [PaymentsV2Service],
})
export class PaymentsV2Module {}