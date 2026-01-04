# Stripe Implementation - Quick Start Guide

> **TL;DR**: Backend is 70% done, mobile needs complete Stripe UI. ~20 hours total work.

## Status Overview

### ✅ Already Implemented (Backend)
- Stripe SDK installed (`stripe: ^18.5.0`)
- `processStripePayment()` method exists
- Database entities support `STRIPE_CARD`
- Payment method management endpoints
- Basic payment intent creation

### ❌ Missing
- Stripe webhook handler (stubbed)
- Mobile Stripe UI (0% done)
- Currency conversion (COP → USD)
- Environment variables setup
- Feature flags for provider switching

## Time Estimate

| Component | Time | Status |
|-----------|------|--------|
| Backend completion | 6 hours | 🟡 Partial |
| Mobile implementation | 11 hours | 🔴 Not started |
| Testing & validation | 3 hours | 🔴 Not started |
| **TOTAL** | **~20 hours** | |

## Implementation Checklist

### Step 1: Stripe Account Setup (1 day)
- [ ] Create Stripe account with US business info
- [ ] Complete business verification
- [ ] Get API keys (test + live)
- [ ] Configure webhook endpoint

### Step 2: Backend (6 hours)

#### Environment Setup (30 min)
```bash
# Add to backend/.env
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...
ENABLED_PAYMENT_PROVIDERS=stripe,mercadopago
```

#### Code Changes
- [ ] **Create** `currency.service.ts` - COP to USD conversion (1.5h)
- [ ] **Update** `payments-v2.controller.ts` - Webhook handler (2h)
- [ ] **Update** `payments-v2.service.ts` - Add currency conversion (30min)
- [ ] **Create** `payment-config.service.ts` - Feature flags (30min)
- [ ] **Update** `main.ts` - Raw body parser for webhooks (15min)
- [ ] **Test** Webhook with Stripe CLI (1h)

### Step 3: Mobile (11 hours)

#### Install Dependencies (30 min)
```bash
cd mobile
npm install @stripe/stripe-react-native
npx expo install expo-build-properties
```

#### Code Changes
- [ ] **Create** `StripeProvider.tsx` - Stripe context (30min)
- [ ] **Create** `StripeCardScreen.tsx` - Card input UI (3h)
- [ ] **Update** `PaymentMethodSelection.tsx` - Add Stripe option (2h)
- [ ] **Update** `CheckoutScreen.tsx` - Routing logic (2h)
- [ ] **Update** `payments.service.ts` - Stripe API calls (1h)
- [ ] **Update** `AppNavigator.tsx` - Add screen (30min)
- [ ] **Update** `App.tsx` - Wrap with provider (10min)
- [ ] **Test** Complete payment flow (1.5h)

### Step 4: Testing (3 hours)
- [ ] Backend webhook tests with Stripe CLI
- [ ] Mobile payment with test card `4242 4242 4242 4242`
- [ ] 3D Secure test with `4000 0027 6000 3184`
- [ ] Payment failure test with `4000 0000 0000 0002`
- [ ] MercadoPago regression test
- [ ] End-to-end order completion

## Key Files to Modify

### Backend (7 files)
```
backend/
├── .env.example                          # Add Stripe keys
├── src/main.ts                           # Raw body parser
├── src/payments/
│   ├── payments-v2.controller.ts         # Webhook handler
│   ├── payments-v2.service.ts            # Currency conversion
│   ├── payments-v2.module.ts             # Import services
│   ├── currency.service.ts               # NEW - COP/USD conversion
│   └── payment-config.service.ts         # NEW - Feature flags
```

### Mobile (9 files)
```
mobile/
├── package.json                          # Add @stripe/stripe-react-native
├── app.json                              # Stripe plugin config
├── .env.development                      # STRIPE_PUBLISHABLE_KEY
├── App.tsx                               # Wrap with StripeProvider
├── src/
│   ├── providers/
│   │   └── StripeProvider.tsx            # NEW - Stripe context
│   ├── screens/
│   │   ├── payments/
│   │   │   └── StripeCardScreen.tsx      # NEW - Card input UI
│   │   └── checkout/
│   │       └── CheckoutScreen.tsx        # Add routing
│   ├── components/checkout/
│   │   └── PaymentMethodSelection.tsx    # Add Stripe option
│   ├── services/
│   │   └── payments.service.ts           # Add Stripe methods
│   └── navigation/
│       └── AppNavigator.tsx              # Add StripeCard screen
```

## Preserving MercadoPago

### Option 1: Feature Flag (Recommended)
```bash
# Enable both
ENABLED_PAYMENT_PROVIDERS=stripe,mercadopago

# Stripe only
ENABLED_PAYMENT_PROVIDERS=stripe

# MercadoPago only
ENABLED_PAYMENT_PROVIDERS=mercadopago
```

### Option 2: Comment Code
```typescript
// ============================================
// MERCADOPAGO IMPLEMENTATION (DISABLED)
// Uncomment to re-enable MercadoPago payments
// ============================================

/* ... MercadoPago code ... */

// ============================================
// END MERCADOPAGO IMPLEMENTATION
// ============================================
```

## Testing Commands

### Backend Webhook Testing
```bash
# Terminal 1: Start backend
npm run dev:backend

# Terminal 2: Forward webhooks
stripe listen --forward-to localhost:3000/api/v1/payments-v2/webhooks/stripe

# Terminal 3: Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger charge.refunded
```

### Mobile Testing
```bash
npm run dev:mobile
```

**Test Cards**:
- Success (no 3DS): `4242 4242 4242 4242`
- Success (with 3DS): `4000 0027 6000 3184`
- Declined: `4000 0000 0000 0002`

Exp: Any future date (e.g., `12/34`)
CVC: Any 3 digits (e.g., `123`)

## Critical Considerations

### 🇺🇸 USA Company + 🇨🇴 Colombia Market

**Stripe Requirements**:
- ✅ Stripe account registered to US company
- ✅ US bank account for settlements
- ✅ Colombian cards work (international payments)
- ❌ No local payment methods (PSE, Efecty, Baloto)

**Currency Handling**:
- Stripe charges in USD only
- Need COP → USD conversion
- Exchange rate: ~4000 COP = 1 USD
- Store original COP amount in metadata

**Fees**:
- Base: 2.9% + $0.30 USD
- International: +1.5%
- **Total**: ~4.4% + $0.30 per transaction

**Example**:
```
Order: $150,000 COP
USD: $37.50 (at 4000 COP/USD)
Stripe fee: $1.95
Net: $35.55 USD (~142,200 COP)
```

### Legal Compliance

**Before Production**:
- [ ] Verify Colombian law allows USD pricing
- [ ] Complete Stripe business verification
- [ ] Get legal approval for terms of service
- [ ] Update privacy policy for Stripe data sharing

## Rollout Plan

### Week 1: Internal Testing
- Enable in staging only
- Test with team (test cards)
- Verify webhooks work

### Week 2: Beta (10% users)
- Enable for 10% of users
- Monitor success rate
- Keep MercadoPago as default

### Week 3-4: Gradual Rollout
- 25% → 50% → 75% → 100%
- Monitor metrics weekly

### Month 2: Make Stripe Default
- Switch default to Stripe
- Keep MercadoPago as secondary

### Month 3: Evaluate
- Compare costs, conversion, support
- Decide: both providers or consolidate

## Metrics to Monitor

**Payment Success Rate**:
- Target: >95% for Stripe
- Alert if <90%

**3D Secure Completion**:
- Track authentication failures
- Optimize flow if >10% abandon

**Currency Conversion**:
- Monitor exchange rate variance
- Alert if API down (fallback activates)

**User Adoption**:
- % choosing Stripe vs MercadoPago
- Target: 70%+ on Stripe by month 2

**Cost Comparison**:
- Total fees: Stripe vs MercadoPago
- Track monthly

## Common Issues & Fixes

### Webhook not received
```bash
# Check webhook secret
echo $STRIPE_WEBHOOK_SECRET

# Test locally
stripe listen --forward-to localhost:3000/api/v1/payments-v2/webhooks/stripe
```

### 3D Secure not working
```typescript
// Ensure return_url is set
const paymentIntent = await stripe.paymentIntents.create({
  // ...
  return_url: `${process.env.APP_URL}/payment/callback`,
});

// Mobile: Use confirmPayment()
const { error } = await confirmPayment(clientSecret, {
  paymentMethodType: 'Card',
});
```

### Currency conversion errors
```typescript
// Add fallback rate
const fallbackRate = 4000; // COP per USD
const rate = await getExchangeRate('COP', 'USD').catch(() => fallbackRate);
```

## Next Steps

1. **Review full plan**: See `IMPLEMENTATION_PLAN.md` for details
2. **Get Stripe account**: https://dashboard.stripe.com/register
3. **Legal review**: Consult lawyer on Colombian regulations
4. **Start backend**: Implement webhook handler first
5. **Then mobile**: Build Stripe UI after backend works

## Quick Reference

**Stripe Dashboard**: https://dashboard.stripe.com
**API Docs**: https://stripe.com/docs/api
**React Native SDK**: https://github.com/stripe/stripe-react-native
**Webhook Guide**: https://stripe.com/docs/webhooks
**Stripe CLI**: https://stripe.com/docs/stripe-cli

---

**For detailed implementation guide, see `IMPLEMENTATION_PLAN.md`**
