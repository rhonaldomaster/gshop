# CLAUDE.md - GSHOP Backend API

> **Related Repositories**
> - **Mobile App**: gshop-mobile
> - **Admin Panel**: gshop-admin
> - **Seller Panel**: gshop-seller
> - **Documentation**: gshop-docs

## Project Overview

GSHOP Backend - NestJS REST API with TypeORM and PostgreSQL. Core backend service providing all API endpoints for mobile app, admin panel, and seller panel.

**Tech Stack**:
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport strategies
- **Payments**: MercadoPago, Stripe, USDC (Polygon blockchain)
- **Shipping**: EasyPost integration
- **Real-time**: Socket.IO for live shopping
- **API Docs**: Swagger/OpenAPI at `/api/docs`

## Development Commands

```bash
# Development
npm run start:dev         # Start development server (hot reload)
npm run start:debug       # Start with debugging

# Build & Production
npm run build            # Build for production
npm run start:prod       # Start production server

# Database
npm run migration:generate -- -n MigrationName  # Generate migration
npm run migration:run    # Run pending migrations
npm run migration:revert # Revert last migration

# Testing
npm test                 # Run unit tests
npm run test:e2e        # Run end-to-end tests
npm run test:cov        # Run tests with coverage
```

## Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://gshop_user:gshop_password@localhost:5432/gshop_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=7d

# Payments
MERCAPAGO_CLIENT_ID=your-mercadopago-client-id
MERCAPAGO_CLIENT_SECRET=your-mercadopago-client-secret
MERCAPAGO_ACCESS_TOKEN=your-mercadopago-access-token

STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Blockchain
POLYGON_RPC_URL=https://polygon-rpc.com
USDC_CONTRACT_ADDRESS=0x2791bca1f2de4661ed88a30c99a7a9449aa84174

# Shipping
EASYPOST_API_KEY=EZAK_your_easypost_api_key

# Live Streaming
RTMP_SERVER_URL=rtmp://localhost:1935/live
HLS_SERVER_URL=http://localhost:8080/hls
WEBSOCKET_URL=http://localhost:3000
```

## Architecture

### Module Structure
```
src/
├── auth/           # Authentication (JWT, sellers, users)
├── users/          # User management
├── sellers/        # Seller profiles and KYC
├── products/       # Product catalog
├── orders/         # Order management with commission tracking
├── payments/       # Payment processing (MercadoPago, Stripe, Crypto)
├── affiliates/     # Affiliate link generation and tracking
├── pixel/          # GSHOP Pixel event tracking
├── analytics/      # Analytics and reporting
├── ads/            # Advertising campaigns and DPA
├── audiences/      # Custom audiences and retargeting
├── live/           # Live shopping streams
├── marketplace/    # Marketplace sellers and products
├── token/          # GSHOP token economy
├── recsys/         # AI recommendation engine
├── shipping/       # EasyPost shipping integration
├── returns/        # Returns and refunds
└── database/       # TypeORM entities and migrations
```

### Key Features

#### Phase 1 - Core Platform
- Seller management with KYC
- Affiliate link generation and tracking
- GSHOP Pixel event tracking
- Analytics and reporting
- Commission calculation system

#### Phase 2 - Advanced Marketing
- Ads Manager with campaign management
- Dynamic Product Ads (DPA)
- Audience management and retargeting
- Live shopping with RTMP/HLS streaming
- WebSocket real-time communication

#### Phase 3 - Enhanced Commerce
- Marketplace global system
- Payment System V2 (Stripe + USDC)
- GSHOP Token economy with wallets
- AI-powered recommendation engine

#### Logistics Phase
- EasyPost shipping rate calculation
- Multi-carrier support (Servientrega, Coordinadora, DHL, FedEx)
- Real-time tracking and shipment creation
- Returns management with automated refunds
- Guest checkout with document validation

## Database Entities

### Core Entities
- `users` - User accounts
- `sellers` - Seller profiles with KYC
- `products` - Product catalog
- `orders` - Orders with shipping, live stream attribution, commission tracking
- `categories` - Product categories

### Affiliate System
- `affiliates` - Affiliate/creator accounts
- `affiliate_links` - Generated affiliate links
- `affiliate_clicks` - Click tracking data

### Payment & Token
- `payments_v2` - Enhanced payments (fiat + crypto)
- `invoices` - PDF invoice generation
- `payment_methods` - User payment methods
- `crypto_transactions` - Blockchain transactions
- `gshop_wallets` - User token wallets
- `gshop_transactions` - Token transaction history
- `token_rewards` - Cashback rewards

### Marketing & Analytics
- `pixel_events` - Website tracking events
- `campaigns` - Advertising campaigns
- `campaign_metrics` - Campaign performance
- `audiences` - Custom audiences
- `audience_users` - Audience membership

### Live Shopping
- `live_streams` - Live shopping sessions (seller/affiliate hosted)
- `live_stream_products` - Products in streams
- `live_stream_messages` - Real-time chat
- `live_stream_viewers` - Viewer tracking

### AI & Recommendations
- `user_interactions` - User behavior tracking
- `user_preferences` - Learned preferences
- `product_similarity` - Product relationships
- `recommendation_results` - Generated recommendations

### Marketplace & Reviews
- `marketplace_sellers` - Marketplace seller profiles
- `marketplace_products` - Marketplace product catalog
- `reviews` - Product reviews with images
- `inventory` - Stock management

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/seller/register` - Seller registration
- `POST /api/v1/auth/seller/login` - Seller login

### Seller Management
- `GET /api/v1/sellers/profile` - Get seller profile
- `GET /api/v1/sellers/stats` - Get seller statistics
- `POST /api/v1/sellers/withdrawal` - Request withdrawal

### Products
- `GET /api/v1/products` - List products with filters
- `GET /api/v1/products/:id` - Get product details
- `POST /api/v1/products` - Create product (seller)
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product

### Orders
- `POST /api/v1/orders` - Create order
- `POST /api/v1/orders/guest` - Guest checkout
- `GET /api/v1/orders` - List orders
- `GET /api/v1/orders/:id` - Get order details
- `POST /api/v1/orders/:id/shipping-options` - Get shipping rates
- `POST /api/v1/orders/:id/confirm-shipping` - Confirm shipping
- `GET /api/v1/orders/:id/tracking` - Get tracking info

### Payments
- `POST /api/v1/payments-v2` - Create payment
- `POST /api/v1/payments-v2/:id/process/stripe` - Process Stripe payment
- `POST /api/v1/payments-v2/:id/process/crypto` - Process USDC payment
- `POST /api/v1/payments-v2/crypto/verify/:id` - Verify blockchain transaction
- `GET /api/v1/payments-v2/invoices/:id/pdf` - Generate PDF invoice

### Affiliate System
- `POST /api/v1/affiliates/links` - Create affiliate link
- `GET /api/v1/affiliates/stats/:id` - Get affiliate stats
- `POST /api/v1/affiliates/track/:shortCode` - Track click

### GSHOP Token
- `GET /api/v1/tokens/wallet` - Get user wallet
- `POST /api/v1/tokens/transfer` - Transfer tokens
- `POST /api/v1/tokens/rewards/cashback` - Process cashback
- `POST /api/v1/tokens/topup` - Top up wallet
- `GET /api/v1/tokens/stats` - Token economy stats

### Live Shopping
- `POST /api/v1/live/streams` - Create live stream (seller)
- `POST /api/v1/live/affiliate/streams` - Create affiliate stream
- `GET /api/v1/live/streams/active` - Get active streams
- `GET /api/v1/live/streams/:id` - Get stream details
- `POST /api/v1/live/streams/:id/start` - Start stream
- `POST /api/v1/live/streams/:id/end` - End stream
- `POST /api/v1/live/streams/:id/products` - Add product to stream
- `POST /api/v1/live/streams/:id/messages` - Send chat message
- `GET /api/v1/live/streams/:id/stats` - Get stream analytics

### Analytics & Pixel
- `POST /api/v1/pixel/track` - Track pixel event
- `GET /api/v1/pixel/analytics` - Get analytics data
- `GET /api/v1/pixel/realtime` - Get realtime events

### VAT (IVA) Reporting
- `GET /api/v1/analytics/vat-report` - Generate VAT report by date range
  - Query params: `startDate`, `endDate`, `sellerId` (optional)
  - Returns VAT breakdown by category (excluido, exento, reducido, general)
  - Includes total base prices, VAT amounts, and order counts
  - Required for DIAN tax compliance in Colombia

### Ads Manager
- `POST /api/v1/ads/campaigns` - Create campaign
- `GET /api/v1/ads/campaigns` - List campaigns
- `PUT /api/v1/ads/campaigns/:id/status` - Update campaign status
- `GET /api/v1/ads/dashboard` - Get ads dashboard

### AI Recommendations
- `POST /api/v1/recommendations/interactions` - Track user behavior
- `POST /api/v1/recommendations/generate` - Generate recommendations
- `GET /api/v1/recommendations/trending` - Get trending products
- `POST /api/v1/recommendations/realtime` - Context-aware recommendations

### Returns Management
- `POST /api/v1/orders/:id/return` - Request return
- `PUT /api/v1/orders/:id/process-return` - Process return
- `GET /api/v1/returns` - List returns
- `GET /api/v1/returns/stats` - Return statistics

## Important Implementation Details

### Commission System
- Default 7% commission rate
- Configurable per affiliate
- Automatic calculation on orders
- Live stream attribution support
- Commission tracked in orders table

### Payment Processing
- **MercadoPago**: Primary payment processor with webhooks
- **Stripe**: Card payments with confirmation webhooks
- **USDC**: Polygon blockchain crypto payments with gas tracking
- **Payment Expiration**: 30-minute timeout for pending payments

### Shipping Integration
- **EasyPost**: Real-time rate shopping from multiple carriers
- **Colombian Carriers**: Servientrega, Coordinadora optimized
- **Fallback**: Mock rates when API unavailable (development)
- **Package Dimensions**: Automatic calculation from product data

### Live Shopping Attribution
- Orders include `liveSessionId`, `affiliateId`, `commissionRate`, `commissionAmount`
- Automatic commission calculation for affiliate-hosted streams
- WebSocket real-time communication at `/live` namespace
- RTMP ingestion and HLS playback support

### Colombian VAT (IVA) System
- **Status**: Production-ready (100% implemented - November 2025)
- **Compliance**: Colombian tax legislation (DIAN)
- **VAT Categories**:
  - `excluido` (0%) - Excluded, no tax deduction rights
  - `exento` (0%) - Exempt, with tax deduction rights
  - `reducido` (5%) - Reduced rate for specific goods
  - `general` (19%) - Standard rate (default)
- **Key Principle**: VAT is ALWAYS included in product prices (not added at checkout)
- **Entities**:
  - `Product`: Fields `vatType`, `basePrice`, `vatAmount`
  - `OrderItem`: VAT breakdown per item
  - `Order`: Complete VAT breakdown by category in `vatBreakdown` JSON field
- **Services**:
  - `ProductsService.create()`: Auto-calculates base and VAT via `calculatePrices()`
  - `ProductsService.update()`: Recalculates when price or vatType changes
  - `OrdersService.create()`: Generates vatBreakdown for each order
  - `AnalyticsService.generateVatReport()`: Tax compliance reporting
- **Migration**: `npm run migrate:vat` to update existing products with VAT data
- **Calculation**: `basePrice = price / (1 + vatRate)`, `vatAmount = price - basePrice`

### Token Economy (Partial Implementation)
- ⚠️ **Token metrics table missing** - causes 500 errors on wallet creation
- Backend wallet service implemented but needs database migration
- Mobile integration temporarily disabled
- Cashback system ready but not active

## Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:cov
```

## Deployment

```bash
# Build
npm run build

# Run migrations
npm run migration:run

# Start production
npm run start:prod
```

## API Documentation

Swagger docs available at: `http://localhost:3000/api/docs`

Auto-generated from NestJS controllers and DTOs with decorators.

## Common Issues

### Token Metrics Error
If you see 500 errors on wallet creation:
```bash
# Need to create token_metrics table migration
# Temporary fix: wallet service has try-catch around circulation update
```

### Payment Webhooks
Ensure webhook URLs are configured in MercadoPago/Stripe dashboards:
```
https://your-domain.com/api/v1/payments/webhook/mercadopago
https://your-domain.com/api/v1/payments/webhook/stripe
```

### Live Streaming Setup
Requires external RTMP server (e.g., nginx-rtmp-module):
```bash
# RTMP ingest: rtmp://localhost:1935/live
# HLS playback: http://localhost:8080/hls
```

## Performance Considerations

- **Audience Rebuilding**: Asynchronous for large datasets
- **Campaign Metrics**: Aggregated daily
- **Live Viewer Counts**: Real-time via WebSocket
- **DPA Recommendations**: Cached and refreshed on user activity
- **Database Indexing**: Applied on frequently queried fields

## Security

- JWT tokens with expiration
- Password hashing with bcrypt
- Rate limiting on auth endpoints
- Input validation with class-validator
- SQL injection prevention via TypeORM
- CORS configured for specific origins

## Links to Other Services

- **Mobile App**: Consumes all API endpoints
- **Admin Panel**: Uses auth, analytics, ads, audiences APIs
- **Seller Panel**: Uses seller, products, orders, live streaming APIs
- **Documentation**: See gshop-docs for full architecture diagrams
