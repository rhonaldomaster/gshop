import { applyDecorators } from '@nestjs/common';
import { ApiResponse, ApiHeader } from '@nestjs/swagger';

/**
 * Swagger decorator to document rate limiting on an endpoint
 * @param limit - The rate limit (e.g., "5 requests/minute")
 */
export function ApiRateLimit(limit: string) {
  return applyDecorators(
    ApiResponse({
      status: 429,
      description: `Rate limit exceeded. Limit: ${limit}`,
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 429 },
          message: {
            type: 'string',
            example: 'Has excedido el limite de solicitudes. Intenta de nuevo mas tarde.',
          },
          error: { type: 'string', example: 'Too Many Requests' },
          retryAfter: {
            type: 'number',
            example: 45,
            description: 'Seconds until rate limit resets',
          },
          limit: { type: 'number', example: 5 },
          remaining: { type: 'number', example: 0 },
          resetAt: {
            type: 'string',
            example: '2026-01-15T10:30:00.000Z',
            description: 'ISO timestamp when limit resets',
          },
        },
      },
    }),
    ApiHeader({
      name: 'X-RateLimit-Limit',
      description: 'Maximum requests allowed in the time window',
      required: false,
    }),
    ApiHeader({
      name: 'X-RateLimit-Remaining',
      description: 'Requests remaining in current window',
      required: false,
    }),
    ApiHeader({
      name: 'X-RateLimit-Reset',
      description: 'Unix timestamp when the limit resets',
      required: false,
    }),
  );
}
