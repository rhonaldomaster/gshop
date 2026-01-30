# Live Shopping System

Live streaming infrastructure with WebSocket support for sellers and affiliates.

## Technical Infrastructure

- **RTMP Server**: `rtmp://localhost:1935/live` (for streaming software)
- **HLS Playback**: `http://localhost:8080/hls` (for video consumption)
- **WebSocket**: `/live` namespace for real-time communication
- **Stream Keys**: UUID-based unique keys per stream

## Creating Live Streams

### Seller Stream

```javascript
POST /api/v1/live/streams
{
  "title": "Fashion Sale Live",
  "description": "50% off all summer clothes",
  "hostType": "seller",
  "sellerId": "seller_123"
}
```

### Affiliate Stream

```javascript
POST /api/v1/live/affiliate/streams
{
  "title": "Tech Reviews & Deals",
  "description": "Latest gadget reviews",
  "hostType": "affiliate",
  "affiliateId": "affiliate_456",
  "sellerId": "seller_123"  // Products from this seller
}
```

## Purchase Attribution

Orders during affiliate live streams include:

```javascript
{
  "liveSessionId": "stream_789",
  "affiliateId": "affiliate_456",
  "commissionRate": 7.5,
  "commissionAmount": 15.00  // Calculated automatically
}
```

## WebSocket Integration

```javascript
// Join stream
socket.emit('joinStream', {
  streamId: 'stream_789',
  sessionId: 'mobile_user_123'
});

// Purchase during stream
socket.emit('streamPurchase', {
  streamId: 'stream_789',
  productId: 'product_456',
  affiliateId: 'affiliate_456'
});
```

## API Endpoints

```
POST /live/streams             - Create seller stream
POST /live/affiliate/streams   - Create affiliate stream
GET  /live/streams/active      - Active streams
GET  /live/streams/:id         - Stream details
POST /live/streams/:id/start   - Start stream
POST /live/streams/:id/end     - End stream
POST /live/streams/:id/products - Add product
PUT  /live/streams/:id/products/:productId/toggle - Toggle visibility
POST /live/streams/:id/messages - Send chat
GET  /live/streams/:id/stats   - Analytics
```

## Database Entities

- `live_streams` - Sessions with RTMP/HLS URLs and host type
- `live_stream_products` - Featured products
- `live_stream_messages` - Real-time chat
- `live_stream_viewers` - Viewer tracking

## Key Files

- `backend/src/live/live.entity.ts`
- `backend/src/live/live.service.ts`
- `backend/src/live/live.controller.ts`
- `backend/src/live/live.gateway.ts`
- `seller-panel/app/dashboard/live/page.tsx`
- `mobile/src/screens/live/LiveStreamsScreen.tsx`
- `mobile/src/screens/live/LiveStreamScreen.tsx`

## Environment Variables

```bash
RTMP_SERVER_URL=rtmp://localhost:1935/live
HLS_SERVER_URL=http://localhost:8080/hls
WEBSOCKET_URL=http://localhost:3000
```

## Dependencies

- Backend: `socket.io`, `uuid`
- Mobile: `expo-av`, `socket.io-client`
