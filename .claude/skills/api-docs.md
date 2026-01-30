# GSHOP API Endpoints Reference

Base URL: `http://localhost:3000/api/v1`
Swagger Docs: `http://localhost:3000/api/docs`

## Authentication

```
POST /auth/seller/register     - Register new seller
POST /auth/seller/login        - Seller login
```

## Sellers

```
GET  /sellers/profile          - Get seller profile
GET  /sellers/stats            - Get seller statistics
POST /sellers/withdrawal       - Request withdrawal
PUT  /sellers/:id/shipping-config   - Configure shipping rates
GET  /sellers/:id/shipping-config   - Get shipping config
GET  /sellers/:id/locations         - Get seller locations
POST /sellers/:id/locations         - Add location
DELETE /sellers/:id/locations/:locationId - Remove location
```

## Products

```
POST /products                 - Create product
GET  /products                 - List products
GET  /products/:id             - Get product
PUT  /products/:id             - Update product
DELETE /products/:id           - Delete product
POST /products/upload          - Upload images (multipart)
DELETE /products/images/:filename - Delete image
```

## Orders

```
POST /orders                   - Create order
GET  /orders                   - List orders
GET  /orders/:id               - Get order
PUT  /orders/:id/status        - Update status
POST /orders/guest             - Guest checkout
POST /orders/calculate-shipping - Calculate shipping
PUT  /orders/:id/tracking      - Add tracking info
GET  /orders/:id/tracking      - Get tracking
POST /orders/:id/return        - Request return
PUT  /orders/:id/process-return - Process return
```

## Affiliates

```
POST /affiliates/links         - Create affiliate link
GET  /affiliates/stats/:id     - Get statistics
POST /affiliates/track/:shortCode - Track click
```

## Analytics & Pixel

```
POST /pixel/track              - Track event
GET  /pixel/analytics          - Get analytics
GET  /pixel/realtime           - Realtime events
GET  /analytics/vat-report     - VAT report (query: startDate, endDate)
```

## Ads Manager

```
POST /ads/campaigns            - Create campaign
GET  /ads/campaigns            - List campaigns
PUT  /ads/campaigns/:id/status - Update status
POST /ads/campaigns/:id/metrics - Record metrics
GET  /ads/dashboard            - Ads dashboard
```

## Audiences

```
POST /audiences                - Create audience
GET  /audiences                - List audiences
POST /audiences/:id/rebuild    - Rebuild audience
GET  /audiences/:id/users      - Get members
```

## Dynamic Product Ads

```
GET /dpa/feed/:sellerId        - Product catalog feed
GET /dpa/recommendations/:userId - Personalized recommendations
GET /dpa/retargeting/:audienceId - Retargeting suggestions
GET /dpa/creative/:productId   - Creative assets
```

## Live Shopping

```
POST /live/streams             - Create seller stream
POST /live/affiliate/streams   - Create affiliate stream
GET  /live/streams/active      - Active streams
GET  /live/streams/:id         - Stream details
POST /live/streams/:id/start   - Start stream
POST /live/streams/:id/end     - End stream
POST /live/streams/:id/products - Add product
PUT  /live/streams/:id/products/:productId/toggle - Toggle visibility
POST /live/streams/:id/messages - Send chat message
GET  /live/streams/:id/stats   - Stream analytics
GET  /live/streams/seller/:sellerId - Seller's streams
GET  /live/streams/affiliate/:affiliateId - Affiliate's streams
```

## Marketplace

```
POST /marketplace/sellers      - Create seller with KYC
GET  /marketplace/products     - Search with filters
POST /marketplace/reviews      - Submit review
PUT  /marketplace/inventory/:id - Update inventory
GET  /marketplace/sellers/:id/stats - Performance metrics
```

## Payments V2

```
POST /payments-v2              - Create payment
POST /payments-v2/:id/process/stripe - Process Stripe
GET  /payments-v2/invoices/:id/pdf - Generate PDF invoice
```

## AI Recommendations

```
POST /recommendations/interactions - Track behavior
POST /recommendations/generate  - Generate recommendations
GET  /recommendations/trending  - Trending products
POST /recommendations/realtime  - Context-aware recommendations
GET  /recommendations/preferences/:userId - User preferences
```

## Returns

```
GET  /returns                  - All return requests
GET  /orders/:id/return-details - Return details
GET  /returns/stats            - Return statistics
```
