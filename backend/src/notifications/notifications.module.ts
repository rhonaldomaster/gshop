import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { DeviceToken } from './device-token.entity';
import { User } from '../database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceToken, User])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
