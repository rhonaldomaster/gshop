import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CacheMockService } from '../cache/cache-mock.service';

export interface RateLimitOptions {
  ttl: number; // Time window in seconds
  limit: number; // Max requests in time window
}

export const RATE_LIMIT_KEY = 'rateLimit';

/**
 * Rate Limiting Guard
 *
 * Protects endpoints from excessive requests using sliding window algorithm
 *
 * Usage:
 * @SetMetadata(RATE_LIMIT_KEY, { ttl: 60, limit: 10 })
 * @UseGuards(RateLimitGuard)
 * async myEndpoint() { ... }
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private cacheService: CacheMockService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitOptions = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (!rateLimitOptions) {
      return true; // No rate limit configured
    }

    const request = context.switchToHttp().getRequest();
    const identifier = this.getIdentifier(request);
    const key = `rateLimit:${identifier}:${context.getHandler().name}`;

    const currentTimestamp = Date.now();
    const windowStart = currentTimestamp - rateLimitOptions.ttl * 1000;

    // Get existing timestamps from cache
    const cachedData = await this.cacheService.get(key);
    let timestamps: number[] = cachedData ? JSON.parse(cachedData) : [];

    // Remove timestamps outside the window (sliding window)
    timestamps = timestamps.filter(ts => ts > windowStart);

    if (timestamps.length >= rateLimitOptions.limit) {
      const oldestTimestamp = timestamps[0];
      const resetTime = Math.ceil((oldestTimestamp + rateLimitOptions.ttl * 1000 - currentTimestamp) / 1000);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
          retryAfter: resetTime,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Add current timestamp
    timestamps.push(currentTimestamp);

    // Save to cache with TTL
    await this.cacheService.set(key, JSON.stringify(timestamps), rateLimitOptions.ttl);

    // Add rate limit headers
    const remaining = rateLimitOptions.limit - timestamps.length;
    const response = context.switchToHttp().getResponse();
    response.header('X-RateLimit-Limit', rateLimitOptions.limit.toString());
    response.header('X-RateLimit-Remaining', remaining.toString());
    response.header('X-RateLimit-Reset', new Date(windowStart + rateLimitOptions.ttl * 1000).toISOString());

    return true;
  }

  /**
   * Get identifier for rate limiting (IP address or user ID)
   */
  private getIdentifier(request: any): string {
    // Prioritize authenticated user ID
    if (request.user?.id) {
      return `user:${request.user.id}`;
    }

    // Fall back to IP address for anonymous requests
    const ip = request.ip ||
               request.headers['x-forwarded-for']?.split(',')[0] ||
               request.connection.remoteAddress ||
               'unknown';

    return `ip:${ip}`;
  }
}

/**
 * Decorator to set rate limit options
 *
 * @param ttl Time window in seconds
 * @param limit Maximum requests in time window
 */
export const RateLimit = (ttl: number, limit: number) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(RATE_LIMIT_KEY, { ttl, limit }, descriptor.value);
    return descriptor;
  };
};
