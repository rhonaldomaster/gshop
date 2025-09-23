
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

### Mobile App Features
- Product browsing and search
- Social shopping features
- Cart management
- Secure checkout
- Order tracking
- User profiles

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
│   │   └── database/      # Database config & migrations
│   └── Dockerfile
├── admin-web/             # Next.js Admin Panel
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Admin pages
│   │   ├── styles/        # Tailwind styles
│   │   └── utils/         # Helper functions
│   └── Dockerfile
├── seller-panel/          # 🆕 Next.js Seller Panel
│   ├── app/              # Next.js 14 app directory
│   ├── components/       # Seller UI components
│   ├── lib/              # Auth and utilities
│   └── types/            # TypeScript definitions
├── mobile/                # React Native App
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── screens/       # App screens
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

### New API Endpoints (Phase 1)

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

### 🚧 Phase 2 - Advanced Features (PLANNED)
- Live streaming integration
- Social features (reviews, ratings, follows)
- Advanced recommendation engine
- Multi-language support
- Enhanced mobile app features

### 🔮 Phase 3 - Enterprise Features (PLANNED)
- White-label solutions
- Advanced analytics and AI insights
- B2B marketplace features
- International payment gateways
- Advanced fraud detection

---

Built with ❤️ for the GSHOP community
