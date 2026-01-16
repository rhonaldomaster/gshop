import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { getEnvAwareRateLimitConfig } from '../config/rate-limit.config';

/**
 * Custom Throttler Guard
 *
 * Extends the default NestJS throttler guard with:
 * - IP/API key whitelist support
 * - Enhanced logging for monitoring
 * - Custom error messages
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(CustomThrottlerGuard.name);

  /**
   * Check if the request should skip throttling
   * Returns true if IP or API key is whitelisted
   */
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const config = getEnvAwareRateLimitConfig();

    // Get client IP
    const clientIp = this.getClientIp(request);

    // Check IP whitelist
    if (config.whitelist.ips.includes(clientIp)) {
      this.logger.debug(`Skipping rate limit for whitelisted IP: ${clientIp}`);
      return true;
    }

    // Check API key whitelist
    const apiKey =
      request.headers['x-api-key'] || request.headers['authorization'];
    if (apiKey && config.whitelist.apiKeys.includes(apiKey)) {
      this.logger.debug(`Skipping rate limit for whitelisted API key`);
      return true;
    }

    return false;
  }

  /**
   * Generate a unique tracking key for the request
   * Uses user ID if authenticated, otherwise IP address
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Prioritize authenticated user ID
    if (req.user?.id) {
      return `user:${req.user.id}`;
    }

    // Fall back to IP address
    return `ip:${this.getClientIp(req)}`;
  }

  /**
   * Handle rate limit exceeded
   * Logs the event and throws appropriate exception
   */
  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: {
      limit: number;
      ttl: number;
      key: string;
      tracker: string;
      totalHits: number;
      timeToExpire: number;
      isBlocked: boolean;
      timeToBlockExpire: number;
    },
  ): Promise<void> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const tracker = throttlerLimitDetail.tracker;

    this.logger.warn(
      `[RATE_LIMIT] ${tracker} exceeded limit on ${method} ${url} ` +
        `(hits: ${throttlerLimitDetail.totalHits}/${throttlerLimitDetail.limit}, ` +
        `reset in: ${throttlerLimitDetail.timeToExpire}ms)`,
    );

    throw new ThrottlerException(
      `Has excedido el limite de solicitudes. Intenta de nuevo en ${Math.ceil(throttlerLimitDetail.timeToExpire / 1000)} segundos.`,
    );
  }

  /**
   * Extract client IP from request
   * Handles proxies and load balancers
   */
  private getClientIp(request: any): string {
    // Check X-Forwarded-For header (from proxies/load balancers)
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      // Take the first IP in the chain (original client)
      return forwardedFor.split(',')[0].trim();
    }

    // Check X-Real-IP header
    if (request.headers['x-real-ip']) {
      return request.headers['x-real-ip'];
    }

    // Fall back to direct connection IP
    return (
      request.ip || request.connection?.remoteAddress || request.socket?.remoteAddress || 'unknown'
    );
  }
}
