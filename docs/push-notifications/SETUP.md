# Push Notifications Setup Guide

This guide explains how to configure push notifications for the GSHOP mobile app using Expo and Firebase Cloud Messaging (FCM).

## Prerequisites

- Expo account ([expo.dev](https://expo.dev))
- Firebase project ([console.firebase.google.com](https://console.firebase.google.com))
- EAS CLI installed (`npm install -g eas-cli`)

## Step 1: Create Expo Project

1. Go to [expo.dev](https://expo.dev) and sign in
2. Create a new project or select your existing GSHOP project
3. Copy your **Project ID** from the project settings

## Step 2: Configure Firebase (Android)

### 2.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" and follow the wizard
3. Name it something like "gshop-mobile"

### 2.2 Add Android App

1. In your Firebase project, click "Add app" > Android
2. Enter the package name: `com.gshop.mobile` (or your actual package name from `app.json`)
3. Download the `google-services.json` file
4. Place it in `/mobile/` directory

### 2.3 Get FCM Sender ID

1. Go to Project Settings > Cloud Messaging
2. Copy the **Sender ID** (it's a number like `123456789012`)

## Step 3: Configure Firebase (iOS)

### 3.1 Add iOS App

1. In Firebase Console, click "Add app" > iOS
2. Enter the bundle ID from your `app.json` (e.g., `com.gshop.mobile`)
3. Download the `GoogleService-Info.plist` file
4. Place it in `/mobile/` directory

### 3.2 Generate APNs Key

1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Navigate to Certificates, Identifiers & Profiles > Keys
3. Create a new key with "Apple Push Notifications service (APNs)" enabled
4. Download the `.p8` file and note the Key ID

### 3.3 Upload APNs Key to Firebase

1. In Firebase Console > Project Settings > Cloud Messaging
2. Under "Apple app configuration", upload your APNs key
3. Enter your Key ID and Team ID

## Step 4: Configure Environment Variables

Update your `.env.development` (and `.env.production` for production):

```bash
# Push Notifications
EXPO_PROJECT_ID=your-expo-project-id-here
FCM_SENDER_ID=123456789012
```

### Where to find these values:

| Variable | Location |
|----------|----------|
| `EXPO_PROJECT_ID` | Expo Dashboard > Your Project > Project ID |
| `FCM_SENDER_ID` | Firebase Console > Project Settings > Cloud Messaging > Sender ID |

## Step 5: Configure app.json

Ensure your `mobile/app.json` has the correct configuration:

```json
{
  "expo": {
    "name": "GSHOP",
    "slug": "gshop",
    "android": {
      "package": "com.gshop.mobile",
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "bundleIdentifier": "com.gshop.mobile",
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "your-expo-project-id-here"
      }
    }
  }
}
```

## Step 6: EAS Build Configuration

For push notifications to work on physical devices, you need to build with EAS:

```bash
# Login to Expo
eas login

# Configure EAS (first time only)
eas build:configure

# Build for development
eas build --profile development --platform android
eas build --profile development --platform ios

# Build for production
eas build --profile production --platform all
```

## Step 7: Backend Configuration

Ensure your backend has the Expo push notification credentials configured.

Add to `backend/.env`:

```bash
# Expo Push Notifications
EXPO_ACCESS_TOKEN=your-expo-access-token
```

Get the access token from: Expo Dashboard > Account Settings > Access Tokens

## Testing Push Notifications

### Using Expo Push Notifications Tool

1. Go to [expo.dev/notifications](https://expo.dev/notifications)
2. Enter your Expo Push Token (logged in the app console)
3. Send a test notification

### Using the App

1. Start the mobile app
2. Check the console for: `[Notifications] Initialized { token: 'ExponentPushToken[...]' }`
3. Copy the token and use it to send test notifications

### Local Testing (Development)

```typescript
// In your app, you can trigger a local notification:
import { notificationsService } from './services/notifications.service';

notificationsService.showLocalNotification({
  type: NotificationType.ORDER_UPDATE,
  title: 'Test Notification',
  body: 'This is a test notification!',
});
```

## Troubleshooting

### Error: SERVICE_NOT_AVAILABLE

This error occurs when:
- `EXPO_PROJECT_ID` is not configured
- Firebase/FCM is not properly set up
- Running on emulator without Google Play Services

**Solution:** Configure the environment variables or test on a physical device.

### Error: MISSING_INSTANCEID_SERVICE

This happens on Android emulators without Google Play Services.

**Solution:** Use a physical device or an emulator with Google Play Services (e.g., Pixel emulator).

### Notifications not showing on iOS

1. Check that APNs key is uploaded to Firebase
2. Ensure the app has notification permissions
3. Verify the bundle ID matches in all configurations

### Token is null

The token might be null if:
- Permissions were denied
- `EXPO_PROJECT_ID` is not configured
- Running in Expo Go (limited push support)

**Solution:** Build with EAS for full push notification support.

## Notification Channels (Android)

The app creates these notification channels:

| Channel | Purpose | Importance |
|---------|---------|------------|
| `default` | General notifications | MAX |
| `orders` | Order updates | HIGH |
| `live` | Live stream notifications | DEFAULT |
| `promotions` | Promotional content | LOW |

Users can customize these in Android system settings.

## Security Considerations

- Never commit `google-services.json` or `GoogleService-Info.plist` to public repositories
- Add these files to `.gitignore`
- Use environment variables for sensitive configuration
- Validate push tokens on the backend before sending notifications

## Related Files

- `mobile/src/services/notifications.service.ts` - Main notifications service
- `mobile/src/config/env.config.ts` - Environment configuration
- `mobile/.env.development` - Development environment variables
- `mobile/.env.production` - Production environment variables
- `mobile/app.json` - Expo app configuration
