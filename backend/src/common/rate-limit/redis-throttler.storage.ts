import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';

export interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

/**
 * Redis-based storage for @nestjs/throttler
 *
 * Provides distributed rate limiting across multiple server instances.
 * Falls back gracefully if Redis is unavailable.
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage, OnModuleDestroy {
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  private redis: Redis | null = null;
  private isConnected = false;

  constructor() {
    this.initializeRedis();
  }

  private initializeRedis(): void {
    const host = process.env.REDIS_HOST;
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    const password = process.env.REDIS_PASSWORD;

    if (!host) {
      this.logger.warn(
        'REDIS_HOST not configured. Rate limiting will use in-memory storage (not suitable for production with multiple instances).',
      );
      return;
    }

    try {
      this.redis = new Redis({
        host,
        port,
        password: password || undefined,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.error(
              'Redis connection failed after 3 retries. Falling back to in-memory storage.',
            );
            return null;
          }
          return Math.min(times * 100, 3000);
        },
        lazyConnect: true,
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Connected to Redis for rate limiting storage');
      });

      this.redis.on('error', (error) => {
        this.isConnected = false;
        this.logger.error(`Redis error: ${error.message}`);
      });

      this.redis.on('close', () => {
        this.isConnected = false;
        this.logger.warn('Redis connection closed');
      });

      this.redis.connect().catch((error) => {
        this.logger.error(`Failed to connect to Redis: ${error.message}`);
      });
    } catch (error) {
      this.logger.error(`Failed to initialize Redis: ${error.message}`);
    }
  }

  /**
   * Increment the hit count for a key
   * Returns the current record state
   */
  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const storageKey = `throttle:${throttlerName}:${key}`;

    if (this.redis && this.isConnected) {
      return this.incrementRedis(storageKey, ttl, limit, blockDuration);
    }

    return this.incrementMemory(storageKey, ttl, limit, blockDuration);
  }

  private async incrementRedis(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
  ): Promise<ThrottlerStorageRecord> {
    try {
      const blockedKey = `${key}:blocked`;

      const isBlocked = await this.redis!.get(blockedKey);
      if (isBlocked) {
        const blockedTtl = await this.redis!.ttl(blockedKey);
        return {
          totalHits: limit + 1,
          timeToExpire: 0,
          isBlocked: true,
          timeToBlockExpire: blockedTtl > 0 ? blockedTtl * 1000 : 0,
        };
      }

      const totalHits = await this.redis!.incr(key);

      if (totalHits === 1) {
        await this.redis!.pexpire(key, ttl);
      }

      const pttl = await this.redis!.pttl(key);
      const timeToExpire = pttl > 0 ? pttl : ttl;

      if (totalHits > limit && blockDuration > 0) {
        await this.redis!.set(blockedKey, '1', 'PX', blockDuration);
      }

      return {
        totalHits,
        timeToExpire,
        isBlocked: totalHits > limit,
        timeToBlockExpire: totalHits > limit ? blockDuration : 0,
      };
    } catch (error) {
      this.logger.error(`Redis increment error: ${error.message}`);
      return this.incrementMemory(key, ttl, limit, blockDuration);
    }
  }

  private memoryStorage = new Map<
    string,
    { totalHits: number; expiresAt: number; blockedUntil?: number }
  >();

  private incrementMemory(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
  ): ThrottlerStorageRecord {
    const now = Date.now();
    let record = this.memoryStorage.get(key);

    if (record && record.blockedUntil && now < record.blockedUntil) {
      return {
        totalHits: limit + 1,
        timeToExpire: 0,
        isBlocked: true,
        timeToBlockExpire: record.blockedUntil - now,
      };
    }

    if (!record || now > record.expiresAt) {
      record = {
        totalHits: 0,
        expiresAt: now + ttl,
      };
    }

    record.totalHits++;

    if (record.totalHits > limit && blockDuration > 0) {
      record.blockedUntil = now + blockDuration;
    }

    this.memoryStorage.set(key, record);

    const isBlocked = record.totalHits > limit;

    return {
      totalHits: record.totalHits,
      timeToExpire: record.expiresAt - now,
      isBlocked,
      timeToBlockExpire: isBlocked ? blockDuration : 0,
    };
  }

  /**
   * Check if Redis is connected and available
   */
  isRedisAvailable(): boolean {
    return this.redis !== null && this.isConnected;
  }

  /**
   * Get storage type for logging/debugging
   */
  getStorageType(): string {
    return this.isRedisAvailable() ? 'Redis' : 'In-Memory';
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('Redis connection closed');
    }
  }
}
