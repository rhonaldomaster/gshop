/**
 * Analytics Hook
 *
 * Provides easy access to analytics tracking throughout the app.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import analyticsService, {
  AnalyticsEventType,
  ProductEventData,
  PurchaseEventData,
  LiveStreamEventData,
} from '../services/analytics.service';

/**
 * Main analytics hook
 */
export const useAnalytics = () => {
  return {
    track: analyticsService.track.bind(analyticsService),
    trackPageView: analyticsService.trackPageView.bind(analyticsService),
    trackProductView: analyticsService.trackProductView.bind(analyticsService),
    trackAddToCart: analyticsService.trackAddToCart.bind(analyticsService),
    trackRemoveFromCart: analyticsService.trackRemoveFromCart.bind(analyticsService),
    trackBeginCheckout: analyticsService.trackBeginCheckout.bind(analyticsService),
    trackPurchase: analyticsService.trackPurchase.bind(analyticsService),
    trackSearch: analyticsService.trackSearch.bind(analyticsService),
    trackLiveStreamJoin: analyticsService.trackLiveStreamJoin.bind(analyticsService),
    trackLiveStreamLeave: analyticsService.trackLiveStreamLeave.bind(analyticsService),
    setUserId: analyticsService.setUserId.bind(analyticsService),
    clearUserId: analyticsService.clearUserId.bind(analyticsService),
    getSessionId: analyticsService.getSessionId.bind(analyticsService),
  };
};

/**
 * Auto-track page views when screen is focused
 */
export const usePageViewTracking = (screenName?: string) => {
  const route = useRoute();
  const navigation = useNavigation();
  const hasTracked = useRef(false);

  useEffect(() => {
    const name = screenName || route.name;

    // Track on mount
    if (!hasTracked.current) {
      analyticsService.trackPageView(name, {
        params: route.params,
      });
      hasTracked.current = true;
    }

    // Track on focus
    const unsubscribe = navigation.addListener('focus', () => {
      analyticsService.trackPageView(name, {
        params: route.params,
      });
    });

    return unsubscribe;
  }, [screenName, route, navigation]);
};

/**
 * Track product interactions
 */
export const useProductTracking = () => {
  const trackView = useCallback((product: ProductEventData) => {
    analyticsService.trackProductView(product);
  }, []);

  const trackAddToCart = useCallback((product: ProductEventData) => {
    analyticsService.trackAddToCart(product);
  }, []);

  const trackRemoveFromCart = useCallback((product: ProductEventData) => {
    analyticsService.trackRemoveFromCart(product);
  }, []);

  return {
    trackView,
    trackAddToCart,
    trackRemoveFromCart,
  };
};

/**
 * Track checkout flow
 */
export const useCheckoutTracking = () => {
  const trackBeginCheckout = useCallback((data: { value: number; currency: string; items: any[] }) => {
    analyticsService.trackBeginCheckout(data);
  }, []);

  const trackPurchase = useCallback((data: PurchaseEventData) => {
    analyticsService.trackPurchase(data);
  }, []);

  return {
    trackBeginCheckout,
    trackPurchase,
  };
};

/**
 * Track live stream events with auto cleanup
 */
export const useLiveStreamTracking = (streamData: LiveStreamEventData) => {
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // Track join on mount
    analyticsService.trackLiveStreamJoin(streamData);

    // Track leave on unmount
    return () => {
      const duration = Date.now() - startTimeRef.current;
      analyticsService.trackLiveStreamLeave({
        ...streamData,
        duration: Math.floor(duration / 1000), // in seconds
      });
    };
  }, [streamData.streamId]); // Only re-run if stream ID changes

  return null;
};

/**
 * Track search queries with debouncing
 */
export const useSearchTracking = (delay: number = 1000) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const trackSearch = useCallback(
    (query: string, resultsCount?: number) => {
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Debounce search tracking
      timeoutRef.current = setTimeout(() => {
        if (query.length >= 2) {
          // Only track searches with 2+ characters
          analyticsService.trackSearch(query, resultsCount);
        }
      }, delay);
    },
    [delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { trackSearch };
};

/**
 * Track custom events with type safety
 */
export const useCustomTracking = () => {
  const track = useCallback((eventName: string, properties?: Record<string, any>) => {
    analyticsService.track(AnalyticsEventType.CUSTOM, {
      eventName,
      ...properties,
    });
  }, []);

  return { track };
};

export default useAnalytics;