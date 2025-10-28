/**
 * Deep Link Hooks
 *
 * React hooks for handling deep links and navigation.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import deepLinkService, {
  DeepLinkData,
  DeepLinkRoute,
  buildProductLink,
  buildLiveStreamLink,
  buildAffiliateLink,
  buildOrderLink,
  buildSellerLink,
  buildCategoryLink,
  buildSearchLink,
} from '../services/deeplink.service';
import analyticsService from '../services/analytics.service';

/**
 * Main deep link hook
 */
export const useDeepLink = () => {
  const navigation = useNavigation<any>();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;

    // Initialize service
    deepLinkService.initialize();

    // Add listener for deep links
    const unsubscribe = deepLinkService.addListener((data) => {
      handleDeepLink(data);
    });

    isInitialized.current = true;

    return unsubscribe;
  }, []);

  /**
   * Handle deep link navigation
   */
  const handleDeepLink = useCallback((data: DeepLinkData) => {
    const { route, params } = data;

    // Track deep link click
    analyticsService.track('custom' as any, {
      eventName: 'deep_link_opened',
      route,
      params,
    });

    // Navigate based on route
    switch (route) {
      case DeepLinkRoute.PRODUCT:
        if (params?.id) {
          navigation.navigate('ProductDetail', { productId: params.id });
        }
        break;

      case DeepLinkRoute.LIVE_STREAM:
        if (params?.id) {
          navigation.navigate('LiveStream', { streamId: params.id });
        }
        break;

      case DeepLinkRoute.AFFILIATE:
        if (params?.code) {
          // Track affiliate click and navigate
          analyticsService.track('affiliate_link_click' as any, {
            affiliateCode: params.code,
          });
          // You might want to fetch the product/destination from the affiliate code
          // For now, navigate to home
          navigation.navigate('Home');
        }
        break;

      case DeepLinkRoute.ORDER:
        if (params?.id) {
          navigation.navigate('OrderDetail', { orderId: params.id });
        }
        break;

      case DeepLinkRoute.SELLER:
        if (params?.id) {
          navigation.navigate('SellerProfile', { sellerId: params.id });
        }
        break;

      case DeepLinkRoute.CATEGORY:
        if (params?.slug) {
          navigation.navigate('ProductList', { category: params.slug });
        }
        break;

      case DeepLinkRoute.SEARCH:
        navigation.navigate('Search', { query: params?.q || '' });
        break;

      case DeepLinkRoute.CHECKOUT:
        navigation.navigate('Checkout');
        break;

      case DeepLinkRoute.PROFILE:
        navigation.navigate('Profile');
        break;

      case DeepLinkRoute.HOME:
      default:
        navigation.navigate('Home');
        break;
    }
  }, [navigation]);

  return {
    handleDeepLink,
  };
};

/**
 * Hook for building deep links
 */
export const useDeepLinkBuilder = () => {
  const buildProductUrl = useCallback((productId: string) => {
    return buildProductLink(productId);
  }, []);

  const buildLiveStreamUrl = useCallback((streamId: string) => {
    return buildLiveStreamLink(streamId);
  }, []);

  const buildAffiliateUrl = useCallback((code: string) => {
    return buildAffiliateLink(code);
  }, []);

  const buildOrderUrl = useCallback((orderId: string) => {
    return buildOrderLink(orderId);
  }, []);

  const buildSellerUrl = useCallback((sellerId: string) => {
    return buildSellerLink(sellerId);
  }, []);

  const buildCategoryUrl = useCallback((slug: string) => {
    return buildCategoryLink(slug);
  }, []);

  const buildSearchUrl = useCallback((query: string) => {
    return buildSearchLink(query);
  }, []);

  return {
    buildProductUrl,
    buildLiveStreamUrl,
    buildAffiliateUrl,
    buildOrderUrl,
    buildSellerUrl,
    buildCategoryUrl,
    buildSearchUrl,
  };
};

/**
 * Hook for sharing deep links
 */
export const useShareDeepLink = () => {
  const { buildProductUrl, buildLiveStreamUrl, buildAffiliateUrl } = useDeepLinkBuilder();

  const shareProduct = useCallback(async (productId: string, productName: string) => {
    const url = buildProductUrl(productId);

    // Track share event
    analyticsService.track('share' as any, {
      contentType: 'product',
      contentId: productId,
      contentName: productName,
    });

    // TODO: Implement actual sharing with React Native Share
    // For now, just return the URL
    return url;
  }, [buildProductUrl]);

  const shareLiveStream = useCallback(async (streamId: string, streamTitle: string) => {
    const url = buildLiveStreamUrl(streamId);

    analyticsService.track('share' as any, {
      contentType: 'live_stream',
      contentId: streamId,
      contentName: streamTitle,
    });

    return url;
  }, [buildLiveStreamUrl]);

  const shareAffiliateLink = useCallback(async (code: string, productName?: string) => {
    const url = buildAffiliateUrl(code);

    analyticsService.track('share' as any, {
      contentType: 'affiliate_link',
      contentId: code,
      contentName: productName,
    });

    return url;
  }, [buildAffiliateUrl]);

  return {
    shareProduct,
    shareLiveStream,
    shareAffiliateLink,
  };
};

/**
 * Hook for opening external URLs
 */
export const useExternalLink = () => {
  const openUrl = useCallback(async (url: string) => {
    return await deepLinkService.openExternalUrl(url);
  }, []);

  return {
    openUrl,
  };
};

export default useDeepLink;