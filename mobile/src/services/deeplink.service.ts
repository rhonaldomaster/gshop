/**
 * Deep Linking Service
 *
 * Handles deep links and universal links for the app.
 * Supports navigation to products, live streams, affiliate links, and more.
 */

import * as Linking from 'expo-linking';
import ENV from '../config/env.config';

/**
 * Deep link route types
 */
export enum DeepLinkRoute {
  HOME = 'home',
  PRODUCT = 'product',
  LIVE_STREAM = 'live',
  AFFILIATE = 'affiliate',
  ORDER = 'order',
  SELLER = 'seller',
  CATEGORY = 'category',
  SEARCH = 'search',
  CHECKOUT = 'checkout',
  PROFILE = 'profile',
}

/**
 * Deep link data interface
 */
export interface DeepLinkData {
  route: DeepLinkRoute;
  params?: Record<string, string | number>;
  url: string;
}

/**
 * URL configuration
 */
export const URL_CONFIG = {
  scheme: ENV.APP_SCHEME, // 'gshop'
  prefix: ENV.DEEP_LINK_BASE_URL, // 'https://gshop.com'

  // Route paths
  routes: {
    [DeepLinkRoute.HOME]: '/',
    [DeepLinkRoute.PRODUCT]: '/product/:id',
    [DeepLinkRoute.LIVE_STREAM]: '/live/:id',
    [DeepLinkRoute.AFFILIATE]: '/aff/:code',
    [DeepLinkRoute.ORDER]: '/order/:id',
    [DeepLinkRoute.SELLER]: '/seller/:id',
    [DeepLinkRoute.CATEGORY]: '/category/:slug',
    [DeepLinkRoute.SEARCH]: '/search',
    [DeepLinkRoute.CHECKOUT]: '/checkout',
    [DeepLinkRoute.PROFILE]: '/profile',
  },
};

/**
 * Deep Linking Service Class
 */
class DeepLinkService {
  private listeners: Array<(data: DeepLinkData) => void> = [];

  /**
   * Initialize deep linking
   */
  async initialize(): Promise<void> {
    // Handle initial URL (app opened from link)
    const initialUrl = await Linking.getInitialURL();

    if (initialUrl) {
      const parsed = this.parseUrl(initialUrl);
      if (parsed) {
        this.notifyListeners(parsed);
      }
    }

    // Listen for URL changes (app already open)
    Linking.addEventListener('url', (event) => {
      const parsed = this.parseUrl(event.url);
      if (parsed) {
        this.notifyListeners(parsed);
      }
    });

    if (ENV.DEBUG_MODE) {
      console.log('[DeepLink] Service initialized');
      console.log('[DeepLink] Scheme:', URL_CONFIG.scheme);
      console.log('[DeepLink] Prefix:', URL_CONFIG.prefix);
    }
  }

  /**
   * Parse URL into deep link data
   */
  parseUrl(url: string): DeepLinkData | null {
    try {
      const parsed = Linking.parse(url);
      const { hostname, path, queryParams } = parsed;

      // Determine route from path
      const route = this.getRouteFromPath(path || '/');

      // Extract params from path
      const params = this.extractParams(path || '/', route);

      // Merge with query params
      const allParams = { ...params, ...queryParams };

      if (ENV.DEBUG_MODE) {
        console.log('[DeepLink] Parsed URL:', { url, route, params: allParams });
      }

      return {
        route,
        params: allParams,
        url,
      };
    } catch (error) {
      console.error('[DeepLink] Failed to parse URL:', error);
      return null;
    }
  }

  /**
   * Get route from path
   */
  private getRouteFromPath(path: string): DeepLinkRoute {
    // Remove leading/trailing slashes
    const cleanPath = path.replace(/^\/|\/$/g, '');

    // Match against known routes
    if (!cleanPath || cleanPath === '') return DeepLinkRoute.HOME;
    if (cleanPath.startsWith('product/')) return DeepLinkRoute.PRODUCT;
    if (cleanPath.startsWith('live/')) return DeepLinkRoute.LIVE_STREAM;
    if (cleanPath.startsWith('aff/')) return DeepLinkRoute.AFFILIATE;
    if (cleanPath.startsWith('order/')) return DeepLinkRoute.ORDER;
    if (cleanPath.startsWith('seller/')) return DeepLinkRoute.SELLER;
    if (cleanPath.startsWith('category/')) return DeepLinkRoute.CATEGORY;
    if (cleanPath === 'search') return DeepLinkRoute.SEARCH;
    if (cleanPath === 'checkout') return DeepLinkRoute.CHECKOUT;
    if (cleanPath === 'profile') return DeepLinkRoute.PROFILE;

    return DeepLinkRoute.HOME;
  }

  /**
   * Extract params from path
   */
  private extractParams(path: string, route: DeepLinkRoute): Record<string, string> {
    const params: Record<string, string> = {};
    const cleanPath = path.replace(/^\/|\/$/g, '');
    const segments = cleanPath.split('/');

    switch (route) {
      case DeepLinkRoute.PRODUCT:
        if (segments[1]) params.id = segments[1];
        break;
      case DeepLinkRoute.LIVE_STREAM:
        if (segments[1]) params.id = segments[1];
        break;
      case DeepLinkRoute.AFFILIATE:
        if (segments[1]) params.code = segments[1];
        break;
      case DeepLinkRoute.ORDER:
        if (segments[1]) params.id = segments[1];
        break;
      case DeepLinkRoute.SELLER:
        if (segments[1]) params.id = segments[1];
        break;
      case DeepLinkRoute.CATEGORY:
        if (segments[1]) params.slug = segments[1];
        break;
    }

    return params;
  }

  /**
   * Build deep link URL
   */
  buildUrl(route: DeepLinkRoute, params?: Record<string, string | number>): string {
    let path = URL_CONFIG.routes[route];

    // Replace params in path
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        path = path.replace(`:${key}`, String(value));
      });
    }

    // Build full URL
    const url = `${URL_CONFIG.prefix}${path}`;

    if (ENV.DEBUG_MODE) {
      console.log('[DeepLink] Built URL:', url);
    }

    return url;
  }

  /**
   * Build app scheme URL (for internal use)
   */
  buildSchemeUrl(route: DeepLinkRoute, params?: Record<string, string | number>): string {
    let path = URL_CONFIG.routes[route];

    // Replace params in path
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        path = path.replace(`:${key}`, String(value));
      });
    }

    // Build scheme URL
    const url = `${URL_CONFIG.scheme}://` + path.replace(/^\//, '');

    return url;
  }

  /**
   * Add deep link listener
   */
  addListener(callback: (data: DeepLinkData) => void): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(data: DeepLinkData): void {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('[DeepLink] Listener error:', error);
      }
    });
  }

  /**
   * Open URL externally
   */
  async openExternalUrl(url: string): Promise<boolean> {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[DeepLink] Failed to open URL:', error);
      return false;
    }
  }

  /**
   * Share URL
   */
  async shareUrl(url: string, message?: string): Promise<void> {
    // This will be implemented with React Native Share module
    // For now, just copy to clipboard
    console.log('[DeepLink] Share URL:', url, message);
  }
}

// Helper functions for common deep links

/**
 * Build product deep link
 */
export const buildProductLink = (productId: string): string => {
  return deepLinkService.buildUrl(DeepLinkRoute.PRODUCT, { id: productId });
};

/**
 * Build live stream deep link
 */
export const buildLiveStreamLink = (streamId: string): string => {
  return deepLinkService.buildUrl(DeepLinkRoute.LIVE_STREAM, { id: streamId });
};

/**
 * Build affiliate deep link
 */
export const buildAffiliateLink = (code: string): string => {
  return deepLinkService.buildUrl(DeepLinkRoute.AFFILIATE, { code });
};

/**
 * Build order deep link
 */
export const buildOrderLink = (orderId: string): string => {
  return deepLinkService.buildUrl(DeepLinkRoute.ORDER, { id: orderId });
};

/**
 * Build seller deep link
 */
export const buildSellerLink = (sellerId: string): string => {
  return deepLinkService.buildUrl(DeepLinkRoute.SELLER, { id: sellerId });
};

/**
 * Build category deep link
 */
export const buildCategoryLink = (slug: string): string => {
  return deepLinkService.buildUrl(DeepLinkRoute.CATEGORY, { slug });
};

/**
 * Build search deep link
 */
export const buildSearchLink = (query: string): string => {
  const baseUrl = deepLinkService.buildUrl(DeepLinkRoute.SEARCH);
  return `${baseUrl}?q=${encodeURIComponent(query)}`;
};

// Export singleton instance
export const deepLinkService = new DeepLinkService();
export default deepLinkService;