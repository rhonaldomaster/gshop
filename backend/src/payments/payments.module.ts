
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { MercadoPagoService } from './mercadopago.service';
import { Payment } from '../database/entities/payment.entity';
import { Order } from '../database/entities/order.entity';
import { Commission } from '../database/entities/commission.entity';
import { PaymentMethodEntity, PaymentV2 } from './payments-v2.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, PaymentV2, Order, Commission, PaymentMethodEntity])],
  controllers: [PaymentsController],
  providers: [PaymentsService, MercadoPagoService],
  exports: [PaymentsService, MercadoPagoService],
})
export class PaymentsModule {}
