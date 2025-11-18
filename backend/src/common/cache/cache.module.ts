import { Module, Global } from '@nestjs/common';
import { CacheMockService } from './cache-mock.service';

/**
 * Global Cache Module
 * Provides caching functionality across the application
 * Currently using in-memory mock, can be replaced with Redis
 */

@Global()
@Module({
  providers: [CacheMockService],
  exports: [CacheMockService],
})
export class CacheModule {}
