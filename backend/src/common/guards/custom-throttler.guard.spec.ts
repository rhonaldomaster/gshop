import { CustomThrottlerGuard } from './custom-throttler.guard';

describe('CustomThrottlerGuard', () => {
  let guard: CustomThrottlerGuard;

  beforeEach(() => {
    guard = Object.create(CustomThrottlerGuard.prototype);
  });

  describe('getTracker', () => {
    it('should return user ID when authenticated', async () => {
      const mockRequest = {
        user: { id: 'user-123' },
        ip: '192.168.1.1',
        headers: {},
      };

      const tracker = await (guard as any).getTracker(mockRequest);

      expect(tracker).toBe('user:user-123');
    });

    it('should return IP when not authenticated', async () => {
      const mockRequest = {
        user: null,
        ip: '192.168.1.1',
        headers: {},
        connection: { remoteAddress: '192.168.1.1' },
      };

      const tracker = await (guard as any).getTracker(mockRequest);

      expect(tracker).toBe('ip:192.168.1.1');
    });

    it('should use X-Forwarded-For header when present', async () => {
      const mockRequest = {
        user: null,
        ip: '127.0.0.1',
        headers: {
          'x-forwarded-for': '203.0.113.50, 70.41.3.18, 150.172.238.178',
        },
      };

      const tracker = await (guard as any).getTracker(mockRequest);

      expect(tracker).toBe('ip:203.0.113.50');
    });

    it('should use X-Real-IP header as fallback', async () => {
      const mockRequest = {
        user: null,
        ip: '127.0.0.1',
        headers: {
          'x-real-ip': '203.0.113.100',
        },
      };

      const tracker = await (guard as any).getTracker(mockRequest);

      expect(tracker).toBe('ip:203.0.113.100');
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

      const ip = (guard as any).getClientIp(mockRequest);

      expect(ip).toBe('203.0.113.50');
    });

    it('should extract IP from X-Real-IP header', () => {
      const mockRequest = {
        headers: {
          'x-real-ip': '203.0.113.100',
        },
        ip: '127.0.0.1',
      };

      const ip = (guard as any).getClientIp(mockRequest);

      expect(ip).toBe('203.0.113.100');
    });

    it('should fall back to request.ip', () => {
      const mockRequest = {
        headers: {},
        ip: '192.168.1.50',
      };

      const ip = (guard as any).getClientIp(mockRequest);

      expect(ip).toBe('192.168.1.50');
    });

    it('should fall back to connection.remoteAddress', () => {
      const mockRequest = {
        headers: {},
        ip: undefined,
        connection: { remoteAddress: '10.0.0.1' },
      };

      const ip = (guard as any).getClientIp(mockRequest);

      expect(ip).toBe('10.0.0.1');
    });

    it('should fall back to socket.remoteAddress', () => {
      const mockRequest = {
        headers: {},
        ip: undefined,
        connection: undefined,
        socket: { remoteAddress: '10.0.0.2' },
      };

      const ip = (guard as any).getClientIp(mockRequest);

      expect(ip).toBe('10.0.0.2');
    });

    it('should return unknown when no IP available', () => {
      const mockRequest = {
        headers: {},
        ip: undefined,
        connection: undefined,
        socket: undefined,
      };

      const ip = (guard as any).getClientIp(mockRequest);

      expect(ip).toBe('unknown');
    });
  });
});
