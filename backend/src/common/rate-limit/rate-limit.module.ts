import { Module, Logger } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { CustomThrottlerGuard } from '../guards/custom-throttler.guard';
import { ThrottlerExceptionFilter } from '../filters/throttler-exception.filter';
import { RedisThrottlerStorage } from './redis-throttler.storage';
import { getEnvAwareRateLimitConfig } from '../config/rate-limit.config';

const logger = new Logger('RateLimitModule');

/**
 * Rate Limit Module
 *
 * Configures global rate limiting for the application.
 * Uses @nestjs/throttler with custom guard for enhanced features.
 *
 * Features:
 * - Global rate limiting (100 req/min default)
 * - IP/API key whitelist support
 * - User-based tracking for authenticated requests
 * - Environment variable configuration
 * - Redis storage for distributed rate limiting (production)
 * - In-memory fallback for development
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      useFactory: () => {
        const config = getEnvAwareRateLimitConfig();
        const storage = new RedisThrottlerStorage();

        logger.log(
          `Rate limiting initialized with ${storage.getStorageType()} storage ` +
            `(${config.global.limit} requests per ${config.global.ttl / 1000}s)`,
        );

        return {
          throttlers: [
            {
              name: 'default',
              ttl: config.global.ttl,
              limit: config.global.limit,
            },
          ],
          storage,
          errorMessage:
            'Has excedido el limite de solicitudes. Intenta de nuevo mas tarde.',
        };
      },
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: ThrottlerExceptionFilter,
    },
    RedisThrottlerStorage,
    ThrottlerExceptionFilter,
  ],
  exports: [ThrottlerModule, RedisThrottlerStorage],
})
export class RateLimitModule {}
