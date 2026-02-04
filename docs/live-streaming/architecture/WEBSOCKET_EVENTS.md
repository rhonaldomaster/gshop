# Live Streaming WebSocket Events - Reference

Complete reference for all WebSocket events used in GSHOP's live streaming system.

## Connection

### Client Connection

```typescript
import { io } from 'socket.io-client';

const socket = io(API_URL, {
  query: {
    streamId: 'stream-uuid',
    userId: 'user-uuid'
  },
  transports: ['websocket'],
});
```

### Join/Leave Stream

```typescript
// Join stream room
socket.emit('joinStream', { streamId });

// Leave stream room
socket.emit('leaveStream', { streamId });
```

---

## Events Reference

### Viewer Events (Client Receives)

#### Stream Status

| Event | Payload | Description |
|-------|---------|-------------|
| `streamStarted` | `{ streamId }` | Stream has gone live |
| `streamEnded` | `{ streamId }` | Stream has ended |
| `viewerCountUpdate` | `{ count: number }` | Viewer count changed |

**Example:**
```typescript
socket.on('viewerCountUpdate', ({ count }) => {
  setViewerCount(count);
});
```

#### Product Events

| Event | Payload | Description |
|-------|---------|-------------|
| `streamProductsUpdate` | `{ products: StreamProduct[] }` | Product list updated |
| `productPinned` | `{ productId, timerEndTime? }` | Product was pinned by host |
| `productUnpinned` | `{}` | Pinned product removed |

**Example:**
```typescript
socket.on('productPinned', ({ productId, timerEndTime }) => {
  setPinnedProductId(productId);
  if (timerEndTime) {
    setTimerEndTime(new Date(timerEndTime));
  }
});

socket.on('productUnpinned', () => {
  setPinnedProductId(null);
  setTimerEndTime(null);
});
```

#### Flash Sales

| Event | Payload | Description |
|-------|---------|-------------|
| `flashSaleStarted` | `{ productId, discountPercent, endTime }` | Flash sale began |
| `flashSaleEnded` | `{}` | Flash sale ended |

**Example:**
```typescript
socket.on('flashSaleStarted', ({ productId, discountPercent, endTime }) => {
  setPinnedProductId(productId);
  setFlashSaleDiscount(discountPercent);
  setTimerEndTime(new Date(endTime));
  playFlashSaleAnimation();
});
```

#### Purchase Events

| Event | Payload | Description |
|-------|---------|-------------|
| `newPurchase` | `{ productId, productName, buyerName, quantity, purchaseCount }` | Someone made a purchase |

**Example:**
```typescript
socket.on('newPurchase', (data) => {
  // Update purchase counter
  setPurchaseStats(prev => ({
    ...prev,
    [data.productId]: data.purchaseCount
  }));

  // Show notification
  showPurchaseNotification(data);

  // Haptic feedback
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
});
```

#### Chat Events

| Event | Payload | Description |
|-------|---------|-------------|
| `chatMessage` | `{ id, userId, userName, message, timestamp }` | New chat message |
| `chatModeration` | `{ action, messageId?, userId? }` | Moderation action taken |

**Example:**
```typescript
socket.on('chatMessage', (message) => {
  setChatMessages(prev => [...prev, message]);
});
```

---

### Host Events (Client Emits)

#### Product Management

| Event | Payload | Description |
|-------|---------|-------------|
| `pinProduct` | `{ streamId, productId, duration }` | Pin a product |
| `unpinProduct` | `{ streamId }` | Unpin current product |
| `updateProducts` | `{ streamId, products }` | Update product list |

**Example:**
```typescript
// Pin product for 60 seconds
socket.emit('pinProduct', {
  streamId: 'stream-uuid',
  productId: 'product-uuid',
  duration: 60,
});

// Unpin
socket.emit('unpinProduct', {
  streamId: 'stream-uuid',
});
```

#### Flash Sales

| Event | Payload | Description |
|-------|---------|-------------|
| `startFlashSale` | `{ streamId, productId, discountPercent, durationMinutes }` | Start flash sale |
| `endFlashSale` | `{ streamId }` | End flash sale early |

**Example:**
```typescript
socket.emit('startFlashSale', {
  streamId: 'stream-uuid',
  productId: 'product-uuid',
  discountPercent: 30,
  durationMinutes: 5,
});
```

#### Chat Moderation

| Event | Payload | Description |
|-------|---------|-------------|
| `deleteMessage` | `{ streamId, messageId }` | Delete a message |
| `timeoutUser` | `{ streamId, userId, duration }` | Timeout user |
| `banUser` | `{ streamId, userId }` | Ban user from chat |

---

### Common Events (Both Directions)

#### Chat

| Event | Direction | Payload |
|-------|-----------|---------|
| `sendMessage` | Client → Server | `{ streamId, message }` |
| `chatMessage` | Server → Client | `{ id, userId, userName, message, timestamp }` |

---

## Data Types

### StreamProduct

```typescript
interface StreamProduct {
  id: string;
  isActive: boolean;
  specialPrice?: number;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    stock: number;
  };
}
```

### ChatMessage

```typescript
interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: Date;
  type: 'message' | 'purchase' | 'system';
}
```

### PurchaseNotification

```typescript
interface PurchaseNotification {
  productId: string;
  productName: string;
  productImage?: string;
  buyerName: string;
  quantity: number;
  purchaseCount: number; // Total purchases of this product
}
```

---

## Error Handling

### Connection Errors

```typescript
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error);
  // Show reconnection UI
});

socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    // Server disconnected, need to reconnect manually
    socket.connect();
  }
  // else: will auto-reconnect
});
```

### Event Errors

```typescript
socket.on('error', ({ event, message }) => {
  console.error(`Error in ${event}:`, message);
  showErrorToast(message);
});
```

---

## Backend Implementation

### Gateway (NestJS)

```typescript
// live.gateway.ts
@WebSocketGateway({
  namespace: '/live',
  cors: { origin: '*' },
})
export class LiveGateway {
  @SubscribeMessage('joinStream')
  handleJoin(client: Socket, { streamId }: JoinStreamDto) {
    client.join(`stream:${streamId}`);
    this.updateViewerCount(streamId);
  }

  @SubscribeMessage('pinProduct')
  handlePinProduct(client: Socket, data: PinProductDto) {
    const timerEndTime = new Date(Date.now() + data.duration * 1000);

    this.server.to(`stream:${data.streamId}`).emit('productPinned', {
      productId: data.productId,
      timerEndTime: timerEndTime.toISOString(),
    });
  }
}
```

---

## Testing WebSocket Events

### Using Socket.io Client (CLI)

```bash
npm install -g socket.io-client-cli

# Connect and test
sio connect http://localhost:3000/live --query "streamId=test&userId=user1"

# Emit event
sio emit joinStream '{"streamId":"test"}'
```

### Using Postman

1. Create WebSocket request
2. URL: `ws://localhost:3000/live?streamId=test&userId=user1`
3. Send messages in JSON format
