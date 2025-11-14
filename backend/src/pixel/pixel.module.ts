import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PixelController } from './pixel.controller'
import { PixelService } from './pixel.service'
import { PixelEvent } from './entities/pixel-event.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([PixelEvent]),
  ],
  controllers: [PixelController],
  providers: [PixelService],
  exports: [PixelService, TypeOrmModule],
})
export class PixelModule {}