---
name: vat
description: Colombian VAT (IVA) system - tax categories, calculation, compliance
---

# Colombian VAT (IVA) System

Complete implementation of Colombian tax legislation (DIAN) for VAT management in e-commerce. Unlike international systems where tax is added at checkout, Colombian law requires VAT to be **ALWAYS included** in the displayed price.

## VAT Categories

| Category     | Rate | Description             | Tax Deduction Rights | Examples                           |
| ------------ | ---- | ----------------------- | -------------------- | ---------------------------------- |
| **Excluido** | 0%   | Excluded goods/services | No                   | Educational services, healthcare   |
| **Exento**   | 0%   | Exempt goods/services   | Yes                  | Basic foods (bread, milk, eggs)    |
| **Reducido** | 5%   | Reduced rate            | Yes                  | Processed foods (sausages, coffee) |
| **General**  | 19%  | Standard rate           | Yes                  | Electronics, clothing, jewelry     |

## Price Calculation Formula

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

## Technical Implementation

### Backend

- **Entities**: `Product` has `vatType`, `basePrice`, `vatAmount` fields
- **Services**: `ProductsService.calculatePrices()` for automatic calculation
- **API**: `GET /api/v1/analytics/vat-report` for tax compliance reports
- **Migration**: `1761860408199-AddVatFieldsToProducts.ts`
- **Data migration**: `npm run migrate:vat`

### Seller Panel

- Product creation/editing at `/dashboard/products/new` and `/dashboard/products/[id]/edit`
- VAT type selector with 4 categories
- Real-time price calculator showing base + VAT = final price

### Admin Panel

- VAT Reports at `/dashboard/reports/vat`
- Date range filters, breakdown by category, summary totals

### Mobile App

- `CartContext`: Total = subtotal + shipping - discount (NO additional VAT)
- Product interface includes `vatType`, `basePrice`, `vatAmount`

## Key Files

- `backend/src/database/entities/product.entity.ts` - VatType enum and VAT_RATES
- `backend/src/analytics/analytics.service.ts` - `generateVatReport()` method
- `seller-panel/app/dashboard/products/new/page.tsx` - Product form with VAT
- `admin-web/app/dashboard/reports/vat/page.tsx` - VAT reporting dashboard
- `docs/PLAN_IVA_COLOMBIA.md` - Complete documentation

## API Usage

```typescript
// Creating a product
POST /api/v1/products
{
  "name": "iPhone 15 Pro Max",
  "price": 1299999.99,  // Price WITH VAT included
  "vatType": "general"  // 19% VAT
  // basePrice and vatAmount calculated automatically
}

// Generate VAT report
GET /api/v1/analytics/vat-report?startDate=2025-01-01&endDate=2025-01-31
```

## Important Notes

- All prices MUST include VAT (Colombian law)
- VAT is NEVER added at checkout
- Sellers must select correct VAT category
- New products default to "General" (19%)
