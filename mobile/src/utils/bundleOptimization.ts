/**
 * Bundle optimization utilities and lazy loading helpers
 */

import React from 'react';

/**
 * Lazy load a screen component
 * Reduces initial bundle size by code splitting
 */
export const lazyScreen = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> => {
  return React.lazy(importFunc);
};

/**
 * Preload a lazy component before it's needed
 * Call this when user is likely to navigate to the screen
 */
export const preloadScreen = (
  importFunc: () => Promise<{ default: any }>
): void => {
  // Start loading the component
  importFunc();
};

/**
 * Dynamic imports for heavy libraries
 * Import only when needed to reduce bundle size
 */
export const lazyImports = {
  /**
   * Import chart library only when needed
   */
  getCharts: async () => {
    const module = await import('react-native-chart-kit');
    return module;
  },

  /**
   * Import video player only when needed
   */
  getVideoPlayer: async () => {
    const module = await import('expo-av');
    return module;
  },

  /**
   * Import PDF viewer only when needed
   */
  getPDFViewer: async () => {
    // const module = await import('react-native-pdf');
    // return module;
    return null; // Placeholder
  },

  /**
   * Import markdown renderer only when needed
   */
  getMarkdown: async () => {
    // const module = await import('react-native-markdown-display');
    // return module;
    return null; // Placeholder
  },
};

/**
 * Check bundle size in development
 */
export const logBundleStats = (): void => {
  if (__DEV__) {
    console.log('[Bundle] Performance stats:');
    console.log('- Consider lazy loading heavy screens');
    console.log('- Use dynamic imports for large libraries');
    console.log('- Enable Hermes for better startup time');
  }
};

/**
 * Startup optimization recommendations
 */
export const startupOptimizations = {
  /**
   * Defer non-critical initializations
   */
  deferredInit: (callback: () => void, delay: number = 1000) => {
    setTimeout(callback, delay);
  },

  /**
   * Load heavy assets in background
   */
  backgroundAssetLoad: async (assets: any[]) => {
    // Load assets after app is interactive
    requestIdleCallback(() => {
      assets.forEach(asset => {
        // Preload asset
      });
    });
  },

  /**
   * Initialize analytics after startup
   */
  deferAnalytics: () => {
    // Wait for app to be interactive
    setTimeout(() => {
      // Initialize analytics
    }, 2000);
  },
};

/**
 * Request idle callback polyfill for React Native
 */
const requestIdleCallback =
  (global as any).requestIdleCallback ||
  ((cb: () => void) => {
    const start = Date.now();
    return setTimeout(() => {
      cb();
    }, Math.max(0, 50 - (Date.now() - start)));
  });

/**
 * Module size analysis (development only)
 */
export const analyzeModuleSize = (): void => {
  if (__DEV__) {
    console.log('[Bundle Analysis] Tips to reduce bundle size:');
    console.log('1. Use expo-optimize to compress images');
    console.log('2. Enable Hermes engine in app.json');
    console.log('3. Use dynamic imports for heavy libraries');
    console.log('4. Remove unused dependencies');
    console.log('5. Use production builds for testing');
    console.log('');
    console.log('Run: npx expo-optimize && eas build --profile production');
  }
};

/**
 * Detect slow startup and log warning
 */
export const detectSlowStartup = (startTime: number): void => {
  const loadTime = Date.now() - startTime;

  if (loadTime > 3000) {
    console.warn(`[Performance] Slow startup detected: ${loadTime}ms`);
    console.warn('Consider:');
    console.warn('- Reducing initial bundle size');
    console.warn('- Deferring non-critical initializations');
    console.warn('- Using splash screen to hide loading');
  } else {
    console.log(`[Performance] Startup time: ${loadTime}ms ✓`);
  }
};