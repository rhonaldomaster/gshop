import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Sanitization Interceptor
 *
 * Automatically sanitizes all string inputs to prevent XSS and injection attacks
 * Applied globally or per-controller
 */
@Injectable()
export class SanitizeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (request.body) {
      request.body = this.sanitizeObject(request.body);
    }

    if (request.query) {
      request.query = this.sanitizeObject(request.query);
    }

    if (request.params) {
      request.params = this.sanitizeObject(request.params);
    }

    return next.handle().pipe(
      map(data => {
        // Optionally sanitize response data
        return data;
      }),
    );
  }

  /**
   * Recursively sanitize object properties
   */
  private sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = this.sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    return obj;
  }

  /**
   * Sanitize string values
   * - Remove HTML tags
   * - Escape special characters
   * - Prevent SQL injection patterns
   */
  private sanitizeString(value: string): string {
    if (!value || typeof value !== 'string') {
      return value;
    }

    // Remove HTML tags
    let sanitized = value.replace(/<[^>]*>/g, '');

    // Escape special HTML characters
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    // Detect and warn about potential SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
      /(;|\-\-|\/\*|\*\/|xp_|sp_)/gi,
      /(\bOR\b.*=.*|1=1|' OR ')/gi,
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(value)) {
        throw new BadRequestException('Invalid input detected. Potential security risk.');
      }
    }

    return sanitized;
  }
}

/**
 * Validation Pipe Options Extension
 *
 * Add to main.ts for global validation
 */
export const ValidationPipeOptions = {
  whitelist: true, // Strip properties that don't have decorators
  forbidNonWhitelisted: true, // Throw error if non-whitelisted properties exist
  transform: true, // Automatically transform payloads to DTO instances
  disableErrorMessages: process.env.NODE_ENV === 'production', // Hide detailed errors in production
  validationError: {
    target: false, // Don't expose the target object
    value: false, // Don't expose the value
  },
};
