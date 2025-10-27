# CLAUDE.md - GSHOP Seller Panel

> **Related Repositories**
> - **Backend API**: gshop-backend
> - **Mobile App**: gshop-mobile
> - **Admin Panel**: gshop-admin
> - **Documentation**: gshop-docs

## Project Overview

GSHOP Seller Panel - Next.js web application for sellers to manage their stores. Product management, order fulfillment, live shopping, and analytics.

**Tech Stack**:
- **Framework**: Next.js 14 with App Router
- **Authentication**: NextAuth.js with JWT
- **UI**: Tailwind CSS + Radix UI
- **State Management**: Zustand + React Query
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts for analytics
- **Real-time**: Socket.IO for live shopping

## Development Commands

```bash
# Development
npm run dev              # Start dev server on http://localhost:3002
npm run build            # Build for production
npm run start            # Start production server

# Deployment Script
./deploy_seller.sh development    # Deploy in dev mode
./deploy_seller.sh production     # Deploy in prod mode

# Testing & Linting
npm run lint             # Run ESLint
npm test                 # Run tests
```

## Environment Variables

Create `.env.local`:
```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=your-nextauth-secret-change-this-in-production

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1

# Live Streaming
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3000
NEXT_PUBLIC_RTMP_SERVER_URL=rtmp://localhost:1935/live
NEXT_PUBLIC_HLS_SERVER_URL=http://localhost:8080/hls

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

## App Structure

```
app/
├── (auth)/
│   ├── login/           # Seller login
│   ├── register/        # Seller registration with KYC
│   └── layout.tsx
├── dashboard/
│   ├── page.tsx         # Main dashboard with stats
│   ├── products/        # Product CRUD
│   │   ├── page.tsx     # Product list
│   │   ├── new/         # Create product
│   │   └── [id]/        # Edit product
│   ├── orders/          # Order management
│   │   ├── page.tsx     # Order list
│   │   └── [id]/        # Order details
│   ├── live/            # Live shopping
│   │   ├── page.tsx     # Stream list
│   │   ├── new/         # Create stream
│   │   └── [id]/        # Manage stream
│   ├── analytics/       # Seller analytics
│   ├── commissions/     # Commission tracking
│   ├── withdrawals/     # Withdrawal requests
│   └── settings/        # Seller settings
├── api/
│   └── auth/[...nextauth]/route.ts  # NextAuth routes
└── layout.tsx           # Root layout

components/
├── ui/                  # Radix UI components
├── dashboard/           # Dashboard widgets
├── products/            # Product components
├── orders/              # Order components
└── live/                # Live shopping components
```

## Key Features

### 🏪 Seller Dashboard
- Sales metrics (daily, weekly, monthly)
- Order summary (pending, shipped, delivered)
- Commission tracking
- Quick actions (add product, view orders)
- Performance charts

### 📦 Product Management
- **CRUD Operations**: Create, read, update, delete products
- **Multi-image Upload**: Support for multiple product images
- **Inventory Tracking**: Stock management with low-stock alerts
- **Categories**: Assign products to categories
- **Status Management**: Draft, active, sold_out, discontinued

### 📋 Order Management
- View all orders with filters (status, date range)
- Order details with customer info
- Shipping management:
  - Review automatically generated shipping labels (EasyPost)
  - Approve shipping and tracking numbers
  - Update shipping status
- Returns processing:
  - Review return requests
  - Approve/reject returns with notes
  - Automated MercadoPago refunds on approval

### 📺 Live Shopping (Phase 2)
- **Location**: `app/dashboard/live/`
- **Features**:
  - Create and schedule live streams
  - RTMP streaming key generation
  - Add products to live stream overlay
  - Real-time viewer count
  - Live chat moderation
  - Stream analytics (views, engagement, sales)
  - Host type: Seller (not affiliate)

### 💰 Commission & Withdrawals
- View total earnings and commissions
- Track affiliate-driven sales
- Request withdrawals
- Withdrawal history and status

### 📊 Analytics
- Sales trends and performance
- Top-selling products
- Customer demographics
- Traffic sources
- Conversion rates

## Authentication (NextAuth)

Seller authentication with JWT from backend:

```typescript
// lib/auth.ts
export const authOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        // Call backend API: POST /api/v1/auth/seller/login
        const res = await fetch(`${API_URL}/auth/seller/login`, {
          method: 'POST',
          body: JSON.stringify(credentials),
        });
        const data = await res.json();
        if (data.token) {
          return {
            id: data.seller.id,
            email: data.seller.email,
            token: data.token,
          };
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    }
  }
};
```

## API Integration

All API calls use backend endpoints:

### Seller Auth
- `POST /api/v1/auth/seller/register` - Register with KYC
- `POST /api/v1/auth/seller/login` - Login

### Seller Profile
- `GET /api/v1/sellers/profile` - Get profile
- `PUT /api/v1/sellers/profile` - Update profile
- `GET /api/v1/sellers/stats` - Get dashboard stats

### Products
- `GET /api/v1/products?sellerId=:id` - List seller products
- `POST /api/v1/products` - Create product
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product

### Orders
- `GET /api/v1/orders?sellerId=:id` - List seller orders
- `GET /api/v1/orders/:id` - Get order details
- `PUT /api/v1/orders/:id/shipping-status` - Update shipping status
- `PUT /api/v1/orders/:id/process-return` - Process return request

### Live Shopping
- `POST /api/v1/live/streams` - Create stream
- `GET /api/v1/live/streams/seller/:sellerId` - Get seller streams
- `POST /api/v1/live/streams/:id/start` - Start stream
- `POST /api/v1/live/streams/:id/end` - End stream
- `POST /api/v1/live/streams/:id/products` - Add product to stream
- `GET /api/v1/live/streams/:id/stats` - Get stream analytics

### Withdrawals
- `POST /api/v1/sellers/withdrawal` - Request withdrawal
- `GET /api/v1/sellers/withdrawals` - Get withdrawal history

## Order Management Flow

### Shipping Approval Workflow
1. Customer completes checkout with shipping selection
2. Backend generates shipping label via EasyPost
3. Seller reviews order in dashboard
4. Seller approves shipping (tracking auto-generated)
5. Order status updates to `in_transit`
6. Customer receives tracking link

### Returns Processing Workflow
1. Customer requests return within 30 days
2. Return appears in seller dashboard
3. Seller reviews return reason and proof
4. Seller approves or rejects with notes
5. If approved: Automated MercadoPago refund
6. Order status updates to `refunded`

## Live Shopping Setup

### Starting a Live Stream
1. Create stream in dashboard (`/dashboard/live/new`)
2. Add products to showcase
3. Get RTMP URL and stream key
4. Use OBS/Streamlabs with RTMP URL:
   ```
   rtmp://localhost:1935/live/{stream_key}
   ```
5. Start streaming software
6. Click "Start Stream" in dashboard
7. Stream goes live on mobile app

### Managing Live Stream
- Add/remove products during stream
- Monitor viewer count in real-time
- View live chat messages
- End stream when done
- View analytics after stream ends

## UI Components

### Dashboard Widgets
- **StatCard**: Display key metrics
- **OrderTable**: Sortable order list
- **ProductGrid**: Product gallery
- **RevenueChart**: Sales over time

### Product Forms
- **ProductForm**: Create/edit product with validation
- **ImageUpload**: Multi-image upload component
- **CategorySelect**: Category dropdown

### Order Components
- **OrderDetails**: Full order information
- **ShippingStatus**: Status timeline
- **ReturnReview**: Return approval UI

## State Management

### Zustand Stores
```typescript
// stores/sellerStore.ts
export const useSellerStore = create((set) => ({
  profile: null,
  stats: null,
  setProfile: (profile) => set({ profile }),
  setStats: (stats) => set({ stats }),
}));
```

### React Query
```typescript
// hooks/useProducts.ts
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/v1/products');
      return res.json();
    }
  });
}
```

## Deployment

### Quick Deploy Script
```bash
chmod +x deploy_seller.sh
./deploy_seller.sh production
```

Script handles:
- Dependency installation
- Environment setup
- Build process
- PM2 process management (optional)

### Manual Deployment
```bash
npm install
npm run build
npm run start
```

### Production Environment
```bash
NEXTAUTH_URL=https://seller.gshop.com
NEXTAUTH_SECRET=production-secret
NEXT_PUBLIC_API_URL=https://api.gshop.com/api/v1
```

## Testing

```bash
npm test
npm run lint
```

## Performance

- **Server Components**: Default for data fetching
- **Image Optimization**: Next.js `<Image>`
- **React Query**: Cache management
- **Lazy Loading**: Dynamic imports for charts

## Security

- **NextAuth**: Secure session management
- **JWT**: Token-based auth with backend
- **Protected Routes**: Middleware for auth
- **Input Validation**: Zod schemas

## Common Issues

### NextAuth Session Lost
Clear cookies and re-login

### Live Streaming Not Working
Check RTMP server is running and URL is correct in .env

### Order Not Updating
Verify backend API is accessible and token is valid

## Links

- **Backend API**: http://localhost:3000/api/v1
- **Mobile App**: Customers view products/streams here
- **Admin Panel**: Platform administration
- **Documentation**: See gshop-docs for full details

## Future Features

- [ ] Bulk product upload (CSV)
- [ ] Advanced analytics with cohort analysis
- [ ] Multi-seller collaboration on live streams
- [ ] Automated product recommendations
- [ ] Seller messaging system
- [ ] Shipping label printing
