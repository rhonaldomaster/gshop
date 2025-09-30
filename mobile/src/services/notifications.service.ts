/**
 * Push Notifications Service
 *
 * Handles push notifications using Expo Notifications API.
 * Manages notification permissions, token registration, and notification handling.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';
import ENV from '../config/env.config';

/**
 * Notification types
 */
export enum NotificationType {
  ORDER_UPDATE = 'order_update',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  SHIPPING_UPDATE = 'shipping_update',
  LIVE_STREAM_STARTED = 'live_stream_started',
  NEW_MESSAGE = 'new_message',
  PROMOTION = 'promotion',
  PRICE_DROP = 'price_drop',
  WISHLIST_BACK_IN_STOCK = 'wishlist_back_in_stock',
  AFFILIATE_COMMISSION = 'affiliate_commission',
  REVIEW_REQUEST = 'review_request',
}

/**
 * Notification data interface
 */
export interface NotificationData {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Notification settings
 */
export interface NotificationSettings {
  enabled: boolean;
  orderUpdates: boolean;
  liveStreams: boolean;
  promotions: boolean;
  messages: boolean;
  affiliateUpdates: boolean;
}

/**
 * Set notification handler
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Notifications Service Class
 */
class NotificationsService {
  private apiClient: AxiosInstance;
  private expoPushToken: string | null = null;
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
   * Initialize notifications service
   */
  async initialize(userId?: string): Promise<string | null> {
    if (this.isInitialized) {
      return this.expoPushToken;
    }

    try {
      // Request permissions
      const hasPermission = await this.requestPermissions();

      if (!hasPermission) {
        console.log('[Notifications] Permission denied');
        return null;
      }

      // Get push token
      const token = await this.getExpoPushToken();

      if (token) {
        this.expoPushToken = token;

        // Register token with backend
        if (userId) {
          await this.registerToken(userId, token);
        }

        // Load and apply settings
        await this.loadSettings();

        this.isInitialized = true;

        if (ENV.DEBUG_MODE) {
          console.log('[Notifications] Initialized', { token, userId });
        }
      }

      return token;
    } catch (error) {
      console.error('[Notifications] Initialization failed:', error);
      return null;
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[Notifications] Permission not granted');
        return false;
      }

      // Android specific: configure notification channel
      if (Platform.OS === 'android') {
        await this.createNotificationChannels();
      }

      return true;
    } catch (error) {
      console.error('[Notifications] Failed to request permissions:', error);
      return false;
    }
  }

  /**
   * Get Expo push token
   */
  async getExpoPushToken(): Promise<string | null> {
    try {
      const token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: ENV.EXPO_PROJECT_ID,
        })
      ).data;

      // Save to storage
      await AsyncStorage.setItem('@gshop:push_token', token);

      return token;
    } catch (error) {
      console.error('[Notifications] Failed to get push token:', error);
      return null;
    }
  }

  /**
   * Register push token with backend
   */
  async registerToken(userId: string, token: string): Promise<void> {
    try {
      await this.apiClient.post('/notifications/register', {
        userId,
        token,
        platform: Platform.OS,
        deviceId: token, // Using token as device ID for simplicity
      });

      if (ENV.DEBUG_MODE) {
        console.log('[Notifications] Token registered with backend');
      }
    } catch (error) {
      console.error('[Notifications] Failed to register token:', error);
    }
  }

  /**
   * Unregister push token
   */
  async unregisterToken(userId: string): Promise<void> {
    try {
      if (!this.expoPushToken) return;

      await this.apiClient.post('/notifications/unregister', {
        userId,
        token: this.expoPushToken,
      });

      this.expoPushToken = null;
      await AsyncStorage.removeItem('@gshop:push_token');

      if (ENV.DEBUG_MODE) {
        console.log('[Notifications] Token unregistered');
      }
    } catch (error) {
      console.error('[Notifications] Failed to unregister token:', error);
    }
  }

  /**
   * Create Android notification channels
   */
  private async createNotificationChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Order Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });

    await Notifications.setNotificationChannelAsync('live', {
      name: 'Live Streams',
      importance: Notifications.AndroidImportance.DEFAULT,
    });

    await Notifications.setNotificationChannelAsync('promotions', {
      name: 'Promotions',
      importance: Notifications.AndroidImportance.LOW,
    });
  }

  /**
   * Show local notification
   */
  async showLocalNotification(data: NotificationData): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.body,
          data: { ...data.data, type: data.type },
          sound: true,
        },
        trigger: null, // Show immediately
      });

      if (ENV.DEBUG_MODE) {
        console.log('[Notifications] Local notification shown:', data.title);
      }
    } catch (error) {
      console.error('[Notifications] Failed to show local notification:', error);
    }
  }

  /**
   * Get notification settings
   */
  async getSettings(): Promise<NotificationSettings> {
    try {
      const stored = await AsyncStorage.getItem('@gshop:notification_settings');

      if (stored) {
        return JSON.parse(stored);
      }

      // Default settings
      return {
        enabled: true,
        orderUpdates: true,
        liveStreams: true,
        promotions: true,
        messages: true,
        affiliateUpdates: true,
      };
    } catch (error) {
      console.error('[Notifications] Failed to load settings:', error);
      return {
        enabled: true,
        orderUpdates: true,
        liveStreams: true,
        promotions: true,
        messages: true,
        affiliateUpdates: true,
      };
    }
  }

  /**
   * Update notification settings
   */
  async updateSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      const current = await this.getSettings();
      const updated = { ...current, ...settings };

      await AsyncStorage.setItem('@gshop:notification_settings', JSON.stringify(updated));

      // Sync with backend
      await this.syncSettings(updated);

      if (ENV.DEBUG_MODE) {
        console.log('[Notifications] Settings updated:', updated);
      }
    } catch (error) {
      console.error('[Notifications] Failed to update settings:', error);
    }
  }

  /**
   * Sync settings with backend
   */
  private async syncSettings(settings: NotificationSettings): Promise<void> {
    try {
      if (!this.expoPushToken) return;

      await this.apiClient.put('/notifications/settings', {
        token: this.expoPushToken,
        settings,
      });
    } catch (error) {
      console.error('[Notifications] Failed to sync settings:', error);
    }
  }

  /**
   * Load and apply settings
   */
  private async loadSettings(): Promise<void> {
    const settings = await this.getSettings();

    // Apply settings (e.g., disable certain channels)
    if (Platform.OS === 'android') {
      // Update channel importance based on settings
      if (!settings.orderUpdates) {
        await Notifications.setNotificationChannelAsync('orders', {
          name: 'Order Updates',
          importance: Notifications.AndroidImportance.NONE,
        });
      }
    }
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('[Notifications] Failed to get badge count:', error);
      return 0;
    }
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('[Notifications] Failed to set badge count:', error);
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await this.setBadgeCount(0);

      if (ENV.DEBUG_MODE) {
        console.log('[Notifications] All notifications cleared');
      }
    } catch (error) {
      console.error('[Notifications] Failed to clear notifications:', error);
    }
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const notificationsService = new NotificationsService();
export default notificationsService;