---
name: build
description: Mobile build guide - APK generation, iOS builds, EAS, local builds
---

# Mobile Build Guide

Complete guide for building and installing the GSHOP mobile app.

## Environment Variables (Critical)

Environment variables are in `.env` files. Configuration depends on build method.

### File Structure

```
mobile/
├── .env.development    # Development variables
├── .env.production     # Production variables (create if needed)
└── .env                # EAS Build auto-detects this
```

### Configuring API URL for APK (VERY IMPORTANT)

`.env` variables don't always load correctly during build. To ensure the APK uses the correct backend URL, **modify `app.config.js` directly**.

**File:** `mobile/app.config.js` (lines 107 and 109)

```javascript
extra: {
  API_BASE_URL: process.env.API_BASE_URL || 'https://YOUR-URL-HERE.ngrok-free.app',
  WEBSOCKET_URL: process.env.WEBSOCKET_URL || 'https://YOUR-URL-HERE.ngrok-free.app',
}
```

> **Note**: ngrok URLs change on restart. Update `app.config.js` and regenerate the APK.

### Quick Reference

| Method | What to do |
|--------|-----------|
| Expo Go | Nothing, uses `.env.development` automatically |
| EAS Build (dev) | `cp .env.development .env` |
| EAS Build (prod) | Use `eas secret:create` |
| Local Build | `cp .env.development .env` |

---

## Method 1: Expo Go (Easiest - Development)

Test the app in minutes without compiling.

```bash
cd mobile
npm start
```

1. Download "Expo Go" from Play Store or App Store
2. Scan the QR code that appears in terminal
3. Phone and computer must be on same WiFi network

---

## Method 2: APK with EAS Build (Cloud)

Generates an installable APK file using Expo's cloud build service.

### First-time setup

```bash
npm install -g eas-cli
eas login  # Create account at https://expo.dev/signup
```

### Generate APK

```bash
cd mobile
eas build --platform android --profile preview
```

Build takes ~10-15 minutes. Download link provided when complete.

### Clear cache if build fails

```bash
eas build --platform android --profile preview --clear-cache
```

---

## Method 3: Local Android Build (No Expo Account)

Build locally without cloud services.

### Prerequisites

- Android Studio (includes Java 21)
- JAVA_HOME configured

### Setup JAVA_HOME

**macOS:**
```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```

**Windows:**
- `JAVA_HOME` = `C:\Program Files\Android\Android Studio\jbr`
- `ANDROID_HOME` = `C:\Users\YOUR_USER\AppData\Local\Android\Sdk`

### Build Steps

```bash
cd mobile

# Clean install (important for Metro bundler conflicts)
rm -rf node_modules package-lock.json android
npm install

# Generate Android project
npx expo prebuild --platform android

# Build APK
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
cd android
./gradlew assembleRelease   # macOS/Linux
gradlew.bat assembleRelease # Windows
```

### APK Location

```
mobile/android/app/build/outputs/apk/release/app-release.apk
```

Size: ~105 MB

### Install on Device

```bash
# With ADB (recommended)
adb install android/app/build/outputs/apk/release/app-release.apk

# Or transfer manually and install from file manager
```

---

## iOS Builds

### Expo Go (Any OS)

Same as Method 1 - scan QR with iPhone camera.

### EAS Build (Cloud - No Mac Required)

```bash
eas build --platform ios --profile preview
```

Requires Apple Developer account ($99/year) for device installation.

### Local Build (Mac Only)

```bash
cd mobile
npx expo prebuild --platform ios
npx expo run:ios --device
```

### TestFlight Distribution

```bash
eas build --platform ios --profile production
eas submit --platform ios
```

---

## Common Errors & Solutions

### "Package subpath './src/lib/TerminalReporter' is not defined"

Metro bundler version conflict:

```bash
cd mobile
rm -rf node_modules package-lock.json android
npm install
npx expo prebuild --platform android
```

### "Missing classes detected while running R8"

Add to `android/app/proguard-rules.pro`:

```proguard
# Stripe Push Provisioning
-dontwarn com.stripe.android.pushProvisioning.**
-keep class com.stripe.android.pushProvisioning.** { *; }

# Amazon IVS Broadcast (Cronet)
-dontwarn org.chromium.net.**
-keep class org.chromium.net.** { *; }
```

### "Unable to resolve module expo-file-system/legacy"

Change import:

```typescript
// Wrong (SDK 52)
import * as FileSystem from 'expo-file-system/legacy';

// Correct
import * as FileSystem from 'expo-file-system';
```

### Build slow or out of memory

Edit `android/gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

### "JAVA_HOME is not set"

Export before running gradlew:

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```

### "Unknown sources" installation blocked

Settings > Security > Enable "Install unknown apps" for your file manager or browser.

---

## Quick Commands Reference

### macOS/Linux

```bash
# Expo Go
cd mobile && npm start

# EAS APK
cd mobile && eas build --platform android --profile preview

# Local APK
cd mobile
rm -rf android node_modules package-lock.json
npm install
npx expo prebuild --platform android
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
cd android && ./gradlew assembleRelease

# iOS with Xcode
cd mobile && npx expo run:ios --device
```

### Windows

```bash
# Expo Go
cd mobile && npm start

# EAS APK
cd mobile && eas build --platform android --profile preview

# Local APK
cd mobile
rmdir /s /q android node_modules
del package-lock.json
npm install
npx expo prebuild --platform android
cd android && gradlew.bat assembleRelease
```

---

## Platform Comparison

| Feature | Windows | Mac |
|---------|---------|-----|
| Expo Go (Android) | Yes | Yes |
| Expo Go (iOS) | Yes | Yes |
| Local APK | Yes | Yes |
| EAS Build Android | Yes | Yes |
| EAS Build iOS | Yes | Yes |
| Local iOS Build | No (needs Xcode) | Yes |
| iOS Simulator | No | Yes |

---

## Full Documentation

See `docs/MOBILE_BUILD_GUIDE.md` for the complete guide with additional details.
