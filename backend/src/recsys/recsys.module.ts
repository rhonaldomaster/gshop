import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecsysController } from './recsys.controller';
import { RecsysService } from './recsys.service';
import {
  UserInteraction,
  UserPreference,
  ProductSimilarity,
  RecommendationResult
} from './recsys.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserInteraction,
      UserPreference,
      ProductSimilarity,
      RecommendationResult,
    ]),
  ],
  controllers: [RecsysController],
  providers: [RecsysService],
  exports: [RecsysService],
})
export class RecsysModule {}