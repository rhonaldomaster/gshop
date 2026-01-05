# Stripe Payment Implementation - Testing Guide

Complete testing guide for validating Stripe integration in GSHOP mobile app.

**Status**: Phase 1-3 Complete (100%) | Phase 4 Testing (Ready to Execute)

**Last Updated**: January 5, 2026

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Test 1: Payment Providers Config](#test-1-payment-providers-config)
3. [Test 2: Stripe Webhook Handler](#test-2-stripe-webhook-handler)
4. [Test 3: Currency Conversion](#test-3-currency-conversion)
5. [Test 4: Mobile Payment Flow](#test-4-mobile-payment-flow)
6. [Test 5: MercadoPago Regression](#test-5-mercadopago-regression)
7. [Test 6: Feature Flags](#test-6-feature-flags)
8. [Success Criteria](#success-criteria)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

- **Node.js**: v18+ installed
- **Stripe CLI**: Install with `brew install stripe/stripe-cli/stripe`
- **Mobile Device/Simulator**: iOS Simulator or Android Emulator
- **Terminals**: You'll need 4 terminal windows open

### Environment Setup

Ensure these files are configured:

**Backend** (`backend/.env`):

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_from_stripe_cli

# Payment Providers
ENABLED_PAYMENT_PROVIDERS=stripe,mercadopago

# Exchange Rate API
EXCHANGE_RATE_API_URL=https://api.exchangerate-api.com/v4/latest/USD
```

**Mobile** (`mobile/.env.development`):

```bash
STRIPE_PUBLISHABLE_KEY=pk_test_51SmFxC9cOYKTgS60P5qhF0ldaIcSm4mEkqXoALVApk9DhwBuJkCl2k8QmOQ6KsepBuiDXi2RMpWNsdG8R8ABwIWz00Rd0fpbXI
```

---

## Test 1: Payment Providers Config

**Objective**: Verify backend exposes available payment providers correctly.

### Steps

**Terminal 1 - Start Backend**:

```bash
cd backend
npm run start:dev
```

Wait for:

```
🚀 GSHOP API is running on: http://localhost:3000
📚 Swagger docs available at: http://localhost:3000/api/docs
```

**Terminal 2 - Test Endpoint**:

```bash
curl http://localhost:3000/api/v1/payments-v2/config/providers
```

### Expected Response

```json
{
  "providers": [
    {
      "id": "stripe",
      "name": "Credit/Debit Card",
      "description": "Pay with Visa, Mastercard, or Amex",
      "icon": "💳",
      "enabled": true
    },
    {
      "id": "mercadopago",
      "name": "MercadoPago",
      "description": "PSE, cash payments, and cards",
      "icon": "💵",
      "enabled": true
    }
  ]
}
```

### Validation

- ✅ HTTP 200 status code
- ✅ Returns 2 providers (Stripe + MercadoPago)
- ✅ Each provider has `id`, `name`, `description`, `icon`, `enabled`
- ✅ Stripe icon is 💳
- ✅ MercadoPago icon is 💵

### Troubleshooting

**Issue**: Endpoint returns 404

- **Fix**: Check backend is running on port 3000
- **Fix**: Verify route is `/api/v1/payments-v2/config/providers`

**Issue**: Only shows one provider

- **Fix**: Check `ENABLED_PAYMENT_PROVIDERS` in `.env`
- **Fix**: Should be `stripe,mercadopago`

---

## Test 2: Stripe Webhook Handler

**Objective**: Verify webhook signature verification and event processing.

### Setup Stripe CLI

**First Time Setup**:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe account
stripe login
```

Follow the browser prompt to authenticate.

### Steps

**Terminal 2 - Forward Webhooks**:

```bash
stripe listen --forward-to localhost:3000/api/v1/payments-v2/webhooks/stripe
```

You'll see:

```
> Ready! You are using Stripe API Version [2025-01-27].
> Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

**IMPORTANT**: Copy the webhook secret (`whsec_xxxxx`)

**Update Backend .env**:

```bash
# In backend/.env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx  # Paste the secret here
```

**Restart Backend** (Terminal 1):

```bash
# Stop with Ctrl+C, then restart
npm run start:dev
```

**Terminal 3 - Trigger Test Events**:

```bash
# Test successful payment
stripe trigger payment_intent.succeeded

# Test failed payment
stripe trigger payment_intent.payment_failed

# Test charge refunded
stripe trigger charge.refunded
```

### Expected Backend Logs

After each trigger, you should see in **Terminal 1**:

**For `payment_intent.succeeded`**:

```
[PaymentsV2Controller] Stripe webhook received: payment_intent.succeeded (ID: evt_1ABC123...)
[PaymentsV2Service] Fetching payment by PaymentIntent ID: pi_1ABC123...
[PaymentsV2Controller] Payment status updated to COMPLETED
[OrdersService] Order status updated to CONFIRMED
```

**For `payment_intent.payment_failed`**:

```
[PaymentsV2Controller] Stripe webhook received: payment_intent.payment_failed (ID: evt_2DEF456...)
[PaymentsV2Controller] Payment status updated to FAILED
[PaymentsV2Controller] Error message stored in metadata
```

**For `charge.refunded`**:

```
[PaymentsV2Controller] Stripe webhook received: charge.refunded (ID: evt_3GHI789...)
[PaymentsV2Controller] Payment status updated to REFUNDED
```

### Validation

- ✅ Webhook secret verification passes (no "signature verification failed" errors)
- ✅ Each event type is handled correctly
- ✅ Payment status updates in database
- ✅ Order status updates for successful payments
- ✅ No uncaught errors in logs

### Troubleshooting

**Issue**: "Webhook Error: No signatures found matching the expected signature"

- **Fix**: Webhook secret doesn't match
- **Fix**: Copy secret from `stripe listen` output
- **Fix**: Update `.env` and restart backend

**Issue**: "Payment with ID xxx not found"

- **Fix**: Normal for test events (no real payment exists)
- **Fix**: Create real payment first, then test webhooks

**Issue**: Webhook not received

- **Fix**: Check `stripe listen` is running
- **Fix**: Check backend URL is correct
- **Fix**: Check firewall isn't blocking

---

## Test 3: Currency Conversion

**Objective**: Verify COP → USD conversion works correctly.

### Steps

**Monitor Backend Logs** (Terminal 1):
Look for `CurrencyService` logs when processing Stripe payments.

**Expected Logs**:

```
[CurrencyService] Fetching exchange rate for COP/USD
[CurrencyService] Exchange rate COP/USD: 4000
[CurrencyService] Converted 150000 COP to 37.50 USD at rate 4000
[PaymentsV2Service] Creating Stripe PaymentIntent for 3750 cents USD
```

### Manual Test

```bash
# Test the currency service directly (if you create a payment)
# Check that:
# - Original amount is in COP (e.g., 150,000)
# - Converted amount is in USD (e.g., 37.50)
# - Exchange rate is reasonable (≈4000 COP/USD)
```

### Validation

- ✅ Exchange rate is fetched from API
- ✅ COP amount is divided by rate
- ✅ Result is rounded to 2 decimals
- ✅ Metadata stores original COP amount
- ✅ Stripe receives USD amount (in cents)

### Troubleshooting

**Issue**: Using fallback rate instead of API

- **Fix**: Check `EXCHANGE_RATE_API_URL` in `.env`
- **Fix**: Check internet connection
- **Fix**: Verify API endpoint is accessible

**Issue**: Conversion rate seems wrong

- **Fix**: Check current COP/USD rate online
- **Fix**: Verify fallback rate in `currency.service.ts` (line 21)

---

## Test 4: Mobile Payment Flow

**Objective**: End-to-end Stripe payment from mobile app.

### Setup Mobile App

**Terminal 4 - Start Mobile**:

```bash
cd mobile
npm install  # Install Stripe SDK if not done
npm start -- --clear  # Clear cache
```

Select platform (iOS/Android) or scan QR code.

### Test Steps - Happy Path

1. **Add Product to Cart**
   - Browse products
   - Click "Add to Cart" on any product
   - Verify cart badge updates

2. **Navigate to Checkout**
   - Click cart icon
   - Click "Checkout"
   - Fill shipping address (or use saved address)
   - Click "Continue"

3. **Select Payment Method**
   - **You should see 2 options**:
     - 💳 **Credit/Debit Card** (Stripe) ← Select this
     - 💵 MercadoPago
   - Click on "Credit/Debit Card"
   - Verify it's selected (radio button filled)
   - Click "Continue to Review"

4. **Review Order**
   - Verify order summary is correct
   - Click "Place Order"

5. **Stripe Card Screen**
   - **Should navigate to card input screen**
   - Verify screen shows:
     - ✅ "Detalles de Tarjeta" header
     - ✅ Total amount in COP
     - ✅ Stripe CardField component
     - ✅ Security info (🔒)
     - ✅ Test mode badge (🧪) in dev mode

6. **Enter Test Card**
   - Card Number: `4242 4242 4242 4242`
   - Expiry: `12/34` (any future date)
   - CVC: `123` (any 3 digits)
   - **Watch CardField validate in real-time**

7. **Process Payment**
   - Click "Pagar Ahora"
   - **Should see**:
     - Loading indicator
     - Button text changes to "Procesando..."
     - Button is disabled

8. **Payment Success**
   - Alert shows: "Pago Exitoso" ✅
   - Message: "Tu orden ha sido confirmada"
   - Click "OK"
   - **Should navigate to Order Confirmation**

### Test Steps - 3D Secure

Use this card to test 3D Secure authentication:

**Card**: `4000 0027 6000 3184`

1. Follow steps 1-6 above
2. Enter 3DS test card: `4000 0027 6000 3184`
3. Click "Pagar Ahora"
4. **3D Secure modal should appear**
5. Click "Authenticate" or "Complete"
6. Payment should succeed
7. Navigate to confirmation

### Test Steps - Declined Card

Use this card to test error handling:

**Card**: `4000 0000 0000 0002`

1. Follow steps 1-6 above
2. Enter declined card: `4000 0000 0000 0002`
3. Click "Pagar Ahora"
4. **Should see error alert**:
   - Title: "Pago Fallido"
   - Message: "Your card was declined"
5. Click "OK"
6. **Should stay on card screen**
7. User can enter different card and retry

### Validation

- ✅ Payment provider selection shows Stripe
- ✅ Card screen renders correctly
- ✅ CardField validates in real-time
- ✅ Test card `4242...` succeeds
- ✅ 3DS card triggers authentication
- ✅ Declined card shows error
- ✅ Success navigates to confirmation
- ✅ Backend logs show payment processed
- ✅ Webhook updates order status

### Troubleshooting

**Issue**: Card screen crashes

- **Fix**: Check Stripe SDK installed (`npm install`)
- **Fix**: Check StripeProvider wraps App.tsx
- **Fix**: Check STRIPE_PUBLISHABLE_KEY in .env.development

**Issue**: "No client secret received"

- **Fix**: Backend processStripePayment() not returning clientSecret
- **Fix**: Check backend logs for errors
- **Fix**: Verify Stripe API keys are correct

**Issue**: Payment stuck on "Processing"

- **Fix**: Check backend is running
- **Fix**: Check webhook is configured
- **Fix**: Check network connectivity

---

## Test 5: MercadoPago Regression

**Objective**: Ensure MercadoPago flow still works after Stripe integration.

### Steps

1. **Add Product to Cart**
2. **Navigate to Checkout**
3. **Select Payment Method**
   - **Select 💵 MercadoPago** (NOT Stripe)
   - Verify it's selected
   - Click "Continue to Review"
4. **Review Order**
   - Click "Place Order"
5. **MercadoPago WebView**
   - **Should navigate to WebView** (NOT Stripe card screen)
   - Should load MercadoPago website
   - Complete payment on MercadoPago
6. **Order Confirmation**
   - After MP payment, return to app
   - Verify order confirmation

### Validation

- ✅ MercadoPago option appears
- ✅ Selecting MP routes to WebView (not card screen)
- ✅ WebView loads MercadoPago URL
- ✅ Payment completes successfully
- ✅ Order is confirmed
- ✅ No errors in logs

### Troubleshooting

**Issue**: MercadoPago routes to Stripe screen

- **Fix**: Check CheckoutScreen routing logic
- **Fix**: Should check `selectedPaymentMethod.id === 'stripe'`

**Issue**: WebView doesn't load

- **Fix**: Check MercadoPago credentials in backend .env
- **Fix**: Check payment URL is generated

---

## Test 6: Feature Flags

**Objective**: Verify provider enable/disable functionality.

### Test Case 1: Only Stripe

**Backend .env**:

```bash
ENABLED_PAYMENT_PROVIDERS=stripe
```

**Restart Backend**, then:

```bash
curl http://localhost:3000/api/v1/payments-v2/config/providers
```

**Expected**: Only Stripe provider in response

**Mobile**: Should only show "Credit/Debit Card" option

### Test Case 2: Only MercadoPago

**Backend .env**:

```bash
ENABLED_PAYMENT_PROVIDERS=mercadopago
```

**Restart Backend**, then test endpoint.

**Expected**: Only MercadoPago provider in response

**Mobile**: Should only show "MercadoPago" option

### Test Case 3: Both Enabled

**Backend .env**:

```bash
ENABLED_PAYMENT_PROVIDERS=stripe,mercadopago
```

**Expected**: Both providers in response

**Mobile**: Should show both options

### Validation

- ✅ Feature flag controls which providers appear
- ✅ Mobile fetches and displays correct options
- ✅ At least one provider is always enabled
- ✅ Invalid provider names are filtered out

---

## Success Criteria

Phase 4 is **COMPLETE** when all checkboxes are ✅:

### Backend Tests

- [ ] Backend starts without errors
- [ ] `/payments-v2/config/providers` returns both providers
- [ ] Stripe webhook connects successfully
- [ ] Webhook processes `payment_intent.succeeded`
- [ ] Webhook processes `payment_intent.payment_failed`
- [ ] Webhook processes `charge.refunded`
- [ ] Currency conversion logs show COP→USD
- [ ] Exchange rate fetched from API

### Mobile Tests

- [ ] Mobile app starts without errors
- [ ] Checkout shows 2 payment options
- [ ] Selecting Stripe navigates to card screen
- [ ] Card screen renders correctly
- [ ] Test card `4242 4242 4242 4242` succeeds
- [ ] 3DS card `4000 0027 6000 3184` works
- [ ] Declined card `4000 0000 0000 0002` shows error
- [ ] Payment success navigates to confirmation
- [ ] Order is created and confirmed

### Regression Tests

- [ ] Selecting MercadoPago navigates to WebView
- [ ] MercadoPago payment completes successfully
- [ ] Feature flag disables Stripe (only MP shows)
- [ ] Feature flag disables MP (only Stripe shows)
- [ ] Feature flag enables both (default)

### Integration Tests

- [ ] Backend receives webhook after mobile payment
- [ ] Order status updates from PENDING → CONFIRMED
- [ ] Payment metadata includes COP amount
- [ ] Payment metadata includes USD amount
- [ ] Payment metadata includes exchange rate
- [ ] Invoice is generated (if applicable)

---

## Troubleshooting

### Common Issues

#### "STRIPE_WEBHOOK_SECRET is not configured"

**Symptom**: Webhook returns error

**Fix**:

1. Run `stripe listen --forward-to localhost:3000/api/v1/payments-v2/webhooks/stripe`
2. Copy the `whsec_...` secret
3. Update `backend/.env`
4. Restart backend

#### "Cannot find module '@stripe/stripe-react-native'"

**Symptom**: Mobile app crashes on startup

**Fix**:

```bash
cd mobile
npm install
npm start -- --clear
```

#### "Payment stuck on processing"

**Symptom**: Mobile shows loading forever

**Fix**:

1. Check backend is running
2. Check backend logs for errors
3. Check webhook is configured
4. Verify network connectivity
5. Check Stripe API keys are valid

#### "Card field not showing"

**Symptom**: Blank screen on Stripe card page

**Fix**:

1. Verify StripeProvider wraps App.tsx
2. Check STRIPE_PUBLISHABLE_KEY in mobile .env
3. Rebuild app: `npm start -- --clear`
4. Check for React errors in console

#### "Exchange rate using fallback"

**Symptom**: Logs show "Using fallback exchange rate"

**Fix**:

1. Check `EXCHANGE_RATE_API_URL` in backend .env
2. Test API manually: `curl https://api.exchangerate-api.com/v4/latest/USD`
3. Check internet connection
4. Fallback rate (4000) is acceptable for testing

---

## Test Cards Reference

| Card Number           | Scenario                  | Use Case            |
| --------------------- | ------------------------- | ------------------- |
| `4242 4242 4242 4242` | ✅ Success (no 3DS)       | Happy path testing  |
| `4000 0027 6000 3184` | ✅ Success (requires 3DS) | Authentication flow |
| `4000 0000 0000 0002` | ❌ Card declined          | Error handling      |
| `4000 0000 0000 9995` | ❌ Insufficient funds     | Specific error      |
| `4000 0000 0000 9987` | ❌ Lost card              | Fraud prevention    |
| `4000 0000 0000 0069` | ❌ Expired card           | Validation          |

**Expiry**: Any future date (e.g., `12/34`)
**CVC**: Any 3 digits (e.g., `123`)

Full list: https://stripe.com/docs/testing

---

## Next Steps After Testing

Once all tests pass:

1. **Document Results**: Note any issues found
2. **Fix Bugs**: Address any failing tests
3. **Production Prep**:
   - Get production Stripe keys
   - Update webhook endpoint in Stripe dashboard
   - Test with real cards (small amounts)
4. **Deploy**:
   - Deploy backend with production keys
   - Deploy mobile app
   - Monitor for errors
5. **Monitor**:
   - Watch webhook events in Stripe dashboard
   - Monitor payment success rate
   - Track currency conversion accuracy

---

## Support Resources

- **Stripe Docs**: https://stripe.com/docs
- **Stripe React Native**: https://github.com/stripe/stripe-react-native
- **Stripe Testing**: https://stripe.com/docs/testing
- **Stripe CLI**: https://stripe.com/docs/stripe-cli
- **Support**: https://support.stripe.com

---

**Happy Testing, Senpai!** 🎉❤️

_Last Updated: January 5, 2026_
