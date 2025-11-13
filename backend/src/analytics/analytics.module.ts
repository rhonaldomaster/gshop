import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AnalyticsService } from './analytics.service'
import { AnalyticsController } from './analytics.controller'
import { PixelEvent } from '../pixel/entities/pixel-event.entity'
import { Order } from '../orders/entities/order.entity'
import { Seller } from '../sellers/entities/seller.entity'
import { User } from '../database/entities/user.entity'
import { Product } from '../database/entities/product.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([PixelEvent, Order, Seller, User, Product]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}