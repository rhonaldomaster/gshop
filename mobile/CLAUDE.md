# CLAUDE.md - GSHOP Mobile App

> **Related Repositories**
> - **Backend API**: gshop-backend
> - **Admin Panel**: gshop-admin
> - **Seller Panel**: gshop-seller
> - **Documentation**: gshop-docs

## Project Overview

GSHOP Mobile - React Native mobile app built with Expo. TikTok Shop clone with live shopping, affiliate tools, and complete e-commerce experience.

**Tech Stack**:
- **Framework**: React Native with Expo SDK 51
- **Navigation**: React Navigation v7
- **State Management**: React Context API + AsyncStorage
- **UI**: Custom components with React Native Reanimated
- **Video**: Expo AV for live streaming
- **Real-time**: Socket.IO client for live chat
- **Performance**: Hermes engine, image caching, lazy loading

## Development Commands

```bash
# Development
npm start                # Start Expo development server
npm run android          # Start Android emulator
npm run ios              # Start iOS simulator
npm run web              # Start web version

# Clear cache (if needed)
npm start -- --clear

# Production builds
eas build --platform android
eas build --platform ios
```

## Environment Variables

Create `.env` file:
```bash
# API
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1

# Payment
EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY=your-mercadopago-public-key

# Streaming
EXPO_PUBLIC_WEBSOCKET_URL=http://localhost:3000
EXPO_PUBLIC_HLS_SERVER_URL=http://localhost:8080/hls

# Optional: Analytics
EXPO_PUBLIC_ANALYTICS_ID=your-analytics-id
```

## App Structure

```
src/
├── components/
│   ├── ui/              # UI components (CachedImage, Skeleton, LoadingState)
│   ├── product/         # Product cards, lists
│   ├── checkout/        # Payment, shipping components
│   └── ErrorBoundary.tsx
├── screens/
│   ├── auth/            # Login, Register, Profile
│   ├── home/            # Home feed
│   ├── products/        # Product catalog, details
│   ├── cart/            # Shopping cart
│   ├── checkout/        # Checkout flow, guest checkout
│   ├── orders/          # Order history, tracking
│   ├── live/            # Live shopping streams
│   ├── affiliate/       # Affiliate dashboard
│   └── wallet/          # GSHOP token wallet (disabled)
├── navigation/
│   └── AppNavigator.tsx # Main navigation
├── contexts/
│   ├── AuthContext.tsx  # User authentication
│   ├── CartContext.tsx  # Shopping cart state
│   └── ProductContext.tsx
├── services/
│   ├── api.ts           # Axios API client
│   ├── auth.ts          # Auth service
│   ├── products.ts      # Product service
│   ├── orders.ts        # Order service
│   └── socket.ts        # Socket.IO setup
├── hooks/
│   ├── useApi.ts        # API hook
│   ├── useCart.ts       # Cart hook
│   ├── useImagePreloader.ts
│   ├── useScreenFocus.ts
│   └── useOfflineSync.ts
├── utils/
│   ├── storage.ts       # AsyncStorage wrapper
│   ├── offlineStorage.ts # Offline sync
│   ├── errorHandler.ts  # Error utilities
│   ├── performanceMonitor.ts
│   └── navigationOptimization.ts
└── __tests__/           # Unit & integration tests
```

## Key Features

### ✅ Completed (Phase 1-6)

#### Phase 1: Foundation
- API services layer with Axios
- State management (Cart, Products, Auth)
- Custom hooks (useApi, useCart, useProducts)

#### Phase 2: Core Shopping
- Product catalog with search and filters
- Shopping cart with persistence
- User profile and order management

#### Phase 3: Payment & Logistics
- MercadoPago integration
- Crypto payments (USDC) - UI ready
- ~~GSHOP token wallet~~ (temporarily disabled)
- Shipping options with dynamic rates
- Real-time order tracking
- Guest checkout with document validation

#### Phase 4: Live Shopping & Social
- Live streaming with WebSocket chat
- Wishlist and reviews system
- Social sharing features
- Follow system for sellers/affiliates

#### Phase 5: Advanced Features
- AI-powered recommendations
- Trending products discovery
- Affiliate dashboard and tools
- Commission tracking
- Link generation

#### Phase 6: Polish & Optimization
- **Performance**:
  - Image caching with filesystem persistence
  - Lazy loading components
  - Navigation optimization
  - Screen focus management
  - Performance monitoring
- **Loading States**:
  - Skeleton screens (Product, List, Profile, Grid)
  - Loading indicators (Full screen, Inline, Button)
  - Empty states with CTAs
- **Offline Support**:
  - Offline storage with expiration
  - Action queue for sync
  - Network status detection
  - Offline/sync banners
- **Testing**:
  - Unit tests (services, hooks, utilities)
  - Integration tests (checkout, auth, flows)
  - Jest configuration with mocks
- **Error Handling**:
  - React Error Boundary
  - Crash reporting (Sentry-ready)
  - Global error handlers
- **Bundle Optimization**:
  - Hermes engine enabled (2x faster startup)
  - Metro bundler optimization
  - Tree-shaking with Babel plugins
  - Code splitting and lazy imports

### 📱 Development Progress: 87% Complete (54/62 tasks)

### 🎯 Phase 7: Deployment & Production (Pending)
- Environment variables configuration
- Analytics integration (Firebase/Amplitude)
- Push notifications (Expo Notifications)
- App Store deployment (iOS)
- Play Store deployment (Android)
- Deep linking setup
- Beta testing (TestFlight/Internal Testing)

## API Integration

All API calls go through `src/services/api.ts`:

```typescript
import api from '../services/api';

// Example: Fetch products
const products = await api.get('/products');

// With auth token (automatic from AsyncStorage)
const orders = await api.get('/orders');
```

### Key API Endpoints Used

**Authentication**:
- `POST /auth/register`
- `POST /auth/login`

**Products**:
- `GET /products` - List with filters
- `GET /products/:id` - Product details

**Orders**:
- `POST /orders/guest` - Guest checkout
- `POST /orders/:id/shipping-options` - Get shipping rates
- `POST /orders/:id/confirm-shipping` - Confirm shipping
- `GET /orders/:id/tracking` - Track order

**Payments**:
- `POST /payments-v2` - Create payment
- `POST /payments-v2/:id/process/crypto` - USDC payment

**Live Shopping**:
- `GET /live/streams/active` - Active streams
- `GET /live/streams/:id` - Stream details
- WebSocket: `socket.emit('joinStream', { streamId, sessionId })`

**Affiliate**:
- `POST /affiliates/links` - Generate link
- `GET /affiliates/stats/:id` - Get stats

**Recommendations**:
- `POST /recommendations/generate` - Personalized products
- `GET /recommendations/trending` - Trending items

## Performance Optimization

### Image Caching
```tsx
import CachedImage from '../components/ui/CachedImage';

<CachedImage
  source={{ uri: product.imageUrl }}
  style={styles.image}
  cacheKey={`product-${product.id}`}
/>
```

### Lazy Loading
```tsx
import LazyLoadView from '../components/ui/LazyLoadView';

<LazyLoadView
  placeholder={<Skeleton />}
  minHeight={200}
>
  <ExpensiveComponent />
</LazyLoadView>
```

### Skeleton Screens
```tsx
import { ProductSkeleton, ListSkeleton } from '../components/ui/Skeleton';

{loading ? <ProductSkeleton /> : <ProductCard product={product} />}
```

### Offline Support
```typescript
import { useOfflineSync } from '../hooks/useOfflineSync';

const { isOnline, syncPending } = useOfflineSync();

// Queue action for later sync
await queueAction('addToCart', { productId, quantity });
```

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# Specific test file
npm test -- src/services/__tests__/api.test.ts
```

### Test Files
- `src/services/__tests__/` - API service tests
- `src/hooks/__tests__/` - Custom hook tests
- `src/__tests__/integration/` - Integration tests
- `jest.config.js` - Jest configuration
- `jest.setup.js` - Test environment setup

## Build Configuration

### Hermes Engine
Enabled in `app.json`:
```json
{
  "expo": {
    "jsEngine": "hermes",
    "android": {
      "enableHermes": true
    }
  }
}
```

### Metro Bundler
Optimized in `metro.config.js`:
- Minification enabled
- Tree-shaking configured
- Source maps for production

### Babel Plugins
In `babel.config.js`:
- `react-native-reanimated/plugin`
- `transform-remove-console` (production)

## Deployment

### EAS Build Setup
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure project
eas build:configure

# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production
```

### Environment Profiles
Create `eas.json`:
```json
{
  "build": {
    "development": {
      "env": {
        "EXPO_PUBLIC_API_URL": "http://localhost:3000/api/v1"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.gshop.com/api/v1"
      }
    }
  }
}
```

## Important Notes

### GSHOP Token Wallet (Temporarily Disabled)
- Backend has token system implemented
- Mobile integration removed due to:
  - Missing `token_metrics` database table
  - Backend 500 errors on wallet creation
- To re-enable:
  1. Backend: Create token_metrics migration
  2. Mobile: Uncomment GSHOP tokens in `PaymentMethodSelection.tsx`

### Guest Checkout
- Full checkout without account
- Colombian document validation (CC, CE, PA, TI)
- Creates temporary user in backend
- Can convert to full account later

### Payment Expiration
- 30-minute timeout on pending payments
- Automatic cleanup via backend

### Live Stream Attribution
- Orders created during live streams include:
  - `liveSessionId`
  - `affiliateId` (if affiliate-hosted)
  - Automatic commission calculation

## Performance Targets

- ⚡ **Startup**: <2s on Hermes
- 📸 **Image Loading**: <500ms with caching
- 🔄 **Navigation**: <200ms between screens
- 📴 **Offline**: Full cart/wishlist support
- 💾 **Bundle Size**: <50MB (optimized)
- 🧪 **Test Coverage**: >70%

## Common Issues

### Metro Bundler Cache
```bash
npm start -- --clear
```

### iOS Simulator Not Starting
```bash
npx expo run:ios --clean
```

### Android Build Errors
```bash
cd android && ./gradlew clean && cd ..
npm run android
```

### Socket.IO Connection Issues
Check WEBSOCKET_URL in .env matches backend

## Links

- **Backend API**: All endpoints at `/api/v1`
- **Backend WebSocket**: Socket.IO at root namespace
- **Admin Panel**: Not directly used by mobile
- **Seller Panel**: Not directly used by mobile
- **Documentation**: See gshop-docs for API contracts

## Next Steps (Phase 7)

1. Configure environment variables for production
2. Integrate Firebase Analytics
3. Setup Expo Push Notifications
4. Submit to App Store & Play Store
5. Setup deep linking (`gshop://`)
6. Beta testing with TestFlight/Internal Testing
7. Production monitoring (Sentry, Crashlytics)
