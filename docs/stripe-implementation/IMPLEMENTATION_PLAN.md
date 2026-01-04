# Stripe Payment Implementation Plan - GSHOP Mobile App

## Executive Summary

This document outlines the implementation plan for integrating Stripe as the primary payment provider in the GSHOP mobile application, while preserving MercadoPago functionality for potential future use.

**Current Status**: Backend has **70% of Stripe integration already implemented** (Phase 3). Mobile app currently uses MercadoPago exclusively.

**Key Findings**:
- ✅ Backend Stripe integration exists with `PaymentsV2Service.processStripePayment()`
- ✅ Stripe SDK already installed (`stripe: ^18.5.0`)
- ✅ Database entities support `STRIPE_CARD` payment method
- ❌ Mobile app has **zero Stripe UI** (100% MercadoPago)
- ❌ Stripe webhook handler is stubbed (needs implementation)
- ❌ Environment variables missing (`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`)

**Estimated Implementation Time**: **12-16 hours** (80% mobile UI, 20% backend completion)

---

## Table of Contents

1. [Current Architecture Analysis](#1-current-architecture-analysis)
2. [USA Company / Colombia Market Considerations](#2-usa-company--colombia-market-considerations)
3. [Implementation Phases](#3-implementation-phases)
4. [Preserving MercadoPago](#4-preserving-mercadopago)
5. [Technical Implementation Details](#5-technical-implementation-details)
6. [Testing Strategy](#6-testing-strategy)
7. [Cost & Risk Analysis](#7-cost--risk-analysis)
8. [Timeline Estimate](#8-timeline-estimate)

---

## 1. Current Architecture Analysis

### 1.1 Backend Status (70% Complete)

#### ✅ Already Implemented

**File**: `backend/src/payments/payments-v2.service.ts`

```typescript
async processStripePayment(paymentId: string, paymentMethodId: string): Promise<PaymentV2> {
  const payment = await this.getPaymentById(paymentId);

  // Creates Stripe Payment Intent with confirmation
  const paymentIntent = await this.stripe.paymentIntents.create({
    amount: Math.round(payment.amount * 100),
    currency: payment.currency.toLowerCase(),
    payment_method: paymentMethodId,
    confirm: true,
    return_url: `${process.env.APP_URL}/payment/callback`,
    metadata: {
      paymentId: payment.id,
      orderId: payment.orderId,
    },
  });

  // Handles 3D Secure flow
  if (paymentIntent.status === 'requires_action') {
    payment.paymentMetadata = {
      stripe_client_secret: paymentIntent.client_secret,
      requires_action: true,
    };
  }

  // Updates payment status
  if (paymentIntent.status === 'succeeded') {
    payment.status = PaymentStatus.COMPLETED;
    payment.processedAt = new Date();
  }

  return payment;
}
```

**Database Entities**:
- `PaymentV2` entity with `stripePaymentIntentId` field
- `PaymentMethod` enum includes `STRIPE_CARD` and `STRIPE_BANK`
- `PaymentMethodEntity` for storing user's cards
- `Invoice` entity for receipt generation

**API Endpoints**:
- `POST /api/v1/payments-v2/:id/process/stripe` - Process payment ✅
- `POST /api/v1/payments-v2/methods` - Save payment method ✅
- `GET /api/v1/payments-v2/methods` - List saved cards ✅
- `DELETE /api/v1/payments-v2/methods/:id` - Remove card ✅

#### ❌ Missing/Stubbed

1. **Stripe Webhook Handler** (`payments-v2.controller.ts:249`):
```typescript
@Post('webhooks/stripe')
async handleStripeWebhook(@Body() body: any) {
  console.log('Stripe webhook received:', body);
  return { received: true }; // ← No actual processing!
}
```

2. **Environment Variables** (`.env.example`):
```bash
# Missing:
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

3. **PDF Invoice Generation**:
```typescript
async generateInvoicePDF(invoice: Invoice): Promise<string> {
  // TODO: Implement actual PDF generation
  return `https://gshop.com/invoices/${invoice.invoiceNumber}.pdf`;
}
```

### 1.2 Mobile App Status (0% Stripe)

#### Current MercadoPago Implementation

**Files**:
- `mobile/src/screens/payments/PaymentScreen.tsx` - Hardcoded to MercadoPago
- `mobile/src/screens/payments/PaymentWebViewScreen.tsx` - WebView for MercadoPago checkout
- `mobile/src/screens/checkout/CheckoutScreen.tsx` - Auto-selects MercadoPago
- `mobile/src/components/checkout/PaymentMethodSelection.tsx` - Only shows MercadoPago option

**Current Flow**:
1. User creates order → `POST /api/v1/orders`
2. App calls `POST /api/v1/payments-v2` with `paymentMethod: 'mercadopago'`
3. Backend creates MercadoPago preference, returns `mercadopago_init_point` URL
4. Mobile opens WebView with MercadoPago checkout page
5. User pays, MercadoPago sends webhook to backend
6. Backend updates order status, mobile detects callback and clears cart

**What's Hardcoded**:
```typescript
// PaymentMethodSelection.tsx:37
const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>({
  id: '1',
  type: 'mercadopago', // ← Hardcoded!
  provider: 'MercadoPago',
  details: { isDefault: true },
  isDefault: true,
});

// CheckoutScreen.tsx:280
const paymentMethodMap = {
  'mercadopago': 'mercadopago', // ← Only option
  'card': 'stripe_card',
  'crypto': 'usdc_polygon',
  'gshop_tokens': 'gshop_tokens',
}
```

---

## 2. USA Company / Colombia Market Considerations

### 2.1 Legal & Regulatory Compliance

#### Stripe Requirements for US-Based Companies

**Entity Structure**:
- Stripe account must be registered to US company (LLC, Corp, etc.)
- Requires US bank account for fund settlement
- Needs EIN (Employer Identification Number)
- Beneficial owner verification (25%+ ownership)

**Colombian Customer Payments**:
- ✅ Stripe supports **international card payments** from Colombia
- ✅ Colombian customers can pay with Visa, Mastercard, Amex (issued anywhere)
- ❌ No local payment methods (PSE, Efecty, Baloto) - this is MercadoPago's advantage
- ❌ Currency: Stripe processes in USD/EUR, requires **manual COP conversion**

#### Tax & Compliance Considerations

**Colombian VAT (IVA)**:
- Already implemented in backend (`VatType` enum, `basePrice`, `vatAmount` fields)
- Stripe payments will preserve existing VAT calculation
- Prices displayed to users **ALWAYS include VAT** (Colombian law)
- No changes needed to VAT system

**Currency Handling**:
```typescript
// Option 1: Display in COP, charge in USD (recommended)
const usdAmount = copAmount / exchangeRate; // Use real-time rate
stripe.paymentIntents.create({
  amount: Math.round(usdAmount * 100),
  currency: 'usd',
  metadata: {
    original_currency: 'COP',
    original_amount: copAmount,
    exchange_rate: exchangeRate
  }
});

// Option 2: Use Stripe multi-currency (if enabled)
// Requires special Stripe account setup
```

**Colombia-Specific Requirements**:
- Customer document validation (CC, CE, PA, TI) - **already implemented** ✅
- Address with Colombian department/city - **already implemented** ✅
- Invoice generation with NIT/RUT - needs enhancement for Stripe

### 2.2 Stripe Connect for Marketplace

**Current Architecture**: GSHOP is a **multi-seller marketplace** (sellers create products, buyers purchase)

**Payment Split Requirements**:
1. Platform fee (3-5% configurable) → GSHOP
2. Seller revenue (95-97%) → Individual seller
3. Affiliate commission (if applicable, 7.5%) → Affiliate/Creator

**Stripe Connect Options**:

| Model | Description | Best For | Implementation Complexity |
|-------|-------------|----------|--------------------------|
| **Standard** | Sellers create own Stripe accounts | Full seller control | High (seller onboarding) |
| **Express** | Stripe-hosted onboarding for sellers | Balanced approach | Medium |
| **Custom** | Platform manages everything | Full platform control | Low (recommended) |

**Recommended**: **Stripe Connect Custom** (Destination Charges)
- GSHOP collects full payment into platform account
- Automatically transfers seller portion via `transfer_data`
- Platform retains fee before transfer
- Simplest for Colombian sellers (no Stripe account needed)

**Implementation**:
```typescript
// When processing payment
const paymentIntent = await stripe.paymentIntents.create({
  amount: totalAmount,
  currency: 'usd',
  payment_method: paymentMethodId,
  confirm: true,
  transfer_data: {
    amount: sellerAmount, // After deducting platform fee
    destination: sellerStripeAccountId, // Created via Stripe Connect
  },
  application_fee_amount: platformFeeAmount,
});
```

**Seller Onboarding Required**:
- Sellers provide bank account info (Colombian or international)
- Stripe verifies identity (KYC) - already have this data! ✅
- Platform creates Connected Account via API
- Transfers happen automatically after payment

**Stripe Fees** (for US account):
- **2.9% + $0.30 USD** per successful card charge
- **+1.5%** for international cards (Colombian customers)
- **Total**: ~4.4% + $0.30 per transaction
- **Payout**: 2-day rolling basis to US bank account

### 2.3 Comparison: MercadoPago vs Stripe for Colombia

| Feature | MercadoPago | Stripe |
|---------|-------------|--------|
| **Local Payment Methods** | ✅ PSE, Efecty, Baloto, cash | ❌ Only cards |
| **Colombian Currency** | ✅ Native COP support | ⚠️ USD/EUR only (manual conversion) |
| **International Cards** | ✅ Visa, Mastercard | ✅ Visa, Mastercard, Amex |
| **Colombian Market Share** | ✅ Very high | ⚠️ Lower |
| **User Trust** | ✅ Well-known in LATAM | ⚠️ Less familiar |
| **Fees (Colombia)** | 3.99% + COP $900 | ~4.4% + $0.30 USD |
| **Marketplace Support** | ⚠️ Complex (requires MP Split) | ✅ Stripe Connect built-in |
| **Webhook Reliability** | ⚠️ Can be delayed | ✅ Very reliable |
| **API Quality** | ⚠️ Inconsistent docs | ✅ Excellent docs |
| **Refunds** | ✅ Automated via API | ✅ Automated via API |
| **3D Secure** | ✅ Supported | ✅ Supported |
| **Settlement** | 2-14 days (to AR/CO bank) | 2 days (to US bank) |
| **Best For** | 🇨🇴 Colombian users (local methods) | 🌎 US company, international users |

**Recommendation**:
- **Phase 1**: Implement Stripe for **card payments** (international & Colombian cards)
- **Phase 2**: Offer **both** options - let users choose based on payment method preference
- **Long-term**: Keep MercadoPago for local methods (PSE, cash), use Stripe for cards

---

## 3. Implementation Phases

### Phase 1: Backend Completion (4 hours)

#### Task 1.1: Environment Configuration (30 min)

**Files to modify**:
- `backend/.env.example`
- `backend/.env` (local development)

**Actions**:
1. Add Stripe environment variables:
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51...  # Get from https://dashboard.stripe.com/apikeys
STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...  # Get from webhook settings
STRIPE_CONNECT_CLIENT_ID=ca_...  # For marketplace (optional Phase 2)

# Currency conversion (if using USD)
EXCHANGE_RATE_API_URL=https://api.exchangerate-api.com/v4/latest/USD
```

2. Update `.env.example` with placeholder values
3. Create Stripe account (if not exists):
   - Sign up at https://stripe.com
   - Complete business verification (US company info)
   - Get API keys from Dashboard → Developers → API Keys
   - Enable test mode for development

#### Task 1.2: Stripe Webhook Handler (2 hours)

**File**: `backend/src/payments/payments-v2.controller.ts`

**Implementation**:
```typescript
@Post('webhooks/stripe')
async handleStripeWebhook(
  @Headers('stripe-signature') signature: string,
  @Req() req: RawBodyRequest<Request>,
) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = this.stripe.webhooks.constructEvent(
      req.rawBody, // Need raw body!
      signature,
      webhookSecret,
    );
  } catch (err) {
    this.logger.error(`Webhook signature verification failed: ${err.message}`);
    throw new BadRequestException(`Webhook Error: ${err.message}`);
  }

  // Handle event types
  switch (event.type) {
    case 'payment_intent.succeeded':
      await this.handlePaymentIntentSucceeded(event.data.object);
      break;

    case 'payment_intent.payment_failed':
      await this.handlePaymentIntentFailed(event.data.object);
      break;

    case 'charge.refunded':
      await this.handleChargeRefunded(event.data.object);
      break;

    case 'payment_intent.requires_action':
      await this.handlePaymentRequiresAction(event.data.object);
      break;

    default:
      this.logger.warn(`Unhandled Stripe event type: ${event.type}`);
  }

  return { received: true, eventType: event.type };
}

private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const paymentId = paymentIntent.metadata.paymentId;
  const payment = await this.paymentsV2Service.getPaymentById(paymentId);

  if (payment.status === PaymentStatus.COMPLETED) {
    return; // Idempotency - already processed
  }

  // Update payment
  payment.status = PaymentStatus.COMPLETED;
  payment.processedAt = new Date();
  payment.stripePaymentIntentId = paymentIntent.id;
  payment.processingFee = (paymentIntent.charges.data[0]?.balance_transaction as any)?.fee / 100;
  await this.paymentsV2Service.save(payment);

  // Update order status
  const order = await this.ordersService.findOne(payment.orderId);
  order.status = OrderStatus.CONFIRMED;
  await this.ordersService.save(order);

  this.logger.log(`Stripe payment ${paymentId} confirmed for order ${order.id}`);
}

private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const paymentId = paymentIntent.metadata.paymentId;
  const payment = await this.paymentsV2Service.getPaymentById(paymentId);

  payment.status = PaymentStatus.FAILED;
  payment.paymentMetadata = {
    ...payment.paymentMetadata,
    stripe_error: paymentIntent.last_payment_error?.message,
    stripe_error_code: paymentIntent.last_payment_error?.code,
  };
  await this.paymentsV2Service.save(payment);

  this.logger.error(`Stripe payment ${paymentId} failed: ${paymentIntent.last_payment_error?.message}`);
}
```

**Additional Configuration Needed**:
- NestJS raw body parser for webhook signature verification
- Add to `main.ts`:
```typescript
app.useBodyParser('json', {
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
});
```

#### Task 1.3: Currency Conversion Service (1.5 hours)

**New File**: `backend/src/payments/currency.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private exchangeRateCache: Map<string, { rate: number; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 3600000; // 1 hour

  constructor(private readonly httpService: HttpService) {}

  async convertCOPtoUSD(amountCOP: number): Promise<{ amountUSD: number; rate: number }> {
    const rate = await this.getExchangeRate('COP', 'USD');
    const amountUSD = amountCOP / rate;

    return {
      amountUSD: Math.round(amountUSD * 100) / 100, // Round to 2 decimals
      rate,
    };
  }

  async getExchangeRate(from: string, to: string): Promise<number> {
    const cacheKey = `${from}_${to}`;
    const cached = this.exchangeRateCache.get(cacheKey);

    // Return cached rate if fresh
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.rate;
    }

    // Fetch fresh rate
    try {
      const apiUrl = process.env.EXCHANGE_RATE_API_URL || 'https://api.exchangerate-api.com/v4/latest/USD';
      const response = await firstValueFrom(this.httpService.get(apiUrl));
      const rates = response.data.rates;

      const rate = to === 'USD' ? rates[from] : 1 / rates[to];

      // Cache the rate
      this.exchangeRateCache.set(cacheKey, { rate, timestamp: Date.now() });

      this.logger.log(`Exchange rate ${from}/${to}: ${rate}`);
      return rate;

    } catch (error) {
      this.logger.error(`Failed to fetch exchange rate: ${error.message}`);

      // Fallback to hardcoded rate if API fails
      const fallbackRates = {
        COP_USD: 4000, // ~4000 COP = 1 USD (update periodically)
      };

      return fallbackRates[cacheKey] || 1;
    }
  }
}
```

**Update `PaymentsV2Service`**:
```typescript
async processStripePayment(paymentId: string, paymentMethodId: string): Promise<PaymentV2> {
  const payment = await this.getPaymentById(paymentId);

  // Convert COP to USD if needed
  let amount = payment.amount;
  let currency = payment.currency.toLowerCase();

  if (currency === 'cop') {
    const conversion = await this.currencyService.convertCOPtoUSD(payment.amount);
    amount = conversion.amountUSD;
    currency = 'usd';

    payment.paymentMetadata = {
      ...payment.paymentMetadata,
      original_currency: 'COP',
      original_amount: payment.amount,
      exchange_rate: conversion.rate,
      converted_amount: amount,
    };
  }

  // Create payment intent with USD amount
  const paymentIntent = await this.stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: currency,
    payment_method: paymentMethodId,
    confirm: true,
    return_url: `${process.env.APP_URL}/payment/callback`,
    metadata: {
      paymentId: payment.id,
      orderId: payment.orderId,
    },
  });

  // ... rest of existing code
}
```

### Phase 2: Mobile App UI Implementation (8-10 hours)

#### Task 2.1: Install Stripe React Native SDK (15 min)

**Commands**:
```bash
cd mobile
npm install @stripe/stripe-react-native
npx expo install expo-build-properties
```

**Update `app.json`**:
```json
{
  "expo": {
    "plugins": [
      [
        "@stripe/stripe-react-native",
        {
          "merchantIdentifier": "merchant.com.gshop",
          "enableGooglePay": true
        }
      ]
    ]
  }
}
```

**Update `.env.development`**:
```bash
STRIPE_PUBLISHABLE_KEY=pk_test_51...
```

#### Task 2.2: Stripe Provider Setup (30 min)

**New File**: `mobile/src/providers/StripeProvider.tsx`

```typescript
import React from 'react';
import { StripeProvider as StripeProviderNative } from '@stripe/stripe-react-native';
import { Platform } from 'react-native';

const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || '';

export const StripeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <StripeProviderNative
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier="merchant.com.gshop" // Apple Pay
      urlScheme="gshop" // Deep linking for 3D Secure
    >
      {children}
    </StripeProviderNative>
  );
};
```

**Update `App.tsx`**:
```typescript
import { StripeProvider } from './src/providers/StripeProvider';

export default function App() {
  return (
    <StripeProvider>
      {/* ... existing providers */}
    </StripeProvider>
  );
}
```

#### Task 2.3: Payment Method Selection UI (2 hours)

**Update**: `mobile/src/components/checkout/PaymentMethodSelection.tsx`

**Changes**:
1. Remove hardcoded MercadoPago method
2. Add dynamic method selection (Stripe card, MercadoPago, crypto, tokens)
3. Fetch available methods from backend

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PaymentMethod } from '../../types';
import { paymentsService } from '../../services/payments.service';

interface PaymentMethodSelectionProps {
  selectedMethod?: PaymentMethod;
  onMethodSelect: (method: PaymentMethod) => void;
}

export const PaymentMethodSelection: React.FC<PaymentMethodSelectionProps> = ({
  selectedMethod,
  onMethodSelect,
}) => {
  const [availableMethods, setAvailableMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      // Get user's saved payment methods
      const savedMethods = await paymentsService.getPaymentMethods();

      // Build available methods list
      const methods: PaymentMethod[] = [
        {
          id: 'new_card',
          type: 'card',
          provider: 'Stripe',
          details: {
            label: 'Credit/Debit Card',
            description: 'Visa, Mastercard, Amex',
            icon: '💳',
          },
          isDefault: false,
        },
        {
          id: 'mercadopago',
          type: 'mercadopago',
          provider: 'MercadoPago',
          details: {
            label: 'MercadoPago',
            description: 'Cards, PSE, cash payments',
            icon: '💵',
          },
          isDefault: false,
        },
        ...savedMethods, // User's saved cards
      ];

      setAvailableMethods(methods);

      // Auto-select first method if none selected
      if (!selectedMethod && methods.length > 0) {
        onMethodSelect(methods[0]);
      }

    } catch (error) {
      console.error('Failed to load payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMethod = (method: PaymentMethod) => {
    const isSelected = selectedMethod?.id === method.id;

    return (
      <TouchableOpacity
        key={method.id}
        style={[styles.methodCard, isSelected && styles.methodCardSelected]}
        onPress={() => onMethodSelect(method)}
      >
        <View style={styles.methodIcon}>
          <Text style={styles.iconText}>{method.details.icon}</Text>
        </View>
        <View style={styles.methodInfo}>
          <Text style={styles.methodLabel}>{method.details.label || method.provider}</Text>
          {method.details.description && (
            <Text style={styles.methodDescription}>{method.details.description}</Text>
          )}
          {method.details.last4 && (
            <Text style={styles.methodLast4}>•••• {method.details.last4}</Text>
          )}
        </View>
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <Text>Loading payment methods...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Payment Method</Text>
      {availableMethods.map(renderMethod)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 12,
  },
  methodCardSelected: {
    borderColor: '#007AFF',
    borderWidth: 2,
    backgroundColor: '#F0F8FF',
  },
  methodIcon: { marginRight: 12 },
  iconText: { fontSize: 24 },
  methodInfo: { flex: 1 },
  methodLabel: { fontSize: 16, fontWeight: '600' },
  methodDescription: { fontSize: 12, color: '#666', marginTop: 4 },
  methodLast4: { fontSize: 14, color: '#333', marginTop: 4 },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

#### Task 2.4: Stripe Card Input Screen (3 hours)

**New File**: `mobile/src/screens/payments/StripeCardScreen.tsx`

```typescript
import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { CardField, useStripe, useConfirmPayment } from '@stripe/stripe-react-native';
import { paymentsService } from '../../services/payments.service';
import { useNavigation, useRoute } from '@react-navigation/native';

export const StripeCardScreen: React.FC = () => {
  const [cardComplete, setCardComplete] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const [loading, setLoading] = useState(false);

  const { createPaymentMethod } = useStripe();
  const { confirmPayment } = useConfirmPayment();
  const navigation = useNavigation();
  const route = useRoute();

  const { orderId, amount, paymentId } = route.params as {
    orderId: string;
    amount: number;
    paymentId: string;
  };

  const handlePayment = async () => {
    if (!cardComplete) {
      Alert.alert('Error', 'Please enter valid card details');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create Stripe Payment Method
      const { paymentMethod, error: pmError } = await createPaymentMethod({
        paymentMethodType: 'Card',
      });

      if (pmError) {
        throw new Error(pmError.message);
      }

      // Step 2: Process payment via backend
      const result = await paymentsService.processStripePayment(
        paymentId,
        paymentMethod!.id,
      );

      // Step 3: Handle 3D Secure if required
      if (result.paymentMetadata?.requires_action) {
        const { error: confirmError } = await confirmPayment(
          result.paymentMetadata.stripe_client_secret,
          {
            paymentMethodType: 'Card',
          },
        );

        if (confirmError) {
          throw new Error(confirmError.message);
        }
      }

      // Step 4: Save card if requested
      if (saveCard && paymentMethod) {
        await paymentsService.createPaymentMethod({
          type: 'stripe_card',
          stripePaymentMethodId: paymentMethod.id,
          details: {
            brand: paymentMethod.card?.brand,
            last4: paymentMethod.card?.last4,
            expMonth: paymentMethod.card?.expMonth,
            expYear: paymentMethod.card?.expYear,
          },
        });
      }

      // Success!
      Alert.alert('Success', 'Payment completed successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('OrderConfirmation', { orderId }),
        },
      ]);

    } catch (error: any) {
      Alert.alert('Payment Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Card Details</Text>

      <CardField
        postalCodeEnabled={true}
        placeholder={{
          number: '4242 4242 4242 4242',
        }}
        cardStyle={styles.card}
        style={styles.cardField}
        onCardChange={(cardDetails) => {
          setCardComplete(cardDetails.complete);
        }}
      />

      <TouchableOpacity
        style={styles.saveCardRow}
        onPress={() => setSaveCard(!saveCard)}
      >
        <View style={[styles.checkbox, saveCard && styles.checkboxChecked]}>
          {saveCard && <Text>✓</Text>}
        </View>
        <Text style={styles.saveCardLabel}>Save card for future purchases</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.payButton, (!cardComplete || loading) && styles.payButtonDisabled]}
        onPress={handlePayment}
        disabled={!cardComplete || loading}
      >
        <Text style={styles.payButtonText}>
          {loading ? 'Processing...' : `Pay $${amount.toFixed(2)} USD`}
        </Text>
      </TouchableOpacity>

      <Text style={styles.securityNote}>
        🔒 Your payment is secured by Stripe. Card details are never stored on our servers.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  cardField: {
    width: '100%',
    height: 50,
    marginVertical: 30,
  },
  card: {
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
  },
  saveCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  saveCardLabel: {
    fontSize: 16,
  },
  payButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  securityNote: {
    marginTop: 20,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
```

#### Task 2.5: Update Checkout Flow (2 hours)

**Update**: `mobile/src/screens/checkout/CheckoutScreen.tsx`

**Changes**:
1. Route to `StripeCardScreen` if Stripe card selected
2. Keep existing MercadoPago WebView flow for MercadoPago option
3. Add payment method routing logic

```typescript
const handlePlaceOrder = async () => {
  // ... existing order creation code

  // Route based on payment method
  if (selectedPaymentMethod?.type === 'card') {
    // Stripe card flow - navigate to card input
    navigation.navigate('StripeCard', {
      orderId: order.id,
      paymentId: payment.id,
      amount: total,
    });
  } else if (selectedPaymentMethod?.type === 'mercadopago') {
    // Existing MercadoPago WebView flow
    const paymentUrl = payment.paymentMetadata?.mercadopago_init_point;
    navigation.navigate('PaymentWebView', {
      paymentUrl,
      orderId: order.id,
      paymentId: payment.id,
    });
  } else if (selectedPaymentMethod?.id !== 'new_card') {
    // Saved card - process directly
    const result = await paymentsService.processStripePayment(
      payment.id,
      selectedPaymentMethod.stripePaymentMethodId,
    );

    if (result.status === 'COMPLETED') {
      navigation.navigate('OrderConfirmation', { orderId: order.id });
    }
  }
};
```

#### Task 2.6: Update Navigation (30 min)

**Update**: `mobile/src/navigation/AppNavigator.tsx` or equivalent

```typescript
import { StripeCardScreen } from '../screens/payments/StripeCardScreen';

// Add to stack navigator
<Stack.Screen
  name="StripeCard"
  component={StripeCardScreen}
  options={{ title: 'Payment Details' }}
/>
```

#### Task 2.7: Update Payments Service (1 hour)

**Update**: `mobile/src/services/payments.service.ts`

Add Stripe-specific methods:

```typescript
async processStripePayment(
  paymentId: string,
  paymentMethodId: string,
): Promise<PaymentResponse> {
  const response = await api.post<PaymentResponse>(
    `/payments-v2/${paymentId}/process/stripe`,
    { paymentMethodId },
  );
  return response.data;
}

async createPaymentMethod(methodData: {
  type: 'stripe_card';
  stripePaymentMethodId: string;
  details: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}): Promise<PaymentMethodEntity> {
  const response = await api.post<PaymentMethodEntity>(
    '/payments-v2/methods',
    methodData,
  );
  return response.data;
}
```

### Phase 3: Testing & Validation (2-3 hours)

#### Task 3.1: Backend Testing (1 hour)

**Test Cases**:
1. ✅ Stripe webhook signature validation
2. ✅ Payment intent creation with COP→USD conversion
3. ✅ Order status update after successful payment
4. ✅ Payment failure handling
5. ✅ 3D Secure flow
6. ✅ Refund processing

**Test Commands**:
```bash
cd backend

# Test webhook locally with Stripe CLI
stripe listen --forward-to localhost:3000/api/v1/payments-v2/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger charge.refunded
```

#### Task 3.2: Mobile Testing (1.5 hours)

**Test Scenarios**:
1. ✅ Select Stripe card payment method
2. ✅ Enter card details (test card: 4242 4242 4242 4242)
3. ✅ Save card for future use
4. ✅ Pay with saved card
5. ✅ Handle 3D Secure challenge (test card: 4000 0027 6000 3184)
6. ✅ Handle payment failure (test card: 4000 0000 0000 0002)
7. ✅ Verify order confirmation
8. ✅ Test MercadoPago still works (regression test)

**Stripe Test Cards**:
| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Success (no 3DS) |
| 4000 0027 6000 3184 | Success (requires 3DS) |
| 4000 0000 0000 0002 | Card declined |
| 4000 0000 0000 9995 | Insufficient funds |

#### Task 3.3: End-to-End Testing (30 min)

**Full Flow Test**:
1. Create order in mobile app
2. Select Stripe payment
3. Enter card details
4. Complete payment
5. Verify webhook received in backend logs
6. Verify order status = CONFIRMED
7. Verify payment status = COMPLETED
8. Check Stripe dashboard for payment record

---

## 4. Preserving MercadoPago

### 4.1 Backend Preservation Strategy

**Option A: Feature Flag (Recommended)**

**New File**: `backend/src/payments/payment-config.service.ts`

```typescript
@Injectable()
export class PaymentConfigService {
  getEnabledProviders(): string[] {
    const providers = process.env.ENABLED_PAYMENT_PROVIDERS || 'stripe,mercadopago';
    return providers.split(',').map(p => p.trim());
  }

  isProviderEnabled(provider: 'stripe' | 'mercadopago' | 'crypto'): boolean {
    return this.getEnabledProviders().includes(provider);
  }
}
```

**Update `.env`**:
```bash
# Payment Providers (comma-separated)
ENABLED_PAYMENT_PROVIDERS=stripe,mercadopago  # Enable both
# ENABLED_PAYMENT_PROVIDERS=stripe             # Stripe only
# ENABLED_PAYMENT_PROVIDERS=mercadopago        # MercadoPago only
```

**Update `PaymentsV2Controller`**:
```typescript
@Post()
async createPayment(@Body() createPaymentDto: CreatePaymentDto) {
  const { paymentMethod } = createPaymentDto;

  // Check if provider is enabled
  if (paymentMethod === 'mercadopago' && !this.paymentConfig.isProviderEnabled('mercadopago')) {
    throw new BadRequestException('MercadoPago is currently disabled');
  }

  if (paymentMethod === 'stripe_card' && !this.paymentConfig.isProviderEnabled('stripe')) {
    throw new BadRequestException('Stripe is currently disabled');
  }

  return this.paymentsV2Service.createPayment(createPaymentDto);
}
```

**Option B: Comment Out Code (Not Recommended)**

If you prefer to completely disable MercadoPago code:

```typescript
// backend/src/payments/payments-v2.service.ts

// ============================================
// MERCADOPAGO IMPLEMENTATION (DISABLED)
// Uncomment to re-enable MercadoPago payments
// ============================================

/*
async initiateMercadoPagoPayment(payment: PaymentV2): Promise<void> {
  // ... existing MercadoPago code
}
*/

// ============================================
// END MERCADOPAGO IMPLEMENTATION
// ============================================
```

### 4.2 Mobile App Preservation

**Strategy**: Use conditional rendering based on backend's available providers

**Update**: `mobile/src/components/checkout/PaymentMethodSelection.tsx`

```typescript
const loadPaymentMethods = async () => {
  try {
    // Fetch enabled providers from backend
    const config = await api.get('/payments-v2/config/providers');
    const enabledProviders = config.data.providers; // ['stripe', 'mercadopago']

    const methods: PaymentMethod[] = [];

    // Only show if enabled
    if (enabledProviders.includes('stripe')) {
      methods.push({
        id: 'new_card',
        type: 'card',
        provider: 'Stripe',
        details: { label: 'Credit/Debit Card', icon: '💳' },
      });
    }

    // Only show if enabled
    if (enabledProviders.includes('mercadopago')) {
      methods.push({
        id: 'mercadopago',
        type: 'mercadopago',
        provider: 'MercadoPago',
        details: { label: 'MercadoPago', icon: '💵' },
      });
    }

    setAvailableMethods(methods);
  } catch (error) {
    console.error('Failed to load payment methods:', error);
  }
};
```

**Add Backend Endpoint**:
```typescript
// backend/src/payments/payments-v2.controller.ts

@Get('config/providers')
async getEnabledProviders() {
  return {
    providers: this.paymentConfig.getEnabledProviders(),
  };
}
```

### 4.3 Switching Between Providers

**Quick Switch**:
```bash
# Enable only Stripe
ENABLED_PAYMENT_PROVIDERS=stripe

# Enable only MercadoPago
ENABLED_PAYMENT_PROVIDERS=mercadopago

# Enable both (let users choose)
ENABLED_PAYMENT_PROVIDERS=stripe,mercadopago
```

**Deployment Strategy**:
1. Deploy with both enabled initially
2. Monitor Stripe adoption rate
3. Gradually migrate users
4. Disable MercadoPago once adoption is high

---

## 5. Technical Implementation Details

### 5.1 File Changes Summary

#### Backend Files (7 files to modify/create)

| File | Action | Estimated Time |
|------|--------|---------------|
| `backend/.env.example` | Add Stripe keys | 5 min |
| `backend/src/payments/payments-v2.controller.ts` | Implement webhook handler | 2 hours |
| `backend/src/payments/currency.service.ts` | **Create new** - Currency conversion | 1.5 hours |
| `backend/src/payments/payments-v2.service.ts` | Add currency conversion logic | 30 min |
| `backend/src/payments/payment-config.service.ts` | **Create new** - Feature flags | 30 min |
| `backend/src/payments/payments-v2.module.ts` | Import HttpModule, new services | 15 min |
| `backend/src/main.ts` | Add raw body parser for webhooks | 15 min |

**Total Backend Time**: ~4 hours

#### Mobile Files (9 files to modify/create)

| File | Action | Estimated Time |
|------|--------|---------------|
| `mobile/package.json` | Add @stripe/stripe-react-native | 5 min |
| `mobile/app.json` | Add Stripe plugin config | 10 min |
| `mobile/.env.development` | Add STRIPE_PUBLISHABLE_KEY | 5 min |
| `mobile/src/providers/StripeProvider.tsx` | **Create new** - Stripe provider | 30 min |
| `mobile/App.tsx` | Wrap with StripeProvider | 10 min |
| `mobile/src/screens/payments/StripeCardScreen.tsx` | **Create new** - Card input UI | 3 hours |
| `mobile/src/components/checkout/PaymentMethodSelection.tsx` | Replace hardcoded methods | 2 hours |
| `mobile/src/screens/checkout/CheckoutScreen.tsx` | Add routing logic | 2 hours |
| `mobile/src/services/payments.service.ts` | Add Stripe methods | 1 hour |
| `mobile/src/navigation/AppNavigator.tsx` | Add StripeCard screen | 30 min |

**Total Mobile Time**: ~9.5 hours

### 5.2 Database Schema Changes

**No migrations required!** ✅

All necessary fields already exist in `PaymentV2` entity:
- `stripePaymentIntentId` ✅
- `paymentMetadata` (JSONB) ✅
- `processingFee` ✅
- `platformFee` ✅

Existing `payment_methods` table supports Stripe:
- `type` enum includes `'stripe_card'` ✅
- `stripePaymentMethodId` field exists ✅

### 5.3 API Request/Response Examples

#### Create Payment (Stripe)

**Request**:
```http
POST /api/v1/payments-v2
Content-Type: application/json
Authorization: Bearer <token>

{
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "paymentMethod": "stripe_card",
  "amount": 150000,
  "currency": "COP"
}
```

**Response**:
```json
{
  "id": "payment_abc123",
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "amount": 150000,
  "currency": "COP",
  "paymentMethod": "STRIPE_CARD",
  "status": "PENDING",
  "paymentMetadata": {
    "original_currency": "COP",
    "original_amount": 150000,
    "exchange_rate": 4000,
    "converted_amount": 37.5
  },
  "createdAt": "2025-01-04T10:30:00Z",
  "expiresAt": "2025-01-04T11:00:00Z"
}
```

#### Process Stripe Payment

**Request**:
```http
POST /api/v1/payments-v2/payment_abc123/process/stripe
Content-Type: application/json
Authorization: Bearer <token>

{
  "paymentMethodId": "pm_1234567890abcdef"
}
```

**Response (3D Secure Required)**:
```json
{
  "id": "payment_abc123",
  "status": "PROCESSING",
  "paymentMetadata": {
    "stripe_client_secret": "pi_3abc123_secret_xyz",
    "requires_action": true
  }
}
```

**Response (Success)**:
```json
{
  "id": "payment_abc123",
  "status": "COMPLETED",
  "processedAt": "2025-01-04T10:31:15Z",
  "stripePaymentIntentId": "pi_3abc123",
  "processingFee": 1.65
}
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

**Backend**:
```typescript
// backend/src/payments/__tests__/currency.service.spec.ts
describe('CurrencyService', () => {
  it('should convert COP to USD correctly', async () => {
    const result = await currencyService.convertCOPtoUSD(4000);
    expect(result.amountUSD).toBe(1.00);
  });

  it('should cache exchange rates', async () => {
    await currencyService.getExchangeRate('COP', 'USD');
    const cachedRate = await currencyService.getExchangeRate('COP', 'USD');
    expect(cachedRate).toBeDefined();
  });
});
```

**Mobile**:
```typescript
// mobile/src/services/__tests__/payments.service.spec.ts
describe('PaymentsService', () => {
  it('should process Stripe payment', async () => {
    const result = await paymentsService.processStripePayment('pay_123', 'pm_456');
    expect(result.status).toBe('COMPLETED');
  });

  it('should handle 3D Secure flow', async () => {
    const result = await paymentsService.processStripePayment('pay_123', 'pm_3ds');
    expect(result.paymentMetadata.requires_action).toBe(true);
  });
});
```

### 6.2 Integration Tests

**Webhook Test**:
```bash
# Use Stripe CLI to test webhooks
stripe listen --forward-to http://localhost:3000/api/v1/payments-v2/webhooks/stripe

# In another terminal
stripe trigger payment_intent.succeeded

# Check backend logs
# Expected: Payment status = COMPLETED, Order status = CONFIRMED
```

**End-to-End Test (Manual)**:
1. Start backend: `npm run dev:backend`
2. Start mobile app: `npm run dev:mobile`
3. Create account / login
4. Add product to cart
5. Proceed to checkout
6. Enter shipping address
7. Select "Credit/Debit Card" payment method
8. Enter test card: `4242 4242 4242 4242`
9. Submit payment
10. Verify order confirmation screen appears
11. Check backend logs for webhook confirmation
12. Check Stripe dashboard for payment record

### 6.3 Regression Tests

**Ensure MercadoPago still works**:
1. Set `ENABLED_PAYMENT_PROVIDERS=stripe,mercadopago`
2. Complete checkout flow with MercadoPago option
3. Verify WebView opens correctly
4. Complete payment in MercadoPago sandbox
5. Verify order confirmation

---

## 7. Cost & Risk Analysis

### 7.1 Stripe Fees Breakdown

**Per Transaction (Colombian customer paying USD)**:
- Base fee: 2.9% + $0.30
- International card fee: +1.5%
- **Total**: ~4.4% + $0.30 USD

**Example** (Order total: $150,000 COP ≈ $37.50 USD):
- Stripe fee: ($37.50 × 0.044) + $0.30 = **$1.95 USD**
- You receive: $35.55 USD
- In COP: ~142,200 COP (94.8% of order value)

**vs MercadoPago** (Same order):
- MercadoPago fee: 3.99% + $900 COP = **$6,885 COP**
- You receive: 143,115 COP (95.4% of order value)

**Verdict**: Similar costs, but Stripe has better USD settlement

### 7.2 Currency Exchange Risk

**Risk**: COP/USD exchange rate fluctuates daily

**Mitigation Strategies**:
1. **Dynamic Rates** (Recommended):
   - Fetch real-time rate at checkout
   - Update prices every hour
   - Cache rate for 1 hour max

2. **Fixed Daily Rate**:
   - Set rate once per day (8 AM Colombia time)
   - Less volatile but less accurate

3. **Buffer Margin**:
   - Add 1-2% buffer to exchange rate
   - Protects against rate changes during checkout
   ```typescript
   const bufferRate = currentRate * 1.02; // 2% buffer
   ```

4. **Lock Rate at Checkout**:
   - Store exchange rate in payment metadata
   - Use same rate for refunds
   - Prevents loss on refunds

### 7.3 Implementation Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **3D Secure rejection** | Medium | High | Handle gracefully, allow retry |
| **Webhook delivery failure** | Low | High | Implement retry logic + manual reconciliation |
| **Exchange rate API downtime** | Low | Medium | Fallback to hardcoded rate (4000 COP/USD) |
| **User confusion (new UI)** | Medium | Low | Add onboarding tooltips, keep MercadoPago option |
| **Colombian card rejection** | Medium | Medium | Show clear error messages, offer MercadoPago fallback |
| **Stripe account suspension** | Very Low | Critical | Complete business verification properly |

### 7.4 Compliance Risks

**Stripe Terms Compliance**:
- ✅ Must have valid US business entity
- ✅ Must not sell prohibited goods (weapons, drugs, etc.)
- ✅ Must honor refunds within 60 days
- ✅ Must clearly display pricing in customer's currency
- ❌ Risk: Colombian regulations around USD pricing

**Colombian Law**:
- ⚠️ Check if showing prices in USD is allowed
- ⚠️ May need to display COP price prominently
- ✅ VAT (IVA) already implemented correctly
- ✅ Invoice generation required (already have this)

**Recommendation**: Consult Colombian e-commerce lawyer before production launch

---

## 8. Timeline Estimate

### 8.1 Detailed Time Breakdown

| Phase | Task | Estimated Time | Priority |
|-------|------|---------------|----------|
| **Backend** | | | |
| | Stripe environment setup | 30 min | P0 |
| | Implement webhook handler | 2 hours | P0 |
| | Create currency conversion service | 1.5 hours | P0 |
| | Update PaymentsV2Service | 30 min | P0 |
| | Add feature flag service | 30 min | P1 |
| | Testing & debugging | 1 hour | P0 |
| **Backend Subtotal** | | **~6 hours** | |
| **Mobile** | | | |
| | Install Stripe SDK & config | 30 min | P0 |
| | Create StripeProvider | 30 min | P0 |
| | Build StripeCardScreen UI | 3 hours | P0 |
| | Update PaymentMethodSelection | 2 hours | P0 |
| | Update CheckoutScreen routing | 2 hours | P0 |
| | Update PaymentsService | 1 hour | P0 |
| | Update navigation | 30 min | P0 |
| | Testing (cards, 3DS, errors) | 1.5 hours | P0 |
| **Mobile Subtotal** | | **~11 hours** | |
| **Testing** | | | |
| | E2E integration testing | 1 hour | P0 |
| | Webhook testing (Stripe CLI) | 30 min | P0 |
| | MercadoPago regression testing | 30 min | P1 |
| **Testing Subtotal** | | **~2 hours** | |
| **Documentation** | | | |
| | Update README | 30 min | P1 |
| | API docs (Swagger) | 30 min | P1 |
| | Deployment guide | 30 min | P1 |
| **Docs Subtotal** | | **~1.5 hours** | |
| **TOTAL** | | **~20.5 hours** | |

**Optimistic Estimate**: 16-18 hours (if everything goes smoothly)
**Realistic Estimate**: 20-24 hours (includes debugging & iterations)
**Pessimistic Estimate**: 28-32 hours (if major issues arise)

### 8.2 Recommended Sprint Plan

**Week 1: Backend Foundation (6 hours)**
- Day 1-2: Stripe setup, webhook handler, currency service
- Day 3: Testing, debugging

**Week 2: Mobile Implementation (11 hours)**
- Day 1: Stripe SDK setup, provider
- Day 2-3: Card input UI, payment flow
- Day 4: Testing, polish

**Week 3: Integration & Launch (3 hours)**
- Day 1: E2E testing
- Day 2: Bug fixes, documentation
- Day 3: Staging deployment, final validation

**Total Calendar Time**: 2-3 weeks (depending on team availability)

### 8.3 Rollout Strategy

**Phase 1: Internal Testing (1 week)**
- Enable Stripe in staging environment only
- Test with team members using test cards
- Verify webhooks, refunds, edge cases

**Phase 2: Beta Testing (1-2 weeks)**
- Enable Stripe for 10% of users (feature flag)
- Keep MercadoPago as default
- Monitor error rates, success rates
- Collect user feedback

**Phase 3: Gradual Rollout (2-4 weeks)**
- Week 1: 25% of users
- Week 2: 50% of users
- Week 3: 75% of users
- Week 4: 100% of users

**Phase 4: Default Switch (after 1 month)**
- Make Stripe the default payment method
- Keep MercadoPago as secondary option
- Monitor metrics for 2 weeks

**Phase 5: Evaluate (after 2 months)**
- Compare conversion rates, fees, support tickets
- Decide whether to keep both or consolidate

---

## 9. Next Steps & Recommendations

### 9.1 Immediate Actions (Before Starting)

1. **Legal Review** (1-2 days)
   - Consult lawyer on Colombian USD pricing regulations
   - Review Stripe terms of service
   - Ensure business entity is properly set up in US

2. **Stripe Account Setup** (1-3 days)
   - Create Stripe account with US business info
   - Complete business verification (may take 1-3 days)
   - Get API keys (test + production)
   - Set up webhook endpoints in dashboard

3. **Stakeholder Alignment** (1 day)
   - Get approval from business team on exchange rate strategy
   - Align on rollout timeline with marketing
   - Ensure customer support is trained on Stripe flow

### 9.2 Technical Prerequisites

**Backend**:
- ✅ Node.js 16+ with NestJS
- ✅ PostgreSQL database
- ✅ Existing PaymentsV2 module
- ❌ Need: Stripe SDK keys
- ❌ Need: Exchange rate API account (or use free tier)

**Mobile**:
- ✅ React Native with Expo
- ✅ TypeScript
- ❌ Need: Upgrade to Expo SDK 50+ (for Stripe compatibility)
- ❌ Need: Test devices (iOS + Android)

### 9.3 Post-Implementation Monitoring

**Metrics to Track**:
1. **Payment Success Rate**: Target >95% for Stripe
2. **3D Secure Completion Rate**: Track authentication failures
3. **Average Processing Time**: Compare Stripe vs MercadoPago
4. **Currency Conversion Accuracy**: Monitor exchange rate variance
5. **User Adoption Rate**: % of users choosing Stripe over MercadoPago
6. **Cost Comparison**: Total fees paid to each provider
7. **Support Tickets**: Payment-related issues

**Alerts to Set Up**:
- Webhook failure rate >5%
- Payment success rate <90%
- Exchange rate API downtime
- Stripe account limits approaching

### 9.4 Future Enhancements (Post-Launch)

**Phase 2 Features** (Optional, after Stripe is stable):
1. **Stripe Connect for Sellers**
   - Allow sellers to receive direct payouts
   - Implement destination charges
   - Add seller onboarding flow

2. **Apple Pay / Google Pay**
   - Enable one-tap checkout
   - Increase mobile conversion rates

3. **Subscription Support**
   - For sellers with recurring products
   - Use Stripe Billing

4. **Multi-Currency Pricing**
   - Display prices in user's preferred currency
   - Support USD, COP, EUR

5. **Advanced Fraud Detection**
   - Enable Stripe Radar
   - Custom fraud rules

---

## 10. Conclusion

### Summary

**Current State**:
- Backend: 70% Stripe integration exists (PaymentsV2Service)
- Mobile: 0% Stripe (100% MercadoPago WebView)
- Database: Schema already supports Stripe ✅

**Implementation Plan**:
- **Backend**: 6 hours (webhook handler, currency service)
- **Mobile**: 11 hours (Stripe UI, card input, routing)
- **Testing**: 3 hours (E2E, webhooks, regression)
- **Total**: ~20 hours of development work

**Key Benefits**:
- ✅ Better marketplace support (Stripe Connect)
- ✅ Cleaner API and documentation
- ✅ Reliable webhooks
- ✅ 2-day settlement to US bank
- ✅ Support for Colombian cards

**Key Challenges**:
- ⚠️ No local payment methods (PSE, cash)
- ⚠️ Currency conversion required (COP → USD)
- ⚠️ User familiarity lower than MercadoPago

**Recommended Approach**:
1. Implement Stripe as **primary** payment method
2. Keep MercadoPago as **secondary** option (for local methods)
3. Use feature flags to control rollout
4. Monitor metrics closely during gradual rollout

### Final Recommendation

✅ **Proceed with Stripe implementation** for the following reasons:

1. Backend work is minimal (most code exists)
2. Stripe Connect is perfect for marketplace model
3. US company = better Stripe compatibility
4. Colombian cards work fine with Stripe
5. Can preserve MercadoPago as fallback

⚠️ **BUT first complete**:
1. Legal review on Colombian USD pricing
2. Stripe business verification
3. Stakeholder alignment on rollout plan

---

## Appendix

### A. Environment Variables Reference

```bash
# Backend .env

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51...  # Get from https://dashboard.stripe.com/test/apikeys
STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...  # Get from webhook settings

# Currency Conversion
EXCHANGE_RATE_API_URL=https://api.exchangerate-api.com/v4/latest/USD
FALLBACK_COP_USD_RATE=4000  # Updated monthly

# Payment Config
ENABLED_PAYMENT_PROVIDERS=stripe,mercadopago

# Application URLs
APP_URL=http://localhost:3002  # Mobile deep link scheme
API_URL_PUBLIC=https://api.gshop.com  # For webhook callbacks
```

```bash
# Mobile .env.development

STRIPE_PUBLISHABLE_KEY=pk_test_51...
API_BASE_URL=http://192.168.20.93:3000
```

### B. Stripe Test Cards

| Card Number | Scenario | 3D Secure |
|-------------|----------|-----------|
| 4242 4242 4242 4242 | Success | No |
| 4000 0027 6000 3184 | Success | Yes (authenticate) |
| 4000 0000 0000 0077 | Success | Yes (challenge) |
| 4000 0000 0000 0002 | Declined | No |
| 4000 0000 0000 9995 | Declined (insufficient funds) | No |
| 4000 0000 0000 9987 | Declined (lost card) | No |

Use any future expiry date (e.g., 12/34) and any 3-digit CVC.

### C. Useful Links

- Stripe Dashboard: https://dashboard.stripe.com
- Stripe API Docs: https://stripe.com/docs/api
- Stripe React Native: https://github.com/stripe/stripe-react-native
- Stripe Webhooks Guide: https://stripe.com/docs/webhooks
- Stripe Connect: https://stripe.com/docs/connect
- Stripe CLI: https://stripe.com/docs/stripe-cli
- Exchange Rate API: https://exchangerate-api.com
- Colombian Tax Authority (DIAN): https://www.dian.gov.co

### D. Support & Troubleshooting

**Common Issues**:

1. **Webhook not received**:
   - Check webhook URL is publicly accessible
   - Verify webhook secret matches Stripe dashboard
   - Use Stripe CLI for local testing

2. **3D Secure not working**:
   - Ensure `return_url` is set correctly
   - Verify mobile app has deep link scheme configured
   - Use `confirmPayment()` from Stripe SDK

3. **Currency conversion errors**:
   - Check exchange rate API is accessible
   - Verify fallback rate is set
   - Log conversion details for debugging

4. **Card declined**:
   - Check Stripe dashboard for decline reason
   - Verify card supports international payments
   - Ensure 3D Secure is enabled

**Getting Help**:
- Stripe Support: https://support.stripe.com
- Stripe Discord: https://stripe.com/discord
- Stack Overflow: Tag questions with `stripe-payments`

---

**Document Version**: 1.0
**Last Updated**: January 4, 2026
**Author**: Claude (Miyu) - GSHOP Development Team
**Next Review**: After implementation completion
