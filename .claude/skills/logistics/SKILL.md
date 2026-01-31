---
name: logistics
description: Shipping, returns, guest checkout
---

# Logistics & Shipping System

Seller-managed shipping with configurable rates and manual tracking.

## Features

- Seller-configured shipping rates (local/national)
- Multiple seller locations (warehouses/branches)
- Free shipping with configurable minimum order
- Manual tracking URL provision
- Guest checkout with document validation
- Returns with automated MercadoPago refunds

## Order Status Flow

```typescript
enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  IN_TRANSIT = 'in_transit',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURN_REQUESTED = 'return_requested',
  REFUNDED = 'refunded'
}
```

## Shipping Configuration

Sellers set their own rates:

```typescript
interface ShippingConfig {
  localRate: number;      // Local delivery price
  nationalRate: number;   // National delivery price
  freeShippingMinimum?: number;  // Min order for free shipping
}
```

## API Endpoints

### Shipping

```
PUT  /sellers/:id/shipping-config    - Configure rates
GET  /sellers/:id/shipping-config    - Get config
GET  /sellers/:id/locations          - Get locations
POST /sellers/:id/locations          - Add location
DELETE /sellers/:id/locations/:id    - Remove location
POST /orders/calculate-shipping      - Calculate cost
PUT  /orders/:id/tracking            - Add tracking
GET  /orders/:id/tracking            - Get tracking
```

### Returns

```
POST /orders/:id/return              - Request return
PUT  /orders/:id/process-return      - Approve/reject
GET  /returns                        - All requests
GET  /orders/:id/return-details      - Return details
GET  /returns/stats                  - Statistics
```

### Guest Checkout

```
POST /orders/guest                   - Guest order
```

## Guest Checkout

- No account required
- Document validation: CC, CE, PA, TI (Colombian IDs)
- Colombian address validation
- Temporary user creation for order management

## Returns & Refunds

- 30-day return window from delivery
- Reason tracking and storage
- Automated MercadoPago refunds
- Seller approve/reject with notes

## Key Files

- `backend/src/sellers/` - Shipping configuration
- `backend/src/returns/` - Returns management
- `seller-panel/app/dashboard/orders/page.tsx` - Order management
- `mobile/src/screens/checkout/ShippingOptionsScreen.tsx`
- `mobile/src/screens/checkout/GuestCheckoutScreen.tsx`
- `mobile/src/screens/orders/OrderTrackingScreen.tsx`

## Document Types

```typescript
type DocumentType = 'CC' | 'CE' | 'PA' | 'TI';
// CC = Cedula de Ciudadania
// CE = Cedula de Extranjeria
// PA = Pasaporte
// TI = Tarjeta de Identidad
```

## Cost Structure

- Shipping: Configured by sellers
- Returns: Free within 30 days (seller absorbs cost)
- No external API fees
