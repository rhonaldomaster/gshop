import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AnalyticsService } from './analytics.service'
import { PixelEvent } from '../pixel/entities/pixel-event.entity'
import { Order } from '../orders/entities/order.entity'
import { Seller } from '../sellers/entities/seller.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([PixelEvent, Order, Seller]),
  ],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}