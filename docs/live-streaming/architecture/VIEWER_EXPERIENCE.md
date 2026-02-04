# Live Stream Viewer Experience - Technical Documentation

This document describes how the live shopping experience works for viewers in the GSHOP mobile app, including product display, interactions, and checkout flow.

## Overview

The viewer experience is designed to replicate TikTok Shop's live commerce functionality, allowing users to watch live streams while browsing and purchasing products without leaving the stream.

## Key Files

| Component | File Path | Lines | Purpose |
|-----------|-----------|-------|---------|
| **LiveStreamScreen** | `mobile/src/screens/live/LiveStreamScreen.tsx` | ~614 | Main viewer interface |
| **ProductOverlayTikTok** | `mobile/src/components/live/ProductOverlayTikTok.tsx` | ~598 | Pinned product UI with animations |
| **ProductCard** | `mobile/src/components/live/ProductCard.tsx` | ~210 | Product cards in list |
| **LiveCheckoutModal** | `mobile/src/components/live/LiveCheckoutModal.tsx` | ~1029 | Quick checkout flow |
| **PurchaseNotification** | `mobile/src/components/live/PurchaseNotification.tsx` | ~200 | Purchase toast notifications |

---

## Screen Architecture

### LiveStreamScreen.tsx

The main viewer screen manages:

**State Variables (lines 73-86):**
```typescript
const [pinnedProductId, setPinnedProductId] = useState<string | null>(null);
const [purchaseStats, setPurchaseStats] = useState<Record<string, number>>({});
const [timerEndTime, setTimerEndTime] = useState<Date | null>(null);
const [showProducts, setShowProducts] = useState(false);
const [showChat, setShowChat] = useState(true);
const [selectedProduct, setSelectedProduct] = useState(null);
```

**Layout Structure:**
```
┌─────────────────────────────────────┐
│           HLS Video Player          │  ~70% height
│     (Expo Video component)          │
├─────────────────────────────────────┤
│  ProductOverlayTikTok (absolute)    │  Floating overlay
├─────────────────────────────────────┤
│    Products Tab  |  Chat Tab        │  ~30% height
│    (Bottom Sheet Panel)             │
└─────────────────────────────────────┘
```

---

## Product Display System

### 1. Products Bottom Sheet Panel

**Location:** `LiveStreamScreen.tsx` lines 491-518

- Horizontal FlatList of active products
- Maximum height: 30% of screen
- Toggle between Products and Chat tabs

**Filtering Logic (line 493):**
```typescript
const productsData = (stream?.products || []).filter(p => {
  const isValid = p?.isActive && p?.product;
  return isValid;
});
```

### 2. TikTok-Style Overlay

**Location:** `ProductOverlayTikTok.tsx`

The overlay displays:
- **Pinned Product Card** - Featured product with animations
- **Mini Carousel** - Scrollable list of other products below
- Positioned absolutely at bottom of video

---

## Pin Product Feature

### How It Works

**Host Side (Seller/Affiliate):**
- Long-press (500ms) on a product to pin it
- Emits WebSocket event with 60-second default duration

**Code (NativeBroadcastScreen.tsx lines 485-507):**
```typescript
const handlePinProduct = useCallback((productId: string) => {
  if (pinnedProductId === productId) {
    // Unpin
    socketRef.current.emit('unpinProduct', { streamId });
    setPinnedProductId(null);
  } else {
    // Pin with timer
    socketRef.current.emit('pinProduct', {
      streamId,
      productId,
      duration: 60,
    });
    setPinnedProductId(productId);
  }
}, [streamId, pinnedProductId]);
```

**Viewer Side (LiveStreamScreen.tsx lines 209-219):**
```typescript
socketRef.current.on('productPinned', (data) => {
  setPinnedProductId(data.productId);
  if (data.timerEndTime) {
    setTimerEndTime(new Date(data.timerEndTime));
  }
});

socketRef.current.on('productUnpinned', () => {
  setPinnedProductId(null);
  setTimerEndTime(null);
});
```

### Visual Effects for Pinned Product

| Effect | Implementation |
|--------|----------------|
| Bounce animation | Scale: 1 → 1.05 → 1 (lines 70-85) |
| Glowing shadow | Purple → Gold cycle (lines 87-101) |
| Pin badge | Push-pin icon (lines 236-239) |
| Countdown timer | Timer display (lines 228-233) |
| Purchase counter | Fire emoji + count (lines 274-287) |

---

## User Interactions

### Interaction Paths

| Action | Location | Result |
|--------|----------|--------|
| Tap product in list | Products Tab | Navigate to ProductDetail |
| Tap "Quick Buy" button | Products Tab / Overlay | Open LiveCheckoutModal |
| Tap pinned product card | Overlay | Navigate to ProductDetail |
| Tap quick-buy on pinned | Overlay | Open LiveCheckoutModal |
| Long-press product (host) | Overlay | Pin/unpin product |

### Navigation with Attribution

**Code (LiveStreamScreen.tsx lines 297-301):**
```typescript
navigation.navigate('ProductDetail', {
  productId: item.product.id,
  liveSessionId: streamId,     // Attribution tracking
  affiliateId: stream?.affiliate?.id  // Affiliate commission
});
```

---

## Checkout Flow

### LiveCheckoutModal.tsx

**Three-Step Process:**

#### Step 1: Variant Selection (lines 264-370)
- Product image and name
- Color/size variant selectors
- Quantity adjuster
- Live deal badge if discount active

#### Step 2: Checkout (lines 373-485)
- Shipping address selection
- Payment method (card/MercadoPago)
- Order summary

#### Step 3: Success (lines 487-531)
- Green checkmark animation
- Confetti effect
- Order details display

**Price Calculation (lines 94-97):**
```typescript
const finalPrice = product.specialPrice || product.price;
const hasDiscount = product.specialPrice && product.specialPrice < product.price;
const totalPrice = finalPrice * quantity;
```

---

## WebSocket Events

### Events Received by Viewer

| Event | Data | Handler |
|-------|------|---------|
| `streamProductsUpdate` | `{ products }` | Updates product list |
| `productPinned` | `{ productId, timerEndTime? }` | Shows pinned product |
| `productUnpinned` | (empty) | Hides pinned product |
| `newPurchase` | `{ productId, productName, buyerName, quantity, purchaseCount }` | Shows notification, updates counter |
| `flashSaleStarted` | `{ productId, discountPercent, endTime }` | Pins product with timer |
| `flashSaleEnded` | (empty) | Removes timer |
| `viewerCountUpdate` | `{ count }` | Updates viewer counter |
| `chatMessage` | `{ message, user }` | Adds to chat |

### Socket Connection (LiveStreamScreen.tsx lines 150-240)

```typescript
useEffect(() => {
  socketRef.current = io(API_URL, {
    query: { streamId, userId },
    transports: ['websocket'],
  });

  socketRef.current.emit('joinStream', { streamId });

  // Event listeners...

  return () => {
    socketRef.current?.emit('leaveStream', { streamId });
    socketRef.current?.disconnect();
  };
}, [streamId]);
```

---

## Real-Time Features

### Viewer Counter
- Updates via `viewerCountUpdate` socket event
- Formatted display (e.g., "1.2K viewers")

### Purchase Notifications
- Toast notification with product info
- Haptic feedback on purchase
- Purchase counter animation (scale up effect)

### Chat Integration
- Live messages in chat panel
- Can toggle between chat and products view

---

## Picture-in-Picture

**Minimize Button (lines 427-432):**
- Allows user to minimize stream
- Video continues playing in background
- User can navigate app while watching

---

## Attribution Tracking

All purchases made during live include:

| Parameter | Purpose |
|-----------|---------|
| `liveSessionId` | Revenue attribution to stream |
| `affiliateId` | Commission calculation for affiliate |

This enables:
- Analytics by stream performance
- Affiliate commission payouts
- Conversion tracking

---

## Related Documentation

- [GUIA_TRANSMISION_EN_VIVO.md](../GUIA_TRANSMISION_EN_VIVO.md) - Seller guide for broadcasting
- [PLAN_STREAMING_NATIVO_MOBILE.md](../../PLAN_STREAMING_NATIVO_MOBILE.md) - Native streaming implementation plan
