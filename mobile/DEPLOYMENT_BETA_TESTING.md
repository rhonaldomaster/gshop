# 🚀 Deployment & Beta Testing Guide

Complete guide for deploying GSHOP mobile app and setting up beta testing with TestFlight (iOS) and Google Play Console (Android).

## 📋 Prerequisites

### Required Accounts
- [ ] **Apple Developer Account** ($99/year) - [developer.apple.com](https://developer.apple.com)
- [ ] **Google Play Developer Account** ($25 one-time) - [play.google.com/console](https://play.google.com/console)
- [ ] **Expo Account** (Free) - [expo.dev](https://expo.dev)

### Required Tools
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Verify installation
eas --version
```

## 🍎 iOS Deployment (TestFlight)

### Step 1: Apple Developer Setup

#### 1.1 Create App Identifier

1. Go to [Apple Developer Console](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** (Add)
4. Select **App IDs** → Click **Continue**
5. Configure:
   - Description: `GSHOP`
   - Bundle ID: `com.gshop.app` (Explicit)
   - Capabilities:
     - ✅ Push Notifications
     - ✅ Associated Domains (for universal links)
     - ✅ Sign in with Apple (optional)
6. Click **Continue** → **Register**

#### 1.2 Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - Platform: **iOS**
   - Name: **GSHOP**
   - Primary Language: **English (U.S.)**
   - Bundle ID: `com.gshop.app`
   - SKU: `gshop-mobile-ios`
   - User Access: **Full Access**
4. Click **Create**

#### 1.3 Configure App Information

In App Store Connect:

1. **App Information**:
   - Privacy Policy URL: `https://gshop.com/privacy`
   - Category: Primary: **Shopping**, Secondary: **Social Networking**
   - Content Rights: Check if applicable

2. **Pricing and Availability**:
   - Price: **Free**
   - Availability: **All countries**

### Step 2: Configure EAS Build for iOS

#### 2.1 Update eas.json

Already configured in `eas.json`:

```json
{
  "build": {
    "production": {
      "ios": {
        "autoIncrement": true
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD123456"
      }
    }
  }
}
```

#### 2.2 Get Apple Team ID

```bash
# List your Apple teams
eas device:list

# Or find it in Apple Developer Console → Membership
```

#### 2.3 Get ASC App ID

1. Go to App Store Connect
2. Open your app
3. Copy the ID from URL: `https://appstoreconnect.apple.com/apps/[THIS_IS_YOUR_ID]/appstore`

#### 2.4 Update eas.json with Your IDs

```bash
# Edit eas.json
nano mobile/eas.json

# Update:
"appleId": "your-actual-apple-id@example.com"
"ascAppId": "1234567890"  # From App Store Connect URL
"appleTeamId": "ABCD123456"  # From Apple Developer Console
```

### Step 3: Build for iOS

#### 3.1 Configure Credentials

```bash
cd mobile

# Configure iOS credentials
eas credentials

# Select:
# - iOS
# - Production
# - Set up push notification key (for notifications)
# - Set up distribution certificate (for App Store)
```

#### 3.2 Build Production IPA

```bash
# Build for iOS App Store
eas build --platform ios --profile production

# This will:
# 1. Upload your code to Expo servers
# 2. Build the app
# 3. Generate IPA file
# 4. Provide download link
```

**Build time**: ~15-20 minutes

### Step 4: Submit to TestFlight

#### 4.1 Automatic Submission (Recommended)

```bash
# Submit to TestFlight
eas submit --platform ios --profile production

# Follow prompts:
# - Select the build you just created
# - Confirm submission
```

#### 4.2 Manual Submission (Alternative)

1. Download IPA from EAS build page
2. Use Transporter app:
   - Open **Transporter** (Mac App Store)
   - Drag IPA file
   - Click **Deliver**

### Step 5: TestFlight Setup

#### 5.1 Configure TestFlight

1. Go to **App Store Connect** → **My Apps** → **GSHOP**
2. Click **TestFlight** tab
3. Select your build (processing takes 5-10 minutes)

#### 5.2 Add Beta Test Information

1. **Test Information**:
   - Beta App Name: `GSHOP`
   - Beta App Description: Brief description for testers
   - Feedback Email: `beta@gshop.com`
   - Marketing URL: `https://gshop.com`
   - Privacy Policy URL: `https://gshop.com/privacy`

2. **Export Compliance**:
   - Select "No" if not using encryption (most apps)
   - Or select "Yes" and provide documentation

#### 5.3 Add Internal Testers

1. Click **Internal Testing**
2. Click **+** next to Testers
3. Add testers (up to 100):
   - Enter their Apple IDs (email)
   - They'll receive email invitation

#### 5.4 Add External Testers (Optional)

1. Click **External Testing**
2. Create test group
3. Add testers (up to 10,000)
4. **Note**: Requires App Review for first build

### Step 6: Distribute to Testers

Testers receive email invitation:

1. **Install TestFlight** app from App Store
2. **Tap invitation link** in email
3. **Accept** invitation
4. **Install** GSHOP beta
5. **Provide feedback** through TestFlight app

---

## 🤖 Android Deployment (Google Play)

### Step 1: Google Play Console Setup

#### 1.1 Create New App

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **Create app**
3. Fill in:
   - App name: **GSHOP**
   - Default language: **English (United States)**
   - App or game: **App**
   - Free or paid: **Free**
4. Accept terms → Click **Create app**

#### 1.2 Complete App Details

1. **Store presence** → **Main store listing**:
   - Short description (80 chars)
   - Full description (4000 chars)
   - App icon (512x512 PNG)
   - Feature graphic (1024x500)
   - Screenshots (at least 2)
   - Category: **Shopping**

2. **Policy** → **Privacy Policy**:
   - URL: `https://gshop.com/privacy`

3. **App access**:
   - All functionality available without restrictions
   - Or specify login requirements

4. **Content rating**:
   - Complete questionnaire
   - Submit for rating

5. **Target audience**:
   - Age groups: 18+

6. **Data safety**:
   - Complete data safety form
   - Describe data collection practices

### Step 2: Configure EAS Build for Android

#### 2.1 Generate Upload Keystore

```bash
cd mobile

# Generate keystore for Google Play
eas credentials

# Select:
# - Android
# - Production
# - Generate new keystore
```

This creates and stores your keystore securely with Expo.

#### 2.2 Get Service Account Key

For automated submission:

1. Go to **Google Play Console**
2. **Setup** → **API access**
3. Click **Create new service account**
4. Follow instructions to create service account in Google Cloud Console
5. Grant permissions: **Release Manager**
6. Download JSON key file
7. Save as `google-play-service-account.json` in mobile directory
8. **Add to .gitignore** (never commit this file!)

#### 2.3 Update eas.json

```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### Step 3: Build for Android

#### 3.1 Build Production AAB

```bash
# Build Android App Bundle
eas build --platform android --profile production

# This will:
# 1. Upload code to Expo
# 2. Build AAB file
# 3. Sign with your keystore
# 4. Provide download link
```

**Build time**: ~15-20 minutes

### Step 4: Submit to Google Play

#### 4.1 Automatic Submission (Recommended)

```bash
# Submit to internal testing track
eas submit --platform android --profile production

# Follow prompts
```

#### 4.2 Manual Submission (Alternative)

1. Go to **Google Play Console** → **GSHOP**
2. **Testing** → **Internal testing**
3. Click **Create new release**
4. Upload AAB file
5. Add release notes
6. Click **Save** → **Review release** → **Start rollout**

### Step 5: Internal Testing Setup

#### 5.1 Create Email List

1. **Testing** → **Internal testing**
2. **Testers** tab
3. Click **Create email list**
4. Name: `GSHOP Beta Testers`
5. Add tester emails (one per line, up to 100)
6. Click **Save**

#### 5.2 Get Testing Link

1. Copy **Copy link** from Internal testing page
2. Share with testers

Example link:
```
https://play.google.com/apps/internaltest/1234567890
```

### Step 6: Distribute to Testers

Testers can install via link:

1. **Open link** on Android device
2. **Accept invitation** to become tester
3. **Install** GSHOP beta from Play Store
4. **Provide feedback** via Play Store

---

## 🧪 Testing Workflow

### Internal Testing Phase (1-2 weeks)

**Goal**: Find critical bugs before wider release

**Testers**: 10-20 internal team members

**Focus**:
- [ ] App launches successfully
- [ ] Core flows work (browse, purchase, checkout)
- [ ] Push notifications work
- [ ] Deep links work
- [ ] No crashes on startup
- [ ] Performance is acceptable

### Closed Beta Phase (2-4 weeks)

**Goal**: Test with diverse users and devices

**Testers**: 50-200 selected users

**Focus**:
- [ ] Payment flows
- [ ] Live shopping features
- [ ] Affiliate program
- [ ] Edge cases and unusual scenarios
- [ ] Different device models
- [ ] Different OS versions

### Open Beta Phase (Optional)

**Goal**: Large-scale testing before public launch

**Testers**: Anyone can join (1000+)

**Focus**:
- [ ] Server load testing
- [ ] Scalability
- [ ] Real-world usage patterns
- [ ] Final polish

### Beta Feedback Collection

#### TestFlight Feedback (iOS)

Testers can provide feedback through:
- **TestFlight app** → Send to developers
- **Screenshots** with annotations
- **Crash reports** automatically sent

#### Play Console Feedback (Android)

Testers can:
- **Rate the app** (not public)
- **Leave reviews** (visible to you only)
- **Report bugs** directly

#### External Feedback Tools

Recommended:
- **Slack channel** for testers
- **Google Forms** for structured feedback
- **Discord server** for community
- **GitHub Issues** for bug reports

---

## 🔄 Update & Iteration Process

### Releasing Updates to Beta

#### iOS TestFlight

```bash
# 1. Increment version in app.json
# "version": "1.0.1"

# 2. Build new version
eas build --platform ios --profile production

# 3. Submit to TestFlight
eas submit --platform ios --profile production

# 4. Add "What's New" notes in App Store Connect
```

#### Android Internal Testing

```bash
# 1. Increment version in app.json
# "version": "1.0.1"

# 2. Build new version
eas build --platform android --profile production

# 3. Submit to Play Console
eas submit --platform android --profile production

# 4. Add release notes in Play Console
```

### Beta Versioning Strategy

```
1.0.0 - Initial internal beta
1.0.1 - Bug fixes from internal testing
1.0.2 - Bug fixes from closed beta
1.1.0 - New features added
1.1.1 - Hot fixes
2.0.0 - Major release (ready for production)
```

---

## 📊 Monitoring & Analytics

### Beta Metrics to Track

1. **Adoption Rate**: % of invited testers who installed
2. **Active Users**: Daily/weekly active testers
3. **Crash Rate**: Crashes per user session
4. **Feedback Volume**: Number of reports received
5. **Feature Usage**: Which features are being tested
6. **Device Coverage**: OS versions and models tested

### Tools Integration

```typescript
// Enable beta-specific logging
if (ENV.ENV !== 'production') {
  // More verbose logging
  console.log('Beta mode enabled');

  // Track beta events
  analyticsService.track('beta_session' as any, {
    version: '1.0.0',
    buildNumber: 1,
  });
}
```

---

## 🚀 Production Release

Once beta testing is complete:

### iOS Production Release

1. **App Store Connect** → **GSHOP**
2. Click **+** next to **iOS App** in left sidebar
3. Select your TestFlight build
4. Fill in:
   - App Store promotional text
   - Description
   - Keywords
   - Screenshots
   - Support URL
   - Marketing URL
5. Complete **App Review Information**
6. Submit for review
7. Review takes 24-48 hours
8. Once approved, manually release or auto-release

### Android Production Release

1. **Google Play Console** → **GSHOP**
2. **Testing** → **Closed testing** or **Open testing**
3. Promote to **Production**
4. Create production release
5. Add release notes
6. Click **Review release** → **Start rollout to Production**
7. Can start with % rollout (e.g., 10%, then 50%, then 100%)

---

## ✅ Pre-Release Checklist

### Technical
- [ ] All critical bugs fixed
- [ ] Performance optimized
- [ ] Analytics tracking verified
- [ ] Push notifications tested
- [ ] Deep links tested
- [ ] Payment flows tested end-to-end
- [ ] Crash rate < 1%
- [ ] App size optimized

### Content
- [ ] All copy reviewed and approved
- [ ] All images optimized
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Support email responsive

### App Store
- [ ] Metadata complete
- [ ] Screenshots uploaded
- [ ] App icon final version
- [ ] Keywords optimized
- [ ] Content rating appropriate
- [ ] Age rating correct

### Legal & Compliance
- [ ] Privacy policy GDPR-compliant
- [ ] Data collection disclosed
- [ ] Third-party SDKs disclosed
- [ ] Export compliance declared
- [ ] Content ratings completed

---

## 🆘 Troubleshooting

### Build Failures

**Issue**: "Bundle identifier mismatch"
```bash
# Fix in app.config.js
ios: {
  bundleIdentifier: "com.gshop.app"  # Must match Apple Developer
}
```

**Issue**: "Provisioning profile error"
```bash
# Regenerate credentials
eas credentials
# Select iOS → Production → Regenerate
```

### Submission Rejections

**Common iOS rejections**:
- Missing privacy policy
- Incomplete app description
- Broken links
- Crashes on launch
- Incomplete functionality

**Common Android rejections**:
- Incomplete content rating
- Missing privacy policy
- Inadequate data safety info
- Inappropriate content

### TestFlight Issues

**Issue**: "Build stuck in processing"
- Wait 10-15 minutes
- Check email for export compliance
- Contact Apple Support if > 24 hours

**Issue**: "Testers not receiving invitations"
- Verify email addresses are Apple IDs
- Check spam folders
- Resend invitation

---

## 📚 Resources

### Documentation
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [TestFlight Guide](https://developer.apple.com/testflight/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)

### Tools
- [Expo Dashboard](https://expo.dev/)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Google Play Console](https://play.google.com/console)

---

**Last Updated:** 2025-09-30
**Version:** 1.0.0

Ready for beta testing! 🎉