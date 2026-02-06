# TikTok Shop vs GSHOP - Feature Comparison

This document compares TikTok Shop's live commerce features with GSHOP's current implementation, identifying gaps and potential improvements.

## Feature Comparison Matrix

### Currently Implemented in GSHOP

| Feature | TikTok Shop | GSHOP | Notes |
|---------|:-----------:|:-----:|-------|
| Pin product overlay | ✅ | ✅ | Host can pin products with timer |
| Overlay on video | ✅ | ✅ | ProductOverlayTikTok component |
| Countdown timer | ✅ | ✅ | 60s default, configurable |
| Quick buy without leaving | ✅ | ✅ | LiveCheckoutModal inline |
| Products tab/panel | ✅ | ✅ | Bottom sheet with products |
| Purchase counter | ✅ | ✅ | Real-time with fire emoji |
| Purchase notifications | ✅ | ✅ | Toast + haptic feedback |
| Affiliate attribution | ✅ | ✅ | liveSessionId + affiliateId |
| Flash sales | ✅ | ✅ | Discount + timer events |
| Live chat | ✅ | ✅ | Real-time WebSocket |
| Viewer count | ✅ | ✅ | Real-time updates |
| PiP mini player | ✅ | ✅ | Draggable mini player, auto-PiP on product tap |
| Cart during live | ✅ | ✅ | Persistent cart with useLiveCart hook |

### Missing Features

| Feature | TikTok Shop | GSHOP | Priority | Difficulty |
|---------|:-----------:|:-----:|:--------:|:----------:|
| Sticky floating product | ✅ | ❌ | High | Low |
| Purchases in chat | ✅ | ❌ | Medium | Low |
| Live-exclusive coupons | ✅ | ❌ | Medium | Medium |
| "X viewing this product" | ✅ | ❌ | Low | Low |
| Lucky draws / Giveaways | ✅ | ❌ | Medium | High |
| Product Q&A | ✅ | ❌ | Low | Medium |
| "Notify when back in stock" | ✅ | ❌ | Low | Low |
| Dramatic flash sale UI | ✅ | ⚠️ | Medium | Low |
| Double-tap likes | ✅ | ❌ | Low | Low |
| Swipe gestures | ✅ | ❌ | Low | Medium |
| System PiP (OS-level) | ✅ | ❌ | Low | High |
| Background music | ✅ | ❌ | Low | Medium |

---

## Missing Features - Detailed Analysis

### 1. Sticky Floating Product (High Priority)

**What TikTok Does:**
- Pinned product remains visible as a small floating card
- Stays on screen when user switches to chat or scrolls
- Always accessible without blocking content

**Current GSHOP Behavior:**
- ProductOverlayTikTok disappears when switching tabs
- User loses sight of featured product

**Implementation Suggestion:**
```typescript
// Add a mini floating card component
<MiniProductCard
  product={pinnedProduct}
  style={{
    position: 'absolute',
    bottom: chatVisible ? CHAT_HEIGHT + 10 : 10,
    right: 10,
    zIndex: 1000,
  }}
  onPress={() => openQuickBuy(pinnedProduct)}
/>
```

**Files to Modify:**
- `LiveStreamScreen.tsx` - Add floating card layer
- Create `MiniProductCard.tsx` component

---

### ~~2. Cart During Live~~ ✅ Implemented

Implemented via `useLiveCart` hook with AsyncStorage persistence, `LiveCartModal`, `LiveCartBadge`, and `LiveCartCheckoutScreen`.

---

### 3. Purchases Visible in Chat (Medium Priority)

**What TikTok Does:**
- Special formatted message when someone buys
- Shows product image, buyer name, quantity
- Creates social proof and FOMO
- Different visual style than regular messages

**Current GSHOP Behavior:**
- Toast notification only
- Not visible in chat stream
- Less social impact

**Implementation Suggestion:**
```typescript
// New message type in chat
interface PurchaseMessage {
  type: 'purchase';
  buyerName: string;
  productName: string;
  productImage: string;
  quantity: number;
  timestamp: Date;
}

// Render differently in chat
{message.type === 'purchase' && (
  <PurchaseChatBubble
    buyer={message.buyerName}
    product={message.productName}
    image={message.productImage}
  />
)}
```

**Files to Modify:**
- `LiveStreamScreen.tsx` - Handle purchase in chat
- Create `PurchaseChatBubble.tsx` component
- Backend: Emit purchase to chat channel

---

### 4. Live-Exclusive Coupons (Medium Priority)

**What TikTok Does:**
- Host can "drop" coupons during stream
- Animated overlay for users to "catch"
- Time-limited availability
- Only valid during/for that live session

**Implementation Suggestion:**
```typescript
// WebSocket events
socket.on('couponDropped', (data) => {
  setCouponOverlay({
    code: data.code,
    discount: data.discount,
    expiresAt: data.expiresAt,
    claimed: false,
  });
  showCouponAnimation();
});

// Coupon overlay component
<CouponDropOverlay
  coupon={couponOverlay}
  onClaim={() => claimCoupon(couponOverlay.code)}
  onExpire={() => setCouponOverlay(null)}
/>
```

**Files to Create:**
- `CouponDropOverlay.tsx`
- Backend: `live-coupons.service.ts`

---

### 5. "X People Viewing This Product" (Low Priority)

**What TikTok Does:**
- Shows real-time count when product detail is open
- "24 people are viewing this right now"
- Creates urgency

**Implementation:**
```typescript
// WebSocket room per product
socket.emit('viewingProduct', { productId });
socket.on('productViewers', ({ productId, count }) => {
  setViewerCount(count);
});
```

---

### 6. Lucky Draws / Giveaways (Medium Priority)

**What TikTok Does:**
- Host can start a giveaway
- Viewers participate by tapping/commenting
- Random winner selection
- Prize can be discount or free product

**Complexity:** High - requires:
- Participation tracking
- Random selection algorithm
- Prize redemption system
- Fraud prevention

---

### 7. Enhanced Flash Sale UI (Medium Priority)

**What TikTok Does:**
- Dramatic countdown reveal
- Price "breaking" animation
- Red/gold color scheme
- Sound effects
- Urgency indicators

**Current GSHOP:**
- Basic timer display
- Standard discount badge

**Enhancement Suggestion:**
```typescript
// Animated reveal component
<FlashSaleReveal
  originalPrice={product.price}
  salePrice={product.specialPrice}
  countdown={timerEndTime}
  onReveal={() => playRevealSound()}
/>
```

---

### 8. Double-Tap Likes (Low Priority)

**What TikTok Does:**
- Double-tap video to send heart
- Hearts float up on screen
- Counter for total likes

**Implementation:**
```typescript
<TapGestureHandler
  numberOfTaps={2}
  onActivated={() => {
    sendLike();
    showFloatingHeart();
  }}
>
  <VideoPlayer />
</TapGestureHandler>
```

---

## Implementation Roadmap

### Phase 1 - High Impact, Low Effort
1. Sticky floating product card
2. Purchases visible in chat
3. Enhanced flash sale animations

### ~~Phase 2 - High Impact, Medium Effort~~ ✅ Done
- ~~Cart during live session~~ ✅ Implemented (persistent with useLiveCart)
- ~~In-app PiP mini player~~ ✅ Implemented (draggable + auto-PiP on product tap)

### Phase 2 - Medium Impact
4. Live-exclusive coupons
5. Product viewer count
6. Double-tap likes
7. Swipe gestures

### Phase 3 - Complex Features
8. Lucky draws / Giveaways
9. System PiP (OS-level)
10. Background music integration

---

## Technical Considerations

### Performance
- Floating elements should use `position: absolute` with `useNativeDriver`
- Cart state should be memoized
- WebSocket events should be debounced where appropriate

### Backend Requirements
- New events: `couponDropped`, `productViewers`, `likeAdded`
- New endpoints: `/live/cart`, `/live/coupons`, `/live/giveaways`
- Redis for real-time counters

### Testing
- Load test with multiple viewers
- Test cart persistence if connection drops
- Verify attribution tracking with new features
