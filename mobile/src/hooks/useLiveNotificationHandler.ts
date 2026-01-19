/**
 * Live Notification Handler Hook
 *
 * Handles navigation when user taps on a live stream notification.
 * Integrates with the notification system to navigate to live streams.
 */

import { useEffect, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NotificationType } from '../services/notifications.service';

interface LiveNotificationData {
  type: NotificationType;
  streamId?: string;
  streamerName?: string;
}

/**
 * Hook to handle live stream notifications
 * Automatically navigates to the live stream when user taps notification
 */
export const useLiveNotificationHandler = () => {
  const navigation = useNavigation();
  const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);

  const handleNotificationTap = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as unknown as LiveNotificationData;

      console.log('[LiveNotificationHandler] Notification tapped:', data);

      if (data?.type === NotificationType.LIVE_STREAM_STARTED && data?.streamId) {
        // Navigate to the live stream
        navigation.dispatch(
          CommonActions.navigate({
            name: 'LiveStream',
            params: { streamId: data.streamId },
          })
        );
      }
    },
    [navigation]
  );

  const handleNotificationReceived = useCallback(
    (notification: Notifications.Notification) => {
      const data = notification.request.content.data as unknown as LiveNotificationData;

      console.log('[LiveNotificationHandler] Notification received:', data);

      // Could show an in-app banner here if needed
    },
    []
  );

  useEffect(() => {
    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      handleNotificationReceived
    );

    // Listen for user tapping on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationTap
    );

    // Check if app was opened from a notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationTap(response);
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
  }, [handleNotificationTap, handleNotificationReceived]);

  return {
    handleNotificationTap,
    handleNotificationReceived,
  };
};

export default useLiveNotificationHandler;
