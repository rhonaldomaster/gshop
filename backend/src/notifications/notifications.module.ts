import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { DeviceToken } from './device-token.entity';
import { User } from '../database/entities/user.entity';
import { UserNotification } from './user-notification.entity';
import { UserNotificationsService } from './user-notifications.service';
import { UserNotificationsController } from './user-notifications.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceToken, User, UserNotification])],
  controllers: [NotificationsController, UserNotificationsController],
  providers: [NotificationsService, UserNotificationsService],
  exports: [NotificationsService, UserNotificationsService],
})
export class NotificationsModule {}
