import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';
import { DPAController } from './dpa.controller';
import { DPAService } from './dpa.service';
import { Campaign, CampaignMetric } from './ads.entity';
import { Product } from '../products/product.entity';
import { PixelEvent } from '../pixel/pixel.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Campaign, CampaignMetric, Product, PixelEvent])],
  controllers: [AdsController, DPAController],
  providers: [AdsService, DPAService],
  exports: [AdsService, DPAService],
})
export class AdsModule {}