import { RedisThrottlerStorage } from './redis-throttler.storage';

describe('RedisThrottlerStorage', () => {
  let storage: RedisThrottlerStorage;

  beforeEach(() => {
    delete process.env.REDIS_HOST;
    storage = new RedisThrottlerStorage();
  });

  afterEach(async () => {
    await storage.onModuleDestroy();
  });

  describe('without Redis (in-memory fallback)', () => {
    it('should be defined', () => {
      expect(storage).toBeDefined();
    });

    it('should use in-memory storage when REDIS_HOST is not set', () => {
      expect(storage.getStorageType()).toBe('In-Memory');
      expect(storage.isRedisAvailable()).toBe(false);
    });

    it('should increment and track hits correctly', async () => {
      const key = 'test-key';
      const ttl = 60000;
      const limit = 5;
      const blockDuration = 0;
      const throttlerName = 'default';

      const result1 = await storage.increment(
        key,
        ttl,
        limit,
        blockDuration,
        throttlerName,
      );

      expect(result1.totalHits).toBe(1);
      expect(result1.isBlocked).toBe(false);
      expect(result1.timeToExpire).toBeGreaterThan(0);
      expect(result1.timeToExpire).toBeLessThanOrEqual(ttl);
    });

    it('should block after exceeding limit', async () => {
      const key = 'block-test-key';
      const ttl = 60000;
      const limit = 3;
      const blockDuration = 10000;
      const throttlerName = 'default';

      for (let i = 0; i < limit; i++) {
        await storage.increment(key, ttl, limit, blockDuration, throttlerName);
      }

      const blockedResult = await storage.increment(
        key,
        ttl,
        limit,
        blockDuration,
        throttlerName,
      );

      expect(blockedResult.totalHits).toBe(limit + 1);
      expect(blockedResult.isBlocked).toBe(true);
    });

    it('should track different keys separately', async () => {
      const ttl = 60000;
      const limit = 10;
      const blockDuration = 0;
      const throttlerName = 'default';

      const result1 = await storage.increment(
        'key1',
        ttl,
        limit,
        blockDuration,
        throttlerName,
      );
      const result2 = await storage.increment(
        'key2',
        ttl,
        limit,
        blockDuration,
        throttlerName,
      );

      expect(result1.totalHits).toBe(1);
      expect(result2.totalHits).toBe(1);
    });

    it('should reset after TTL expires', async () => {
      const key = 'ttl-test-key';
      const ttl = 100;
      const limit = 5;
      const blockDuration = 0;
      const throttlerName = 'default';

      await storage.increment(key, ttl, limit, blockDuration, throttlerName);
      await storage.increment(key, ttl, limit, blockDuration, throttlerName);

      await new Promise((resolve) => setTimeout(resolve, 150));

      const result = await storage.increment(
        key,
        ttl,
        limit,
        blockDuration,
        throttlerName,
      );

      expect(result.totalHits).toBe(1);
    });

    it('should handle multiple throttler names', async () => {
      const key = 'multi-throttler-key';
      const ttl = 60000;
      const limit = 5;
      const blockDuration = 0;

      const result1 = await storage.increment(
        key,
        ttl,
        limit,
        blockDuration,
        'throttler1',
      );
      const result2 = await storage.increment(
        key,
        ttl,
        limit,
        blockDuration,
        'throttler2',
      );

      expect(result1.totalHits).toBe(1);
      expect(result2.totalHits).toBe(1);
    });
  });

  describe('storage type detection', () => {
    it('should return In-Memory when Redis is not configured', () => {
      expect(storage.getStorageType()).toBe('In-Memory');
    });

    it('should report Redis unavailable when not configured', () => {
      expect(storage.isRedisAvailable()).toBe(false);
    });
  });
});
