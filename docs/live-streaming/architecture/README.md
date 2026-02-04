# Live Streaming Architecture Documentation

Technical documentation for GSHOP's live shopping system.

## Documents

| Document | Description |
|----------|-------------|
| [VIEWER_EXPERIENCE.md](./VIEWER_EXPERIENCE.md) | How the viewer experience works - screens, components, interactions |
| [WEBSOCKET_EVENTS.md](./WEBSOCKET_EVENTS.md) | Complete WebSocket events reference for real-time features |
| [TIKTOK_SHOP_COMPARISON.md](./TIKTOK_SHOP_COMPARISON.md) | Feature comparison with TikTok Shop and implementation gaps |

## Quick Reference

### Key Files

```
mobile/src/
├── screens/live/
│   ├── LiveStreamScreen.tsx      # Main viewer screen
│   ├── NativeBroadcastScreen.tsx # Host/broadcaster screen
│   ├── LiveStreamsScreen.tsx     # Live streams listing
│   └── LiveForYouFeedScreen.tsx  # Discovery feed
├── components/live/
│   ├── ProductOverlayTikTok.tsx  # TikTok-style product overlay
│   ├── ProductCard.tsx           # Product cards in list
│   ├── LiveCheckoutModal.tsx     # Quick checkout flow
│   └── PurchaseNotification.tsx  # Purchase toast notifications
```

### Core Features Implemented

- HLS video streaming via Expo Video
- Real-time WebSocket communication
- Product pinning with timer
- Quick checkout without leaving stream
- Purchase notifications with haptics
- Live chat
- Flash sales
- Affiliate attribution tracking

### Missing vs TikTok Shop

**High Priority:**
- Sticky floating product (always visible)
- Cart during live (multi-product checkout)

**Medium Priority:**
- Purchases visible in chat
- Live-exclusive coupons
- Enhanced flash sale animations

See [TIKTOK_SHOP_COMPARISON.md](./TIKTOK_SHOP_COMPARISON.md) for full analysis.

## Related Documentation

- [../GUIA_TRANSMISION_EN_VIVO.md](../GUIA_TRANSMISION_EN_VIVO.md) - Seller guide (Spanish)
- [../../PLAN_STREAMING_NATIVO_MOBILE.md](../../PLAN_STREAMING_NATIVO_MOBILE.md) - Native streaming plan
- [../../PLAN_LIVE_STREAMING_ENHANCEMENT.md](../../PLAN_LIVE_STREAMING_ENHANCEMENT.md) - Enhancement plan
