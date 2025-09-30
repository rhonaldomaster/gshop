/**
 * GSHOP Pixel Analytics Service
 *
 * Tracks user behavior and sends events to the backend analytics system.
 * Integrates with the GSHOP Pixel backend API.
 */

import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from '../config/env.config';

/**
 * Analytics event types
 */
export enum AnalyticsEventType {
  PAGE_VIEW = 'page_view',
  PRODUCT_VIEW = 'product_view',
  ADD_TO_CART = 'add_to_cart',
  REMOVE_FROM_CART = 'remove_from_cart',
  BEGIN_CHECKOUT = 'begin_checkout',
  PURCHASE = 'purchase',
  SEARCH = 'search',
  WISHLIST_ADD = 'wishlist_add',
  REVIEW_SUBMIT = 'review_submit',
  SHARE = 'share',
  LIVE_STREAM_JOIN = 'live_stream_join',
  LIVE_STREAM_LEAVE = 'live_stream_leave',
  AFFILIATE_LINK_CLICK = 'affiliate_link_click',
  CUSTOM = 'custom',
}

/**
 * Analytics event data interface
 */
export interface AnalyticsEvent {
  eventType: AnalyticsEventType;
  timestamp: number;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

/**
 * Product event data
 */
export interface ProductEventData {
  productId: string;
  productName: string;
  category?: string;
  price?: number;
  currency?: string;
  quantity?: number;
}

/**
 * Purchase event data
 */
export interface PurchaseEventData {
  orderId: string;
  value: number;
  currency: string;
  items: Array<{
    productId: string;
    productName: string;
    price: number;
    quantity: number;
  }>;
  paymentMethod?: string;
}

/**
 * Live stream event data
 */
export interface LiveStreamEventData {
  streamId: string;
  hostId: string;
  hostType: 'seller' | 'affiliate';
  duration?: number;
}

/**
 * Analytics Service Class
 */
class AnalyticsService {
  private apiClient: AxiosInstance;
  private sessionId: string | null = null;
  private userId: string | null = null;
  private eventQueue: AnalyticsEvent[] = [];
  private isInitialized = false;

  constructor() {
    this.apiClient = axios.create({
      baseURL: `${ENV.API_BASE_URL}${ENV.API_VERSION}`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Initialize analytics service
   */
  async initialize(userId?: string): Promise<void> {
    if (!ENV.ANALYTICS_ENABLED) {
      console.log('[Analytics] Analytics disabled');
      return;
    }

    try {
      // Get or create session ID
      this.sessionId = await this.getOrCreateSessionId();

      // Set user ID if provided
      if (userId) {
        this.userId = userId;
        await AsyncStorage.setItem('@gshop:analytics_user_id', userId);
      } else {
        // Try to load from storage
        const storedUserId = await AsyncStorage.getItem('@gshop:analytics_user_id');
        if (storedUserId) {
          this.userId = storedUserId;
        }
      }

      this.isInitialized = true;

      // Process any queued events
      await this.processEventQueue();

      if (ENV.DEBUG_MODE) {
        console.log('[Analytics] Initialized', {
          pixelId: ENV.GSHOP_PIXEL_ID,
          sessionId: this.sessionId,
          userId: this.userId,
        });
      }
    } catch (error) {
      console.error('[Analytics] Initialization failed:', error);
    }
  }

  /**
   * Track analytics event
   */
  async track(eventType: AnalyticsEventType, properties?: Record<string, any>): Promise<void> {
    if (!ENV.ANALYTICS_ENABLED) return;

    const event: AnalyticsEvent = {
      eventType,
      timestamp: Date.now(),
      properties: {
        ...properties,
        platform: Platform.OS,
        appVersion: '1.0.0', // TODO: Get from app config
      },
      userId: this.userId || undefined,
      sessionId: this.sessionId || undefined,
    };

    if (!this.isInitialized) {
      // Queue event for later
      this.eventQueue.push(event);
      return;
    }

    try {
      await this.sendEvent(event);

      if (ENV.DEBUG_MODE) {
        console.log('[Analytics] Event tracked:', eventType, properties);
      }
    } catch (error) {
      console.error('[Analytics] Failed to track event:', error);
      // Queue for retry
      this.eventQueue.push(event);
    }
  }

  /**
   * Track page view
   */
  async trackPageView(screenName: string, properties?: Record<string, any>): Promise<void> {
    await this.track(AnalyticsEventType.PAGE_VIEW, {
      screenName,
      ...properties,
    });
  }

  /**
   * Track product view
   */
  async trackProductView(data: ProductEventData): Promise<void> {
    await this.track(AnalyticsEventType.PRODUCT_VIEW, data);
  }

  /**
   * Track add to cart
   */
  async trackAddToCart(data: ProductEventData): Promise<void> {
    await this.track(AnalyticsEventType.ADD_TO_CART, data);
  }

  /**
   * Track remove from cart
   */
  async trackRemoveFromCart(data: ProductEventData): Promise<void> {
    await this.track(AnalyticsEventType.REMOVE_FROM_CART, data);
  }

  /**
   * Track checkout start
   */
  async trackBeginCheckout(data: { value: number; currency: string; items: any[] }): Promise<void> {
    await this.track(AnalyticsEventType.BEGIN_CHECKOUT, data);
  }

  /**
   * Track purchase
   */
  async trackPurchase(data: PurchaseEventData): Promise<void> {
    await this.track(AnalyticsEventType.PURCHASE, data);
  }

  /**
   * Track search
   */
  async trackSearch(query: string, resultsCount?: number): Promise<void> {
    await this.track(AnalyticsEventType.SEARCH, {
      query,
      resultsCount,
    });
  }

  /**
   * Track live stream events
   */
  async trackLiveStreamJoin(data: LiveStreamEventData): Promise<void> {
    await this.track(AnalyticsEventType.LIVE_STREAM_JOIN, data);
  }

  async trackLiveStreamLeave(data: LiveStreamEventData): Promise<void> {
    await this.track(AnalyticsEventType.LIVE_STREAM_LEAVE, data);
  }

  /**
   * Set user ID for tracking
   */
  async setUserId(userId: string): Promise<void> {
    this.userId = userId;
    await AsyncStorage.setItem('@gshop:analytics_user_id', userId);

    if (ENV.DEBUG_MODE) {
      console.log('[Analytics] User ID set:', userId);
    }
  }

  /**
   * Clear user ID (on logout)
   */
  async clearUserId(): Promise<void> {
    this.userId = null;
    await AsyncStorage.removeItem('@gshop:analytics_user_id');

    if (ENV.DEBUG_MODE) {
      console.log('[Analytics] User ID cleared');
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Send event to backend
   */
  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    try {
      await this.apiClient.post('/pixel/track', {
        pixelId: ENV.GSHOP_PIXEL_ID,
        event: event.eventType,
        properties: event.properties,
        userId: event.userId,
        sessionId: event.sessionId,
        timestamp: event.timestamp,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Process queued events
   */
  private async processEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    for (const event of events) {
      try {
        await this.sendEvent(event);
      } catch (error) {
        console.error('[Analytics] Failed to process queued event:', error);
      }
    }
  }

  /**
   * Get or create session ID
   */
  private async getOrCreateSessionId(): Promise<string> {
    const stored = await AsyncStorage.getItem('@gshop:analytics_session_id');

    if (stored) {
      const session = JSON.parse(stored);
      // Check if session is still valid (24 hours)
      if (Date.now() - session.timestamp < 24 * 60 * 60 * 1000) {
        return session.id;
      }
    }

    // Create new session
    const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await AsyncStorage.setItem(
      '@gshop:analytics_session_id',
      JSON.stringify({ id: sessionId, timestamp: Date.now() })
    );

    return sessionId;
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;