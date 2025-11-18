import { Injectable } from '@nestjs/common';

/**
 * Mock Cache Service
 * Simulates Redis cache operations using in-memory Map
 * TODO: Replace with real Redis when available
 */

interface CacheEntry {
  value: any;
  expiresAt?: number;
}

@Injectable()
export class CacheMockService {
  private cache: Map<string, CacheEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 60 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60000);
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set value in cache with optional TTL
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const entry: CacheEntry = {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    };

    this.cache.set(key, entry);
    console.log(`[CACHE MOCK] Set key: ${key} (TTL: ${ttlSeconds || 'none'})`);
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<void> {
    this.cache.delete(key);
    console.log(`[CACHE MOCK] Deleted key: ${key}`);
  }

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`[CACHE MOCK] Deleted ${keysToDelete.length} keys matching pattern: ${pattern}`);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Set expiration time for key
   */
  async expire(key: string, ttlSeconds: number): Promise<void> {
    const entry = this.cache.get(key);

    if (entry) {
      entry.expiresAt = Date.now() + ttlSeconds * 1000;
      this.cache.set(key, entry);
    }
  }

  /**
   * Increment numeric value
   */
  async incr(key: string): Promise<number> {
    const current = await this.get<number>(key);
    const newValue = (current || 0) + 1;
    await this.set(key, newValue);
    return newValue;
  }

  /**
   * Decrement numeric value
   */
  async decr(key: string): Promise<number> {
    const current = await this.get<number>(key);
    const newValue = (current || 0) - 1;
    await this.set(key, newValue);
    return newValue;
  }

  /**
   * Get all keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    const matchingKeys: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        const entry = this.cache.get(key);
        // Only include non-expired keys
        if (!entry?.expiresAt || Date.now() <= entry.expiresAt) {
          matchingKeys.push(key);
        }
      }
    }

    return matchingKeys;
  }

  /**
   * Add member to set
   */
  async sadd(key: string, ...members: string[]): Promise<void> {
    const currentSet = await this.get<Set<string>>(key) || new Set<string>();
    members.forEach(member => currentSet.add(member));
    await this.set(key, currentSet);
  }

  /**
   * Remove member from set
   */
  async srem(key: string, member: string): Promise<void> {
    const currentSet = await this.get<Set<string>>(key);
    if (currentSet) {
      currentSet.delete(member);
      await this.set(key, currentSet);
    }
  }

  /**
   * Get all members of set
   */
  async smembers(key: string): Promise<string[]> {
    const set = await this.get<Set<string>>(key);
    return set ? Array.from(set) : [];
  }

  /**
   * Get set cardinality (size)
   */
  async scard(key: string): Promise<number> {
    const set = await this.get<Set<string>>(key);
    return set ? set.size : 0;
  }

  /**
   * Clear all cache
   */
  async flushall(): Promise<void> {
    this.cache.clear();
    console.log('[CACHE MOCK] Flushed all cache');
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ keys: number; memoryUsage: number }> {
    return {
      keys: this.cache.size,
      memoryUsage: 0, // Mock value
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`[CACHE MOCK] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
