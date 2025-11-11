# Admin Panel - Missing Pages Implementation Plan

## Overview

This document outlines the implementation plan for missing pages in the admin panel navigation menu. Based on the `navigationConfig` in `sidebar.tsx`, 6 out of 10 pages need to be created.

---

## ✅ Existing Pages (4/10)

1. **Dashboard** - `/dashboard/page.tsx` ✅
2. **Products** - `/dashboard/products/page.tsx` ✅
3. **Ads Manager** - `/ads/page.tsx` ✅
4. **Live Streams** - `/live/page.tsx` ✅

---

## ✅ Implementation Complete! (6/6)

**Status:** All 6 missing pages have been successfully implemented!
**Date Completed:** November 11, 2025

### Summary of Completed Pages:

### 1. Categories Management (`/dashboard/categories`) ✅ COMPLETED

**Priority:** HIGH
**Location:** `admin-web/app/dashboard/categories/page.tsx`
**Status:** ✅ Completed - Main page with tree/flat view toggle and category management implemented
**Files Created:**
- `admin-web/app/dashboard/categories/page.tsx` - Main categories page
- `admin-web/components/categories/categories-table.tsx` - Categories table with tree view

#### Features Required:
- **Category List View**
  - Display all product categories in a table/grid
  - Show category name, description, product count
  - Search and filter functionality
  - Sort by name, creation date, product count

- **CRUD Operations**
  - Create new category with name, description, icon/image
  - Edit existing category details
  - Delete category (with product reassignment check)
  - Bulk actions (delete, activate/deactivate)

- **Category Hierarchy**
  - Support parent/child categories (subcategories)
  - Drag-and-drop reordering
  - Visual tree structure display

#### API Endpoints Needed:
```typescript
GET    /api/v1/categories           // List all categories
POST   /api/v1/categories           // Create category
GET    /api/v1/categories/:id       // Get category details
PUT    /api/v1/categories/:id       // Update category
DELETE /api/v1/categories/:id       // Delete category
```

#### UI Components:
- `CategoryList.tsx` - Main list view
- `CategoryForm.tsx` - Create/edit form
- `CategoryCard.tsx` - Grid view item
- `CategoryTree.tsx` - Hierarchy tree view

---

### 2. Orders Management (`/dashboard/orders`) ✅ COMPLETED

**Priority:** CRITICAL
**Location:** `admin-web/app/dashboard/orders/page.tsx`
**Status:** ✅ Completed - Main page, table with filters, and detail view implemented
**Files Created:**
- `admin-web/app/dashboard/orders/page.tsx` - Main orders page
- `admin-web/app/dashboard/orders/[id]/page.tsx` - Order detail page
- `admin-web/components/orders/orders-table.tsx` - Orders table component

#### Features Required:
- **Order List View**
  - Display all orders with status, customer, total, date
  - Advanced filters (status, date range, payment method, seller)
  - Search by order ID, customer name, product name
  - Pagination and infinite scroll

- **Order Details**
  - View full order information
  - Customer details (name, address, contact)
  - Order items with product details and prices
  - Payment information and status
  - Shipping/tracking information
  - VAT breakdown by category (Excluido, Exento, Reducido, General)
  - Commission tracking (if affiliate/live stream order)

- **Order Actions**
  - Update order status (pending → confirmed → processing → shipped → delivered)
  - Cancel orders with refund processing
  - Process returns and refunds
  - Add internal notes
  - Print invoices/packing slips
  - Send status update emails to customers

- **Analytics Dashboard**
  - Orders by status (pie chart)
  - Revenue trends (line chart)
  - Top products and sellers
  - Average order value
  - Conversion rate

#### API Endpoints Needed:
```typescript
GET    /api/v1/orders                    // List orders with filters
GET    /api/v1/orders/:id                // Get order details
PUT    /api/v1/orders/:id/status         // Update order status
POST   /api/v1/orders/:id/cancel         // Cancel order
POST   /api/v1/orders/:id/refund         // Process refund
POST   /api/v1/orders/:id/note           // Add internal note
GET    /api/v1/orders/:id/invoice        // Generate invoice PDF
GET    /api/v1/orders/analytics          // Get order analytics
```

#### UI Components:
- `OrderList.tsx` - Main orders table
- `OrderFilters.tsx` - Advanced filter sidebar
- `OrderDetails.tsx` - Order detail modal/page
- `OrderStatusBadge.tsx` - Status indicator
- `OrderActions.tsx` - Action buttons (cancel, refund, etc.)
- `OrderTimeline.tsx` - Status history timeline
- `OrderAnalytics.tsx` - Analytics dashboard

---

### 3. Users Management (`/dashboard/users`) ✅ COMPLETED

**Priority:** HIGH
**Location:** `admin-web/app/dashboard/users/page.tsx`
**Status:** ✅ Completed - Main page with user stats and management table implemented
**Files Created:**
- `admin-web/app/dashboard/users/page.tsx` - Main users page
- `admin-web/components/users/users-table.tsx` - Users table with filters and actions
- `admin-web/components/users/user-stats.tsx` - User statistics dashboard

#### Features Required:
- **User List View**
  - Display all users (customers, sellers, affiliates, admins)
  - Show user type, registration date, status, total orders
  - Search by name, email, phone
  - Filter by user type, status, registration date

- **User Details**
  - View full user profile
  - Order history and purchase patterns
  - Account status and verification status
  - Contact information
  - Roles and permissions (for admin users)

- **User Actions**
  - Activate/deactivate user accounts
  - Reset user passwords
  - Edit user information
  - Assign roles (admin, moderator, etc.)
  - Ban/suspend users
  - View login history and activity logs

- **Seller & Affiliate Management**
  - KYC verification status
  - Performance metrics (sales, commissions)
  - Approve/reject seller applications
  - Manage affiliate links and campaigns

#### API Endpoints Needed:
```typescript
GET    /api/v1/users                     // List all users with filters
GET    /api/v1/users/:id                 // Get user details
PUT    /api/v1/users/:id                 // Update user information
DELETE /api/v1/users/:id                 // Delete user account
PUT    /api/v1/users/:id/status          // Update user status
POST   /api/v1/users/:id/reset-password  // Send password reset
GET    /api/v1/users/:id/orders          // Get user order history
GET    /api/v1/users/:id/activity        // Get activity logs
PUT    /api/v1/users/:id/roles           // Update user roles
```

#### UI Components:
- `UserList.tsx` - Main users table
- `UserFilters.tsx` - Filter sidebar
- `UserDetails.tsx` - User profile view
- `UserTypeBadge.tsx` - User type indicator
- `UserActions.tsx` - Action buttons
- `SellerKYC.tsx` - KYC verification component
- `UserActivityLog.tsx` - Activity timeline

---

### 4. Payments Management (`/dashboard/payments`) ✅ COMPLETED

**Priority:** CRITICAL
**Location:** `admin-web/app/dashboard/payments/page.tsx`
**Status:** ✅ Completed - Main page, payment stats, transactions table, and withdrawals management implemented
**Files Created:**
- `admin-web/app/dashboard/payments/page.tsx` - Main payments page
- `admin-web/components/payments/payments-table.tsx` - Payments table with refund functionality
- `admin-web/components/payments/payment-stats.tsx` - Payment statistics dashboard
- `admin-web/components/payments/withdrawals-table.tsx` - Seller withdrawals management

#### Features Required:
- **Payment List View**
  - Display all payment transactions
  - Show payment method, status, amount, date
  - Filter by status, method, date range, seller
  - Search by transaction ID, order ID, customer

- **Payment Details**
  - Full transaction information
  - Related order details
  - Customer payment method
  - Transaction timeline
  - Refund history
  - MercadoPago transaction details

- **Payment Actions**
  - Process refunds (full/partial)
  - Mark payments as verified
  - Handle failed payments
  - Export payment reports
  - Download invoices

- **Seller Payouts**
  - View pending withdrawals
  - Approve/reject withdrawal requests
  - Process bulk payouts
  - Track commission payments
  - Payout history

- **Analytics Dashboard**
  - Revenue trends by payment method
  - Failed payment analysis
  - Refund rates
  - Seller payout summary
  - MercadoPago fees tracking

#### API Endpoints Needed:
```typescript
GET    /api/v1/payments                  // List all payments
GET    /api/v1/payments/:id              // Get payment details
POST   /api/v1/payments/:id/refund       // Process refund
PUT    /api/v1/payments/:id/status       // Update payment status
GET    /api/v1/payments/analytics        // Payment analytics
GET    /api/v1/payments/withdrawals      // List withdrawal requests
POST   /api/v1/payments/withdrawals/:id/approve  // Approve withdrawal
POST   /api/v1/payments/withdrawals/:id/reject   // Reject withdrawal
GET    /api/v1/payments/export           // Export payment data
```

#### UI Components:
- `PaymentList.tsx` - Main payments table
- `PaymentFilters.tsx` - Filter sidebar
- `PaymentDetails.tsx` - Transaction details
- `PaymentStatusBadge.tsx` - Status indicator
- `RefundForm.tsx` - Refund processing form
- `WithdrawalList.tsx` - Seller withdrawals table
- `PaymentAnalytics.tsx` - Analytics dashboard

---

### 5. Analytics Dashboard (`/dashboard/analytics`) ✅ COMPLETED

**Priority:** HIGH
**Location:** `admin-web/app/dashboard/analytics/page.tsx`
**Status:** ✅ Completed - Overview metrics, revenue charts, and top performers implemented
**Files Created:**
- `admin-web/app/dashboard/analytics/page.tsx` - Main analytics page
- `admin-web/components/analytics/analytics-overview.tsx` - Overview metrics dashboard
- `admin-web/components/analytics/revenue-chart.tsx` - Revenue trends visualization
- `admin-web/components/analytics/top-products.tsx` - Top products widget
- `admin-web/components/analytics/top-sellers.tsx` - Top sellers widget

#### Features Required:
- **Overview Metrics**
  - Total revenue (with date range selector)
  - Total orders
  - Total users (customers, sellers, affiliates)
  - Average order value
  - Conversion rate

- **Revenue Analytics**
  - Revenue trends (line chart - daily, weekly, monthly)
  - Revenue by category
  - Revenue by seller
  - Revenue by payment method
  - GMV (Gross Merchandise Value)

- **Sales Analytics**
  - Orders by status (pie chart)
  - Top-selling products
  - Top-performing sellers
  - Sales by region/location
  - Sales by time of day/day of week

- **User Analytics**
  - New user registrations
  - Active users (DAU, MAU)
  - User retention rate
  - User lifetime value

- **Traffic & Conversion**
  - Pixel event analytics
  - Page views and sessions
  - Traffic sources
  - Conversion funnel
  - Cart abandonment rate

- **VAT Reporting**
  - VAT breakdown by category (Excluido, Exento, Reducido, General)
  - Total base price, VAT amount, total with VAT
  - Order count per VAT category
  - Date range filtering for tax compliance

- **Export & Reporting**
  - Export data to CSV/Excel
  - Generate PDF reports
  - Schedule automated reports
  - Custom date ranges

#### API Endpoints Needed:
```typescript
GET    /api/v1/analytics/overview        // General overview metrics
GET    /api/v1/analytics/revenue         // Revenue analytics
GET    /api/v1/analytics/sales           // Sales analytics
GET    /api/v1/analytics/users           // User analytics
GET    /api/v1/analytics/traffic         // Traffic analytics
GET    /api/v1/analytics/vat-report      // VAT report (EXISTING)
GET    /api/v1/analytics/export          // Export analytics data
```

#### UI Components:
- `AnalyticsOverview.tsx` - Main metrics dashboard
- `RevenueChart.tsx` - Revenue visualization
- `SalesChart.tsx` - Sales trends
- `TopProducts.tsx` - Top products widget
- `TopSellers.tsx` - Top sellers widget
- `UserMetrics.tsx` - User analytics
- `TrafficSources.tsx` - Traffic analytics
- `VATReport.tsx` - VAT breakdown (EXISTING)
- `DateRangePicker.tsx` - Date range selector
- `ExportButton.tsx` - Export functionality

---

### 6. Settings (`/dashboard/settings`) ✅ COMPLETED

**Priority:** MEDIUM
**Location:** `admin-web/app/dashboard/settings/page.tsx`
**Status:** ✅ Completed - Settings page with tabs for general, payment, email, and security settings implemented
**Files Created:**
- `admin-web/app/dashboard/settings/page.tsx` - Main settings page with tabs
- `admin-web/components/settings/general-settings.tsx` - General site settings
- `admin-web/components/settings/payment-settings.tsx` - Payment and commission settings
- `admin-web/components/settings/email-settings.tsx` - Email/SMTP configuration
- `admin-web/components/settings/security-settings.tsx` - Security and password policies

#### Features Required:
- **General Settings**
  - Site name and description
  - Logo and favicon upload
  - Contact information
  - Social media links
  - Default language and currency

- **Email Settings**
  - SMTP configuration
  - Email templates (order confirmation, shipping, etc.)
  - Test email functionality
  - Email notification toggles

- **Payment Settings**
  - MercadoPago credentials
  - Default commission rate
  - Withdrawal settings (minimum amount, frequency)
  - Tax/VAT configuration
  - Currency settings

- **Shipping Settings**
  - Shipping rate configuration
  - Free shipping thresholds
  - Supported countries/regions
  - Default shipping provider

- **System Settings**
  - Maintenance mode toggle
  - API rate limiting
  - Cache settings
  - Backup and restore
  - Database optimization

- **Security Settings**
  - Two-factor authentication (2FA)
  - Password policies
  - Session timeout
  - IP whitelist/blacklist
  - API key management

- **Feature Flags**
  - Enable/disable features (live shopping, affiliates, ads, etc.)
  - Beta feature access
  - A/B testing configuration

#### API Endpoints Needed:
```typescript
GET    /api/v1/settings                  // Get all settings
PUT    /api/v1/settings/general          // Update general settings
PUT    /api/v1/settings/email            // Update email settings
PUT    /api/v1/settings/payment          // Update payment settings
PUT    /api/v1/settings/shipping         // Update shipping settings
PUT    /api/v1/settings/system           // Update system settings
PUT    /api/v1/settings/security         // Update security settings
POST   /api/v1/settings/test-email       // Send test email
POST   /api/v1/settings/backup           // Create backup
POST   /api/v1/settings/restore          // Restore from backup
```

#### UI Components:
- `SettingsTabs.tsx` - Tab navigation
- `GeneralSettings.tsx` - General config form
- `EmailSettings.tsx` - Email config form
- `PaymentSettings.tsx` - Payment config form
- `ShippingSettings.tsx` - Shipping config form
- `SystemSettings.tsx` - System config form
- `SecuritySettings.tsx` - Security config form
- `FeatureFlags.tsx` - Feature toggle switches

---

## Implementation Priority

### Phase 1 (Critical - Week 1-2)
1. **Orders Management** - Core business functionality
2. **Payments Management** - Financial operations

### Phase 2 (High - Week 3-4)
3. **Categories Management** - Product organization
4. **Users Management** - User administration
5. **Analytics Dashboard** - Business insights

### Phase 3 (Medium - Week 5-6)
6. **Settings** - System configuration

---

## Technical Considerations

### Shared Components to Create
- `DataTable.tsx` - Reusable table with sorting, filtering, pagination
- `StatsCard.tsx` - Metric display card
- `DateRangePicker.tsx` - Date range selector
- `StatusBadge.tsx` - Generic status indicator
- `ExportButton.tsx` - Data export functionality
- `ActionMenu.tsx` - Dropdown action menu
- `ConfirmDialog.tsx` - Confirmation modal

### State Management
- Use Zustand for global state
- Use React Query (@tanstack/react-query) for API calls
- Local state with useState for form inputs

### Data Fetching Strategy
- Implement pagination (50 items per page)
- Infinite scroll for mobile-optimized views
- Real-time updates with polling or WebSocket for critical data
- Cache frequently accessed data

### Authentication & Permissions
- Verify admin role on all pages
- Implement role-based access control (RBAC)
- Different permission levels (viewer, editor, admin)

### Internationalization (i18n)
- Add translations to `admin-web/messages/es.json`
- Use `useTranslations` hook from next-intl
- Support Spanish and English

### Performance Optimization
- Server-side rendering (SSR) for initial load
- Client-side data fetching for dynamic content
- Image optimization with Next.js Image component
- Code splitting per page

---

## Testing Strategy

### Unit Tests
- Test components with Jest and React Testing Library
- Test utility functions and helpers
- Test API integration functions

### Integration Tests
- Test full user flows (create order, process payment, etc.)
- Test API endpoints with mock data
- Test authentication and authorization

### E2E Tests
- Critical user flows (order management, payment processing)
- Use Playwright or Cypress

---

## Documentation

### For Each Page, Document:
1. User guide (how to use the feature)
2. API endpoint documentation
3. Component API documentation
4. State management patterns used
5. Common issues and troubleshooting

---

## Success Metrics

### Completion Criteria:
- ✅ All 6 pages implemented and accessible
- ✅ All CRUD operations working
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Translations complete (Spanish & English)
- ✅ Unit tests with >80% coverage
- ✅ Integration tests for critical flows
- ✅ Performance optimized (Lighthouse score >90)
- ✅ Accessibility compliant (WCAG 2.1 AA)
- ✅ Documentation complete

---

## Next Steps

1. **Review this plan** with the team
2. **Create GitHub issues** for each page
3. **Estimate effort** for each page (story points)
4. **Assign developers** to each page
5. **Set up project board** for tracking
6. **Begin Phase 1 implementation**

---

## Notes

- All pages should follow the existing design system and component library
- Reuse existing components from `/dashboard/products` and `/ads` pages
- Ensure consistency with the Colombian VAT system (prices include VAT)
- Consider mobile-first design approach
- Implement proper error handling and loading states
- Add proper SEO meta tags for each page
