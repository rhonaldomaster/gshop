
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ShippingService } from './shipping.service';
import { Order } from '../database/entities/order.entity';
import { OrderItem } from '../database/entities/order-item.entity';
import { Product } from '../database/entities/product.entity';
import { User } from '../database/entities/user.entity';
import { LiveStream, LiveStreamProduct } from '../live/live.entity';
import { Affiliate } from '../affiliates/entities/affiliate.entity';
import { Seller } from '../sellers/entities/seller.entity';
import { SellerLocation } from '../sellers/entities/seller-location.entity';
import { ConfigModule as PlatformConfigModule } from '../config/config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Product,
      User,
      LiveStream,
      LiveStreamProduct,
      Affiliate,
      Seller,
      SellerLocation,
    ]),
    PlatformConfigModule, // Import ConfigModule to use ConfigService
  ],
  controllers: [OrdersController],
  providers: [OrdersService, ShippingService],
  exports: [OrdersService, ShippingService],
})
export class OrdersModule {}
