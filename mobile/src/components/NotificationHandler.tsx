/**
 * Notification Handler Component
 *
 * Global notification handler that initializes push notifications
 * and handles navigation when users tap on notifications.
 */

import React, { useEffect, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import notificationsService, { NotificationType } from '../services/notifications.service';

interface NotificationData {
  type?: NotificationType | string;
  streamId?: string;
  orderId?: string;
  productId?: string;
  [key: string]: any;
}

const NotificationHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuth();
  const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const isInitialized = useRef(false);

  // Initialize notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id && !isInitialized.current) {
      notificationsService.initialize(user.id);
      isInitialized.current = true;
      console.log('[NotificationHandler] Initialized for user:', user.id);
    }
  }, [isAuthenticated, user?.id]);

  // Handle notification navigation
  const handleNotificationNavigation = useCallback(
    (data: NotificationData) => {
      console.log('[NotificationHandler] Handling notification:', data);

      const type = data.type;

      switch (type) {
        case NotificationType.LIVE_STREAM_STARTED:
        case 'live':
          if (data.streamId) {
            navigation.dispatch(
              CommonActions.navigate({
                name: 'Live',
                params: {
                  screen: 'LiveStream',
                  params: { streamId: data.streamId },
                },
              })
            );
          }
          break;

        case NotificationType.ORDER_UPDATE:
        case NotificationType.SHIPPING_UPDATE:
        case 'order':
          if (data.orderId) {
            navigation.dispatch(
              CommonActions.navigate({
                name: 'Profile',
                params: {
                  screen: 'OrderDetails',
                  params: { orderId: data.orderId },
                },
              })
            );
          }
          break;

        case NotificationType.PRICE_DROP:
        case NotificationType.WISHLIST_BACK_IN_STOCK:
        case 'price_drop':
          if (data.productId) {
            navigation.dispatch(
              CommonActions.navigate({
                name: 'Home',
                params: {
                  screen: 'ProductDetail',
                  params: { productId: data.productId },
                },
              })
            );
          }
          break;

        case NotificationType.PROMOTION:
        case 'promotion':
          navigation.dispatch(
            CommonActions.navigate({
              name: 'Home',
            })
          );
          break;

        default:
          // For unknown types, try to navigate based on data
          if (data.streamId) {
            navigation.dispatch(
              CommonActions.navigate({
                name: 'Live',
                params: {
                  screen: 'LiveStream',
                  params: { streamId: data.streamId },
                },
              })
            );
          } else if (data.orderId) {
            navigation.dispatch(
              CommonActions.navigate({
                name: 'Profile',
                params: {
                  screen: 'OrderDetails',
                  params: { orderId: data.orderId },
                },
              })
            );
          } else if (data.productId) {
            navigation.dispatch(
              CommonActions.navigate({
                name: 'Home',
                params: {
                  screen: 'ProductDetail',
                  params: { productId: data.productId },
                },
              })
            );
          }
          break;
      }
    },
    [navigation]
  );

  // Handle notification tapped
  const handleNotificationTapped = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as unknown as NotificationData;
      console.log('[NotificationHandler] Notification tapped:', data);
      handleNotificationNavigation(data);
    },
    [handleNotificationNavigation]
  );

  // Handle notification received while app is foregrounded
  const handleNotificationReceived = useCallback(
    (notification: Notifications.Notification) => {
      const data = notification.request.content.data as unknown as NotificationData;
      console.log('[NotificationHandler] Notification received in foreground:', data);
      // Could show in-app banner here if needed
    },
    []
  );

  // Set up notification listeners
  useEffect(() => {
    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      handleNotificationReceived
    );

    // Listen for user tapping on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationTapped
    );

    // Check if app was opened from a notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationTapped(response);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [handleNotificationTapped, handleNotificationReceived]);

  return <>{children}</>;
};

export default NotificationHandler;
