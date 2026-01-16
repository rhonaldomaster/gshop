/**
 * Rate Limiting Configuration
 *
 * Centralized configuration for API rate limiting across all endpoints.
 * Uses @nestjs/throttler for implementation.
 */

export interface RateLimitTier {
  ttl: number; // Time window in milliseconds
  limit: number; // Max requests in time window
}

export interface RateLimitConfig {
  global: RateLimitTier;
  endpoints: {
    auth: {
      login: RateLimitTier;
      register: RateLimitTier;
      forgotPassword: RateLimitTier;
    };
    api: {
      read: RateLimitTier;
      write: RateLimitTier;
      upload: RateLimitTier;
    };
    payments: {
      create: RateLimitTier;
      webhook: RateLimitTier;
    };
    search: {
      default: RateLimitTier;
    };
    live: {
      createStream: RateLimitTier;
    };
    reviews: {
      create: RateLimitTier;
    };
  };
  whitelist: {
    ips: string[];
    apiKeys: string[];
  };
}

export const rateLimitConfig: RateLimitConfig = {
  // Global default limits (100 requests per minute)
  global: {
    ttl: 60000,
    limit: 100,
  },

  // Endpoint-specific limits
  endpoints: {
    // Authentication - strict limits to prevent brute force
    auth: {
      login: { ttl: 60000, limit: 5 }, // 5 attempts per minute
      register: { ttl: 3600000, limit: 3 }, // 3 registrations per hour
      forgotPassword: { ttl: 3600000, limit: 3 }, // 3 requests per hour
    },

    // General API operations
    api: {
      read: { ttl: 60000, limit: 100 }, // 100 reads per minute
      write: { ttl: 60000, limit: 30 }, // 30 writes per minute
      upload: { ttl: 60000, limit: 10 }, // 10 uploads per minute
    },

    // Payment operations - moderate limits for security
    payments: {
      create: { ttl: 60000, limit: 5 }, // 5 payment attempts per minute
      webhook: { ttl: 1000, limit: 100 }, // Webhooks need higher limits
    },

    // Search operations - prevent abuse
    search: {
      default: { ttl: 60000, limit: 30 }, // 30 searches per minute
    },

    // Live streaming - limited resource
    live: {
      createStream: { ttl: 3600000, limit: 5 }, // 5 streams per hour
    },

    // Reviews - prevent spam
    reviews: {
      create: { ttl: 60000, limit: 5 }, // 5 reviews per minute
    },
  },

  // Whitelist for internal services and trusted IPs
  whitelist: {
    ips: [
      '127.0.0.1',
      '::1', // IPv6 localhost
    ],
    apiKeys: [], // Internal API keys that bypass rate limiting
  },
};

/**
 * Helper to get config from environment variables with fallback
 */
export const getRateLimitFromEnv = (
  key: string,
  defaultValue: number,
): number => {
  const envValue = process.env[key];
  if (envValue) {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  return defaultValue;
};

/**
 * Environment-aware rate limit config
 * Allows overriding via environment variables
 */
export const getEnvAwareRateLimitConfig = (): RateLimitConfig => {
  return {
    ...rateLimitConfig,
    global: {
      ttl: getRateLimitFromEnv('RATE_LIMIT_TTL', rateLimitConfig.global.ttl),
      limit: getRateLimitFromEnv(
        'RATE_LIMIT_DEFAULT',
        rateLimitConfig.global.limit,
      ),
    },
    endpoints: {
      ...rateLimitConfig.endpoints,
      auth: {
        ...rateLimitConfig.endpoints.auth,
        login: {
          ...rateLimitConfig.endpoints.auth.login,
          limit: getRateLimitFromEnv(
            'RATE_LIMIT_AUTH',
            rateLimitConfig.endpoints.auth.login.limit,
          ),
        },
      },
      api: {
        ...rateLimitConfig.endpoints.api,
        upload: {
          ...rateLimitConfig.endpoints.api.upload,
          limit: getRateLimitFromEnv(
            'RATE_LIMIT_UPLOADS',
            rateLimitConfig.endpoints.api.upload.limit,
          ),
        },
      },
    },
    whitelist: {
      ips: [
        ...rateLimitConfig.whitelist.ips,
        ...(process.env.RATE_LIMIT_WHITELIST_IPS?.split(',') || []),
      ],
      apiKeys: [
        ...rateLimitConfig.whitelist.apiKeys,
        ...(process.env.RATE_LIMIT_WHITELIST_KEYS?.split(',') || []),
      ],
    },
  };
};
