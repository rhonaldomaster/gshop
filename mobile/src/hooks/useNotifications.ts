/**
 * Notifications Hooks
 *
 * React hooks for managing push notifications in the app.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import notificationsService, {
  NotificationData,
  NotificationSettings,
  NotificationType,
} from '../services/notifications.service';

/**
 * Main notifications hook
 */
export const useNotifications = () => {
  const [isReady, setIsReady] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);

  useEffect(() => {
    setIsReady(notificationsService.isReady());
    setPushToken(notificationsService.getPushToken());
  }, []);

  const initialize = useCallback(async (userId?: string) => {
    const token = await notificationsService.initialize(userId);
    setPushToken(token);
    setIsReady(true);

    const currentSettings = await notificationsService.getSettings();
    setSettings(currentSettings);
  }, []);

  const showNotification = useCallback(async (data: NotificationData) => {
    await notificationsService.showLocalNotification(data);
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    await notificationsService.updateSettings(newSettings);
    const updated = await notificationsService.getSettings();
    setSettings(updated);
  }, []);

  const clearAll = useCallback(async () => {
    await notificationsService.clearAllNotifications();
  }, []);

  return {
    isReady,
    pushToken,
    settings,
    initialize,
    showNotification,
    updateSettings,
    clearAll,
  };
};

/**
 * Hook to handle notification interactions
 */
export const useNotificationHandler = (
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
) => {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Listen for incoming notifications when app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    // Listen for user tapping on notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      if (onNotificationTapped) {
        onNotificationTapped(response);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [onNotificationReceived, onNotificationTapped]);
};

/**
 * Hook for notification permissions
 */
export const useNotificationPermissions = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    setIsLoading(true);
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Failed to check permissions:', error);
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = async () => {
    const granted = await notificationsService.requestPermissions();
    setHasPermission(granted);
    return granted;
  };

  return {
    hasPermission,
    isLoading,
    requestPermissions,
    checkPermissions,
  };
};

/**
 * Hook for badge count management
 */
export const useBadgeCount = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    loadBadgeCount();
  }, []);

  const loadBadgeCount = async () => {
    const badgeCount = await notificationsService.getBadgeCount();
    setCount(badgeCount);
  };

  const updateBadgeCount = async (newCount: number) => {
    await notificationsService.setBadgeCount(newCount);
    setCount(newCount);
  };

  const incrementBadge = async () => {
    const newCount = count + 1;
    await updateBadgeCount(newCount);
  };

  const decrementBadge = async () => {
    const newCount = Math.max(0, count - 1);
    await updateBadgeCount(newCount);
  };

  const clearBadge = async () => {
    await updateBadgeCount(0);
  };

  return {
    count,
    updateBadgeCount,
    incrementBadge,
    decrementBadge,
    clearBadge,
    refresh: loadBadgeCount,
  };
};

/**
 * Hook for notification settings management
 */
export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const currentSettings = await notificationsService.getSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    if (!settings) return;

    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await notificationsService.updateSettings({ [key]: value });
  };

  const resetSettings = async () => {
    const defaultSettings: NotificationSettings = {
      enabled: true,
      orderUpdates: true,
      liveStreams: true,
      promotions: true,
      messages: true,
      affiliateUpdates: true,
    };

    setSettings(defaultSettings);
    await notificationsService.updateSettings(defaultSettings);
  };

  return {
    settings,
    isLoading,
    updateSetting,
    resetSettings,
    refresh: loadSettings,
  };
};

/**
 * Hook for sending local notifications
 */
export const useLocalNotifications = () => {
  const showNotification = useCallback(async (data: NotificationData) => {
    await notificationsService.showLocalNotification(data);
  }, []);

  // Helper methods for common notification types
  const showOrderUpdate = useCallback(
    async (orderId: string, message: string) => {
      await showNotification({
        type: NotificationType.ORDER_UPDATE,
        title: 'Order Update',
        body: message,
        data: { orderId },
      });
    },
    [showNotification]
  );

  const showLiveStreamNotification = useCallback(
    async (streamId: string, hostName: string) => {
      await showNotification({
        type: NotificationType.LIVE_STREAM_STARTED,
        title: 'Live Stream Started!',
        body: `${hostName} just went live`,
        data: { streamId },
      });
    },
    [showNotification]
  );

  const showPriceDropNotification = useCallback(
    async (productId: string, productName: string, oldPrice: number, newPrice: number) => {
      await showNotification({
        type: NotificationType.PRICE_DROP,
        title: 'Price Drop Alert!',
        body: `${productName} is now $${newPrice} (was $${oldPrice})`,
        data: { productId, oldPrice, newPrice },
      });
    },
    [showNotification]
  );

  return {
    showNotification,
    showOrderUpdate,
    showLiveStreamNotification,
    showPriceDropNotification,
  };
};

export default useNotifications;