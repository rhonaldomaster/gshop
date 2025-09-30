# 📦 GSHOP Mobile - Bundle Size & Performance Optimization Guide

## 🎯 Overview
This guide covers techniques implemented in Phase 6 to optimize bundle size and improve app startup performance.

---

## 🚀 Startup Time Optimization

### Current Optimizations Implemented
1. **Hermes Engine**: Enabled in `app.json` for faster JavaScript execution
2. **Lazy Loading**: Screens and heavy components load on-demand
3. **Deferred Initialization**: Non-critical services initialize after app is interactive
4. **Inline Requires**: Babel config enables inline requires for better tree-shaking

### Measuring Startup Time
```typescript
import { detectSlowStartup } from './src/utils/bundleOptimization';

// In App.tsx
const appStartTime = Date.now();

function App() {
  useEffect(() => {
    detectSlowStartup(appStartTime);
  }, []);
}
```

### Startup Benchmarks
- **Target**: < 2 seconds on mid-range devices
- **Good**: 2-3 seconds
- **Needs work**: > 3 seconds

---

## 📦 Bundle Size Reduction

### Techniques Implemented

#### 1. Code Splitting with Lazy Loading
```typescript
// Instead of direct import
import HeavyScreen from './HeavyScreen';

// Use lazy loading
import { lazyScreen } from './utils/bundleOptimization';
const HeavyScreen = lazyScreen(() => import('./HeavyScreen'));
```

#### 2. Dynamic Imports for Heavy Libraries
```typescript
// Chart library - only load when needed
import { lazyImports } from './utils/bundleOptimization';

const ChartsScreen = () => {
  const [Charts, setCharts] = useState(null);

  useEffect(() => {
    lazyImports.getCharts().then(setCharts);
  }, []);

  if (!Charts) return <LoadingState />;
  return <Charts.LineChart data={data} />;
};
```

#### 3. Image Optimization
```bash
# Optimize images before building
npx expo-optimize

# Use WebP format for smaller sizes
# Use cached images component
import { CachedImage } from './components/ui/CachedImage';
```

#### 4. Tree Shaking (Babel Config)
```javascript
// babel.config.js
plugins: [
  ['transform-imports', {
    'lodash': {
      transform: 'lodash/${member}',
      preventFullImport: true
    }
  }]
]
```

#### 5. Remove Console Logs in Production
```javascript
// Automatically removed via babel.config.js
console.log('This will be removed in production');
console.error('This will stay'); // error/warn kept for debugging
```

---

## 🔧 Metro Bundler Configuration

### Optimizations in `metro.config.js`
1. **Minification**: Enhanced with custom config
2. **Inline Requires**: Enabled for better tree-shaking
3. **Source Maps**: Optimized for production builds

### Build for Production
```bash
# Android
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production

# Analyze bundle
npx react-native-bundle-visualizer
```

---

## 📊 Performance Monitoring

### Tools Implemented

#### 1. Performance Monitor Utility
```typescript
import { performanceMonitor } from './utils/performanceMonitor';

// Measure operation
performanceMonitor.start('fetchProducts');
await fetchProducts();
performanceMonitor.end('fetchProducts');

// Check for slow operations
performanceMonitor.logSlowOperations(100); // > 100ms
```

#### 2. Navigation Performance
```typescript
import { useScreenFocus } from './hooks/useScreenFocus';

function MyScreen() {
  const { shouldLoad } = useScreenFocus();

  useEffect(() => {
    if (shouldLoad) {
      // Load heavy data only when screen is focused
      loadData();
    }
  }, [shouldLoad]);
}
```

#### 3. Component Render Performance
```typescript
import { useRenderPerformance } from './utils/performanceMonitor';

function HeavyComponent() {
  useRenderPerformance('HeavyComponent');
  // Component will log if render takes > 16ms (60fps threshold)
}
```

---

## 🎨 UI Performance

### Image Loading Optimization
```typescript
// Use CachedImage component
import { CachedImage } from './components/ui/CachedImage';

<CachedImage
  uri={product.image}
  cacheKey={`product_${product.id}`}
  style={{ width: 100, height: 100 }}
/>
```

### Lazy Load Off-Screen Content
```typescript
import { LazyLoadView } from './components/ui/LazyLoadView';

<LazyLoadView placeholder={<Skeleton />}>
  <HeavyComponent />
</LazyLoadView>
```

### Use Skeleton Screens
```typescript
import { ProductCardSkeleton } from './components/ui/Skeleton';

{loading ? <ProductCardSkeleton /> : <ProductCard />}
```

---

## 📱 Platform-Specific Optimizations

### Android
1. **Proguard**: Enabled in `app.json` for release builds
2. **Resource Shrinking**: Removes unused resources automatically
3. **Hermes**: Enabled for faster startup

### iOS
1. **Deployment Target**: iOS 13.0+ for modern optimizations
2. **Bitcode**: Enabled for App Store optimization

---

## 🧪 Testing Performance

### Run Production Build Locally
```bash
# Android
npx expo run:android --variant release

# iOS
npx expo run:ios --configuration Release
```

### Analyze Bundle Size
```bash
# Generate bundle analysis
npx react-native-bundle-visualizer

# Check for large dependencies
npx npkill  # Remove unused node_modules

# Analyze with source-map-explorer
npm install -g source-map-explorer
source-map-explorer bundle.js bundle.map
```

---

## 📋 Performance Checklist

### Before Release
- [ ] Enable Hermes engine
- [ ] Run `expo-optimize` for images
- [ ] Remove unused dependencies
- [ ] Test production build on real devices
- [ ] Check bundle size (target: < 10MB for JS bundle)
- [ ] Verify startup time (target: < 2s)
- [ ] Test on low-end devices
- [ ] Profile memory usage
- [ ] Test offline functionality
- [ ] Verify error boundaries work

### Post-Release Monitoring
- [ ] Monitor crash reports
- [ ] Track startup metrics
- [ ] Analyze slow screens
- [ ] Monitor API response times
- [ ] Check memory leaks

---

## 🎯 Target Metrics

| Metric | Target | Good | Needs Work |
|--------|--------|------|------------|
| **JS Bundle Size** | < 5MB | 5-10MB | > 10MB |
| **Startup Time** | < 2s | 2-3s | > 3s |
| **TTI (Time to Interactive)** | < 3s | 3-5s | > 5s |
| **Memory Usage** | < 100MB | 100-200MB | > 200MB |
| **FPS (60fps target)** | 55-60 | 45-54 | < 45 |

---

## 🔗 Useful Commands

```bash
# Build optimized production bundle
npx expo export --platform android

# Analyze bundle
npx expo export --dump-sourcemap
npx source-map-explorer www/_expo/static/js/android-*.js

# Check app size
du -sh .expo-shared

# Profile JavaScript performance
npx react-native profile-hermes

# Clean build cache
npx expo start -c

# Optimize images
npx expo-optimize
```

---

## 📚 Additional Resources

- [Expo Performance Docs](https://docs.expo.dev/guides/performance/)
- [React Native Performance](https://reactnative.dev/docs/performance)
- [Hermes Engine](https://hermesengine.dev/)
- [Metro Bundler](https://facebook.github.io/metro/)

---

**Last Updated**: 2025-09-29
**Phase**: 6 - Polish & Optimization
**Status**: ✅ Complete