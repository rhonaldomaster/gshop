
# GSHOP - TikTok Shop Clone MVP

A comprehensive e-commerce platform with social shopping features, built with modern technologies.

## 🏗️ Architecture

- **Backend**: NestJS with microservices architecture
- **Admin Web Panel**: Next.js with TypeScript and Tailwind CSS
- **Mobile App**: React Native with Expo
- **Database**: PostgreSQL with TypeORM
- **Payment**: MercadoPago integration
- **Authentication**: JWT + NextAuth

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
# All services
npm run dev

# Individual services
npm run dev:backend   # Backend API on :3000
npm run dev:admin     # Admin panel on :3001
npm run dev:mobile    # Mobile app with Expo
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
│   │   └── database/      # Database config & migrations
│   └── Dockerfile
├── admin-web/             # Next.js Admin Panel
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Admin pages
│   │   ├── styles/        # Tailwind styles
│   │   └── utils/         # Helper functions
│   └── Dockerfile
├── mobile/                # React Native App
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── screens/       # App screens
│   │   ├── navigation/    # Navigation setup
│   │   └── services/      # API services
│   └── app.json
├── branding/             # Brand assets
│   ├── logos/
│   ├── icons/
│   └── guidelines/
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

Built with ❤️ for the GSHOP community
