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
- **Admin Panel**: `admin-web/app/live/`
- **Mobile App**: `mobile/src/screens/live/`
- **Features**:
  - RTMP/HLS live streaming infrastructure
  - Real-time chat with WebSocket integration
  - Live product showcasing with overlay purchase buttons
  - Viewer count tracking and engagement metrics
  - Stream scheduling and management
  - Mobile-optimized viewing experience
  - Integration with existing product catalog

### 🔧 Advanced Integrations
- **WebSocket Integration**: Real-time communication for live streams
- **Streaming Infrastructure**: RTMP ingest and HLS playback
- **Cross-Platform Analytics**: Unified tracking across web and mobile
- **API Webhooks**: Event-driven architecture for campaign triggers

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
- `POST /api/v1/live/streams` - Create live stream
- `GET /api/v1/live/streams/active` - Get active live streams
- `POST /api/v1/live/streams/:id/start` - Start live stream
- `POST /api/v1/live/streams/:id/end` - End live stream
- `POST /api/v1/live/streams/:id/products` - Add product to stream
- `POST /api/v1/live/streams/:id/messages` - Send chat message
- `GET /api/v1/live/streams/:id/stats` - Get stream analytics

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

#### Phase 2 Entities
- `campaigns` - Advertising campaigns with budget and targeting
- `campaign_metrics` - Daily performance metrics (CTR, CPA, ROAS)
- `audiences` - Custom audiences with segmentation rules
- `audience_users` - User membership in audiences
- `live_streams` - Live shopping sessions with RTMP/HLS URLs
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
```