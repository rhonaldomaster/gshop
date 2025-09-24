import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';
import { EasyPostService } from './easypost.service';
import { Order } from '../database/entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    ConfigModule,
  ],
  controllers: [ShippingController],
  providers: [ShippingService, EasyPostService],
  exports: [ShippingService, EasyPostService],
})
export class ShippingModule {}