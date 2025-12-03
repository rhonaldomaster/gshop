# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GSHOP is a TikTok Shop clone MVP with a microservices architecture consisting of:

- **Backend**: NestJS API with TypeORM and PostgreSQL
- **Admin Web Panel**: Next.js with TypeScript, Tailwind CSS, and Prisma
- **Seller Panel**: Next.js with NextAuth, seller dashboard and product management
- **Mobile App**: React Native with Expo
- **Database**: PostgreSQL with TypeORM (backend) and Prisma (admin panel)
- **Payment**: MercadoPago integration
- **Authentication**: JWT + NextAuth
- **Affiliate System**: Link generation and tracking with commission management
- **GSHOP Pixel**: JavaScript tracking script for external websites
- **Analytics**: Real-time analytics and reporting dashboard
- **Logistics System**: Seller-managed shipping with configurable rates and manual tracking

## Development Commands

### Quick Setup

```bash
npm install
npm run install:all        # Install dependencies for all workspaces
cp .env.example .env       # Setup environment variables
npm run docker:up          # Start PostgreSQL with Docker
npm run db:migrate         # Run database migrations
npm run db:seed           # Seed database with initial data
```

### Development Servers

```bash
npm run dev               # Start all services (backend, admin, seller, mobile)
npm run dev:backend       # Backend API on http://localhost:3000
npm run dev:admin         # Admin panel on http://localhost:3001
npm run dev:seller        # Seller panel on http://localhost:3002
npm run dev:mobile        # Mobile app with Expo development server
./deploy_seller.sh        # Deploy seller panel with automated setup
```

### Individual Service Commands

```bash
# Backend (NestJS)
cd backend
npm run start:dev         # Development server
npm run build            # Build for production
npm test                 # Run tests

# Admin Web Panel (Next.js)
cd admin-web/app
npm run dev              # Development server
npm run build            # Build for production
npm run lint             # Run ESLint
npm test                 # Run tests

# Mobile App (React Native/Expo)
cd mobile
npm start                # Start Expo development server
npm run android          # Start Android emulator
npm run ios              # Start iOS simulator
npm run web              # Start web version
```

### Database Operations

```bash
npm run db:migrate           # Run TypeORM migrations (backend)
npm run db:seed             # Seed database with initial data

# Backend migrations
cd backend
npm run migration:generate -- -n MigrationName  # Generate new migration
npm run migration:run       # Run pending migrations
```

### ⚠️ Important: Database Schema Changes

**ALWAYS create a migration when modifying database entities or schema:**

When you make changes that affect the database structure, you MUST generate and run a migration:

**Changes that require migrations:**
- ✅ Adding or removing columns to entities
- ✅ Changing column types, nullability, or defaults
- ✅ Adding or removing tables (new entities)
- ✅ Modifying constraints, indexes, or relationships
- ✅ Changing enum values or types

**Steps to create a migration:**
```bash
cd backend

# 1. Make your changes to entity files (*.entity.ts)

# 2. Generate migration with descriptive name
npm run migration:generate -- -n AddUserPhoneNumber

# 3. Review the generated migration file in src/database/migrations/

# 4. Run the migration
npm run migration:run

# 5. Test that everything works correctly
```

**Example workflow:**
```typescript
// 1. Modified entity: src/database/entities/user.entity.ts
@Column({ nullable: true })
phoneNumber: string;  // ← New field added

// 2. Generate migration
// $ npm run migration:generate -- -n AddPhoneNumberToUsers

// 3. Migration file created automatically in:
// src/database/migrations/1234567890123-AddPhoneNumberToUsers.ts

// 4. Run migration
// $ npm run migration:run
```

**Note:** Changes to code logic, services, or controllers that don't affect the database schema do NOT require migrations.

### 🔑 Test Credentials

After running `npm run seed` from the backend directory, use these test accounts:

**Admin Panel** (`http://localhost:3001`)
- Email: `john@doe.com`
- Password: `johndoe123`
- Role: ADMIN

**Seller Panel** (`http://localhost:3002`)
- Email: `seller@gshop.com`
- Password: `seller123`
- Role: SELLER

**Mobile App / Buyer**
- Email: `buyer@gshop.com`
- Password: `buyer123`
- Role: BUYER

> **Important**: These are development credentials only. The seed script also creates sample products, categories, and commission settings.

### Testing

```bash
npm test                    # Run all tests
npm run test:backend        # Backend tests only
npm run test:admin          # Admin panel tests only
```

### Docker Operations

```bash
npm run docker:up          # Start PostgreSQL container
npm run docker:down        # Stop containers
npm run docker:logs        # View container logs
```

## Architecture Notes

### Monorepo Structure

- Uses npm workspaces with individual package.json files
- Root package.json contains scripts for coordinating all services
- Each service (backend, admin-web, mobile) is self-contained

### Backend Architecture (NestJS)

- **Location**: `backend/src/`
- **Modules**: auth, users, products, orders, payments, database
- **Database**: TypeORM with PostgreSQL
- **API Docs**: Available at http://localhost:3000/api/docs (Swagger)
- **Authentication**: JWT with Passport strategies

### Admin Web Panel (Next.js)

- **Location**: `admin-web/app/`
- **Framework**: Next.js 14 with App Router
- **UI**: Tailwind CSS + Radix UI components
- **Database**: Prisma ORM (separate from backend TypeORM)
- **Authentication**: NextAuth.js
- **State Management**: Zustand, React Query (@tanstack/react-query)

### Mobile App (React Native)

- **Location**: `mobile/src/`
- **Framework**: Expo with React Native
- **Navigation**: React Navigation v7
- **State**: AsyncStorage for persistence

### Key Dependencies

- **Backend**: NestJS, TypeORM, PostgreSQL, JWT, Swagger
- **Admin**: Next.js, Prisma, NextAuth, Tailwind, Radix UI, Zustand
- **Mobile**: Expo, React Navigation, React Native Reanimated

### Environment Configuration

- Copy `.env.example` to `.env` and configure:
  - Database connection (PostgreSQL)
  - MercadoPago credentials (CLIENT_ID, CLIENT_SECRET, ACCESS_TOKEN)
  - JWT secrets
  - NextAuth configuration

### Development Workflow

1. Start PostgreSQL: `npm run docker:up`
2. Run migrations and seed: `npm run db:migrate && npm run db:seed`
3. Start all services: `npm run dev`
4. Access services:
   - Backend API: http://localhost:3000
   - Admin Panel: http://localhost:3001
   - Seller Panel: http://localhost:3002
   - Mobile: Expo DevTools in terminal

### Commission System

- Default 7% commission rate configured in backend
- Configurable through admin panel
- Applied to all orders automatically

### Colombian VAT (IVA) System

- **Implementation Date**: November 2025
- **Status**: Production-ready (100% implemented)
- **Compliance**: Colombian tax legislation (DIAN)
- **Features**:
  - 4 VAT categories: Excluido (0%), Exento (0%), Reducido (5%), General (19%)
  - VAT-inclusive pricing (price includes VAT, not added at checkout)
  - Automatic base price and VAT amount calculation
  - VAT breakdown by category for tax compliance
  - Admin panel reporting for tax declarations
  - Real-time price calculator in seller panel
- **Key Difference**: Unlike other systems, Colombian VAT is ALWAYS included in the displayed price
- **Documentation**: See `PLAN_IVA_COLOMBIA.md` for complete implementation details

## Phase 1 Features (Implemented)

### 🏪 Seller Panel (Next.js)

- **Location**: `seller-panel/`
- **URL**: http://localhost:3002
- **Features**:
  - Seller registration with KYC (business name, owner name, document verification)
  - JWT authentication with NextAuth
  - Dashboard with sales metrics and quick actions
  - Product management (CRUD operations)
  - Order management and tracking
  - Commission tracking and withdrawal requests
  - Real-time analytics integration

### 👥 Affiliate/Creator System

- **Backend Module**: `backend/src/affiliates/`
- **Features**:
  - Affiliate registration and management
  - Automatic affiliate code generation
  - Link creation and tracking with unique short codes
  - Click tracking with IP, user agent, and referrer data
  - Last-click attribution for conversions
  - Commission calculation and earnings tracking
  - Performance analytics (clicks, conversions, revenue)

### 📊 GSHOP Pixel (Website Tracking)

- **Script Location**: `public/gshop-pixel.js`
- **Backend Module**: `backend/src/pixel/`
- **Features**:
  - Lightweight JavaScript tracking script for external websites
  - Event tracking: `page_view`, `product_view`, `add_to_cart`, `purchase`, `custom`
  - Automatic scroll depth and click tracking
  - Session management and user identification
  - Real-time analytics data collection
  - GDPR-friendly with configurable data collection

### 📈 Analytics Dashboard

- **Backend Module**: `backend/src/analytics/`
- **Features**:
  - Real-time visitor tracking and conversion metrics
  - GMV (Gross Merchandise Value) reporting
  - Seller performance analytics
  - Commission tracking and payouts
  - Traffic source analysis
  - Product performance metrics

### 💳 Enhanced Payment System

- **Features**:
  - MercadoPago webhook integration for payment confirmation
  - Automated commission calculation on successful orders
  - Seller withdrawal system with balance tracking
  - Automatic weekly withdrawal processing (configurable)

## Phase 2 Features (Implemented)

### 🎯 Ads Manager (Admin Panel)

- **Location**: `admin-web/app/ads/`
- **Backend Module**: `backend/src/ads/`
- **Features**:
  - Campaign creation and management (DPA, Retargeting, Custom)
  - Real-time campaign metrics (CTR, CPA, ROAS)
  - Budget control and scheduling
  - Campaign activation/deactivation
  - Performance analytics dashboard
  - Integration with pixel events for audience building

### 🎨 Dynamic Product Ads (DPA)

- **Backend Module**: `backend/src/ads/dpa.service.ts`
- **Features**:
  - Automatic product feed generation from catalog
  - Personalized product recommendations based on user behavior
  - Dynamic creative asset generation
  - Cross-platform product showcase integration
  - Real-time inventory sync with product availability

### 👥 Audience Management & Retargeting

- **Backend Module**: `backend/src/audiences/`
- **Features**:
  - Pixel-based audience creation from website events
  - Customer list uploads for targeting
  - Lookalike audience generation
  - Audience size estimation and real-time updates
  - Advanced segmentation rules (timeframe, event conditions)
  - Automatic audience rebuilding based on new data

### 📺 Live Shopping Platform

- **Backend Module**: `backend/src/live/`
- **Seller Panel**: `seller-panel/app/dashboard/live/`
- **Mobile App**: `mobile/src/screens/live/`
- **Features**:
  - RTMP/HLS live streaming infrastructure with dual host support
  - **Seller & Affiliate Hosting**: Both sellers and affiliates can host live streams
  - Real-time chat with WebSocket integration
  - Live product showcasing with overlay purchase buttons
  - **Purchase Attribution**: Automatic commission tracking for affiliate-hosted streams
  - Viewer count tracking and engagement metrics
  - Stream scheduling and management from seller panel
  - Mobile-optimized viewing experience with host type badges
  - Integration with existing product catalog and affiliate system
  - **Commission Calculation**: Automatic commission calculation for affiliate sales during live streams

### 🔧 Advanced Integrations

- **WebSocket Integration**: Real-time communication for live streams
- **Streaming Infrastructure**: RTMP ingest and HLS playback
- **Cross-Platform Analytics**: Unified tracking across web and mobile
- **API Webhooks**: Event-driven architecture for campaign triggers

## Colombian VAT (IVA) System (November 2025)

### 📋 Overview

Complete implementation of Colombian tax legislation (DIAN) for VAT management in e-commerce. Unlike international systems where tax is added at checkout, Colombian law requires VAT to be **ALWAYS included** in the displayed price.

### 🏷️ VAT Categories

| Category     | Rate | Description             | Tax Deduction Rights | Examples                           |
| ------------ | ---- | ----------------------- | -------------------- | ---------------------------------- |
| **Excluido** | 0%   | Excluded goods/services | ❌ No                | Educational services, healthcare   |
| **Exento**   | 0%   | Exempt goods/services   | ✅ Yes               | Basic foods (bread, milk, eggs)    |
| **Reducido** | 5%   | Reduced rate            | ✅ Yes               | Processed foods (sausages, coffee) |
| **General**  | 19%  | Standard rate           | ✅ Yes               | Electronics, clothing, jewelry     |

### 🔧 Technical Implementation

#### Backend (100% Complete)

- **Entities Enhanced**:
  - `Product`: Added `vatType`, `basePrice`, `vatAmount` fields
  - `OrderItem`: VAT breakdown per item with totals
  - `Order`: Complete VAT breakdown by category in `vatBreakdown` JSON field
- **Services**:
  - `ProductsService`: Automatic price calculation via `calculatePrices()` method
  - `OrdersService`: VAT breakdown aggregation for tax reporting
  - `AnalyticsService`: VAT report generation with `generateVatReport()` method
- **API Endpoints**:
  - `GET /api/v1/analytics/vat-report` - Tax compliance reports
- **Migration**:
  - Migration: `1761860408199-AddVatFieldsToProducts.ts`
  - Data migration script: `npm run migrate:vat` (updates existing products)

#### Seller Panel (100% Complete)

- **Product Creation** (`/dashboard/products/new`):
  - VAT type selector with 4 categories
  - Real-time price calculator showing base + VAT = final price
  - Visual breakdown with tooltips
- **Product Editing** (`/dashboard/products/[id]/edit`):
  - Same VAT features as creation form
  - Recalculates on VAT type change

#### Admin Panel (100% Complete)

- **VAT Reports** (`/dashboard/reports/vat`):
  - Date range filters (start/end dates)
  - Breakdown by category with visual cards
  - Summary totals (base, VAT, total with VAT)
  - Order count per category
- **Products Table**:
  - "VAT Type" column with color-coded badges
  - Category labels with percentage

#### Mobile App (100% Complete)

- **CartContext**:
  - Removed incorrect `taxAmount * 0.1` calculation
  - Total = subtotal + shipping - discount (NO additional VAT)
- **Product Interface**:
  - Added `vatType`, `basePrice`, `vatAmount` fields
  - Prices displayed ALWAYS include VAT

### 💰 Price Calculation Formula

```typescript
// Given: Final price (with VAT included) = $119,000 COP
// VAT Rate: 19% (General category)

basePrice = finalPrice / (1 + vatRate)
basePrice = 119000 / 1.19 = 100,000 COP

vatAmount = finalPrice - basePrice
vatAmount = 119000 - 100000 = 19,000 COP

// Customer sees: $119,000 COP (VAT included)
// Seller gets: $100,000 COP (base)
// Government gets: $19,000 COP (VAT)
```

### 📊 Usage Examples

#### For Sellers

```typescript
// Creating a product
POST /api/v1/products
{
  "name": "iPhone 15 Pro Max",
  "price": 1299999.99,  // Price WITH VAT included
  "vatType": "general",  // 19% VAT
  // basePrice and vatAmount calculated automatically
}

// System calculates:
// basePrice: 1,092,436.97 COP
// vatAmount: 207,563.02 COP
// price: 1,299,999.99 COP (what customer sees)
```

#### For Admins

```bash
# Generate VAT report for tax declaration
GET /api/v1/analytics/vat-report?startDate=2025-01-01&endDate=2025-01-31

# Response includes:
{
  "breakdown": {
    "excluido": { "base": 0, "vat": 0, "total": 0, "orders": 0 },
    "exento": { "base": 50000, "vat": 0, "total": 50000, "orders": 5 },
    "reducido": { "base": 95238, "vat": 4762, "total": 100000, "orders": 10 },
    "general": { "base": 420168, "vat": 79832, "total": 500000, "orders": 25 }
  },
  "totalBase": 565406,
  "totalVat": 84594,
  "totalWithVat": 650000,
  "totalOrders": 40
}
```

### 🚀 Key Features

1. **Automatic Calculation**: Sellers enter final price, system calculates base and VAT
2. **Tax Compliance**: Complete audit trail for DIAN declarations
3. **Mixed Carts**: Supports products with different VAT rates in same order
4. **Historical Data**: Existing products migrated with default 19% VAT
5. **Real-time Preview**: Seller panel shows live price breakdown
6. **Admin Reporting**: Generate reports by date range for tax filing

### 📁 Key Files

- `backend/src/database/entities/product.entity.ts` - VatType enum and VAT_RATES constant
- `backend/src/analytics/analytics.service.ts` - `generateVatReport()` method
- `backend/src/analytics/analytics.controller.ts` - VAT report endpoint
- `backend/src/database/scripts/migrate-vat-data.ts` - Data migration script
- `seller-panel/app/dashboard/products/new/page.tsx` - Product form with VAT selector
- `admin-web/app/dashboard/reports/vat/page.tsx` - VAT reporting dashboard
- `PLAN_IVA_COLOMBIA.md` - Complete implementation plan and documentation

### ⚠️ Important Notes

- **Pricing**: All prices in GSHOP MUST include VAT (Colombian law requirement)
- **No Checkout Addition**: Unlike US/EU systems, VAT is NEVER added at checkout
- **Seller Responsibility**: Sellers must select correct VAT category for their products
- **Data Migration**: Run `npm run migrate:vat` after deployment to update existing products
- **Default VAT**: New products default to "General" (19%) if not specified

## Installation & Usage

### Quick Start with Deploy Script

```bash
# Make script executable
chmod +x deploy_seller.sh

# Deploy in development mode
./deploy_seller.sh development

# Deploy in production mode
./deploy_seller.sh production
```

### Manual Setup

```bash
# Install all dependencies
npm run install:all

# Copy environment files
cp .env.example .env

# Start database
npm run docker:up

# Run migrations
npm run db:migrate

# Start all services
npm run dev
```

### GSHOP Pixel Implementation

```html
<!-- Add to your website -->
<script src="https://your-domain.com/gshop-pixel.js"></script>
<script>
  // Initialize pixel with your seller ID
  gshop('init', 'YOUR_SELLER_ID');

  // Track page view (automatic on init)
  gshop('track', 'page_view');

  // Track product view
  gshop('track', 'product_view', {
    productId: 'prod_123',
    productName: 'Awesome Product',
    category: 'Electronics',
    price: 99.99
  });

  // Track purchase
  gshop('track', 'purchase', {
    orderId: 'order_456',
    value: 199.98,
    currency: 'USD'
  });
</script>
```

### Affiliate Link Creation

```javascript
// Generate affiliate link via API
POST /api/v1/affiliates/links
{
  "affiliateId": "affiliate_123",
  "originalUrl": "https://shop.example.com/product/123",
  "productId": "prod_123"
}

// Returns
{
  "shortCode": "a1b2c3d4",
  "fullUrl": "https://gshop.com/aff/a1b2c3d4"
}
```

### Environment Variables

```bash
# Add to .env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DATABASE_URL=postgresql://gshop_user:gshop_password@localhost:5432/gshop_db
MERCAPAGO_CLIENT_ID=your-mercadopago-client-id
MERCAPAGO_CLIENT_SECRET=your-mercadopago-client-secret
MERCAPAGO_ACCESS_TOKEN=your-mercadopago-access-token

# Add to seller-panel/.env.local
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=your-nextauth-secret-change-this-in-production
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

## API Endpoints

### Seller Authentication

- `POST /api/v1/auth/seller/register` - Register new seller
- `POST /api/v1/auth/seller/login` - Seller login

### Seller Management

- `GET /api/v1/sellers/profile` - Get seller profile
- `GET /api/v1/sellers/stats` - Get seller statistics
- `POST /api/v1/sellers/withdrawal` - Request withdrawal

### Affiliate System

- `POST /api/v1/affiliates/links` - Create affiliate link
- `GET /api/v1/affiliates/stats/:id` - Get affiliate statistics
- `POST /api/v1/affiliates/track/:shortCode` - Track click

### Analytics & Pixel

- `POST /api/v1/pixel/track` - Track pixel event
- `GET /api/v1/pixel/analytics` - Get analytics data
- `GET /api/v1/pixel/realtime` - Get realtime events

### VAT (IVA) Reporting

- `GET /api/v1/analytics/vat-report` - Generate VAT report by date range
  - Query params: `startDate`, `endDate`, `sellerId` (optional)
  - Returns breakdown by VAT category (excluido, exento, reducido, general)
  - Includes total base, total VAT, and order counts per category
  - Used for DIAN tax compliance and declarations

### Ads Manager (Phase 2)

- `POST /api/v1/ads/campaigns` - Create advertising campaign
- `GET /api/v1/ads/campaigns` - List seller campaigns
- `PUT /api/v1/ads/campaigns/:id/status` - Update campaign status
- `POST /api/v1/ads/campaigns/:id/metrics` - Record campaign metrics
- `GET /api/v1/ads/dashboard` - Get ads dashboard statistics

### Audience Management (Phase 2)

- `POST /api/v1/audiences` - Create custom audience
- `GET /api/v1/audiences` - List seller audiences
- `POST /api/v1/audiences/:id/rebuild` - Rebuild audience from rules
- `GET /api/v1/audiences/:id/users` - Get audience members

### Dynamic Product Ads (Phase 2)

- `GET /api/v1/dpa/feed/:sellerId` - Get product catalog feed
- `GET /api/v1/dpa/recommendations/:userId` - Get personalized recommendations
- `GET /api/v1/dpa/retargeting/:audienceId` - Get retargeting product suggestions
- `GET /api/v1/dpa/creative/:productId` - Generate creative assets for product

### Live Shopping (Phase 2)

- `POST /api/v1/live/streams` - Create live stream (seller)
- `POST /api/v1/live/affiliate/streams` - Create affiliate live stream
- `GET /api/v1/live/streams/active` - Get active live streams
- `GET /api/v1/live/streams/:id` - Get stream details with host info
- `POST /api/v1/live/streams/:id/start` - Start live stream
- `POST /api/v1/live/streams/:id/end` - End live stream
- `POST /api/v1/live/streams/:id/products` - Add product to stream
- `PUT /api/v1/live/streams/:id/products/:productId/toggle` - Toggle product visibility
- `POST /api/v1/live/streams/:id/messages` - Send chat message
- `GET /api/v1/live/streams/:id/stats` - Get stream analytics
- `GET /api/v1/live/streams/seller/:sellerId` - Get seller's streams
- `GET /api/v1/live/streams/affiliate/:affiliateId` - Get affiliate's streams

## Architecture Notes

### Phase 1 Modules Added

- **Sellers Module**: Complete seller management with KYC and payments
- **Affiliates Module**: Link generation, tracking, and commission management
- **Pixel Module**: Event tracking and analytics data collection
- **Analytics Module**: Reporting and metrics aggregation

### Phase 2 Modules Added

- **Ads Module**: Campaign management, metrics tracking, and DPA system
- **Audiences Module**: Pixel-based audience creation and retargeting
- **Live Module**: Live streaming infrastructure with WebSocket support

### Database Entities

#### Phase 1 Entities

- `sellers` - Seller profiles with KYC information
- `affiliates` - Affiliate/creator accounts
- `affiliate_links` - Generated affiliate links with tracking
- `affiliate_clicks` - Click tracking data
- `pixel_events` - Website tracking events
- `orders` - Enhanced with live stream attribution (liveSessionId, affiliateId, commissionRate, commissionAmount) and VAT breakdown
- `products` - Enhanced with VAT fields (vatType, basePrice, vatAmount)
- `order_items` - Enhanced with VAT fields per item (vatType, basePrice, vatAmountPerUnit, totalBasePrice, totalVatAmount)

#### Phase 2 Entities

- `campaigns` - Advertising campaigns with budget and targeting
- `campaign_metrics` - Daily performance metrics (CTR, CPA, ROAS)
- `audiences` - Custom audiences with segmentation rules
- `audience_users` - User membership in audiences
- `live_streams` - Live shopping sessions with RTMP/HLS URLs and host type (seller/affiliate)
- `live_stream_products` - Products featured in live streams
- `live_stream_messages` - Real-time chat messages
- `live_stream_viewers` - Viewer tracking and engagement

### Technical Infrastructure

#### Streaming Setup

- **RTMP Server**: rtmp://localhost:1935/live (for streaming software)
- **HLS Playback**: http://localhost:8080/hls (for video consumption)
- **WebSocket**: /live namespace for real-time communication
- **Stream Keys**: UUID-based unique keys per stream

#### Performance Considerations

- Audience rebuilding is asynchronous for large datasets
- Campaign metrics are aggregated daily for performance
- Live stream viewer counts are updated in real-time via WebSocket
- DPA recommendations are cached and refreshed based on user activity

### Development Notes

#### Required Dependencies

Add to package.json files:

- **Backend**: `socket.io`, `uuid` for live streaming
- **Admin Panel**: `date-fns`, `recharts` for analytics
- **Mobile**: `expo-av`, `socket.io-client` for live video and chat

#### Environment Variables

```bash
# Add to .env for Phase 2 features
RTMP_SERVER_URL=rtmp://localhost:1935/live
HLS_SERVER_URL=http://localhost:8080/hls
WEBSOCKET_URL=http://localhost:3000

# Add to .env for Phase 3 features
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
POLYGON_RPC_URL=https://polygon-rpc.com
USDC_CONTRACT_ADDRESS=0x2791bca1f2de4661ed88a30c99a7a9449aa84174

# Note: EasyPost removed - shipping now managed by sellers (no API key needed)
```

## Phase 3 Features (Implemented)

### 🛒 Marketplace Global System

- **Backend Module**: `backend/src/marketplace/`
- **Features**:
  - Comprehensive seller management with KYC verification and approval workflow
  - Advanced product catalog with multi-image support and inventory tracking
  - Review and rating system with image uploads and seller scoring
  - Shipping management with status tracking and delivery updates
  - Advanced product search with category filtering, price ranges, and popularity sorting
  - Seller dashboard with performance analytics and inventory management
  - Multi-status product management (draft, active, sold_out, discontinued)

### 💳 Enhanced Payment System V2

- **Backend Module**: `backend/src/payments/`
- **Features**:
  - Stripe integration for traditional card payments with webhooks
  - PDF invoice generation with automated numbering system
  - Payment method management (cards, bank accounts)
  - Advanced payment analytics with volume and fee tracking

### 🤖 AI-Powered Recommendation Engine

- **Backend Module**: `backend/src/recsys/`
- **Features**:
  - Multiple recommendation algorithms: collaborative filtering, content-based, popularity-based, and hybrid
  - Real-time user interaction tracking (views, clicks, purchases, cart additions)
  - Dynamic user preference learning with strength weighting
  - Product similarity calculations for "customers also bought" features
  - Cold start problem solutions for new users
  - A/B testing framework for algorithm performance comparison
  - Context-aware recommendations (checkout, browsing, cart abandonment)
  - Recommendation feedback loop for continuous improvement

### 🔗 Advanced Integrations

- **Cross-Module Communication**: Seamless integration between marketplace, payments, tokens, and recommendations
- **Webhook System**: Real-time event processing for payment confirmations and marketplace updates
- **Analytics Pipeline**: Unified data collection across all Phase 3 modules
- **API Consistency**: Standardized REST endpoints following established patterns

## Phase 3 Database Entities

### Marketplace Entities

- `marketplace_sellers` - Seller profiles with business verification and status management
- `marketplace_products` - Product catalog with multi-image support and inventory tracking
- `reviews` - Customer reviews with ratings and image attachments
- `inventory` - Stock management with low stock alerts
- `shipping` - Order shipping with carrier tracking and delivery status

### Payment V2 Entities

- `payments_v2` - Enhanced payment records
- `invoices` - PDF invoice generation with automated numbering
- `payment_methods` - User payment methods (cards, bank accounts)

### AI Recommendation Entities

- `user_interactions` - All user behavior tracking (views, clicks, purchases)
- `user_preferences` - Learned user preferences with strength scoring
- `product_similarity` - Product relationship mapping for recommendations
- `recommendation_results` - Generated recommendation history with performance tracking

## Phase 3 API Endpoints

### Marketplace Global

- `POST /api/v1/marketplace/sellers` - Create seller profile with KYC
- `GET /api/v1/marketplace/products` - Search products with advanced filters
- `POST /api/v1/marketplace/reviews` - Submit product review with images
- `PUT /api/v1/marketplace/inventory/:id` - Update product inventory
- `GET /api/v1/marketplace/sellers/:id/stats` - Get seller performance metrics

### Payment System V2

- `POST /api/v1/payments-v2` - Create payment with fiat or crypto
- `POST /api/v1/payments-v2/:id/process/stripe` - Process Stripe payment
- `GET /api/v1/payments-v2/invoices/:id/pdf` - Generate PDF invoice

### AI Recommendations

- `POST /api/v1/recommendations/interactions` - Track user behavior
- `POST /api/v1/recommendations/generate` - Generate personalized recommendations
- `GET /api/v1/recommendations/trending` - Get trending products
- `POST /api/v1/recommendations/realtime` - Get context-aware recommendations
- `GET /api/v1/recommendations/preferences/:userId` - Get user preferences

## Phase 3 Technical Infrastructure

### Machine Learning Pipeline

- **Algorithms**: Collaborative filtering, content-based filtering, and hybrid approaches
- **Real-time Processing**: Immediate preference updates on user interactions
- **Cold Start Solutions**: Popularity-based recommendations for new users
- **Performance Tracking**: A/B testing framework for algorithm optimization

### Payment Processing

- **Stripe Integration**: Card payments with webhook confirmation
- **Invoice System**: Automated PDF generation with unique numbering

## GSHOP Logistics Phase (Latest Implementation)

### 🚚 Complete Shipping & Logistics System (Seller-Managed)

- **Backend Module**: `backend/src/sellers/` and `backend/src/returns/`
- **Seller-Managed Shipping**: Sellers configure their own rates and provide tracking
- **Features**:
  - Seller-configured shipping rates (local and national)
  - Multiple seller locations support (warehouses/branches)
  - Free shipping option with configurable minimum order amount
  - Manual tracking URL provision by sellers
  - Guest checkout with mandatory document validation
  - Returns management with automated MercadoPago refunds
  - Seller dashboard for shipping configuration and tracking management
  - Mobile app with calculated shipping and order tracking

### 📱 Mobile Buyer Experience

- **Checkout Flow**: Seller-configured shipping rates calculated before payment
- **Guest Checkout**: Full checkout without account creation, with document validation
- **Document Validation**: Support for Cédula, Pasaporte, and other Colombian ID types
- **Real-time Tracking**: Live order status with seller-provided tracking URLs
- **Return Requests**: In-app return initiation with 30-day window

### 🏪 Seller Panel Integration

- **Shipping Configuration**: Configure local/national rates and free shipping thresholds
- **Location Management**: Add/remove multiple warehouse/branch locations
- **Order Management**: Complete order lifecycle from confirmation to delivery
- **Tracking Management**: Add tracking URLs and carrier info to orders
- **Return Processing**: Approve/reject return requests with automated refunds

### 🔧 Technical Implementation

#### Order Entity Enhancements

```typescript
// Order status types
export enum OrderStatus {
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

// New seller-managed shipping fields
interface OrderShippingData {
  shippingType?: 'local' | 'national';
  shippingCost?: number;
  shippingCarrier?: string;
  shippingTrackingNumber?: string;
  shippingTrackingUrl?: string;
  shippingNotes?: string;
  customerDocument?: CustomerDocument;
  isGuestOrder?: boolean;
  returnReason?: string;
}
```

#### Seller Shipping Configuration

- **Configurable Rates**: Sellers set their own local/national prices
- **Multiple Locations**: Support for warehouses/branches with city/state
- **Distance Calculation**: Automatic local vs national determination
- **Free Shipping**: Optional free shipping with minimum order amount

### 🛒 Guest Checkout System

- **No Account Required**: Complete purchases without user registration
- **Document Validation**: Mandatory Colombian ID validation (CC, CE, PA, TI)
- **Address Validation**: Colombian state/department selection and postal code verification
- **Temporary User Creation**: Creates temporary user records for order management

### 📦 Returns & Refunds

- **30-Day Return Window**: Automatic calculation from delivery date
- **Reason Tracking**: Detailed return reason collection and storage
- **Automated Refunds**: Integration with existing MercadoPago refund system
- **Seller Review**: Approve/reject returns with seller notes

### 🌐 API Endpoints - Logistics

#### Shipping Management

- `PUT /api/v1/sellers/:id/shipping-config` - Configure shipping rates
- `GET /api/v1/sellers/:id/shipping-config` - Get shipping configuration
- `GET /api/v1/sellers/:id/locations` - Get seller locations
- `POST /api/v1/sellers/:id/locations` - Add seller location
- `DELETE /api/v1/sellers/:id/locations/:locationId` - Remove location
- `POST /api/v1/orders/calculate-shipping` - Calculate shipping cost for order
- `PUT /api/v1/orders/:id/tracking` - Add tracking info to order
- `GET /api/v1/orders/:id/tracking` - Get tracking information

#### Returns Management

- `POST /api/v1/orders/:id/return` - Request return for delivered order
- `PUT /api/v1/orders/:id/process-return` - Process return (approve/reject)
- `GET /api/v1/returns` - Get all return requests (filtered by seller)
- `GET /api/v1/orders/:id/return-details` - Get return details for specific order
- `GET /api/v1/returns/stats` - Get return statistics and analytics

#### Guest Checkout

- `POST /api/v1/orders/guest` - Create order for guest user
- All existing shipping and payment endpoints work with guest orders

### 💰 Cost Structure

- **Shipping Costs**: Configured by sellers (fixed local/national rates)
- **Return Handling**: Free returns within 30-day window (cost absorbed by seller)
- **No External Fees**: $0 API costs (seller-managed system)

### 📊 Analytics & Reporting

- **Shipping Performance**: Track delivery times, carrier performance, and costs
- **Return Analytics**: Monitor return rates, reasons, and seller approval rates
- **Guest Conversion**: Track guest checkout completion rates and user conversion

### 🔐 Security & Validation

- **Document Verification**: Validates Colombian ID formats and patterns
- **Address Validation**: Ensures complete and valid Colombian addresses
- **Rate Protection**: Prevents rate manipulation through server-side validation

### 📺 Live Shopping Implementation Files

- `backend/src/live/live.entity.ts` - Live stream entity with affiliate support
- `backend/src/live/live.service.ts` - Live streaming business logic with host type handling
- `backend/src/live/live.controller.ts` - API endpoints for both seller and affiliate streams
- `backend/src/live/live.gateway.ts` - WebSocket gateway for real-time communication
- `backend/src/database/entities/order.entity.ts` - Enhanced with live stream attribution fields
- `backend/src/orders/orders.service.ts` - Commission calculation for affiliate live stream sales
- `seller-panel/app/dashboard/live/page.tsx` - Live stream management dashboard
- `seller-panel/app/dashboard/live/[id]/page.tsx` - Individual stream management interface
- `mobile/src/screens/live/LiveStreamsScreen.tsx` - Live streams discovery with host badges
- `mobile/src/screens/live/LiveStreamScreen.tsx` - Live stream viewing with purchase attribution

### 📱 Mobile Implementation Files

- `mobile/src/screens/checkout/ShippingOptionsScreen.tsx` - Dynamic rate selection
- `mobile/src/screens/checkout/GuestCheckoutScreen.tsx` - Guest checkout with validation
- `mobile/src/screens/orders/OrderTrackingScreen.tsx` - Real-time order tracking

### 🖥️ Seller Panel Files

- `seller-panel/app/dashboard/orders/page.tsx` - Complete order management dashboard

### ⚙️ Environment Configuration

```bash
# MercadoPago config (used for payments and refunds)
MERCAPAGO_CLIENT_ID=your-mercadopago-client-id
MERCAPAGO_CLIENT_SECRET=your-mercadopago-client-secret
MERCAPAGO_ACCESS_TOKEN=your-mercadopago-access-token

# Note: EasyPost removed - shipping now managed by sellers
# Sellers configure their own shipping rates and provide tracking URLs
```

### 🚀 Deployment Notes

- Sellers manage their own shipping rates (no external API needed)
- Sellers provide tracking URLs from their chosen carriers
- Database migrations required for seller locations and shipping config
- Mobile app requires @react-native-picker/picker dependency

## Live Shopping Usage Examples

### Creating Live Streams

#### Seller Live Stream

```javascript
// Create seller live stream via API
POST /api/v1/live/streams
{
  "title": "Fashion Sale Live",
  "description": "50% off all summer clothes",
  "hostType": "seller",
  "sellerId": "seller_123"
}
```

#### Affiliate Live Stream

```javascript
// Create affiliate live stream via API
POST /api/v1/live/affiliate/streams
{
  "title": "Tech Reviews & Deals",
  "description": "Latest gadget reviews with exclusive discounts",
  "hostType": "affiliate",
  "affiliateId": "affiliate_456",
  "sellerId": "seller_123"  // Products from this seller
}
```

### Purchase Attribution Flow

```javascript
// Mobile app: User purchases during affiliate live stream
// Order automatically includes:
{
  "liveSessionId": "stream_789",
  "affiliateId": "affiliate_456",
  "commissionRate": 7.5,  // From affiliate's rate
  "commissionAmount": 15.00  // Calculated automatically
}

// Commission is tracked and paid to affiliate
// Seller gets remaining revenue after commission
```

### WebSocket Integration

```javascript
// Real-time chat and viewer tracking
socket.emit('joinStream', {
  streamId: 'stream_789',
  sessionId: 'mobile_user_123'
});

// Purchase during live stream
socket.emit('streamPurchase', {
  streamId: 'stream_789',
  productId: 'product_456',
  affiliateId: 'affiliate_456' // For attribution
});
```

### 📱 **Mobile App Key Files**

#### Performance & Optimization

- `mobile/src/components/ui/CachedImage.tsx` - Image caching
- `mobile/src/components/ui/LazyLoadView.tsx` - Lazy loading
- `mobile/src/components/ui/Skeleton.tsx` - Skeleton screens
- `mobile/src/components/ui/LoadingState.tsx` - Loading states
- `mobile/src/components/ui/EmptyState.tsx` - Empty states
- `mobile/src/components/ui/OfflineBanner.tsx` - Offline UI
- `mobile/src/hooks/useImagePreloader.ts` - Image preloading
- `mobile/src/hooks/useScreenFocus.ts` - Screen focus optimization
- `mobile/src/hooks/useOfflineSync.ts` - Offline sync management
- `mobile/src/utils/navigationOptimization.ts` - Navigation performance
- `mobile/src/utils/performanceMonitor.ts` - Performance tracking
- `mobile/src/utils/offlineStorage.ts` - Offline storage system
- `mobile/src/utils/bundleOptimization.ts` - Bundle optimization helpers

#### Error Handling & Testing

- `mobile/src/components/ErrorBoundary.tsx` - Error boundary
- `mobile/src/utils/crashReporting.ts` - Crash reporter
- `mobile/src/utils/errorHandler.ts` - Error handling utilities
- `mobile/src/__tests__/integration/` - Integration tests
- `mobile/src/services/__tests__/` - Service unit tests
- `mobile/src/hooks/__tests__/` - Hook unit tests
- `mobile/jest.config.js` - Jest configuration
- `mobile/jest.setup.js` - Test setup

#### Build Configuration

- `mobile/app.json` - Expo config with Hermes & optimization
- `mobile/metro.config.js` - Metro bundler optimization
- `mobile/babel.config.js` - Babel optimization plugins
- `mobile/OPTIMIZATION_GUIDE.md` - Complete optimization guide

### 🚀 **Performance Targets Achieved**

- ⚡ Image caching with filesystem persistence
- 💀 Animated skeleton screens for smooth UX
- 📴 Offline-first architecture with auto-sync
- 🛡️ Enterprise-grade error handling
- 🧪 Comprehensive test coverage
- 📦 Hermes engine enabled (2x faster startup)
- 🔄 Smart navigation with deferred loading
- 📊 Performance monitoring built-in
