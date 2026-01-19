import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { LiveController } from './live.controller';
import { LiveService } from './live.service';
import { LiveGateway } from './live.gateway';
import { LiveMetricsService } from './live-metrics.service';
import { LiveSchedulerService } from './live-scheduler.service';
import {
  LiveStream,
  LiveStreamProduct,
  LiveStreamMessage,
  LiveStreamViewer,
  LiveStreamReaction,
  LiveStreamMetrics
} from './live.entity';
import { LiveStreamVod } from './vod.entity';
import { VodService } from './vod.service';
import { VodController } from './vod.controller';
import { FollowersService } from './followers.service';
import { FollowersController } from './followers.controller';
import { Affiliate } from '../affiliates/entities/affiliate.entity';
import { Order } from '../database/entities/order.entity';
import { User } from '../database/entities/user.entity';
import { StreamerFollow } from '../database/entities/streamer-follow.entity';
import { DeviceToken } from '../notifications/device-token.entity';
import { AwsIvsMockService } from './aws-ivs-mock.service';
import { AwsIvsService } from './aws-ivs.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { CacheMockService } from '../common/cache/cache-mock.service';
import { IVS_SERVICE } from './live.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LiveStream,
      LiveStreamProduct,
      LiveStreamMessage,
      LiveStreamViewer,
      LiveStreamReaction,
      LiveStreamMetrics,
      LiveStreamVod,
      Affiliate,
      Order,
      User,
      StreamerFollow,
      DeviceToken,
    ]),
    ScheduleModule.forRoot(),
    NotificationsModule,
  ],
  controllers: [LiveController, VodController, FollowersController],
  providers: [
    CacheMockService,
    {
      provide: IVS_SERVICE,
      useValue: new AwsIvsMockService(),
    },
    LiveService,
    LiveGateway,
    LiveMetricsService,
    LiveSchedulerService,
    VodService,
    FollowersService,
  ],
  exports: [LiveService, LiveGateway, LiveMetricsService, IVS_SERVICE, VodService, FollowersService],
})
export class LiveModule {}