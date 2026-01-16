import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CustomThrottlerGuard } from '../guards/custom-throttler.guard';
import { getEnvAwareRateLimitConfig } from '../config/rate-limit.config';

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
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      useFactory: () => {
        const config = getEnvAwareRateLimitConfig();
        return {
          throttlers: [
            {
              name: 'default',
              ttl: config.global.ttl,
              limit: config.global.limit,
            },
          ],
          // Error message customization
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
  ],
  exports: [ThrottlerModule],
})
export class RateLimitModule {}
