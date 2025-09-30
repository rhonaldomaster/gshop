# 🌍 Environment Configuration Guide

This guide explains how to configure environment variables for the GSHOP mobile app.

## 📋 Quick Start

### 1. Copy Environment Files
```bash
# From mobile directory
cd mobile

# Copy .env.development for local development
cp .env.development .env
```

### 2. Install Dependencies
```bash
npm install dotenv expo-constants
```

### 3. Update Configuration
Edit `.env` file with your actual values:
```bash
API_BASE_URL=http://YOUR_LOCAL_IP:3000
GSHOP_PIXEL_ID=your-actual-pixel-id
# ... other variables
```

### 4. Start Development Server
```bash
npm start
# or
npx expo start
```

## 🔑 Environment Files

### `.env.example`
Template file with all available environment variables. Use this as reference.

### `.env.development`
Development environment configuration. Used when `ENV=development`.
- Local API endpoints
- Test payment keys
- Debug mode enabled
- Development pixel ID

### `.env.production`
Production environment configuration. Used when `ENV=production`.
- Production API endpoints
- Live payment keys
- Debug mode disabled
- Production pixel ID

### `.env` (local - not committed)
Your personal local configuration. Copy from `.env.development` and customize.
**This file is ignored by git.**

## 🔐 Required Environment Variables

### Minimum Required (Development)
```bash
API_BASE_URL=http://192.168.20.85:3000
ENV=development
```

### Required for Production
```bash
API_BASE_URL=https://api.gshop.com
ENV=production
GSHOP_PIXEL_ID=your-production-pixel-id
MERCAPAGO_PUBLIC_KEY=APP_USR-xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
EXPO_PROJECT_ID=your-expo-project-id
```

## 📱 Accessing Environment Variables

### In TypeScript/JavaScript
```typescript
import ENV from '@/config/env.config';

// Use environment variables
console.log(ENV.API_BASE_URL);
console.log(ENV.IS_DEV);
console.log(ENV.ENABLE_LIVE_SHOPPING);

// Check if required vars are set
import { validateEnv, logEnvConfig } from '@/config/env.config';

const validation = validateEnv();
if (!validation.valid) {
  console.error('Missing required environment variables:', validation.missing);
}

// Log configuration (only in debug mode)
logEnvConfig();
```

### Environment Detection
```typescript
import ENV from '@/config/env.config';

if (ENV.IS_DEV) {
  console.log('Running in development mode');
}

if (ENV.IS_PROD) {
  console.log('Running in production mode');
}

// Environment-specific logic
if (ENV.DEBUG_MODE) {
  // Show debug information
}
```

## 🚀 Building for Different Environments

### Development Build
```bash
# Uses .env.development
ENV=development npx expo start
```

### Production Build
```bash
# Uses .env.production
ENV=production eas build --platform all
```

### Custom Environment
```bash
# Use custom .env file
cp .env.staging .env
npx expo start
```

## 🎯 Feature Flags

Control feature availability with environment variables:

```bash
ENABLE_LIVE_SHOPPING=true      # Enable/disable live shopping
ENABLE_CRYPTO_PAYMENTS=true    # Enable/disable crypto payments
ENABLE_AFFILIATE_MODE=true     # Enable/disable affiliate features
ENABLE_OFFLINE_MODE=true       # Enable/disable offline support
```

Usage in code:
```typescript
import ENV from '@/config/env.config';

// Conditional rendering
{ENV.ENABLE_LIVE_SHOPPING && (
  <LiveShoppingButton />
)}

// Conditional logic
if (ENV.ENABLE_CRYPTO_PAYMENTS) {
  // Show crypto payment option
}
```

## 🔍 Environment Variable Categories

### API Configuration
- `API_BASE_URL` - Backend API base URL
- `API_VERSION` - API version path (e.g., /api/v1)
- `WEBSOCKET_URL` - WebSocket server URL

### Analytics & Tracking
- `GSHOP_PIXEL_ID` - GSHOP Pixel tracking ID
- `ANALYTICS_ENABLED` - Enable/disable analytics

### Payment Gateways
- `MERCAPAGO_PUBLIC_KEY` - MercadoPago public/test key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

### Blockchain
- `POLYGON_RPC_URL` - Polygon RPC endpoint
- `USDC_CONTRACT_ADDRESS` - USDC token contract address

### Shipping
- `EASYPOST_PUBLIC_KEY` - EasyPost API key

### Deep Linking
- `APP_SCHEME` - URL scheme (e.g., gshop://)
- `DEEP_LINK_BASE_URL` - Deep link base URL

### Push Notifications
- `EXPO_PROJECT_ID` - Expo project ID
- `FCM_SENDER_ID` - Firebase Cloud Messaging sender ID

### Debug & Testing
- `DEBUG_MODE` - Enable debug logs and dev tools
- `ENABLE_DEV_MENU` - Show development menu
- `LOG_LEVEL` - Logging level (debug, info, warn, error)

## 🔧 Troubleshooting

### Environment Variables Not Loading
1. Restart Expo dev server
2. Clear metro bundler cache:
   ```bash
   npx expo start -c
   ```
3. Verify `.env` file exists and has correct format
4. Check `app.config.js` is properly configured

### Invalid Environment Values
```typescript
import { validateEnv } from '@/config/env.config';

const validation = validateEnv();
console.log('Valid:', validation.valid);
console.log('Missing:', validation.missing);
```

### Wrong Environment Detected
Check the `ENV` variable in your `.env` file:
```bash
# Should be one of: development, staging, production
ENV=development
```

## 🔒 Security Best Practices

### ✅ DO:
- Keep `.env` files out of version control
- Use different keys for dev and production
- Validate required variables on app start
- Use feature flags for gradual rollouts

### ❌ DON'T:
- Commit `.env` files with real secrets
- Share production keys in team chat
- Hardcode API keys in source code
- Use production keys in development

## 📚 Additional Resources

- [Expo Constants Documentation](https://docs.expo.dev/versions/latest/sdk/constants/)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [EAS Build Configuration](https://docs.expo.dev/build/eas-json/)

## 🆘 Need Help?

If you encounter issues:
1. Check this documentation
2. Verify your `.env` file syntax
3. Run `npx expo start -c` to clear cache
4. Check console logs for validation errors
5. Contact the development team

---

**Last Updated:** 2025-09-30
**Maintained by:** GSHOP Development Team