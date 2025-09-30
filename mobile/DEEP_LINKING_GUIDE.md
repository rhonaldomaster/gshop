# 🔗 Deep Linking Guide

Complete guide for implementing and using deep links in the GSHOP mobile app.

## 📋 Overview

Deep linking allows users to navigate directly to specific content in your app from:
- Web browsers
- Other apps
- Push notifications
- Email campaigns
- Social media posts
- QR codes

## 🎯 Supported Deep Links

### URL Scheme (Custom Scheme)
```
gshop://
```

### Universal Links (HTTPS)
```
https://gshop.com/
```

### Supported Routes

| Route | URL Pattern | Example | Screen |
|-------|-------------|---------|--------|
| Home | `/` | `gshop.com/` | Home Screen |
| Product | `/product/:id` | `gshop.com/product/123` | Product Detail |
| Live Stream | `/live/:id` | `gshop.com/live/456` | Live Stream |
| Affiliate | `/aff/:code` | `gshop.com/aff/abc123` | Affiliate Redirect |
| Order | `/order/:id` | `gshop.com/order/789` | Order Detail |
| Seller | `/seller/:id` | `gshop.com/seller/101` | Seller Profile |
| Category | `/category/:slug` | `gshop.com/category/electronics` | Category |
| Search | `/search?q=query` | `gshop.com/search?q=laptop` | Search Results |
| Checkout | `/checkout` | `gshop.com/checkout` | Checkout |
| Profile | `/profile` | `gshop.com/profile` | User Profile |

## 🚀 Quick Start

### 1. Initialize Deep Linking

In your main `App.tsx`:

```typescript
import { useDeepLink } from '@/hooks/useDeepLink';

function App() {
  // Initialize deep link handling
  useDeepLink();

  return (
    // Your app content
  );
}
```

That's it! The hook automatically:
- Listens for incoming deep links
- Parses URLs
- Navigates to the correct screen
- Tracks analytics events

## 🔧 Configuration

### iOS Universal Links Setup

1. **Add Associated Domains to app.config.js**:
   ```javascript
   ios: {
     associatedDomains: ['applinks:gshop.com', 'applinks:www.gshop.com']
   }
   ```

2. **Create Apple App Site Association file**:

   On your server at `https://gshop.com/.well-known/apple-app-site-association`:

   ```json
   {
     "applinks": {
       "apps": [],
       "details": [
         {
           "appID": "TEAM_ID.com.gshop.app",
           "paths": [
             "/product/*",
             "/live/*",
             "/aff/*",
             "/order/*",
             "/seller/*",
             "/category/*"
           ]
         }
       ]
     }
   }
   ```

3. **Test Universal Link**:
   ```bash
   # iOS Simulator
   xcrun simctl openurl booted "https://gshop.com/product/123"
   ```

### Android App Links Setup

1. **Add Intent Filters in app.config.js**:
   ```javascript
   android: {
     intentFilters: [
       {
         action: 'VIEW',
         autoVerify: true,
         data: [
           {
             scheme: 'https',
             host: 'gshop.com',
             pathPrefix: '/'
           }
         ],
         category: ['BROWSABLE', 'DEFAULT']
       }
     ]
   }
   ```

2. **Create Digital Asset Links file**:

   On your server at `https://gshop.com/.well-known/assetlinks.json`:

   ```json
   [
     {
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "com.gshop.app",
         "sha256_cert_fingerprints": [
           "YOUR_SHA256_FINGERPRINT_HERE"
         ]
       }
     }
   ]
   ```

3. **Get SHA256 Fingerprint**:
   ```bash
   # For development
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

   # For production
   keytool -list -v -keystore my-release-key.keystore
   ```

4. **Test App Link**:
   ```bash
   adb shell am start -W -a android.intent.action.VIEW -d "https://gshop.com/product/123" com.gshop.app
   ```

## 💻 Usage Examples

### Building Deep Links

```typescript
import { useDeepLinkBuilder } from '@/hooks/useDeepLink';

function ProductCard({ product }) {
  const { buildProductUrl } = useDeepLinkBuilder();

  const shareProduct = () => {
    const url = buildProductUrl(product.id);
    console.log('Share URL:', url);
    // https://gshop.com/product/123
  };

  return (
    <TouchableOpacity onPress={shareProduct}>
      <Text>Share</Text>
    </TouchableOpacity>
  );
}
```

### Sharing Deep Links

```typescript
import { useShareDeepLink } from '@/hooks/useDeepLink';

function ProductDetail({ product }) {
  const { shareProduct } = useShareDeepLink();

  const handleShare = async () => {
    const url = await shareProduct(product.id, product.name);

    // TODO: Integrate with React Native Share
    Share.share({
      message: `Check out ${product.name} on GSHOP!`,
      url: url,
    });
  };

  return (
    <Button title="Share Product" onPress={handleShare} />
  );
}
```

### Opening External URLs

```typescript
import { useExternalLink } from '@/hooks/useDeepLink';

function SettingsScreen() {
  const { openUrl } = useExternalLink();

  const openPrivacyPolicy = () => {
    openUrl('https://gshop.com/privacy');
  };

  return (
    <Button title="Privacy Policy" onPress={openPrivacyPolicy} />
  );
}
```

### Custom Deep Link Handling

```typescript
import deepLinkService from '@/services/deeplink.service';

// Add custom listener
const unsubscribe = deepLinkService.addListener((data) => {
  console.log('Deep link received:', data);

  // Custom handling
  if (data.route === 'affiliate') {
    // Track affiliate click
    // Fetch affiliate destination
    // Show modal or navigate
  }
});

// Clean up
return unsubscribe;
```

## 🎯 Deep Link Scenarios

### Scenario 1: Product Sharing

**Flow**:
1. User shares product from app
2. Friend receives link: `https://gshop.com/product/123`
3. Friend taps link
4. App opens to Product Detail screen
5. Analytics tracked

**Implementation**:
```typescript
const { shareProduct } = useShareDeepLink();

// Share product
const url = await shareProduct('123', 'Cool Gadget');

// URL generated: https://gshop.com/product/123
```

### Scenario 2: Affiliate Link Tracking

**Flow**:
1. Affiliate generates link: `https://gshop.com/aff/xyz789`
2. Customer taps affiliate link
3. App opens and tracks affiliate click
4. Customer makes purchase
5. Affiliate earns commission

**Implementation**:
```typescript
const { buildAffiliateUrl } = useDeepLinkBuilder();

// Build affiliate link
const affiliateUrl = buildAffiliateUrl('xyz789');

// Link clicked → handled by deep link service
// Analytics automatically tracked
```

### Scenario 3: Live Stream Notification

**Flow**:
1. Seller starts live stream
2. Push notification sent with deep link
3. User taps notification
4. App opens directly to live stream

**Implementation**:
```typescript
// In push notification payload
{
  type: 'live_stream_started',
  data: {
    streamId: '456',
    deepLink: 'https://gshop.com/live/456'
  }
}

// Notification handler automatically navigates via deep link
```

### Scenario 4: Email Campaign

**Flow**:
1. Marketing email sent with deep link
2. User taps "Shop Now" button
3. App opens to specific category
4. User browses and purchases

**Email HTML**:
```html
<a href="https://gshop.com/category/summer-sale">
  Shop Summer Sale
</a>
```

### Scenario 5: QR Code

**Flow**:
1. Physical store displays QR code
2. Customer scans QR code
3. App opens to product detail
4. Customer purchases in-store pickup

**QR Code Content**:
```
https://gshop.com/product/789?source=qr&location=store-123
```

## 🧪 Testing Deep Links

### iOS Simulator
```bash
# Test custom scheme
xcrun simctl openurl booted "gshop://product/123"

# Test universal link
xcrun simctl openurl booted "https://gshop.com/product/123"
```

### Android Emulator
```bash
# Test custom scheme
adb shell am start -W -a android.intent.action.VIEW -d "gshop://product/123"

# Test app link
adb shell am start -W -a android.intent.action.VIEW -d "https://gshop.com/product/123" com.gshop.app
```

### Physical Devices

#### iOS
1. Send link via Notes app
2. Long press the link
3. Tap "Open in GSHOP"

Or:
1. Open Safari
2. Enter URL in address bar
3. Tap "Open in GSHOP" banner

#### Android
1. Send link via any messaging app
2. Tap the link
3. Choose "Open with GSHOP"

### Testing Checklist

- [ ] Custom scheme works (gshop://)
- [ ] Universal links work (https://gshop.com)
- [ ] All routes navigate correctly
- [ ] Params are extracted properly
- [ ] Analytics events are tracked
- [ ] Works when app is closed
- [ ] Works when app is backgrounded
- [ ] Works when app is foregrounded
- [ ] Fallback to web browser if app not installed

## 📊 Analytics & Tracking

Deep links are automatically tracked with the following data:

```typescript
{
  eventName: 'deep_link_opened',
  route: 'product',
  params: { id: '123' },
  timestamp: 1234567890,
  source: 'notification', // or 'email', 'social', etc.
}
```

### Custom Tracking

Add source parameter to track campaigns:

```
https://gshop.com/product/123?source=email-campaign&campaign=summer-2025
```

Access in app:
```typescript
deepLinkService.addListener((data) => {
  const { source, campaign } = data.params;
  // Track campaign performance
});
```

## 🔒 Security Considerations

### Validate Parameters
```typescript
const handleDeepLink = (data: DeepLinkData) => {
  // Validate product ID format
  if (data.route === 'product') {
    const productId = data.params?.id;
    if (!productId || typeof productId !== 'string') {
      console.error('Invalid product ID');
      return;
    }
  }

  // Continue with navigation
};
```

### Sanitize Inputs
```typescript
// Don't directly pass params to API
const productId = String(params.id).replace(/[^a-zA-Z0-9-]/g, '');

// Validate before API call
if (!isValidProductId(productId)) {
  return;
}
```

### Rate Limiting
```typescript
// Prevent deep link spam/abuse
const lastDeepLinkTime = useRef(0);

const handleDeepLink = (data: DeepLinkData) => {
  const now = Date.now();
  if (now - lastDeepLinkTime.current < 1000) {
    console.warn('Rate limit exceeded');
    return;
  }
  lastDeepLinkTime.current = now;

  // Handle deep link
};
```

## 🆘 Troubleshooting

### Deep Links Not Working

1. **Check URL format**:
   ```
   ✅ https://gshop.com/product/123
   ❌ https://gshop.com//product/123 (double slash)
   ❌ gshop:/product/123 (missing slash)
   ```

2. **Verify configuration**:
   - Check `app.config.js` scheme and associatedDomains
   - Verify `assetlinks.json` (Android) is accessible
   - Verify `apple-app-site-association` (iOS) is accessible

3. **Clear app data**:
   ```bash
   # iOS: Delete and reinstall app
   # Android:
   adb shell pm clear com.gshop.app
   ```

4. **Check logs**:
   ```typescript
   // Enable debug mode
   ENV.DEBUG_MODE = true;

   // Check console for deep link logs
   ```

### Universal Links Opening in Browser

- **iOS**: Make sure `associatedDomains` is configured
- **Android**: Verify Digital Asset Links file
- **Both**: Ensure app is installed and scheme is registered

### Parameters Not Extracting

Check route matching logic:
```typescript
// Debug parameter extraction
console.log('Path:', path);
console.log('Route:', route);
console.log('Extracted params:', params);
```

## 📚 Best Practices

### DO:
✅ Use HTTPS for universal links
✅ Keep URLs short and readable
✅ Include analytics parameters
✅ Test on physical devices
✅ Handle missing parameters gracefully
✅ Provide fallback navigation
✅ Track all deep link events

### DON'T:
❌ Use deep links for sensitive actions
❌ Pass passwords or tokens in URLs
❌ Create overly complex URL structures
❌ Forget to validate parameters
❌ Assume app is always installed
❌ Ignore error cases

## 🔗 Additional Resources

- [Expo Linking Documentation](https://docs.expo.dev/guides/linking/)
- [iOS Universal Links](https://developer.apple.com/ios/universal-links/)
- [Android App Links](https://developer.android.com/training/app-links)
- [Deep Link Testing Tools](https://www.deeplinkingtools.com/)

---

**Last Updated:** 2025-09-30
**Version:** 1.0.0