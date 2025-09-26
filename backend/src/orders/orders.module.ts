
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from '../database/entities/order.entity';
import { OrderItem } from '../database/entities/order-item.entity';
import { Product } from '../database/entities/product.entity';
import { User } from '../database/entities/user.entity';
import { LiveStream, LiveStreamProduct } from '../live/live.entity';
import { Affiliate } from '../affiliates/entities/affiliate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Product, User, LiveStream, LiveStreamProduct, Affiliate])],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
