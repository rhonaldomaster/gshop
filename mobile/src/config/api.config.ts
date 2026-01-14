import ENV from './env.config';

export const API_CONFIG = {
  // Base URLs - from environment configuration
  BASE_URL: ENV.API_BASE_URL,

  // API version
  API_VERSION: ENV.API_VERSION,

  // WebSocket URL
  WEBSOCKET_URL: ENV.WEBSOCKET_URL,

  // Timeout settings
  TIMEOUT: 30000, // 30 seconds

  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second

  // Storage keys
  STORAGE_KEYS: {
    AUTH_TOKEN: '@gshop:auth_token',
    USER_DATA: '@gshop:user_data',
    CART_DATA: '@gshop:cart_data',
    GUEST_DATA: '@gshop:guest_data',
  },

  // API Endpoints
  ENDPOINTS: {
    // Authentication
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
      PROFILE: '/auth/profile',
      SOCIAL: '/auth/social',
    },

    // Products
    PRODUCTS: {
      BASE: '/products',
      LIST: '/products',
      DETAIL: '/products/:id',
      SEARCH: '/products/search',
      CATEGORIES: '/products/categories',
      TRENDING: '/products/trending',
      BY_CATEGORY: '/products/category/:categoryId',
    },

    // Categories
    CATEGORIES: {
      LIST: '/categories',
      DETAIL: '/categories/:id',
      FLAT: '/categories/flat',
    },

    // Orders
    ORDERS: {
      LIST: '/orders/my-orders',
      CREATE: '/orders',
      DETAIL: '/orders/:id',
      GUEST: '/orders/guest',
      SHIPPING_OPTIONS: '/orders/:id/shipping-options',
      CONFIRM_SHIPPING: '/orders/:id/confirm-shipping',
      TRACKING: '/orders/:id/tracking',
    },

    // Cart (if needed for API sync)
    CART: {
      GET: '/cart',
      ADD: '/cart/add',
      UPDATE: '/cart/update',
      REMOVE: '/cart/remove',
      CLEAR: '/cart/clear',
    },

    // Payments
    PAYMENTS: {
      CREATE: '/payments-v2',
      PROCESS_STRIPE: '/payments-v2/:id/process/stripe',
      PROCESS_CRYPTO: '/payments-v2/:id/process/crypto',
      METHODS: '/payments-v2/methods',
    },

    // Live Streams
    LIVE: {
      ACTIVE: '/live/streams/active',
      DETAIL: '/live/streams/:id',
      MESSAGES: '/live/streams/:id/messages',
      JOIN: '/live/streams/:id/join',
    },

    // Marketplace
    MARKETPLACE: {
      SELLERS: '/marketplace/sellers',
      REVIEWS: '/marketplace/reviews',
    },

    // Recommendations
    RECOMMENDATIONS: {
      GENERATE: '/recommendations/generate',
      TRENDING: '/recommendations/trending',
      INTERACTIONS: '/recommendations/interactions',
    },
  },
} as const;

// Helper function to build full API URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}${endpoint}`;
};

// Helper function to replace path parameters
export const buildEndpointUrl = (endpoint: string, params: Record<string, string | number>): string => {
  let url = endpoint;

  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, String(value));
  });

  return buildApiUrl(url);
};

// Helper function to normalize image URLs
export const normalizeImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  // If URL starts with http://localhost or https://localhost, replace with API_BASE_URL
  if (url.startsWith('http://localhost') || url.startsWith('https://localhost')) {
    // Extract the path part (e.g., /uploads/products/image.jpg)
    const urlObj = new URL(url);
    const pathWithQuery = urlObj.pathname + urlObj.search + urlObj.hash;

    // Return API_BASE_URL + path
    return `${API_CONFIG.BASE_URL}${pathWithQuery}`;
  }

  // If URL is already absolute (starts with http:// or https://), return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // If URL is relative (starts with /), prepend API_BASE_URL
  if (url.startsWith('/')) {
    return `${API_CONFIG.BASE_URL}${url}`;
  }

  // Otherwise, return as-is
  return url;
};

// Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error types
export interface ApiError {
  message: string;
  statusCode: number;
  errors?: string[];
}