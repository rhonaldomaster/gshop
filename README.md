
# GSHOP - TikTok Shop Clone MVP

A comprehensive e-commerce platform with social shopping features, built with modern technologies.

## 🏗️ Architecture

- **Backend**: NestJS with microservices architecture
- **Admin Web Panel**: Next.js with TypeScript and Tailwind CSS
- **Seller Panel**: Next.js with NextAuth for seller management
- **Mobile App**: React Native with Expo
- **Database**: PostgreSQL with TypeORM
- **Payment**: MercadoPago integration
- **Authentication**: JWT + NextAuth
- **Affiliate System**: Link generation and tracking
- **Analytics**: Real-time tracking with GSHOP Pixel
- **Ads Manager**: Campaign management with DPA and retargeting
- **Live Shopping**: RTMP streaming with real-time chat
- **Marketplace Global**: Multi-seller marketplace with advanced features
- **Enhanced Payments V2**: Stripe and USDC crypto payments
- **GSHOP Token System**: Rewards, cashback, and wallet management
- **AI Recommendations**: ML-powered personalized product suggestions
- **Creator System**: TikTok Shop-style creator economy with social features

## 📋 Features

### Core Features
- User authentication (buyers, sellers, admins)
- Product catalog with categories and variants
- Shopping cart and checkout
- Order processing and tracking
- MercadoPago payment integration
- Commission system (7% default)
- Admin dashboard with analytics

### Admin Panel Features
- Dashboard with metrics
- Product management (CRUD)
- Order management
- User management
- Commission configuration
- Real-time notifications

### 🏪 Seller Panel Features (NEW)
- Seller registration with KYC (business name, documents, etc.)
- Seller dashboard with sales metrics
- Product management (CRUD operations)
- Order management and tracking
- Commission tracking and withdrawal requests
- Real-time analytics integration
- Profile and settings management

### 👥 Affiliate System Features (NEW)
- Affiliate/creator registration and management
- Automatic affiliate code generation
- Link creation and tracking with unique short codes
- Click tracking with IP, user agent, and referrer data
- Last-click attribution for conversions
- Commission calculation and earnings tracking
- Performance analytics (clicks, conversions, revenue)

### 📊 GSHOP Pixel Features (NEW)
- Lightweight JavaScript tracking script for external websites
- Event tracking: `page_view`, `product_view`, `add_to_cart`, `purchase`, `custom`
- Automatic scroll depth and click tracking
- Session management and user identification
- Real-time analytics data collection
- GDPR-friendly with configurable data collection

### 📈 Analytics Features (NEW)
- Real-time visitor tracking and conversion metrics
- GMV (Gross Merchandise Value) reporting
- Seller performance analytics
- Commission tracking and payouts
- Traffic source analysis
- Product performance metrics

### 🎯 Ads Manager Features (PHASE 2)
- Campaign creation and management (DPA, Retargeting, Custom)
- Real-time campaign metrics (CTR, CPA, ROAS)
- Budget control and scheduling
- Audience management with pixel-based segmentation
- Dynamic Product Ads with auto-generated creatives
- Performance analytics dashboard

### 📺 Live Shopping Features (PHASE 2)
- RTMP/HLS live streaming infrastructure with dual host support
- **Seller & Affiliate Hosting**: Both sellers and affiliates can host live streams
- Real-time chat with WebSocket integration
- Live product showcasing with purchase overlays
- **Purchase Attribution**: Automatic commission tracking for affiliate-hosted streams
- Viewer count tracking and engagement metrics
- Stream scheduling and management from seller panel
- Mobile-optimized viewing experience with host type badges
- **Commission Calculation**: Automatic commission calculation for affiliate sales during live streams

### 🛒 Marketplace Global Features (PHASE 3)
- Multi-seller marketplace with seller verification and KYC
- Advanced product catalog with multi-image support
- Comprehensive review and rating system with image uploads
- Inventory management with stock tracking and alerts
- Shipping management with carrier integration and tracking
- Advanced product search with filters (category, price, rating, location)
- Seller dashboard with performance analytics and insights
- Commission management and automated payouts

### 💳 Enhanced Payment System V2 (PHASE 3)
- Stripe integration for traditional card and bank payments
- USDC cryptocurrency payments on Polygon blockchain
- Hybrid fiat/crypto payment processing with real-time conversion
- Blockchain transaction verification with gas optimization
- Automated PDF invoice generation with unique numbering
- Payment method management (cards, bank accounts, crypto wallets)
- Multi-currency support with exchange rate integration
- Advanced payment analytics and fraud detection

### 🪙 GSHOP Token Economy (PHASE 3)
- Internal wallet system with secure balance management
- 5% cashback rewards on all purchases (configurable rates)
- Peer-to-peer token transfer system with transaction history
- Fiat-to-token conversion via credit cards and bank transfers
- Admin token management (minting, burning, circulation control)
- Comprehensive transaction categorization and analytics
- Token exchange rate tracking and valuation
- Reward distribution automation and scheduling

### 🤖 AI-Powered Recommendations (PHASE 3)
- Multiple ML algorithms: collaborative filtering, content-based, and hybrid
- Real-time user behavior tracking (views, clicks, purchases, cart actions)
- Dynamic preference learning with weighted interaction scoring
- Product similarity engine for "customers also bought" features
- Cold start solutions for new users with demographic targeting
- Context-aware recommendations (checkout, browsing, abandonment)
- A/B testing framework for algorithm performance optimization
- Recommendation feedback loop for continuous improvement

### 🎯 Creator System Features (PHASE 4 - NEW!)
- **Creator Profiles**: Public profiles with bio, avatar, verification badges, and follower count
- **Social Following**: Follow/unfollow system with notifications and mutual follows tracking
- **Content Creation**: Video upload with product tagging, metadata, and engagement tracking
- **Video Interactions**: Like, comment, share system with real-time analytics
- **Live Shopping Integration**: Affiliate-hosted live streams with commission attribution
- **Product Affiliation**: Creator product selection and promotion with custom pricing
- **Creator Dashboard**: Performance metrics, earnings tracking, and content analytics
- **Admin Panel**: Creator approval workflow, content moderation, and platform analytics
- **Notification System**: Real-time notifications for social interactions and milestones
- **Revenue Sharing**: Commission-based earnings with transparent tracking and payments

### Mobile App Features
- Product browsing and search
- Social shopping features
- Cart management
- Secure checkout
- Order tracking
- User profiles
- Live stream viewing with chat and affiliate/seller host badges (PHASE 2)
- Marketplace shopping with seller ratings (PHASE 3)
- GSHOP wallet with cashback tracking (PHASE 3)
- Personalized product recommendations (PHASE 3)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (if running locally)

### Installation

1. **Clone and setup**
```bash
git clone <repository>
cd gshop
npm install
npm run install:all
```

2. **Environment setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database setup**
```bash
# Using Docker
npm run docker:up

# Or local PostgreSQL
npm run db:migrate
npm run db:seed
```

4. **Start development**
```bash
# All services (includes seller and creator panels)
npm run dev

# Individual services
npm run dev:backend   # Backend API on :3000
npm run dev:admin     # Admin panel on :3001
npm run dev:seller    # Seller panel on :3002
npm run dev:creator   # Creator panel on :3003
npm run dev:mobile    # Mobile app with Expo

# Quick deployment with automated setup
./deploy_seller.sh development
```

## 📁 Project Structure

```
gshop/
├── backend/                # NestJS Backend
│   ├── src/
│   │   ├── auth/          # Authentication service
│   │   ├── products/      # Products service
│   │   ├── orders/        # Orders service
│   │   ├── payments/      # Payments service
│   │   ├── users/         # Users service
│   │   ├── sellers/       # 🆕 Seller management (KYC, dashboard)
│   │   ├── affiliates/    # 🆕 Creator system (social features, content management)
│   │   ├── pixel/         # 🆕 Analytics tracking events
│   │   ├── analytics/     # 🆕 Reporting and metrics
│   │   ├── ads/           # 🆕 Phase 2: Campaign management & DPA
│   │   ├── audiences/     # 🆕 Phase 2: Audience segmentation
│   │   ├── live/          # 🆕 Phase 2: Live streaming with seller/affiliate support
│   │   ├── marketplace/   # 🆕 Phase 3: Multi-seller marketplace system
│   │   ├── payments/      # Enhanced with V2 crypto payments (Phase 3)
│   │   ├── token/         # 🆕 Phase 3: GSHOP token economy & wallet
│   │   ├── recsys/        # 🆕 Phase 3: AI recommendation engine
│   │   └── database/      # Database config & migrations
│   └── Dockerfile
├── admin-web/             # Next.js Admin Panel
│   ├── app/
│   │   ├── ads/          # 🆕 Phase 2: Ads Manager UI
│   │   ├── live/         # 🆕 Phase 2: Live Shopping management
│   │   ├── marketplace/  # 🆕 Phase 3: Marketplace management UI
│   │   ├── payments/     # Enhanced with crypto payment management
│   │   ├── tokens/       # 🆕 Phase 3: Token economy dashboard
│   │   └── dashboard/    # Admin dashboard pages
│   ├── components/
│   │   ├── ads/          # 🆕 Phase 2: Campaign components
│   │   ├── live/         # 🆕 Phase 2: Live streaming components
│   │   └── ui/           # Reusable UI components
│   └── Dockerfile
├── seller-panel/          # 🆕 Next.js Seller Panel
│   ├── app/
│   │   ├── dashboard/
│   │   │   └── live/     # 🆕 Live streaming management dashboard
│   │   └── auth/         # Authentication pages
│   ├── components/       # Seller UI components
│   ├── lib/              # Auth and utilities
│   └── types/            # TypeScript definitions
├── mobile/                # React Native App
│   ├── src/
│   │   ├── components/
│   │   │   └── live/     # 🆕 Phase 2: Live streaming components
│   │   ├── screens/
│   │   │   └── live/     # 🆕 Phase 2: Live shopping screens
│   │   ├── navigation/    # Navigation setup
│   │   └── services/      # API services
│   └── app.json
├── public/               # 🆕 Static assets
│   └── gshop-pixel.js    # 🆕 Tracking script for external sites
├── branding/             # Brand assets
│   ├── logos/
│   ├── icons/
│   └── guidelines/
├── deploy_seller.sh      # 🆕 Automated deployment script
├── docker-compose.yml    # Development environment
├── .env.example         # Environment template
└── package.json         # Monorepo scripts
```

## 🔧 Configuration

### Payment Gateway Setup

#### MercadoPago (Legacy)
1. Create a MercadoPago developer account
2. Get your credentials from the dashboard
3. Update environment variables:
   - `MERCAPAGO_CLIENT_ID`
   - `MERCAPAGO_CLIENT_SECRET`
   - `MERCAPAGO_ACCESS_TOKEN`

#### Stripe (Phase 3)
1. Create a Stripe account at stripe.com
2. Get your API keys from the dashboard
3. Update environment variables:
   - `STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key`
   - `STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key`

#### Polygon Blockchain (Phase 3)
1. Set up Polygon RPC endpoint (use Alchemy, Infura, or public RPC)
2. Configure USDC contract address for Polygon network
3. Update environment variables:
   - `POLYGON_RPC_URL=https://polygon-rpc.com`
   - `USDC_CONTRACT_ADDRESS=0x2791bca1f2de4661ed88a30c99a7a9449aa84174`

### Database Configuration
The application uses PostgreSQL with TypeORM. Migrations are automatically run on startup.

### Authentication
JWT tokens are used for API authentication. NextAuth handles web authentication.

## 📊 API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:3000/api/docs`
- API Endpoints: `http://localhost:3000/api/v1`

### Phase 1 API Endpoints

#### Seller Authentication
- `POST /api/v1/auth/seller/register` - Register new seller with KYC
- `POST /api/v1/auth/seller/login` - Seller login

#### Seller Management
- `GET /api/v1/sellers/profile` - Get seller profile
- `GET /api/v1/sellers/stats` - Get seller statistics
- `POST /api/v1/sellers/withdrawal` - Request withdrawal

#### Affiliate System
- `POST /api/v1/affiliates/links` - Create affiliate link
- `GET /api/v1/affiliates/stats/:id` - Get affiliate statistics
- `POST /api/v1/affiliates/track/:shortCode` - Track click

#### Analytics & Pixel
- `POST /api/v1/pixel/track` - Track pixel event
- `GET /api/v1/pixel/analytics` - Get analytics data
- `GET /api/v1/pixel/realtime` - Get realtime events

### Phase 2 API Endpoints

#### Ads Manager
- `POST /api/v1/ads/campaigns` - Create advertising campaign
- `GET /api/v1/ads/campaigns` - List seller campaigns
- `PUT /api/v1/ads/campaigns/:id/status` - Update campaign status
- `POST /api/v1/ads/campaigns/:id/metrics` - Record campaign metrics
- `GET /api/v1/ads/dashboard` - Get ads dashboard statistics

#### Audience Management
- `POST /api/v1/audiences` - Create custom audience
- `GET /api/v1/audiences` - List seller audiences
- `POST /api/v1/audiences/:id/rebuild` - Rebuild audience from rules
- `GET /api/v1/audiences/:id/users` - Get audience members

#### Dynamic Product Ads
- `GET /api/v1/dpa/feed/:sellerId` - Get product catalog feed
- `GET /api/v1/dpa/recommendations/:userId` - Get personalized recommendations
- `GET /api/v1/dpa/retargeting/:audienceId` - Get retargeting product suggestions
- `GET /api/v1/dpa/creative/:productId` - Generate creative assets for product

#### Live Shopping
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

### Phase 3 API Endpoints

#### Marketplace Global
- `POST /api/v1/marketplace/sellers` - Create marketplace seller with KYC
- `GET /api/v1/marketplace/products` - Search products with advanced filters
- `POST /api/v1/marketplace/reviews` - Submit product review with images
- `PUT /api/v1/marketplace/products/:id/inventory` - Update inventory levels
- `GET /api/v1/marketplace/sellers/:id/stats` - Get seller performance metrics
- `GET /api/v1/marketplace/categories` - Get product categories
- `GET /api/v1/marketplace/featured` - Get featured products

#### Enhanced Payment System V2
- `POST /api/v1/payments-v2` - Create payment (fiat or crypto)
- `POST /api/v1/payments-v2/:id/process/stripe` - Process Stripe card payment
- `POST /api/v1/payments-v2/:id/process/crypto` - Process USDC crypto payment
- `POST /api/v1/payments-v2/crypto/verify/:id` - Verify blockchain transaction
- `GET /api/v1/payments-v2/invoices/:id/pdf` - Generate and download PDF invoice
- `POST /api/v1/payments-v2/methods` - Create payment method
- `GET /api/v1/payments-v2/stats/overview` - Get payment analytics
- `GET /api/v1/payments-v2/exchange-rates/usdc-usd` - Get USDC exchange rate

#### GSHOP Token System
- `GET /api/v1/tokens/wallet` - Get user wallet balance and details
- `POST /api/v1/tokens/transfer` - Transfer tokens between users
- `POST /api/v1/tokens/rewards/cashback` - Process cashback rewards
- `POST /api/v1/tokens/topup` - Top up wallet with fiat payment
- `GET /api/v1/tokens/wallet/transactions` - Get transaction history
- `GET /api/v1/tokens/stats` - Get token economy statistics
- `GET /api/v1/tokens/circulation` - Get circulation data
- `POST /api/v1/tokens/admin/mint` - Admin: mint new tokens
- `POST /api/v1/tokens/admin/burn` - Admin: burn tokens

#### AI-Powered Recommendations
- `POST /api/v1/recommendations/interactions` - Track user behavior
- `POST /api/v1/recommendations/generate` - Generate personalized recommendations
- `GET /api/v1/recommendations/user/:userId` - Get user recommendations
- `GET /api/v1/recommendations/trending` - Get trending products
- `POST /api/v1/recommendations/realtime` - Get context-aware recommendations
- `GET /api/v1/recommendations/preferences/:userId` - Get user preferences
- `POST /api/v1/recommendations/feedback` - Submit recommendation feedback
- `GET /api/v1/recommendations/stats` - Get recommendation performance stats

### Phase 4 API Endpoints (NEW!)

#### Creator System
- `GET /creators/profile/:username` - Get public creator profile
- `PUT /creators/profile` - Update creator profile
- `POST /creators/follow/:creatorId` - Follow a creator
- `DELETE /creators/follow/:creatorId` - Unfollow creator
- `GET /creators/:id/followers` - Get creator followers list
- `GET /creators/:id/following` - Get creator following list
- `GET /creators/search` - Search and discover creators

#### Content Management
- `POST /creators/videos` - Create new video content
- `PUT /creators/videos/:id` - Update video metadata
- `POST /creators/videos/:id/publish` - Publish video
- `DELETE /creators/videos/:id` - Archive video
- `GET /creators/videos` - Get creator's videos
- `GET /creators/videos/public` - Get public video feed
- `POST /creators/videos/:id/interact` - Interact with video (like, comment, share)
- `GET /creators/videos/:id/analytics` - Get video performance analytics

#### Creator Live Streaming
- `POST /creators/live/streams` - Create affiliate live stream
- `POST /creators/live/streams/schedule` - Schedule live stream
- `POST /creators/live/streams/:id/start` - Start live stream
- `POST /creators/live/streams/:id/end` - End live stream
- `GET /creators/live/streams` - Get creator's live streams
- `GET /creators/live/streams/active` - Get active creator streams
- `GET /creators/live/streams/upcoming` - Get upcoming streams
- `GET /creators/live/streams/:id/analytics` - Get stream analytics

#### Creator Dashboard
- `GET /creators/dashboard/stats` - Get dashboard statistics
- `GET /creators/dashboard/performance` - Get performance metrics over time
- `GET /creators/dashboard/top-content` - Get top performing content
- `GET /creators/dashboard/notifications` - Get notifications
- `PUT /creators/dashboard/notifications/:id/read` - Mark notification as read
- `GET /creators/dashboard/overview` - Get complete dashboard overview

#### Admin Creator Management
- `GET /admin/creators/stats` - Get admin dashboard statistics
- `GET /admin/creators/analytics` - Get platform creator analytics
- `GET /admin/creators` - List all creators with filtering
- `GET /admin/creators/:id` - Get detailed creator information
- `PUT /admin/creators/:id/approve` - Approve pending creator
- `PUT /admin/creators/:id/reject` - Reject creator application
- `PUT /admin/creators/:id/suspend` - Suspend creator account
- `PUT /admin/creators/:id/verify` - Verify creator account
- `PUT /admin/creators/:id/commission-rate` - Update commission rate
- `PUT /admin/creators/videos/:id/moderate` - Moderate content
- `GET /admin/creators/dashboard/overview` - Get admin overview

## 🎨 Branding

GSHOP uses a consistent color palette:
- Primary: `#FF0050` (Hot Pink)
- Secondary: `#000000` (Black)
- Accent: `#00C853` (Green)

Brand assets are located in the `/branding` directory.

## 🧪 Testing

```bash
# Run all tests
npm test

# Backend tests
npm run test:backend

# Admin panel tests
npm run test:admin
```

## 🐳 Docker Deployment

```bash
# Start all services (backend, admin, seller, creator, database)
npm run docker:up

# View logs for all services
npm run docker:logs

# Stop all services
npm run docker:down

# Build all containers
npm run docker:build

# Full rebuild (no cache)
npm run docker:rebuild

# Creator Panel specific commands
npm run docker:creator       # Start only creator-panel container
npm run docker:creator:build # Build only creator-panel
npm run docker:creator:logs  # View creator-panel logs

# Development with hot reload for creator panel
docker compose -f docker-compose.yml -f docker-compose.dev.yml up creator-panel

# Individual service access
# Backend API: http://localhost:3000
# Admin Panel: http://localhost:3001
# Seller Panel: http://localhost:3002
# Creator Panel: http://localhost:3003
```

## 📱 Mobile Development

The mobile app uses Expo for cross-platform development:

```bash
cd mobile
npm start  # Starts Expo development server
```

## 🔄 Database Migrations

```bash
# Create migration
cd backend && npm run migration:generate -- -n MigrationName

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed
```

## 🚀 Deployment

### Backend
- Build Docker image
- Set production environment variables
- Deploy to cloud provider (AWS, GCP, etc.)

### Admin Web Panel
- Build Next.js application
- Deploy to Vercel, Netlify, or similar

### Mobile App
- Build with Expo EAS
- Submit to App Store and Google Play

## 📱 Usage Examples

### GSHOP Pixel Implementation
Add tracking to any website:

```html
<!-- Add to your website -->
<script src="https://your-domain.com/gshop-pixel.js"></script>
<script>
  // Initialize pixel with your seller ID
  gshop('init', 'YOUR_SELLER_ID');

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
Generate tracking links programmatically:

```javascript
// Create affiliate link
const response = await fetch('/api/v1/affiliates/links', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    affiliateId: 'affiliate_123',
    originalUrl: 'https://shop.example.com/product/123',
    productId: 'prod_123'
  })
});

const { shortCode, fullUrl } = await response.json();
// Use fullUrl for sharing: https://gshop.com/aff/a1b2c3d4
```

### Seller Registration
Register sellers with KYC validation:

```javascript
const sellerData = {
  email: 'seller@example.com',
  password: 'securepassword',
  businessName: 'My Store',
  ownerName: 'John Doe',
  documentType: 'CC',
  documentNumber: '12345678',
  phone: '+1234567890',
  address: '123 Main St',
  city: 'New York',
  country: 'USA',
  businessCategory: 'electronics'
};

const response = await fetch('/api/v1/auth/seller/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(sellerData)
});
```

### Live Shopping with Affiliate Support
Create and manage live streams with commission tracking:

```javascript
// Create seller live stream
const sellerStream = await fetch('/api/v1/live/streams', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer SELLER_TOKEN'
  },
  body: JSON.stringify({
    title: 'Fashion Sale Live',
    description: '50% off all summer clothes',
    hostType: 'seller',
    sellerId: 'seller_123'
  })
});

// Create affiliate live stream
const affiliateStream = await fetch('/api/v1/live/affiliate/streams', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer AFFILIATE_TOKEN'
  },
  body: JSON.stringify({
    title: 'Tech Reviews & Deals',
    description: 'Latest gadget reviews with exclusive discounts',
    hostType: 'affiliate',
    affiliateId: 'affiliate_456',
    sellerId: 'seller_123'  // Products from this seller
  })
});

// Purchase during affiliate live stream (mobile app)
// Order automatically includes attribution:
{
  "liveSessionId": "stream_789",
  "affiliateId": "affiliate_456",
  "commissionRate": 7.5,  // From affiliate's rate
  "commissionAmount": 15.00  // Calculated automatically
}

// WebSocket real-time integration
const socket = io('/live');

socket.emit('joinStream', {
  streamId: 'stream_789',
  sessionId: 'mobile_user_123'
});

// Track purchase for commission attribution
socket.emit('streamPurchase', {
  streamId: 'stream_789',
  productId: 'product_456',
  affiliateId: 'affiliate_456'  // For commission tracking
});
```

### Creator System Usage
Complete TikTok Shop-style creator economy:

```javascript
// 1. Creator Registration & Profile Setup
const creatorProfile = await fetch('/creators/profile', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer CREATOR_TOKEN'
  },
  body: JSON.stringify({
    username: 'fashioncreator',
    name: 'Fashion Creator',
    bio: 'Fashion enthusiast sharing the latest trends 💕',
    categories: ['fashion', 'lifestyle'],
    avatarUrl: 'https://cdn.example.com/avatar.jpg',
    isProfilePublic: true
  })
});

// 2. Content Creation with Product Tagging
const video = await fetch('/creators/videos', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer CREATOR_TOKEN'
  },
  body: JSON.stringify({
    title: 'Summer Fashion Haul 2024',
    description: 'Check out these amazing summer pieces!',
    videoUrl: 'https://cdn.example.com/video.mp4',
    thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
    type: 'promotional',
    tags: ['summer', 'fashion', 'haul'],
    hashtags: ['summerfashion', 'ootd', 'style'],
    taggedProducts: ['product-id-1', 'product-id-2']
  })
});

// 3. Publish Video and Track Performance
await fetch(`/creators/videos/${video.id}/publish`, {
  method: 'POST',
  headers: { 'Authorization': 'Bearer CREATOR_TOKEN' }
});

// 4. Social Interactions
// Users can follow creators
await fetch('/creators/follow/creator-id-123', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer USER_TOKEN' }
});

// Users can interact with videos
await fetch('/creators/videos/video-id-456/interact', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer USER_TOKEN'
  },
  body: JSON.stringify({
    type: 'like'
  })
});

// 5. Creator Live Streaming with Commission Tracking
const liveStream = await fetch('/creators/live/streams', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer CREATOR_TOKEN'
  },
  body: JSON.stringify({
    title: 'Live Fashion Show',
    description: 'Showcasing new arrivals with special discounts',
    sellerId: 'seller-123',
    productIds: ['product-1', 'product-2', 'product-3']
  })
});

// Start the live stream
await fetch(`/creators/live/streams/${liveStream.id}/start`, {
  method: 'POST',
  headers: { 'Authorization': 'Bearer CREATOR_TOKEN' }
});

// 6. Dashboard Analytics
const dashboardData = await fetch('/creators/dashboard/overview', {
  headers: { 'Authorization': 'Bearer CREATOR_TOKEN' }
}).then(res => res.json());

console.log({
  followers: dashboardData.stats.profile.followersCount,
  totalViews: dashboardData.stats.profile.totalViews,
  earnings: dashboardData.stats.earnings.totalEarnings,
  topVideo: dashboardData.topContent.topVideos[0],
  growthRate: dashboardData.summary.growthRate
});

// 7. Admin Management
// Approve pending creator
await fetch('/admin/creators/creator-id-789/approve', {
  method: 'PUT',
  headers: { 'Authorization': 'Bearer ADMIN_TOKEN' }
});

// Verify creator account
await fetch('/admin/creators/creator-id-789/verify', {
  method: 'PUT',
  headers: { 'Authorization': 'Bearer ADMIN_TOKEN' }
});

// Update commission rate
await fetch('/admin/creators/creator-id-789/commission-rate', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ADMIN_TOKEN'
  },
  body: JSON.stringify({ commissionRate: 10.0 })
});
```

## 🚀 Deployment Script

Use the automated deployment script for quick setup:

```bash
# Make executable
chmod +x deploy_seller.sh

# Development deployment
./deploy_seller.sh development

# Production deployment
./deploy_seller.sh production
```

The script will:
- Install all dependencies
- Setup environment files
- Start PostgreSQL database
- Run migrations
- Build applications
- Start all services
- Run health checks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the repository.

---

## 🎯 Development Phases

### ✅ Phase 1 - Seller & Analytics Platform (COMPLETED)
- **Seller Panel**: Complete seller onboarding with KYC
- **Affiliate System**: Link generation and tracking
- **GSHOP Pixel**: Website analytics tracking script
- **Analytics Dashboard**: Real-time metrics and reporting
- **Enhanced Payments**: Commission tracking and withdrawals

### ✅ Phase 2 - Ads Manager & Live Shopping (COMPLETED)
- **Ads Manager**: Campaign creation with DPA, retargeting, and custom campaigns
- **Dynamic Product Ads**: Auto-generated product feeds and personalized recommendations
- **Audience Management**: Pixel-based segmentation and lookalike audiences
- **Live Shopping Platform**: RTMP/HLS streaming with seller & affiliate host support
- **Affiliate Live Streaming**: Complete integration with commission tracking and attribution
- **Mobile Live Experience**: Stream viewing with host badges and interactive showcases
- **WebSocket Integration**: Real-time communication infrastructure
- **Purchase Attribution**: Automatic commission calculation for affiliate-hosted streams

### ✅ Phase 3 - Marketplace & AI Features (COMPLETED)
- **Marketplace Global**: Multi-seller platform with KYC, reviews, and inventory management
- **Enhanced Payment System V2**: Stripe integration and USDC crypto payments on Polygon
- **GSHOP Token Economy**: Internal wallet, 5% cashback rewards, and peer-to-peer transfers
- **AI-Powered Recommendations**: ML algorithms with collaborative filtering, content-based, and hybrid approaches
- **Advanced Analytics**: Token circulation metrics, payment analytics, and recommendation performance tracking
- **Blockchain Integration**: Real-time transaction verification and gas optimization on Polygon network

### ✅ Phase 4 - Creator Economy (COMPLETED)
- **Creator System**: Complete TikTok Shop-style creator economy
- **Social Features**: Follow/unfollow system with notifications and social proof
- **Content Management**: Video creation with product tagging and metadata
- **Engagement System**: Like, comment, share with real-time analytics
- **Creator Dashboard**: Performance metrics, earnings tracking, and analytics
- **Live Integration**: Seamless integration with existing live streaming
- **Admin Management**: Creator approval workflow and content moderation
- **Revenue Sharing**: Commission-based earnings with transparent tracking

### 🔮 Phase 5 - Enterprise Features (PLANNED)
- White-label solutions
- Advanced analytics and AI insights
- B2B marketplace features
- International payment gateways
- Advanced fraud detection

---

Built with ❤️ for the GSHOP community
