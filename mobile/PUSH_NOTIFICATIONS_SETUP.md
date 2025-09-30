# 🔔 Push Notifications Setup Guide

Complete guide for configuring and using push notifications in the GSHOP mobile app.

## 📋 Prerequisites

1. **Expo Account**: Sign up at [expo.dev](https://expo.dev)
2. **EAS Project**: Create a project in Expo dashboard
3. **APNs Certificate** (iOS): Apple Push Notification service certificate
4. **FCM API Key** (Android): Firebase Cloud Messaging credentials

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd mobile
npm install expo-notifications
```

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
EXPO_PROJECT_ID=your-expo-project-id-here
FCM_SENDER_ID=your-fcm-sender-id-here
```

### 3. Initialize in App

In your `App.tsx`:

```typescript
import { useEffect } from 'react';
import { useNotifications } from './hooks/useNotifications';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { initialize } = useNotifications();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      initialize(user.id);
    }
  }, [user]);

  // ... rest of app
}
```

## 🔧 Configuration

### iOS Setup (APNs)

1. **Create APNs Key in Apple Developer**:
   - Go to [Apple Developer Console](https://developer.apple.com/account)
   - Navigate to Certificates, Identifiers & Profiles
   - Create a new Key with APNs enabled
   - Download the `.p8` file

2. **Upload to Expo**:
   ```bash
   eas credentials
   ```
   - Select iOS
   - Upload APNs key (.p8 file)
   - Provide Key ID and Team ID

3. **Add capability to app.json**:
   ```json
   {
     "ios": {
       "infoPlist": {
         "UIBackgroundModes": ["remote-notification"]
       }
     }
   }
   ```

### Android Setup (FCM)

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create new project
   - Add Android app with package name: `com.gshop.app`

2. **Get FCM Server Key**:
   - In Firebase Console → Project Settings → Cloud Messaging
   - Copy Server Key and Sender ID

3. **Upload to Expo**:
   ```bash
   eas credentials
   ```
   - Select Android
   - Upload FCM Server Key

4. **Add to app.json**:
   ```json
   {
     "android": {
       "googleServicesFile": "./google-services.json"
     }
   }
   ```

### Notification Icon & Sound

1. **Icon** (Android): Place `notification-icon.png` in `/assets`
   - Size: 96x96px
   - White icon on transparent background
   - PNG format

2. **Sound**: Place `notification-sound.wav` in `/assets`
   - WAV or MP3 format
   - Keep it short (< 5 seconds)

## 📱 Usage Examples

### Basic Notification Handling

```typescript
import { useNotificationHandler } from '@/hooks/useNotifications';
import { useNavigation } from '@react-navigation/native';

function App() {
  const navigation = useNavigation();

  // Handle notification taps
  useNotificationHandler(
    // When notification received (app in foreground)
    (notification) => {
      console.log('Notification received:', notification);
    },
    // When notification tapped
    (response) => {
      const data = response.notification.request.content.data;

      // Navigate based on notification type
      switch (data.type) {
        case 'order_update':
          navigation.navigate('OrderDetail', { orderId: data.orderId });
          break;
        case 'live_stream_started':
          navigation.navigate('LiveStream', { streamId: data.streamId });
          break;
        default:
          break;
      }
    }
  );

  return <>{/* Your app */}</>;
}
```

### Request Permissions

```typescript
import { useNotificationPermissions } from '@/hooks/useNotifications';

function SettingsScreen() {
  const { hasPermission, requestPermissions } = useNotificationPermissions();

  const handleEnableNotifications = async () => {
    const granted = await requestPermissions();

    if (granted) {
      Alert.alert('Success', 'Notifications enabled!');
    } else {
      Alert.alert('Error', 'Notification permission denied');
    }
  };

  return (
    <View>
      <Text>Notifications: {hasPermission ? 'Enabled' : 'Disabled'}</Text>
      {!hasPermission && (
        <Button title="Enable Notifications" onPress={handleEnableNotifications} />
      )}
    </View>
  );
}
```

### Manage Notification Settings

```typescript
import { useNotificationSettings } from '@/hooks/useNotifications';

function NotificationSettingsScreen() {
  const { settings, updateSetting, isLoading } = useNotificationSettings();

  if (isLoading || !settings) return <LoadingState />;

  return (
    <ScrollView>
      <Switch
        value={settings.orderUpdates}
        onValueChange={(value) => updateSetting('orderUpdates', value)}
      />
      <Text>Order Updates</Text>

      <Switch
        value={settings.liveStreams}
        onValueChange={(value) => updateSetting('liveStreams', value)}
      />
      <Text>Live Stream Notifications</Text>

      <Switch
        value={settings.promotions}
        onValueChange={(value) => updateSetting('promotions', value)}
      />
      <Text>Promotions & Deals</Text>
    </ScrollView>
  );
}
```

### Show Local Notifications

```typescript
import { useLocalNotifications } from '@/hooks/useNotifications';

function OrderTrackingScreen({ order }) {
  const { showOrderUpdate } = useLocalNotifications();

  useEffect(() => {
    if (order.status === 'shipped') {
      showOrderUpdate(
        order.id,
        `Your order has shipped! Tracking: ${order.trackingNumber}`
      );
    }
  }, [order.status]);

  return <View>{/* Order details */}</View>;
}
```

### Badge Count Management

```typescript
import { useBadgeCount } from '@/hooks/useNotifications';

function NotificationsScreen() {
  const { count, clearBadge } = useBadgeCount();

  useEffect(() => {
    // Clear badge when screen is viewed
    clearBadge();
  }, []);

  return (
    <View>
      <Text>You have {count} unread notifications</Text>
    </View>
  );
}
```

## 🎯 Notification Types

### Order Updates
```typescript
{
  type: 'order_update',
  title: 'Order Update',
  body: 'Your order has been shipped!',
  data: { orderId: '123' }
}
```

### Live Stream Alerts
```typescript
{
  type: 'live_stream_started',
  title: 'Live Stream Started!',
  body: 'John Doe just went live',
  data: { streamId: '456', hostId: '789' }
}
```

### Price Drop Alerts
```typescript
{
  type: 'price_drop',
  title: 'Price Drop Alert!',
  body: 'Product is now $49.99 (was $69.99)',
  data: { productId: '123', oldPrice: 69.99, newPrice: 49.99 }
}
```

### Affiliate Commission
```typescript
{
  type: 'affiliate_commission',
  title: 'New Commission Earned!',
  body: 'You earned $15.50 from a sale',
  data: { amount: 15.50, orderId: '123' }
}
```

## 🔔 Android Notification Channels

Channels are automatically created:

- **default**: General notifications
- **orders**: Order updates (high priority)
- **live**: Live stream alerts (normal priority)
- **promotions**: Marketing messages (low priority)

Users can customize per-channel settings in Android system settings.

## 🧪 Testing

### Test with Expo Push Tool

1. Get your push token:
   ```typescript
   const { pushToken } = useNotifications();
   console.log('Push Token:', pushToken);
   ```

2. Send test notification:
   - Go to [Expo Push Notification Tool](https://expo.dev/notifications)
   - Paste your token
   - Compose message
   - Send

### Test Locally

```typescript
import { useLocalNotifications } from '@/hooks/useNotifications';

function TestScreen() {
  const { showNotification } = useLocalNotifications();

  const testNotification = () => {
    showNotification({
      type: 'order_update',
      title: 'Test Notification',
      body: 'This is a test!',
      data: { test: true },
    });
  };

  return <Button title="Test Notification" onPress={testNotification} />;
}
```

## 🚨 Troubleshooting

### Notifications Not Showing

1. **Check permissions**:
   ```typescript
   const { hasPermission } = useNotificationPermissions();
   console.log('Has permission:', hasPermission);
   ```

2. **Verify push token**:
   ```typescript
   const { pushToken } = useNotifications();
   console.log('Push token:', pushToken);
   ```

3. **Check backend registration**:
   - Ensure token is being sent to backend
   - Verify backend API endpoint is working

4. **iOS Specific**:
   - Only works on physical devices (not simulator)
   - Requires valid APNs certificate

5. **Android Specific**:
   - Check FCM server key is correct
   - Verify google-services.json is present

### Permission Denied

```typescript
// Check if user previously denied
const { hasPermission, requestPermissions } = useNotificationPermissions();

if (!hasPermission) {
  // Show explanation UI
  Alert.alert(
    'Enable Notifications',
    'Get notified about orders, live streams, and more!',
    [
      { text: 'Not Now', style: 'cancel' },
      {
        text: 'Enable',
        onPress: async () => {
          const granted = await requestPermissions();
          if (!granted) {
            // User denied - show settings link
            Linking.openSettings();
          }
        },
      },
    ]
  );
}
```

## 📊 Best Practices

### DO:
✅ Request permission at appropriate time (not on app launch)
✅ Explain why you need permission
✅ Allow users to customize notification types
✅ Clear badges when notifications are viewed
✅ Use appropriate notification channels
✅ Test on physical devices

### DON'T:
❌ Spam users with too many notifications
❌ Send marketing notifications without consent
❌ Request permission without context
❌ Test only in simulator (iOS)
❌ Forget to handle notification taps
❌ Send sensitive data in notification body

## 🔒 Privacy & Security

- Never send sensitive data (passwords, payment info) in notifications
- Use notification data field for IDs, not full content
- Respect user's notification preferences
- Provide easy opt-out options
- Follow platform guidelines (APNs, FCM)

## 📚 Additional Resources

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [APNs Documentation](https://developer.apple.com/documentation/usernotifications)
- [FCM Documentation](https://firebase.google.com/docs/cloud-messaging)
- [EAS Build Configuration](https://docs.expo.dev/build/introduction/)

---

**Last Updated:** 2025-09-30
**Version:** 1.0.0