
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
- RTMP/HLS live streaming infrastructure
- Real-time chat with WebSocket integration
- Live product showcasing with purchase overlays
- Viewer count tracking and engagement metrics
- Stream scheduling and management
- Mobile-optimized viewing experience

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

### Mobile App Features
- Product browsing and search
- Social shopping features
- Cart management
- Secure checkout
- Order tracking
- User profiles
- Live stream viewing with chat (PHASE 2)
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
# All services (includes new seller panel)
npm run dev

# Individual services
npm run dev:backend   # Backend API on :3000
npm run dev:admin     # Admin panel on :3001
npm run dev:seller    # Seller panel on :3002
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
│   │   ├── affiliates/    # 🆕 Affiliate system (links, tracking)
│   │   ├── pixel/         # 🆕 Analytics tracking events
│   │   ├── analytics/     # 🆕 Reporting and metrics
│   │   ├── ads/           # 🆕 Phase 2: Campaign management & DPA
│   │   ├── audiences/     # 🆕 Phase 2: Audience segmentation
│   │   ├── live/          # 🆕 Phase 2: Live streaming infrastructure
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
│   ├── app/              # Next.js 14 app directory
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
- `POST /api/v1/live/streams` - Create live stream
- `GET /api/v1/live/streams/active` - Get active live streams
- `POST /api/v1/live/streams/:id/start` - Start live stream
- `POST /api/v1/live/streams/:id/end` - End live stream
- `POST /api/v1/live/streams/:id/products` - Add product to stream
- `POST /api/v1/live/streams/:id/messages` - Send chat message
- `GET /api/v1/live/streams/:id/stats` - Get stream analytics

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
# Start all services
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
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
- **Live Shopping Platform**: RTMP/HLS streaming with real-time chat
- **Mobile Live Experience**: Stream viewing with interactive product showcases
- **WebSocket Integration**: Real-time communication infrastructure

### ✅ Phase 3 - Marketplace & AI Features (COMPLETED)
- **Marketplace Global**: Multi-seller platform with KYC, reviews, and inventory management
- **Enhanced Payment System V2**: Stripe integration and USDC crypto payments on Polygon
- **GSHOP Token Economy**: Internal wallet, 5% cashback rewards, and peer-to-peer transfers
- **AI-Powered Recommendations**: ML algorithms with collaborative filtering, content-based, and hybrid approaches
- **Advanced Analytics**: Token circulation metrics, payment analytics, and recommendation performance tracking
- **Blockchain Integration**: Real-time transaction verification and gas optimization on Polygon network

### 🔮 Phase 4 - Enterprise Features (PLANNED)
- White-label solutions
- Advanced analytics and AI insights
- B2B marketplace features
- International payment gateways
- Advanced fraud detection

---

Built with ❤️ for the GSHOP community
