# 📊 Analytics Integration Guide

Complete guide for integrating GSHOP Pixel analytics into the mobile app.

## 🚀 Quick Start

### 1. Initialize Analytics on App Start

In your `App.tsx` or main entry point:

```typescript
import { useEffect } from 'react';
import { initializeAnalytics } from './utils/analytics';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { user } = useAuth();

  useEffect(() => {
    // Initialize analytics
    initializeAnalytics(user?.id);
  }, [user]);

  // ... rest of your app
}
```

### 2. Auto-Track Page Views

Add to any screen component:

```typescript
import { usePageViewTracking } from '@/hooks/useAnalytics';

function ProductListScreen() {
  usePageViewTracking('ProductList');

  return (
    // ... your screen content
  );
}
```

### 3. Track Events

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function ProductCard({ product }) {
  const analytics = useAnalytics();

  const handlePress = () => {
    analytics.trackProductView({
      productId: product.id,
      productName: product.name,
      category: product.category,
      price: product.price,
      currency: 'USD',
    });
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      {/* ... */}
    </TouchableOpacity>
  );
}
```

## 📋 Common Use Cases

### Product Tracking

#### Track Product View
```typescript
import { useProductTracking } from '@/hooks/useAnalytics';

function ProductDetailScreen({ route }) {
  const { product } = route.params;
  const { trackView } = useProductTracking();

  useEffect(() => {
    trackView({
      productId: product.id,
      productName: product.name,
      category: product.category,
      price: product.price,
      currency: 'USD',
    });
  }, [product.id]);
}
```

#### Track Add to Cart
```typescript
const { trackAddToCart } = useProductTracking();

const handleAddToCart = () => {
  // Add to cart logic
  addToCart(product);

  // Track event
  trackAddToCart({
    productId: product.id,
    productName: product.name,
    price: product.price,
    quantity: 1,
  });
};
```

#### Track Remove from Cart
```typescript
const { trackRemoveFromCart } = useProductTracking();

const handleRemove = () => {
  removeFromCart(item.id);

  trackRemoveFromCart({
    productId: item.id,
    productName: item.name,
    price: item.price,
    quantity: item.quantity,
  });
};
```

### Checkout Tracking

```typescript
import { useCheckoutTracking } from '@/hooks/useAnalytics';

function CheckoutScreen() {
  const { trackBeginCheckout, trackPurchase } = useCheckoutTracking();
  const { cart } = useCart();

  // Track when user enters checkout
  useEffect(() => {
    trackBeginCheckout({
      value: cart.total,
      currency: 'USD',
      items: cart.items,
    });
  }, []);

  // Track successful purchase
  const handlePaymentSuccess = (order) => {
    trackPurchase({
      orderId: order.id,
      value: order.total,
      currency: 'USD',
      items: order.items,
      paymentMethod: order.paymentMethod,
    });
  };
}
```

### Search Tracking

```typescript
import { useSearchTracking } from '@/hooks/useAnalytics';

function SearchScreen() {
  const { trackSearch } = useSearchTracking(1000); // 1 second debounce
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (query.length >= 2) {
      // Perform search
      search(query).then(setResults);

      // Track search (automatically debounced)
      trackSearch(query, results.length);
    }
  }, [query]);
}
```

### Live Stream Tracking

```typescript
import { useLiveStreamTracking } from '@/hooks/useAnalytics';

function LiveStreamScreen({ route }) {
  const { streamId, hostId, hostType } = route.params;

  // Automatically tracks join on mount and leave on unmount
  useLiveStreamTracking({
    streamId,
    hostId,
    hostType,
  });

  return (
    // ... live stream UI
  );
}
```

### Custom Events

```typescript
import { useCustomTracking } from '@/hooks/useAnalytics';

function SettingsScreen() {
  const { track } = useCustomTracking();

  const handleNotificationToggle = (enabled: boolean) => {
    track('notification_settings_changed', {
      enabled,
      timestamp: Date.now(),
    });
  };
}
```

## 🔧 Advanced Usage

### Track User Authentication

```typescript
import analyticsService from '@/services/analytics.service';

// On login
const handleLogin = async (credentials) => {
  const user = await login(credentials);

  // Set user ID for tracking
  await analyticsService.setUserId(user.id);
};

// On logout
const handleLogout = async () => {
  await logout();

  // Clear user ID
  await analyticsService.clearUserId();
};
```

### Track Errors

```typescript
import { trackError } from '@/utils/analytics';

try {
  await riskyOperation();
} catch (error) {
  trackError(error, {
    context: 'checkout',
    userId: user?.id,
    timestamp: Date.now(),
  });
}
```

### Track Performance

```typescript
import { trackPerformance } from '@/utils/analytics';

const startTime = Date.now();

// ... expensive operation

const duration = Date.now() - startTime;
trackPerformance('image_loading', duration, {
  imageUrl: image.url,
  imageSize: image.size,
});
```

### Track Feature Usage

```typescript
import { trackFeatureUsage } from '@/utils/analytics';

const handleSharePress = () => {
  trackFeatureUsage('social_share', 'button_click', {
    platform: 'whatsapp',
    contentType: 'product',
    contentId: product.id,
  });

  // ... share logic
};
```

### Batch Tracking

```typescript
import { trackBatch } from '@/utils/analytics';

const events = [
  { type: 'product_view', data: { productId: '123' } },
  { type: 'add_to_cart', data: { productId: '123', quantity: 1 } },
  { type: 'begin_checkout', data: { value: 99.99, currency: 'USD' } },
];

await trackBatch(events);
```

### Helper Utilities

```typescript
import {
  formatProductForAnalytics,
  formatOrderForAnalytics,
} from '@/utils/analytics';

// Format product data
const productData = formatProductForAnalytics(product);
analytics.trackProductView(productData);

// Format order data
const orderData = formatOrderForAnalytics(order);
analytics.trackPurchase(orderData);
```

## 🎯 Event Types

### Standard Events
- `page_view` - Screen navigation
- `product_view` - Product detail view
- `add_to_cart` - Add product to cart
- `remove_from_cart` - Remove product from cart
- `begin_checkout` - Start checkout process
- `purchase` - Complete purchase
- `search` - Search query
- `wishlist_add` - Add to wishlist
- `review_submit` - Submit review
- `share` - Share content

### Live Shopping Events
- `live_stream_join` - Join live stream
- `live_stream_leave` - Leave live stream

### Affiliate Events
- `affiliate_link_click` - Click affiliate link

### Custom Events
- `custom` - Any custom event

## 🔍 Debugging

### View Analytics Logs
```typescript
import ENV from '@/config/env.config';

if (ENV.DEBUG_MODE) {
  // Analytics logs will be visible in console
  console.log('Analytics enabled:', ENV.ANALYTICS_ENABLED);
  console.log('Pixel ID:', ENV.GSHOP_PIXEL_ID);
}
```

### Check Session ID
```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function DebugScreen() {
  const analytics = useAnalytics();
  const sessionId = analytics.getSessionId();

  return <Text>Session ID: {sessionId}</Text>;
}
```

### Validate Analytics Setup
```typescript
import { initializeAnalytics } from '@/utils/analytics';

// Initialize with debug logging
await initializeAnalytics();

// Check console for:
// [Analytics] Initialized
// [Analytics] Session ID: xxx
// [Analytics] Event tracked: page_view
```

## ⚙️ Configuration

### Environment Variables
```bash
# .env
GSHOP_PIXEL_ID=your-pixel-id
ANALYTICS_ENABLED=true
DEBUG_MODE=true
```

### Disable Analytics
```bash
# .env
ANALYTICS_ENABLED=false
```

### Production vs Development
```typescript
// Automatically uses correct pixel ID based on ENV
import ENV from '@/config/env.config';

console.log('Environment:', ENV.ENV); // 'development' or 'production'
console.log('Pixel ID:', ENV.GSHOP_PIXEL_ID);
```

## 📊 Best Practices

### DO:
✅ Track key user actions (views, clicks, purchases)
✅ Use debouncing for frequent events (search)
✅ Auto-track page views with `usePageViewTracking`
✅ Format data with helper utilities
✅ Track errors for debugging
✅ Set user ID on login/logout

### DON'T:
❌ Track PII (passwords, credit cards, etc.)
❌ Track every single click
❌ Block UI for analytics calls
❌ Track in loops without debouncing
❌ Forget to clear user ID on logout

## 🆘 Troubleshooting

### Events Not Being Tracked
1. Check `ANALYTICS_ENABLED=true` in `.env`
2. Verify `GSHOP_PIXEL_ID` is set
3. Check network connection
4. Look for errors in console
5. Verify backend API is running

### Session Not Persisting
- Analytics uses AsyncStorage for session management
- Sessions expire after 24 hours
- Clear app data to reset session

### Performance Issues
- Events are sent asynchronously
- Failed events are queued for retry
- Use debouncing for frequent events
- Batch events when possible

---

**Last Updated:** 2025-09-30
**Version:** 1.0.0