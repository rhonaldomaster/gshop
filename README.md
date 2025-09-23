
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

### Mobile App Features
- Product browsing and search
- Social shopping features
- Cart management
- Secure checkout
- Order tracking
- User profiles
- Live stream viewing with chat (PHASE 2)
- Real-time product recommendations (PHASE 2)

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
│   │   └── database/      # Database config & migrations
│   └── Dockerfile
├── admin-web/             # Next.js Admin Panel
│   ├── app/
│   │   ├── ads/          # 🆕 Phase 2: Ads Manager UI
│   │   ├── live/         # 🆕 Phase 2: Live Shopping management
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

### MercadoPago Setup
1. Create a MercadoPago developer account
2. Get your credentials from the dashboard
3. Update environment variables:
   - `MERCAPAGO_CLIENT_ID`
   - `MERCAPAGO_CLIENT_SECRET`
   - `MERCAPAGO_ACCESS_TOKEN`

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

### 🚧 Phase 3 - Advanced Social Features (PLANNED)
- Social features (reviews, ratings, follows)
- Advanced recommendation engine with ML
- Multi-language support
- Enhanced mobile app features
- Creator monetization tools

### 🔮 Phase 4 - Enterprise Features (PLANNED)
- White-label solutions
- Advanced analytics and AI insights
- B2B marketplace features
- International payment gateways
- Advanced fraud detection

---

Built with ❤️ for the GSHOP community
