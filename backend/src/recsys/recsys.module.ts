import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecsysController } from './recsys.controller';
import { RecsysService } from './recsys.service';
import {
  UserInteraction,
  UserPreference,
  SimilarityMatrix,
  Recommendation
} from './recsys.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserInteraction,
      UserPreference,
      SimilarityMatrix,
      Recommendation,
    ]),
  ],
  controllers: [RecsysController],
  providers: [RecsysService],
  exports: [RecsysService],
})
export class RecsysModule {}