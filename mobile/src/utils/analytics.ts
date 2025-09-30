/**
 * Analytics Utilities
 *
 * Helper functions for analytics tracking throughout the app.
 */

import analyticsService from '../services/analytics.service';
import ENV from '../config/env.config';

/**
 * Initialize analytics on app start
 */
export const initializeAnalytics = async (userId?: string) => {
  if (!ENV.ANALYTICS_ENABLED) {
    console.log('[Analytics] Analytics disabled by environment');
    return;
  }

  try {
    await analyticsService.initialize(userId);
    console.log('[Analytics] Initialized successfully');
  } catch (error) {
    console.error('[Analytics] Failed to initialize:', error);
  }
};

/**
 * Track navigation state changes
 */
export const getAnalyticsNavigationRef = () => {
  return (state: any) => {
    const route = state?.routes[state.index];
    if (route) {
      analyticsService.trackPageView(route.name, {
        params: route.params,
      });
    }
  };
};

/**
 * Format product data for analytics
 */
export const formatProductForAnalytics = (product: any) => {
  return {
    productId: product.id || product._id,
    productName: product.name || product.title,
    category: product.category,
    price: product.price,
    currency: product.currency || 'USD',
    quantity: product.quantity || 1,
  };
};

/**
 * Format order data for analytics
 */
export const formatOrderForAnalytics = (order: any) => {
  return {
    orderId: order.id || order._id,
    value: order.total || order.totalAmount,
    currency: order.currency || 'USD',
    items: order.items?.map((item: any) => ({
      productId: item.productId || item.id,
      productName: item.productName || item.name,
      price: item.price,
      quantity: item.quantity,
    })) || [],
    paymentMethod: order.paymentMethod,
  };
};

/**
 * Track error events
 */
export const trackError = (error: Error, context?: Record<string, any>) => {
  if (ENV.DEBUG_MODE) {
    console.error('[Analytics] Error:', error, context);
  }

  analyticsService.track('custom' as any, {
    eventName: 'error',
    errorMessage: error.message,
    errorStack: error.stack,
    ...context,
  });
};

/**
 * Track performance metrics
 */
export const trackPerformance = (metric: string, value: number, context?: Record<string, any>) => {
  if (!ENV.DEBUG_MODE) return; // Only in development

  analyticsService.track('custom' as any, {
    eventName: 'performance',
    metric,
    value,
    ...context,
  });
};

/**
 * Track feature usage
 */
export const trackFeatureUsage = (featureName: string, action: string, metadata?: Record<string, any>) => {
  analyticsService.track('custom' as any, {
    eventName: 'feature_usage',
    featureName,
    action,
    ...metadata,
  });
};

/**
 * Batch track multiple events
 */
export const trackBatch = async (events: Array<{ type: string; data: any }>) => {
  for (const event of events) {
    await analyticsService.track(event.type as any, event.data);
  }
};

/**
 * Track affiliate interactions
 */
export const trackAffiliateClick = (affiliateId: string, linkId: string, productId?: string) => {
  analyticsService.track('affiliate_link_click' as any, {
    affiliateId,
    linkId,
    productId,
  });
};

/**
 * Track social sharing
 */
export const trackSocialShare = (platform: string, contentType: string, contentId: string) => {
  analyticsService.track('share' as any, {
    platform,
    contentType,
    contentId,
  });
};

/**
 * Track wishlist actions
 */
export const trackWishlistAdd = (productId: string, productName: string) => {
  analyticsService.track('wishlist_add' as any, {
    productId,
    productName,
  });
};

/**
 * Track review submission
 */
export const trackReviewSubmit = (productId: string, rating: number, hasImages: boolean) => {
  analyticsService.track('review_submit' as any, {
    productId,
    rating,
    hasImages,
  });
};

/**
 * Get analytics consent status
 */
export const getAnalyticsConsent = async (): Promise<boolean> => {
  // TODO: Implement consent management
  return ENV.ANALYTICS_ENABLED;
};

/**
 * Set analytics consent
 */
export const setAnalyticsConsent = async (consent: boolean): Promise<void> => {
  // TODO: Implement consent management
  console.log('[Analytics] Consent set to:', consent);
};

export default {
  initializeAnalytics,
  getAnalyticsNavigationRef,
  formatProductForAnalytics,
  formatOrderForAnalytics,
  trackError,
  trackPerformance,
  trackFeatureUsage,
  trackBatch,
  trackAffiliateClick,
  trackSocialShare,
  trackWishlistAdd,
  trackReviewSubmit,
  getAnalyticsConsent,
  setAnalyticsConsent,
};