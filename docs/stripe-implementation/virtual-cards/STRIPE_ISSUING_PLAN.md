# Stripe Issuing - Virtual & Physical Cards Implementation Plan

## 📋 Executive Summary

**Can GSHOP implement virtual cards with Stripe?** **YES**, but with **significant limitations** for the Colombian market.

**TL;DR**:
- ✅ Technically possible with Stripe Issuing
- ❌ **NOT available in Colombia** (US/UK/EU only)
- ⚠️ Complex regulatory requirements
- 💰 High implementation cost ($50k+ setup, ongoing fees)
- 🚫 **Recommendation**: Not viable for Colombian market MVP

**Alternative Solution**: Use Colombian fintech partners (Rappipay, Bold, Ualá Colombia) for local virtual cards.

---

## 🎯 What is Stripe Issuing?

Stripe Issuing is a product that lets platforms **create and distribute virtual and physical debit cards** to users.

### Key Features

| Feature | Description |
|---------|-------------|
| **Virtual Cards** | Instant card creation via API, no physical shipping |
| **Physical Cards** | Custom-branded Visa/Mastercard debit cards |
| **Spend Controls** | Set limits per card, category, merchant |
| **Real-time Auth** | Approve/decline transactions programmatically |
| **Reloadable** | Top-up cards from platform balance |
| **Universal** | Works anywhere Visa/Mastercard is accepted |
| **Webhooks** | Real-time notifications for all transactions |

### Use Cases for GSHOP

**Ideal Scenarios**:
1. **User Wallets**: Users load money into app → get virtual card → spend anywhere
2. **Affiliate Payouts**: Issue cards to affiliates for instant commission withdrawals
3. **Seller Disbursements**: Sellers receive earnings on virtual cards
4. **Gift Cards**: Issue prepaid cards as promotional rewards

**Example User Flow**:
```
User deposits $100 USD → GSHOP issues virtual card with $100 balance
→ User spends at any online/offline store accepting Visa
→ GSHOP gets real-time notification → Deducts from user balance
```

---

## 🌍 Geographic Availability (CRITICAL LIMITATION)

### Where Stripe Issuing is Available

| Region | Status | Notes |
|--------|--------|-------|
| **United States** 🇺🇸 | ✅ Full support | All features available |
| **United Kingdom** 🇬🇧 | ✅ Full support | - |
| **European Union** 🇪🇺 | ✅ Partial | Germany, France, Spain, Italy, Ireland, Netherlands, Belgium, Austria |
| **Colombia** 🇨🇴 | ❌ **NOT AVAILABLE** | No support |
| **Latin America** | ❌ **NOT AVAILABLE** | No support (except Brazil - limited) |

### Impact on GSHOP

**Problem**: GSHOP serves **Colombian users**, but Stripe Issuing is **NOT available in Colombia**.

**Possible Workarounds** (all complex):

1. **Option A: US-Issued Cards to Colombian Users**
   - GSHOP (US company) issues cards via Stripe
   - Colombian users receive US-issued Visa cards
   - ⚠️ **Issues**:
     - Cross-border regulations (FinCEN, DIAN)
     - Currency conversion (COP ↔ USD) on every transaction
     - Tax implications (both US and Colombia)
     - User confusion (card shows USD, users expect COP)

2. **Option B: Geo-Restrict Feature**
   - Only offer virtual cards to US-based users
   - Colombian users excluded
   - ⚠️ **Issues**:
     - Limited addressable market (GSHOP is Colombia-focused)
     - Feature parity problems

3. **Option C: Use Colombian Fintech Partner** (RECOMMENDED)
   - Partner with Rappipay, Bold, Ualá, or Nequi
   - Issue cards under Colombian regulations
   - ✅ **Benefits**:
     - Native COP support
     - No cross-border issues
     - Better user experience

---

## 💰 Cost Analysis

### Stripe Issuing Fees (US-Based)

| Item | Cost | Notes |
|------|------|-------|
| **Card Creation** | $0 (virtual) / $5 (physical) | One-time per card |
| **Monthly Active Card** | $0.50/month | Per active card |
| **Domestic Transactions** | 0.75% + $0.05 | Per transaction (US cards) |
| **International Transactions** | 1.5% + $0.10 | Per transaction (non-US) |
| **ATM Withdrawals** | $2.00 + 1% | If enabled |
| **Interchange Revenue** | Variable | ~1% rebate to platform |

### Cost Example (Colombian User Scenario)

**Assumptions**:
- 10,000 active virtual cards
- Average 5 transactions/month per card
- Average transaction: $20 USD (~80,000 COP)

**Monthly Costs**:
```
Card maintenance: 10,000 cards × $0.50 = $5,000/month
Transaction fees: 10,000 cards × 5 txns × $20 × 1.5% = $15,000/month
Transaction fees (fixed): 10,000 cards × 5 txns × $0.10 = $5,000/month

Total: $25,000/month (~100M COP/month)
```

**Revenue Potential**:
```
Interchange rebate: ~1% × $1,000,000 (volume) = $10,000/month
User fees (optional): 10,000 users × $2/month = $20,000/month

Net cost: $25,000 - $10,000 - $20,000 = -$5,000/month (breakeven)
```

**Conclusion**: Potentially profitable if users pay $2/month card fee, otherwise costly.

### Implementation Costs

| Phase | Time | Cost (@$100/hour) |
|-------|------|-------------------|
| **Legal/Compliance** | 80 hours | $8,000 |
| **Backend Development** | 120 hours | $12,000 |
| **Mobile UI/UX** | 60 hours | $6,000 |
| **Testing & Security** | 40 hours | $4,000 |
| **Stripe Integration** | 80 hours | $8,000 |
| **Regulatory Filings** | - | $10,000-$50,000 |
| **Total** | 380 hours | **$48,000 - $88,000** |

**Timeline**: 3-4 months (assuming no regulatory blockers)

---

## 🔧 Technical Implementation (If Proceeding)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      GSHOP Mobile App                       │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │ User Wallet    │  │ Virtual Cards  │  │ Transactions │  │
│  │ (Deposit COP)  │  │ (View/Manage)  │  │ (History)    │  │
│  └────────┬───────┘  └────────┬───────┘  └──────┬───────┘  │
│           │                   │                  │          │
└───────────┼───────────────────┼──────────────────┼──────────┘
            │                   │                  │
            ▼                   ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  GSHOP Backend (NestJS)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │             Virtual Cards Module (NEW)                 │ │
│  │  - WalletService (balance management)                  │ │
│  │  - CardsService (Stripe Issuing API)                   │ │
│  │  - TransactionsService (webhook handler)               │ │
│  │  - CurrencyService (COP ↔ USD conversion)             │ │
│  │  - AuthorizationService (real-time approve/decline)    │ │
│  └────────────────────────────────────────────────────────┘ │
│           │                   │                  │          │
└───────────┼───────────────────┼──────────────────┼──────────┘
            │                   │                  │
            ▼                   ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     Stripe Issuing API                      │
│  - Create Card                                              │
│  - Fund Card (via Stripe Balance)                           │
│  - Authorize Transaction (webhook: authorization.request)   │
│  - Transaction Events (webhook: issuing_transaction.*)      │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

**New Entities**:

```typescript
// virtual-card.entity.ts
@Entity('virtual_cards')
export class VirtualCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ unique: true })
  stripeCardId: string;  // card_xxxxx from Stripe

  @Column({ type: 'enum', enum: CardStatus })
  status: CardStatus;  // active, inactive, canceled

  @Column()
  last4: string;  // Last 4 digits

  @Column()
  brand: string;  // visa, mastercard

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  balanceCOP: number;  // User-facing balance in COP

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  balanceUSD: number;  // Actual Stripe balance in USD

  @Column({ type: 'jsonb', nullable: true })
  spendingControls: SpendingControls;  // Limits, categories

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// card-transaction.entity.ts
@Entity('card_transactions')
export class CardTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  cardId: string;

  @Column()
  stripeTransactionId: string;  // ipi_xxxxx from Stripe

  @Column()
  merchantName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amountCOP: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amountUSD: number;

  @Column()
  currency: string;  // usd

  @Column({ type: 'enum', enum: TransactionStatus })
  status: TransactionStatus;  // pending, approved, declined

  @Column({ nullable: true })
  declineReason: string;

  @CreateDateColumn()
  createdAt: Date;
}

// wallet.entity.ts (enhance existing or create)
@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balanceCOP: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balanceUSD: number;

  @Column({ type: 'jsonb', nullable: true })
  transactionHistory: WalletTransaction[];
}
```

### API Endpoints

```typescript
// Virtual Cards Management
POST   /api/v1/virtual-cards          // Create virtual card for user
GET    /api/v1/virtual-cards          // List user's cards
GET    /api/v1/virtual-cards/:id      // Get card details
PUT    /api/v1/virtual-cards/:id      // Update card (limits, status)
DELETE /api/v1/virtual-cards/:id      // Cancel card

// Wallet Management
GET    /api/v1/wallet                 // Get wallet balance
POST   /api/v1/wallet/deposit         // Deposit funds (MercadoPago/Stripe)
POST   /api/v1/wallet/withdraw        // Withdraw funds
POST   /api/v1/wallet/transfer        // Transfer to card

// Transactions
GET    /api/v1/virtual-cards/:id/transactions  // Get card transactions
POST   /api/v1/webhooks/stripe/issuing         // Stripe webhook handler
```

### Core Services

**1. CardsService** (`virtual-cards.service.ts`):

```typescript
import Stripe from 'stripe';

@Injectable()
export class VirtualCardsService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(VirtualCard)
    private cardsRepo: Repository<VirtualCard>,
    private currencyService: CurrencyService,
    private walletService: WalletService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  async createCard(userId: string, initialBalanceCOP: number) {
    // 1. Convert COP to USD
    const exchangeRate = await this.currencyService.getRate('COP', 'USD');
    const balanceUSD = initialBalanceCOP / exchangeRate;

    // 2. Create cardholder in Stripe
    const cardholder = await this.stripe.issuing.cardholders.create({
      name: user.fullName,
      email: user.email,
      phone_number: user.phone,
      billing: {
        address: {
          line1: user.address,
          city: user.city,
          state: user.state,
          postal_code: user.postalCode,
          country: 'CO',  // ⚠️ May cause issues - US entity issuing to CO address
        },
      },
      type: 'individual',
      metadata: {
        gshop_user_id: userId,
      },
    });

    // 3. Create virtual card
    const stripeCard = await this.stripe.issuing.cards.create({
      cardholder: cardholder.id,
      currency: 'usd',
      type: 'virtual',
      spending_controls: {
        spending_limits: [
          {
            amount: Math.floor(balanceUSD * 100),  // In cents
            interval: 'all_time',
          },
        ],
      },
      metadata: {
        gshop_user_id: userId,
        initial_balance_cop: initialBalanceCOP.toString(),
      },
    });

    // 4. Fund card (transfer from GSHOP Stripe balance)
    // ⚠️ Requires GSHOP to maintain USD balance in Stripe
    // This is complex - typically done via Stripe Balance API

    // 5. Save to database
    const card = this.cardsRepo.create({
      userId,
      stripeCardId: stripeCard.id,
      status: 'active',
      last4: stripeCard.last4,
      brand: stripeCard.brand,
      balanceCOP: initialBalanceCOP,
      balanceUSD,
    });

    return this.cardsRepo.save(card);
  }

  async handleAuthorizationRequest(event: Stripe.Event) {
    // Real-time authorization webhook
    const authorization = event.data.object as Stripe.Issuing.Authorization;

    // Check if user has sufficient balance
    const card = await this.cardsRepo.findOne({
      where: { stripeCardId: authorization.card.id },
    });

    if (!card) {
      return { approved: false, reason: 'card_not_found' };
    }

    const requestedAmountUSD = authorization.amount / 100;

    if (requestedAmountUSD > card.balanceUSD) {
      // Decline - insufficient funds
      return { approved: false, reason: 'insufficient_funds' };
    }

    // Approve - deduct balance
    card.balanceUSD -= requestedAmountUSD;
    await this.cardsRepo.save(card);

    return { approved: true };
  }
}
```

**2. Webhook Handler** (`virtual-cards.controller.ts`):

```typescript
@Controller('webhooks/stripe/issuing')
export class VirtualCardsWebhookController {
  @Post()
  @RawBody()
  async handleWebhook(
    @Body() body: any,
    @Headers('stripe-signature') signature: string,
  ) {
    const event = this.stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_ISSUING_WEBHOOK_SECRET,
    );

    switch (event.type) {
      case 'issuing_authorization.request':
        // Real-time: approve/decline transaction
        return this.cardsService.handleAuthorizationRequest(event);

      case 'issuing_authorization.created':
        // Transaction authorized
        await this.transactionsService.recordTransaction(event);
        break;

      case 'issuing_transaction.created':
        // Transaction settled
        await this.transactionsService.finalizeTransaction(event);
        break;

      case 'issuing_card.created':
        // Card created successfully
        await this.cardsService.syncCardStatus(event);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }
}
```

**3. Mobile UI** (`VirtualCardScreen.tsx`):

```typescript
import { CardField, useConfirmPayment } from '@stripe/stripe-react-native';

export const VirtualCardScreen = () => {
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [loading, setLoading] = useState(false);

  const createCard = async (initialBalance: number) => {
    setLoading(true);
    try {
      const response = await api.post('/virtual-cards', {
        initialBalanceCOP: initialBalance,
      });
      setCards([...cards, response.data]);
      Alert.alert('Success', 'Virtual card created!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView>
      {/* Card Display */}
      {cards.map((card) => (
        <View key={card.id} style={styles.cardContainer}>
          <Text style={styles.cardNumber}>•••• •••• •••• {card.last4}</Text>
          <Text style={styles.balance}>
            Balance: ${card.balanceCOP.toLocaleString()} COP
          </Text>
          <Text style={styles.balanceUSD}>
            (${card.balanceUSD.toFixed(2)} USD)
          </Text>
          <Button title="View Transactions" onPress={() => {}} />
          <Button title="Top Up" onPress={() => {}} />
        </View>
      ))}

      {/* Create Card Button */}
      <Button
        title="Create Virtual Card"
        onPress={() => createCard(100000)}  // 100k COP
        loading={loading}
      />
    </ScrollView>
  );
};
```

### Key Implementation Steps

1. **Phase 1: Legal & Compliance** (4-8 weeks)
   - Legal review of cross-border card issuance
   - Stripe Issuing application and approval
   - Regulatory filings (FinCEN, DIAN if applicable)
   - Terms of Service updates

2. **Phase 2: Backend** (6 weeks)
   - Database schema migration
   - CardsService implementation
   - Webhook handler
   - Wallet integration
   - Currency conversion service

3. **Phase 3: Mobile** (4 weeks)
   - Virtual card UI
   - Wallet management screens
   - Transaction history
   - Top-up flow

4. **Phase 4: Testing** (2 weeks)
   - Security audit
   - Penetration testing
   - Stripe test mode validation
   - User acceptance testing

5. **Phase 5: Launch** (2 weeks)
   - Beta rollout (10% users)
   - Monitor transactions
   - Fix issues
   - Gradual rollout

**Total Timeline**: 4-5 months

---

## ⚠️ Regulatory & Compliance Considerations

### US Regulations (if GSHOP issues cards from US entity)

**1. Bank Secrecy Act (BSA) / Anti-Money Laundering (AML)**
- Must implement KYC (Know Your Customer) for all cardholders
- Report suspicious activity (SARs - Suspicious Activity Reports)
- Maintain transaction records for 5 years

**2. FinCEN Regulations**
- Register as Money Services Business (MSB) if applicable
- Report large transactions ($10,000+)
- OFAC sanctions screening

**3. Card Network Rules (Visa/Mastercard)**
- Comply with PCI DSS (Payment Card Industry Data Security Standard)
- Follow network operating regulations
- Dispute resolution procedures

### Colombian Regulations (if users are Colombian)

**1. DIAN (Tax Authority)**
- Report cross-border transactions
- Withholding tax implications (if applicable)
- VAT on transaction fees?

**2. Superintendencia Financiera de Colombia**
- Foreign exchange controls
- Limits on USD holdings by Colombian residents?
- Reporting requirements for foreign financial products

**3. User Disclosure**
- Clear T&Cs explaining USD conversion
- Exchange rate transparency
- Fee disclosures

### Partner Requirements

**Stripe Requirements**:
- Business verification (EIN, business documents)
- Background checks on beneficial owners
- Compliance program documentation
- Ongoing transaction monitoring

**Banking Partner** (Stripe uses partner banks):
- Additional KYC/AML checks
- Right to freeze/terminate accounts
- Regular audits

---

## 🚨 Risks & Challenges

### High-Risk Factors

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Regulatory Non-Compliance** | 🔴 Critical | Legal review before launch |
| **Fraud/Money Laundering** | 🔴 Critical | Strict KYC, transaction monitoring |
| **Currency Fluctuations** | 🟡 Medium | Hedge USD exposure, pass costs to users |
| **User Confusion (COP vs USD)** | 🟡 Medium | Clear UI, real-time conversion display |
| **Stripe Account Suspension** | 🔴 Critical | Diversify (backup provider) |
| **High Costs** | 🟡 Medium | Charge user fees, require minimums |
| **Poor User Adoption** | 🟡 Medium | Market research, beta testing |

### Why This is Hard for Colombian Users

1. **Currency Confusion**:
   - User sees balance in COP ($100,000)
   - Spends at merchant (charged in USD $25)
   - Exchange rate changes daily
   - User sees unexpected deduction ($105,000 COP instead of $100,000)

2. **Tax Implications**:
   - Colombian users with US-issued cards may trigger tax reporting
   - Unclear if this counts as "foreign asset" for Colombian tax residents

3. **Limited Utility**:
   - Many Colombian merchants prefer local payment methods (PSE, Nequi)
   - Card seen as "foreign" → less trusted
   - Users already have local debit cards

---

## 💡 Alternative Solutions (RECOMMENDED)

### Option 1: Partner with Colombian Fintech (BEST)

**Providers**:

| Provider | Product | Status |
|----------|---------|--------|
| **Rappipay** | Virtual prepaid cards | ✅ Active in Colombia |
| **Bold** | Virtual cards for businesses | ✅ Active |
| **Ualá Colombia** | Prepaid Mastercard | ✅ Active |
| **Nequi** | Virtual cards | ✅ Bancolombia-backed |
| **DaviPlata** | Prepaid cards | ✅ Davivienda-backed |

**Benefits**:
- ✅ Native COP support (no conversion)
- ✅ Colombian regulatory compliance (already licensed)
- ✅ Better user experience (familiar brands)
- ✅ Faster implementation (use their API)
- ✅ Lower costs (no cross-border fees)

**Implementation**:
```typescript
// Example: Rappipay API integration
const card = await rappipay.cards.create({
  userId: user.id,
  initialBalance: 100000,  // COP
  currency: 'COP',
});

// No currency conversion needed!
```

**Estimated Timeline**: 2-3 months (vs 4-5 months with Stripe)

**Estimated Cost**: $15,000-$30,000 (vs $50,000-$90,000 with Stripe)

### Option 2: Wallet-Only (No Card Issuance)

**Concept**: Create in-app wallet WITHOUT issuing actual cards.

**Features**:
- Users deposit money into GSHOP wallet
- Spend wallet balance ONLY within GSHOP ecosystem
- No external card usage

**Benefits**:
- ✅ No regulatory complexity
- ✅ Lower costs
- ✅ Full control over user experience
- ✅ Simpler implementation

**Limitations**:
- ❌ Can't spend outside GSHOP
- ❌ Lower utility for users

**Use Cases**:
- Loyalty programs
- Gift balances
- Affiliate/seller earnings held in wallet

### Option 3: Crypto/Stablecoin Cards (Emerging)

**Providers**: Crypto.com, Binance Card (if expanding to LATAM)

**Concept**: Issue cards backed by stablecoins (USDC, USDT)

**Status**: ⚠️ Experimental, high regulatory risk

---

## 🎯 Recommendation

### For GSHOP Colombian Market: **DO NOT** Use Stripe Issuing

**Why**:
1. ❌ Not available in Colombia
2. ❌ Extremely high regulatory complexity
3. ❌ Poor user experience (COP ↔ USD confusion)
4. ❌ High cost ($50k+ implementation)
5. ❌ 4-5 month timeline

### Recommended Path: **Partner with Colombian Fintech**

**Action Plan**:

1. **Week 1-2**: Research Colombian card providers
   - Rappipay, Bold, Ualá, Nequi, DaviPlata
   - Compare APIs, fees, features
   - Schedule demos

2. **Week 3-4**: Legal & Compliance
   - Review provider terms
   - Ensure GSHOP can integrate (business type, KYC)
   - Sign partnership agreement

3. **Week 5-8**: Implementation
   - Integrate provider API
   - Build wallet UI
   - Test card issuance flow

4. **Week 9-10**: Testing & Launch
   - Beta test with 100 users
   - Monitor transactions
   - Full rollout

**Timeline**: 2-3 months (vs 4-5 months with Stripe)

**Cost**: $15,000-$30,000 (vs $50,000-$90,000 with Stripe)

**Success Metrics**:
- 30% user adoption (3,000 cards issued in Month 1)
- 5+ transactions per card per month
- <2% fraud rate
- User NPS >50

---

## 📚 Additional Resources

### Stripe Issuing Documentation
- Official Docs: https://stripe.com/docs/issuing
- API Reference: https://stripe.com/docs/api/issuing
- Country Availability: https://stripe.com/docs/issuing/availability
- Webhooks: https://stripe.com/docs/issuing/webhooks

### Colombian Fintech Providers
- **Rappipay**: https://www.rappipay.com
- **Bold**: https://bold.co
- **Ualá Colombia**: https://www.uala.com.co
- **Nequi**: https://www.nequi.com.co

### Regulations
- FinCEN MSB Registration: https://www.fincen.gov/money-services-business-msb-registration
- DIAN Colombia: https://www.dian.gov.co
- Superfinanciera: https://www.superfinanciera.gov.co

---

## ✅ Next Steps

### If Proceeding with Stripe Issuing (NOT RECOMMENDED)

1. **Immediate** (This Week):
   - [ ] Legal consultation ($500-$2,000)
   - [ ] Stripe Issuing account application
   - [ ] Review compliance requirements

2. **Short-term** (Month 1):
   - [ ] Obtain legal opinion on Colombian user eligibility
   - [ ] FinCEN registration (if required)
   - [ ] Stripe approval (can take 2-4 weeks)

3. **Medium-term** (Months 2-3):
   - [ ] Backend development
   - [ ] Mobile UI development
   - [ ] Testing

4. **Long-term** (Month 4+):
   - [ ] Beta launch
   - [ ] Monitor compliance
   - [ ] Scale

### If Using Colombian Partner (RECOMMENDED)

1. **Immediate** (This Week):
   - [ ] Research Rappipay, Bold, Ualá APIs
   - [ ] Request demos and pricing
   - [ ] Compare features

2. **Short-term** (Weeks 2-4):
   - [ ] Select provider
   - [ ] Sign partnership agreement
   - [ ] Get API credentials

3. **Medium-term** (Weeks 5-8):
   - [ ] Integrate API
   - [ ] Build mobile UI
   - [ ] Test

4. **Long-term** (Weeks 9-12):
   - [ ] Beta launch (100 users)
   - [ ] Full rollout
   - [ ] Monitor metrics

---

## 📊 Decision Matrix

| Criteria | Stripe Issuing | Colombian Partner | Wallet-Only |
|----------|----------------|-------------------|-------------|
| **Market Fit** | ❌ Poor | ✅ Excellent | 🟡 Good |
| **Regulatory** | ❌ Complex | ✅ Simple | ✅ Simple |
| **Cost** | ❌ High ($50k+) | ✅ Low ($15k-$30k) | ✅ Very Low ($5k) |
| **Timeline** | ❌ 4-5 months | ✅ 2-3 months | ✅ 1 month |
| **User Experience** | ❌ Confusing (USD) | ✅ Native (COP) | 🟡 Limited |
| **Utility** | ✅ Spend anywhere | ✅ Spend anywhere | ❌ GSHOP only |
| **Maintenance** | ❌ High | 🟡 Medium | ✅ Low |

**Winner**: **Colombian Fintech Partner** 🏆

---

**Questions?** Let me know if you want to explore any specific provider or need help with implementation!
