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
import { Affiliate } from '../affiliates/entities/affiliate.entity';
import { Order } from '../database/entities/order.entity';
import { AwsIvsMockService } from './aws-ivs-mock.service';
import { AwsIvsService } from './aws-ivs.service';
import { NotificationsModule } from '../notifications/notifications.module';

/**
 * IVS_SERVICE Token
 * Used for dependency injection of IVS service (mock or real)
 */
export const IVS_SERVICE = 'IVS_SERVICE';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LiveStream,
      LiveStreamProduct,
      LiveStreamMessage,
      LiveStreamViewer,
      LiveStreamReaction,
      LiveStreamMetrics,
      Affiliate,
      Order
    ]),
    ScheduleModule.forRoot(),
    NotificationsModule,
  ],
  controllers: [LiveController],
  providers: [
    LiveService,
    LiveGateway,
    LiveMetricsService,
    LiveSchedulerService,
    {
      provide: IVS_SERVICE,
      useFactory: (configService: ConfigService) => {
        const isEnabled = configService.get('AWS_IVS_ENABLED') === 'true';

        if (isEnabled) {
          console.log('[Live Module] 🚀 Using REAL AWS IVS Service');
          return new AwsIvsService(configService);
        } else {
          console.log('[Live Module] 🧪 Using MOCK AWS IVS Service (development mode)');
          return new AwsIvsMockService();
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [LiveService, LiveGateway, LiveMetricsService, IVS_SERVICE],
})
export class LiveModule {}