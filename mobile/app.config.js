import 'dotenv/config';

export default ({ config }) => {
  // Determine environment
  const environment = process.env.ENV || 'development';
  const isDev = environment === 'development';

  return {
    ...config,
    name: isDev ? 'GSHOP Dev' : 'GSHOP',
    slug: 'gshop',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    scheme: process.env.APP_SCHEME || 'gshop',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['assets/**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: isDev ? 'com.gshop.app.dev' : 'com.gshop.app',
      buildNumber: '1',
      associatedDomains: [`applinks:${process.env.DEEP_LINK_BASE_URL || 'gshop.com'}`],
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: isDev ? 'com.gshop.app.dev' : 'com.gshop.app',
      versionCode: 1,
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: process.env.DEEP_LINK_BASE_URL?.replace('https://', '') || 'gshop.com',
              pathPrefix: '/',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      [
        'expo-build-properties',
        {
          android: {
            enableProguardInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
          },
          ios: {
            deploymentTarget: '15.1',
          },
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#6366f1',
          sounds: ['./assets/notification-sound.wav'],
          mode: 'production',
        },
      ],
    ],
    jsEngine: 'hermes',
    experiments: {
      tsconfigPaths: true,
    },
    extra: {
      eas: {
        projectId: process.env.EXPO_PROJECT_ID || '',
      },
      // Expose environment variables to the app
      ENV: process.env.ENV || 'development',
      API_BASE_URL: process.env.API_BASE_URL || 'http://192.168.20.85:3000',
      API_VERSION: process.env.API_VERSION || '/api/v1',
      WEBSOCKET_URL: process.env.WEBSOCKET_URL || 'http://192.168.20.85:3000',
      GSHOP_PIXEL_ID: process.env.GSHOP_PIXEL_ID || '',
      ANALYTICS_ENABLED: process.env.ANALYTICS_ENABLED === 'true',
      MERCAPAGO_PUBLIC_KEY: process.env.MERCAPAGO_PUBLIC_KEY || '',
      STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || '',
      POLYGON_RPC_URL: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
      USDC_CONTRACT_ADDRESS: process.env.USDC_CONTRACT_ADDRESS || '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
      EASYPOST_PUBLIC_KEY: process.env.EASYPOST_PUBLIC_KEY || '',
      APP_SCHEME: process.env.APP_SCHEME || 'gshop',
      DEEP_LINK_BASE_URL: process.env.DEEP_LINK_BASE_URL || 'https://gshop.com',
      FCM_SENDER_ID: process.env.FCM_SENDER_ID || '',
      ENABLE_LIVE_SHOPPING: process.env.ENABLE_LIVE_SHOPPING === 'true',
      ENABLE_CRYPTO_PAYMENTS: process.env.ENABLE_CRYPTO_PAYMENTS === 'true',
      ENABLE_AFFILIATE_MODE: process.env.ENABLE_AFFILIATE_MODE === 'true',
      ENABLE_OFFLINE_MODE: process.env.ENABLE_OFFLINE_MODE === 'true',
      DEBUG_MODE: process.env.DEBUG_MODE === 'true',
      ENABLE_DEV_MENU: process.env.ENABLE_DEV_MENU === 'true',
      LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
    },
  };
};