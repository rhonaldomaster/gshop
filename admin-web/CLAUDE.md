# CLAUDE.md - GSHOP Admin Panel

> **Related Repositories**
> - **Backend API**: gshop-backend
> - **Mobile App**: gshop-mobile
> - **Seller Panel**: gshop-seller
> - **Documentation**: gshop-docs

## Project Overview

GSHOP Admin Panel - Next.js web application for platform administration. Manage sellers, products, ads campaigns, audiences, and analytics.

**Tech Stack**:
- **Framework**: Next.js 14 with App Router
- **Database**: Prisma ORM (separate from backend TypeORM)
- **Authentication**: NextAuth.js
- **UI**: Tailwind CSS + Radix UI components
- **State Management**: Zustand
- **Data Fetching**: React Query (@tanstack/react-query)
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation

## Development Commands

```bash
# Development
npm run dev              # Start dev server on http://localhost:3001
npm run build            # Build for production
npm run start            # Start production server

# Database
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Run migrations
npx prisma studio        # Open Prisma Studio GUI

# Testing & Linting
npm run lint             # Run ESLint
npm test                 # Run tests
```

## Environment Variables

Create `.env.local`:
```bash
# Database (Prisma)
DATABASE_URL=postgresql://gshop_user:gshop_password@localhost:5432/gshop_db

# NextAuth
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-nextauth-secret-change-this-in-production

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

## App Structure

```
app/
├── (auth)/
│   ├── login/           # Admin login page
│   └── register/        # Admin registration
├── dashboard/
│   ├── page.tsx         # Main dashboard with stats
│   ├── sellers/         # Seller management
│   ├── products/        # Product approval/management
│   ├── orders/          # Order monitoring
│   ├── analytics/       # Platform analytics
│   ├── ads/             # Ad campaign manager
│   └── audiences/       # Audience management
├── api/
│   └── auth/[...nextauth]/route.ts  # NextAuth API routes
├── layout.tsx           # Root layout
└── providers.tsx        # Client providers (QueryClient, Zustand)

components/
├── ui/                  # Radix UI components
├── dashboard/           # Dashboard-specific components
├── ads/                 # Ad campaign components
└── charts/              # Recharts wrappers

lib/
├── prisma.ts            # Prisma client
├── auth.ts              # NextAuth config
└── api.ts               # API client

prisma/
├── schema.prisma        # Database schema
└── migrations/          # Prisma migrations
```

## Key Features

### 🏪 Seller Management
- View all sellers with KYC status
- Approve/reject seller applications
- Track seller performance metrics
- Manage seller withdrawals

### 📦 Product Management
- Approve new products
- Moderate product listings
- Track inventory across sellers
- Category management

### 📊 Analytics Dashboard
- Real-time GMV (Gross Merchandise Value)
- Seller performance metrics
- Commission tracking and payouts
- Traffic source analysis
- Product performance

### 🎯 Ads Manager (Phase 2)
- **Location**: `app/ads/`
- **Features**:
  - Campaign creation (DPA, Retargeting, Custom)
  - Real-time metrics (CTR, CPA, ROAS)
  - Budget control and scheduling
  - Campaign activation/deactivation
  - Performance dashboard

### 👥 Audience Management (Phase 2)
- **Location**: `app/audiences/`
- **Features**:
  - Create custom audiences from pixel events
  - Upload customer lists
  - Generate lookalike audiences
  - Audience size estimation
  - Segmentation rules (timeframe, events)
  - Real-time audience updates

### 💳 Payment Monitoring
- Track all platform payments
- MercadoPago/Stripe transaction logs
- Crypto payment verification
- Refund management

### 📈 Reports
- Daily/weekly/monthly reports
- Seller performance rankings
- Product performance analytics
- Commission reports

## Database Schema (Prisma)

### Admin Entities
```prisma
model Admin {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  role      String   @default("admin")
  createdAt DateTime @default(now())
}

model SellerApproval {
  id         String   @id @default(cuid())
  sellerId   String
  status     String   // pending, approved, rejected
  notes      String?
  reviewedBy String?
  reviewedAt DateTime?
}
```

**Note**: Most data is fetched from backend API. Prisma is used primarily for admin user management and admin-specific data.

## API Integration

Admin panel primarily consumes backend API endpoints:

### Seller Management
- `GET /api/v1/sellers` - List all sellers
- `PUT /api/v1/sellers/:id/approve` - Approve seller
- `PUT /api/v1/sellers/:id/reject` - Reject seller
- `GET /api/v1/sellers/:id/stats` - Seller stats

### Analytics
- `GET /api/v1/analytics/dashboard` - Platform stats
- `GET /api/v1/analytics/sellers` - Seller performance
- `GET /api/v1/analytics/products` - Product performance

### Ads Manager
- `GET /api/v1/ads/campaigns` - List all campaigns
- `POST /api/v1/ads/campaigns` - Create campaign
- `PUT /api/v1/ads/campaigns/:id/status` - Update status
- `GET /api/v1/ads/dashboard` - Ads dashboard stats

### Audiences
- `GET /api/v1/audiences` - List audiences
- `POST /api/v1/audiences` - Create audience
- `POST /api/v1/audiences/:id/rebuild` - Rebuild audience
- `GET /api/v1/audiences/:id/users` - Get members

## Authentication (NextAuth)

NextAuth configuration in `lib/auth.ts`:

```typescript
export const authOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        // Authenticate against backend API or Prisma
        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email }
        });
        // Verify password and return user
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, token }) {
      // Add admin ID to session
    }
  }
};
```

## State Management

### Zustand Stores
```typescript
// stores/dashboardStore.ts
export const useDashboardStore = create((set) => ({
  stats: null,
  setStats: (stats) => set({ stats }),
  loading: false,
  setLoading: (loading) => set({ loading }),
}));
```

### React Query
```typescript
// hooks/useSellerData.ts
export function useSellerData() {
  return useQuery({
    queryKey: ['sellers'],
    queryFn: async () => {
      const res = await fetch('/api/v1/sellers');
      return res.json();
    }
  });
}
```

## UI Components (Radix UI)

### Common Components
- **Button**: `components/ui/button.tsx`
- **Dialog**: `components/ui/dialog.tsx`
- **Table**: `components/ui/table.tsx`
- **Dropdown Menu**: `components/ui/dropdown-menu.tsx`
- **Toast**: `components/ui/toast.tsx`
- **Card**: `components/ui/card.tsx`

### Dashboard Components
- **StatCard**: Revenue/GMV cards
- **SellerTable**: Sortable seller list
- **ProductGrid**: Product approval grid
- **ChartWidget**: Recharts wrappers

## Ads Manager UI

### Campaign Creation Flow
1. Select campaign type (DPA, Retargeting, Custom)
2. Choose target audience
3. Set budget and schedule
4. Define creative assets
5. Review and launch

### Metrics Dashboard
- CTR (Click-Through Rate)
- CPA (Cost Per Acquisition)
- ROAS (Return on Ad Spend)
- Daily spend tracking
- Performance charts with Recharts

## Testing

```bash
# Run tests
npm test

# E2E with Playwright (if configured)
npm run test:e2e
```

## Deployment

### Build for Production
```bash
npm run build
npm run start
```

### Environment Variables (Production)
```bash
DATABASE_URL=postgresql://user:pass@production-db/gshop
NEXTAUTH_URL=https://admin.gshop.com
NEXTAUTH_SECRET=your-production-secret
NEXT_PUBLIC_API_URL=https://api.gshop.com/api/v1
```

### Deploy to Vercel
```bash
vercel --prod
```

Or connect GitHub repo to Vercel for auto-deployment.

## Performance Optimizations

- **Server Components**: Use React Server Components by default
- **Image Optimization**: Next.js `<Image>` component
- **Code Splitting**: Automatic with Next.js App Router
- **React Query**: Cache API responses
- **Prisma**: Connection pooling enabled

## Security

- **NextAuth**: Secure session management
- **CSRF Protection**: Built-in with NextAuth
- **Environment Variables**: Server-only secrets
- **API Routes**: Protected with middleware
- **Input Validation**: Zod schemas on forms

## Common Issues

### Prisma Client Not Generated
```bash
npx prisma generate
```

### Database Connection Errors
Check DATABASE_URL in `.env.local`

### NextAuth Session Issues
Clear browser cookies and restart dev server

## Links

- **Backend API**: All data from `http://localhost:3000/api/v1`
- **Seller Panel**: Separate Next.js app for sellers
- **Mobile App**: End-user mobile experience
- **Documentation**: See gshop-docs for architecture

## Future Enhancements

- [ ] Real-time dashboard updates with WebSocket
- [ ] Advanced reporting with CSV export
- [ ] Seller communication/messaging system
- [ ] Automated fraud detection alerts
- [ ] Multi-language support
- [ ] Dark mode
