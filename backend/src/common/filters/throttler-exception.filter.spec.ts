import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { ThrottlerExceptionFilter } from './throttler-exception.filter';
import { AuditLogService } from '../services/audit-log.service';

describe('ThrottlerExceptionFilter', () => {
  let filter: ThrottlerExceptionFilter;
  let mockAuditLogService: Partial<AuditLogService>;

  const createMockArgumentsHost = (
    overrides: Partial<{
      method: string;
      url: string;
      path: string;
      ip: string;
      headers: Record<string, string>;
      user: { id: string } | null;
    }> = {},
  ): ArgumentsHost => {
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      header: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    const mockRequest = {
      method: 'POST',
      url: '/api/v1/auth/login',
      path: '/api/v1/auth/login',
      ip: '192.168.1.100',
      headers: {
        'user-agent': 'Mozilla/5.0 Test Browser',
      },
      user: null,
      socket: { remoteAddress: '192.168.1.100' },
      ...overrides,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
      getArgs: () => [],
      getArgByIndex: () => null,
      switchToRpc: () => null as any,
      switchToWs: () => null as any,
      getType: () => 'http',
    } as unknown as ArgumentsHost;
  };

  beforeEach(() => {
    mockAuditLogService = {
      log: jest.fn().mockResolvedValue({}),
    };

    filter = new ThrottlerExceptionFilter(
      mockAuditLogService as AuditLogService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('catch', () => {
    it('should return 429 status code', async () => {
      const exception = new ThrottlerException(
        'Has excedido el limite. Intenta de nuevo en 30 segundos.',
      );
      const host = createMockArgumentsHost();
      const mockResponse = host.switchToHttp().getResponse();

      await filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.TOO_MANY_REQUESTS,
      );
    });

    it('should include Retry-After header', async () => {
      const exception = new ThrottlerException(
        'Has excedido el limite. Intenta de nuevo en 45 segundos.',
      );
      const host = createMockArgumentsHost();
      const mockResponse = host.switchToHttp().getResponse();

      await filter.catch(exception, host);

      expect(mockResponse.header).toHaveBeenCalledWith('Retry-After', '45');
    });

    it('should include X-RateLimit-Remaining header', async () => {
      const exception = new ThrottlerException('Rate limit exceeded');
      const host = createMockArgumentsHost();
      const mockResponse = host.switchToHttp().getResponse();

      await filter.catch(exception, host);

      expect(mockResponse.header).toHaveBeenCalledWith(
        'X-RateLimit-Remaining',
        '0',
      );
    });

    it('should return standardized error response', async () => {
      const exception = new ThrottlerException(
        'Intenta de nuevo en 30 segundos.',
      );
      const host = createMockArgumentsHost();
      const mockResponse = host.switchToHttp().getResponse();

      await filter.catch(exception, host);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 429,
          message: expect.any(String),
          error: 'Too Many Requests',
          retryAfter: expect.any(Number),
          limit: 0,
          remaining: 0,
          resetAt: expect.any(String),
        }),
      );
    });

    it('should log rate limit violation to audit log', async () => {
      const exception = new ThrottlerException('Rate limit exceeded');
      const host = createMockArgumentsHost({
        method: 'POST',
        url: '/api/v1/auth/login',
        ip: '192.168.1.100',
      });

      await filter.catch(exception, host);

      expect(mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: 'rate_limit',
          action: 'rate_limit_exceeded',
          ipAddress: '192.168.1.100',
          metadata: expect.objectContaining({
            endpoint: 'POST /api/v1/auth/login',
            method: 'POST',
          }),
        }),
      );
    });

    it('should include user ID in audit log when authenticated', async () => {
      const exception = new ThrottlerException('Rate limit exceeded');
      const host = createMockArgumentsHost({
        user: { id: 'user-123' },
      });

      await filter.catch(exception, host);

      expect(mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          performedBy: 'user-123',
        }),
      );
    });

    it('should handle missing audit log service gracefully', async () => {
      const filterWithoutAudit = new ThrottlerExceptionFilter();
      const exception = new ThrottlerException('Rate limit exceeded');
      const host = createMockArgumentsHost();

      await expect(
        filterWithoutAudit.catch(exception, host),
      ).resolves.not.toThrow();
    });

    it('should handle audit log errors gracefully', async () => {
      mockAuditLogService.log = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      const exception = new ThrottlerException('Rate limit exceeded');
      const host = createMockArgumentsHost();

      await expect(filter.catch(exception, host)).resolves.not.toThrow();
    });
  });

  describe('extractRetryAfter', () => {
    it('should extract seconds from Spanish message', () => {
      const result = (filter as any).extractRetryAfter(
        'Intenta de nuevo en 45 segundos.',
      );
      expect(result).toBe(45);
    });

    it('should extract seconds from English message', () => {
      const result = (filter as any).extractRetryAfter(
        'Try again in 30 seconds.',
      );
      expect(result).toBe(30);
    });

    it('should default to 60 when no number found', () => {
      const result = (filter as any).extractRetryAfter(
        'Rate limit exceeded. Please try again later.',
      );
      expect(result).toBe(60);
    });
  });

  describe('getClientIp', () => {
    it('should extract IP from X-Forwarded-For header', () => {
      const mockRequest = {
        headers: {
          'x-forwarded-for': '203.0.113.50, 70.41.3.18',
        },
        ip: '127.0.0.1',
      };

      const ip = (filter as any).getClientIp(mockRequest);

      expect(ip).toBe('203.0.113.50');
    });

    it('should use X-Real-IP as fallback', () => {
      const mockRequest = {
        headers: {
          'x-real-ip': '203.0.113.100',
        },
        ip: '127.0.0.1',
      };

      const ip = (filter as any).getClientIp(mockRequest);

      expect(ip).toBe('203.0.113.100');
    });

    it('should fall back to request.ip', () => {
      const mockRequest = {
        headers: {},
        ip: '192.168.1.50',
      };

      const ip = (filter as any).getClientIp(mockRequest);

      expect(ip).toBe('192.168.1.50');
    });
  });
});
