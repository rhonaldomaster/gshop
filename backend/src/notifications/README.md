# Push Notifications Module

Sistema completo de notificaciones push utilizando Firebase Cloud Messaging (FCM).

## 📋 Features

- ✅ Firebase Cloud Messaging integration
- ✅ Device token management (iOS, Android, Web)
- ✅ Automatic notifications when seller starts live stream
- ✅ Purchase notifications to sellers
- ✅ Scheduled stream reminders (15 min before)
- ✅ Batch notifications support
- ✅ Graceful degradation (works without FCM configured)

## 🚀 Quick Start

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Navigate to **Project Settings → Service Accounts**
4. Click **Generate new private key**
5. Save the JSON file as `backend/firebase-service-account.json`

### 2. Environment Configuration

Add to your `backend/.env`:

```bash
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

### 3. Database Migration

Run the migration to create the `device_tokens` table:

```bash
cd backend
npm run migration:run
```

### 4. Verify Installation

Check if FCM is enabled:

```bash
curl http://localhost:3000/api/v1/notifications/status
```

Response (when configured):
```json
{
  "enabled": true,
  "message": "Push notifications are enabled"
}
```

## 📱 Usage

### Register Device Token

From mobile app or web client:

```typescript
POST /api/v1/notifications/register-token
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "token": "<fcm-device-token>",
  "platform": "ios" | "android" | "web"
}
```

### Remove Device Token

When user logs out:

```typescript
DELETE /api/v1/notifications/remove-token
Content-Type: application/json

{
  "token": "<fcm-device-token>"
}
```

## 🔔 Automatic Notifications

### Live Stream Started

Automatically triggered when seller starts a live stream:

```typescript
// In LiveService.startLiveStream()
await notificationsService.notifyLiveStreamStarted(
  sellerId,
  streamTitle,
  streamId,
  thumbnailUrl
);
```

Notification format:
- **Title**: "{Seller Name} is now live! 🔴"
- **Body**: Stream title
- **Data**: `{ type: 'live_stream_started', streamId, sellerId }`
- **Image**: Stream thumbnail

### Purchase Made

Automatically triggered when order is completed:

```typescript
// In OrdersService.create()
await notificationsService.notifyPurchaseMade(
  sellerId,
  buyerName,
  productName,
  amount,
  orderId
);
```

Notification format:
- **Title**: "🎉 New Purchase!"
- **Body**: "{Buyer} bought {Product} for ${amount}"
- **Data**: `{ type: 'purchase_made', orderId, sellerId, amount }`

### Scheduled Stream Reminder

Can be triggered by cron job 15 minutes before scheduled stream:

```typescript
await notificationsService.notifyScheduledStreamReminder(
  streamId,
  streamTitle,
  sellerId,
  thumbnailUrl
);
```

## 🧪 Testing Without FCM

The system works perfectly without Firebase configured:

- All notification methods return gracefully
- Logs show "FCM not enabled - skipping notification send"
- Core functionality (live streaming, orders) continues normally
- No errors or exceptions thrown

## 📁 Files

- `notifications.service.ts` - Main FCM service
- `device-token.entity.ts` - Device token database entity
- `notifications.controller.ts` - REST API endpoints
- `notifications.module.ts` - NestJS module
- `1763500000000-AddDeviceTokensTable.ts` - Database migration

## 🔗 Integrations

- **LiveModule**: Sends notification when stream starts
- **OrdersModule**: Sends notification when purchase is made

## ⚠️ Important Notes

- Device tokens are automatically deactivated on logout (not deleted)
- Foreign key to `users` table with CASCADE on delete
- Unique constraint on token field
- Index on `user_id` for fast lookups
- Requires `firebase-admin` npm package

## 📊 Database Schema

```sql
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform ENUM('ios', 'android', 'web') NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_device_tokens_user_id ON device_tokens(user_id);
CREATE UNIQUE INDEX idx_device_tokens_token ON device_tokens(token);
```

## 🔮 Future Enhancements

- [ ] Followers system integration (currently returns empty array)
- [ ] Notification preferences per user
- [ ] Notification history/logs
- [ ] In-app notifications (alternative to push)
- [ ] Email notifications fallback
- [ ] Notification templates system
- [ ] Analytics dashboard for notification delivery rates

## 📚 Resources

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [firebase-admin SDK](https://firebase.google.com/docs/admin/setup)
- [FCM HTTP v1 API](https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages)
