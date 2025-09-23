import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AudiencesController } from './audiences.controller';
import { AudiencesService } from './audiences.service';
import { Audience, AudienceUser } from './audience.entity';
import { PixelEvent } from '../pixel/pixel.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Audience, AudienceUser, PixelEvent])],
  controllers: [AudiencesController],
  providers: [AudiencesService],
  exports: [AudiencesService],
})
export class AudiencesModule {}