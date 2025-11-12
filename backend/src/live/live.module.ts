import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiveController } from './live.controller';
import { LiveService } from './live.service';
import { LiveGateway } from './live.gateway';
import { LiveStream, LiveStreamProduct, LiveStreamMessage, LiveStreamViewer } from './live.entity';
import { Affiliate } from '../affiliates/entities/affiliate.entity';
import { Order } from '../database/entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LiveStream, LiveStreamProduct, LiveStreamMessage, LiveStreamViewer, Affiliate, Order])],
  controllers: [LiveController],
  providers: [LiveService, LiveGateway],
  exports: [LiveService, LiveGateway],
})
export class LiveModule {}