import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { LiveController } from './live.controller';
import { LiveService } from './live.service';
import { LiveGateway } from './live.gateway';
import { LiveMetricsService } from './live-metrics.service';
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
    ])
  ],
  controllers: [LiveController],
  providers: [
    LiveService,
    LiveGateway,
    LiveMetricsService,
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