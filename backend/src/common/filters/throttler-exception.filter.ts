import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response, Request } from 'express';
import { AuditLogService } from '../services/audit-log.service';
import { AuditAction } from '../../database/entities/audit-log.entity';

interface RateLimitErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  retryAfter: number;
  limit: number;
  remaining: number;
  resetAt: string;
}

/**
 * Exception filter for rate limit (throttler) exceptions
 *
 * Provides:
 * - Standardized error response with retry information
 * - Audit logging for security monitoring
 * - Rate limit headers in response
 */
@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ThrottlerExceptionFilter.name);

  constructor(
    @Optional()
    @Inject(AuditLogService)
    private readonly auditLogService?: AuditLogService,
  ) {}

  async catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const retryAfter = this.extractRetryAfter(exception.message);
    const resetAt = new Date(Date.now() + retryAfter * 1000);

    const clientIp = this.getClientIp(request);
    const userId = (request as any).user?.id;
    const endpoint = `${request.method} ${request.url}`;

    this.logger.warn(
      `[RATE_LIMIT] ${userId ? `User:${userId}` : `IP:${clientIp}`} ` +
        `exceeded limit on ${endpoint}`,
    );

    if (this.auditLogService) {
      try {
        await this.auditLogService.log({
          entity: 'rate_limit',
          action: AuditAction.RATE_LIMIT_EXCEEDED,
          performedBy: userId,
          ipAddress: clientIp,
          userAgent: request.headers['user-agent'],
          metadata: {
            endpoint,
            method: request.method,
            path: request.path,
            retryAfter,
            resetAt: resetAt.toISOString(),
          },
        });
      } catch (error) {
        this.logger.error(`Failed to log rate limit event: ${error.message}`);
      }
    }

    const errorResponse: RateLimitErrorResponse = {
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      message:
        'Has excedido el limite de solicitudes. Intenta de nuevo mas tarde.',
      error: 'Too Many Requests',
      retryAfter,
      limit: 0,
      remaining: 0,
      resetAt: resetAt.toISOString(),
    };

    response
      .status(HttpStatus.TOO_MANY_REQUESTS)
      .header('Retry-After', retryAfter.toString())
      .header('X-RateLimit-Remaining', '0')
      .header('X-RateLimit-Reset', resetAt.toISOString())
      .json(errorResponse);
  }

  private extractRetryAfter(message: string): number {
    const match = message.match(/(\d+)\s*segundos?/i);
    if (match) {
      return parseInt(match[1], 10);
    }

    const secondsMatch = message.match(/(\d+)\s*seconds?/i);
    if (secondsMatch) {
      return parseInt(secondsMatch[1], 10);
    }

    return 60;
  }

  private getClientIp(request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor.split(',')[0];
      return ips.trim();
    }

    if (request.headers['x-real-ip']) {
      return request.headers['x-real-ip'] as string;
    }

    return request.ip || request.socket?.remoteAddress || 'unknown';
  }
}
