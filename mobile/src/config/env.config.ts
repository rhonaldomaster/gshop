/**
 * Environment Configuration
 *
 * Centralized environment variable management for the mobile app.
 * Uses expo-constants to access environment variables at runtime.
 */

import Constants from 'expo-constants';

/**
 * Environment type definition
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * Environment configuration interface
 */
interface EnvConfig {
  // Environment
  ENV: Environment;
  IS_DEV: boolean;
  IS_PROD: boolean;

  // API Configuration
  API_BASE_URL: string;
  API_VERSION: string;
  WEBSOCKET_URL: string;

  // Analytics & Tracking
  GSHOP_PIXEL_ID: string;
  ANALYTICS_ENABLED: boolean;

  // Payment Gateways
  MERCAPAGO_PUBLIC_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;

  // Blockchain
  POLYGON_RPC_URL: string;
  USDC_CONTRACT_ADDRESS: string;

  // Deep Linking
  APP_SCHEME: string;
  DEEP_LINK_BASE_URL: string;

  // Push Notifications
  EXPO_PROJECT_ID: string;
  FCM_SENDER_ID: string;

  // Feature Flags
  ENABLE_LIVE_SHOPPING: boolean;
  ENABLE_CRYPTO_PAYMENTS: boolean;
  ENABLE_AFFILIATE_MODE: boolean;
  ENABLE_OFFLINE_MODE: boolean;

  // Debug & Testing
  DEBUG_MODE: boolean;
  ENABLE_DEV_MENU: boolean;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Get environment variable with fallback
 */
const getEnvVar = (key: string, fallback: string = ''): string => {
  const extra = Constants.expoConfig?.extra;
  return extra?.[key] || process.env[key] || fallback;
};

/**
 * Get boolean environment variable
 */
const getBoolEnvVar = (key: string, fallback: boolean = false): boolean => {
  const value = getEnvVar(key);
  if (!value) return fallback;
  return value === 'true' || value === '1';
};

/**
 * Detect current environment
 */
const detectEnvironment = (): Environment => {
  const env = getEnvVar('ENV', 'development');

  if (env === 'production') return 'production';
  if (env === 'staging') return 'staging';
  return 'development';
};

/**
 * Environment configuration object
 */
export const ENV: EnvConfig = {
  // Environment
  ENV: detectEnvironment(),
  IS_DEV: __DEV__,
  IS_PROD: detectEnvironment() === 'production',

  // API Configuration
  API_BASE_URL: getEnvVar('API_BASE_URL', 'https://c54f-2800-484-1785-2b00-2540-40c4-c0c2-2f99.ngrok-free.app'),
  API_VERSION: getEnvVar('API_VERSION', '/api/v1'),
  WEBSOCKET_URL: getEnvVar('WEBSOCKET_URL', 'https://c54f-2800-484-1785-2b00-2540-40c4-c0c2-2f99.ngrok-free.app'),

  // Analytics & Tracking
  GSHOP_PIXEL_ID: getEnvVar('GSHOP_PIXEL_ID', __DEV__ ? 'dev-pixel-123' : ''),
  ANALYTICS_ENABLED: getBoolEnvVar('ANALYTICS_ENABLED', true),

  // Payment Gateways
  MERCAPAGO_PUBLIC_KEY: getEnvVar('MERCAPAGO_PUBLIC_KEY', ''),
  STRIPE_PUBLISHABLE_KEY: getEnvVar('STRIPE_PUBLISHABLE_KEY', ''),

  // Blockchain
  POLYGON_RPC_URL: getEnvVar('POLYGON_RPC_URL', 'https://polygon-rpc.com'),
  USDC_CONTRACT_ADDRESS: getEnvVar('USDC_CONTRACT_ADDRESS', '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'),

  // Deep Linking
  APP_SCHEME: getEnvVar('APP_SCHEME', 'gshop'),
  DEEP_LINK_BASE_URL: getEnvVar('DEEP_LINK_BASE_URL', 'https://gshop.com'),

  // Push Notifications
  EXPO_PROJECT_ID: getEnvVar('EXPO_PROJECT_ID', ''),
  FCM_SENDER_ID: getEnvVar('FCM_SENDER_ID', ''),

  // Feature Flags
  ENABLE_LIVE_SHOPPING: getBoolEnvVar('ENABLE_LIVE_SHOPPING', true),
  ENABLE_CRYPTO_PAYMENTS: getBoolEnvVar('ENABLE_CRYPTO_PAYMENTS', true),
  ENABLE_AFFILIATE_MODE: getBoolEnvVar('ENABLE_AFFILIATE_MODE', true),
  ENABLE_OFFLINE_MODE: getBoolEnvVar('ENABLE_OFFLINE_MODE', true),

  // Debug & Testing
  DEBUG_MODE: getBoolEnvVar('DEBUG_MODE', __DEV__),
  ENABLE_DEV_MENU: getBoolEnvVar('ENABLE_DEV_MENU', __DEV__),
  LOG_LEVEL: (getEnvVar('LOG_LEVEL', __DEV__ ? 'debug' : 'error') as EnvConfig['LOG_LEVEL']),
};

/**
 * Validate required environment variables
 */
export const validateEnv = (): { valid: boolean; missing: string[] } => {
  const requiredVars = [
    'API_BASE_URL',
    'GSHOP_PIXEL_ID',
  ];

  // Additional production requirements
  if (ENV.IS_PROD) {
    requiredVars.push(
      'MERCAPAGO_PUBLIC_KEY',
      'STRIPE_PUBLISHABLE_KEY',
      'EXPO_PROJECT_ID',
    );
  }

  const missing = requiredVars.filter(key => {
    const value = ENV[key as keyof EnvConfig];
    return !value || value === '';
  });

  return {
    valid: missing.length === 0,
    missing,
  };
};

/**
 * Log environment configuration (safe for production)
 */
export const logEnvConfig = () => {
  if (!ENV.DEBUG_MODE) return;

  console.log('🌍 Environment Configuration:');
  console.log('  Environment:', ENV.ENV);
  console.log('  API Base URL:', ENV.API_BASE_URL);
  console.log('  WebSocket URL:', ENV.WEBSOCKET_URL);
  console.log('  Analytics Enabled:', ENV.ANALYTICS_ENABLED);
  console.log('  Live Shopping:', ENV.ENABLE_LIVE_SHOPPING);
  console.log('  Crypto Payments:', ENV.ENABLE_CRYPTO_PAYMENTS);
  console.log('  Offline Mode:', ENV.ENABLE_OFFLINE_MODE);
  console.log('  Debug Mode:', ENV.DEBUG_MODE);

  // Validate environment
  const validation = validateEnv();
  if (!validation.valid) {
    console.warn('⚠️ Missing required environment variables:', validation.missing);
  }
};

// Export for convenience
export default ENV;