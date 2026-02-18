# Stripe Issuing - Virtual & Physical Cards Implementation Plan

## 📋 Executive Summary

**Can GSHOP implement virtual cards with Stripe?** **YES** — and with Bridge (Stripe's acquisition), Colombia is now **directly supported**.

**TL;DR**:
- ✅ Technically possible with Stripe Issuing
- ✅ **Colombia supported via Bridge + Visa** (stablecoin-linked cards, private preview)
- ⚠️ Traditional Stripe Issuing still US/UK/EU only — Bridge is the path for LATAM
- 💰 Implementation cost TBD (Bridge fees not yet public)
- ✅ **Recommendation**: Use **Bridge (Stripe) + Visa stablecoin cards** for Colombia and LATAM

> **UPDATE (2025)**: Stripe acquired [Bridge](https://stripe.com/newsroom/news/bridge-partners-with-visa) and partnered with Visa to launch **stablecoin-linked card issuing** with Colombia as one of the initial launch countries. This fundamentally changes the viability analysis. See [Option D: Bridge + Visa Stablecoin Cards](#option-d-bridge--visa-stablecoin-cards-recommended) for the new recommended approach.

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
| **Colombia** 🇨🇴 | ❌ Traditional Issuing / ✅ **Bridge + Visa** | Stablecoin-linked cards (early access) |
| **Latin America** | ❌ Traditional Issuing / ✅ **Bridge + Visa** | Argentina, Mexico, Peru, Chile, Ecuador, Colombia |

### Impact on GSHOP

**Original Problem**: GSHOP serves **Colombian users**, and traditional Stripe Issuing is **NOT available in Colombia**.

**Update**: With Bridge + Visa, Colombia IS supported via stablecoin-linked cards. See [Option D](#option-d-bridge--visa-stablecoin-cards-recommended).

**Legacy Workarounds** (kept for reference — Option D supersedes these):

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

3. **Option C: Use Colombian Fintech Partner**
   - Partner with Rappipay, Bold, Ualá, or Nequi
   - Issue cards under Colombian regulations
   - ✅ **Benefits**:
     - Native COP support
     - No cross-border issues
     - Better user experience

4. **Option D: Bridge + Visa Stablecoin Cards** (RECOMMENDED)
   - Use Stripe's Bridge acquisition + Visa partnership
   - Issue stablecoin-linked Visa cards directly to Colombian users
   - ✅ **Benefits**:
     - Colombia is an initial launch country
     - Single API integration (stays within Stripe ecosystem)
     - Automatic stablecoin-to-COP conversion at point of sale
     - Merchant receives COP — transaction looks domestic
     - Scales to Argentina, Mexico, Peru, Chile, Ecuador with zero extra work
     - Users get USD-stable value storage with local spending power
   - ⚠️ **Considerations**:
     - Currently in **private preview** (must be approved by Stripe — more restrictive than early access)
     - Platform must be US-based (GSHOP qualifies)
     - Card currency is USD, balance held in USDC — Bridge converts to local fiat at POS
     - Stablecoin regulatory framework in Colombia still evolving
     - Fees not yet publicly documented
     - Banking partner: Lead Bank (US-based)
     - Physical cards ship from US only (virtual cards are instant)
   - See [full analysis below](#-option-d-bridge--visa-stablecoin-cards-new---recommended)

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

## 💡 Alternative Solutions

### Option D: Bridge + Visa Stablecoin Cards (NEW - RECOMMENDED)

**Sources**:
- [Bridge partners with Visa to launch stablecoin card issuing product](https://stripe.com/newsroom/news/bridge-partners-with-visa)
- [Stablecoin-funded Issuing cards with Connect](https://docs.stripe.com/issuing/stablecoins-connect) (private preview technical docs)

**What is Bridge?**
Bridge is a stablecoin infrastructure company **acquired by Stripe** (Stripe's largest acquisition). Together with Visa, they launched a card-issuing product that enables platforms to offer **stablecoin-linked Visa cards** through a single API integration.

**How It Works (Connect Model)**:

GSHOP acts as a **Connect platform**. Each user becomes a **connected account** with a custodial USDC wallet and a Visa card linked to it.

```
1. GSHOP (platform) funds its Stripe Financial Account (USD via bank wire/ACH)
2. GSHOP transfers USD to user's connected account → auto-converts to USDC
   (Outbound Payments v2 API handles USD → USDC conversion)
3. Bridge issues a Visa prepaid debit card linked to the USDC balance
4. User pays at any merchant → Bridge auto-converts USDC → local fiat (COP)
5. Merchant receives COP like any normal Visa transaction
```

**Card Specifications** (from Stripe docs):

| Specification | Value |
|---------------|-------|
| **Product Type** | Business Prepaid Debit |
| **Card Network** | Visa |
| **Card Currency** | USD |
| **Funding Model** | Pre-funded, Stablecoin-backed (USDC) |
| **Funding Chain** | Base (L2) |
| **Wallet Type** | Custodial |
| **Sponsor Bank** | Lead Bank |
| **Card Types** | Virtual, Physical, Digital Wallets (Apple Pay, Google Pay) |
| **Max per Authorization** | $10,000 USD |
| **BIN Type** | Shared BIN |

**API Flow (Technical Detail)**:

```
Step 1: Onboard user as Connected Account (v2 API)
  → Required capabilities:
    - storer.holds_currencies.usdc (stablecoin storage)
    - storer.outbound_transfer.crypto_wallet (optional: external wallet transfers)
    - card_creator.commercial.lead.prepaid_card (card issuing)
  → KYC handled by Stripe + Bridge

Step 2: Create Financial Account for user
  → POST /v2/financial_accounts { type: "storage", storage: { holds_currencies: ["usdc"] } }

Step 3: Fund user's account
  → Platform transfers USD → connected account via Outbound Payments v2
  → Automatic USD → USDC conversion during transfer

Step 4: Issue Visa card
  → POST /v1/issuing/cardholders (standard Issuing API)
  → POST /v1/issuing/cards { financial_account_v2: "<user_fa_id>" }
  → Card is funded from user's USDC balance

Step 5: User spends
  → Spending controls specified in USD (not USDC)
  → Bridge handles USDC → local fiat conversion at point of sale
  → Transactions tracked via Transactions v2 API + Received Debit v2 API
```

**Additional User Capabilities**:
- **Crypto wallet transfers**: Users can send USDC to external wallets (Arbitrum, Base, Ethereum, Solana, Polygon, etc.)
- **Fiat payouts**: Users can receive payouts in USD, MXN, EUR
- **Digital wallets**: Cards can be added to Apple Pay and Google Pay

**Physical Cards Note**: Currently ships from the US only (express/priority shipping required). Custom card designs require ~8-week lead time.

**Supported Countries (Initial Launch)**:

| Country | Status |
|---------|--------|
| **Colombia** 🇨🇴 | ✅ Initial launch |
| **Argentina** 🇦🇷 | ✅ Initial launch |
| **Mexico** 🇲🇽 | ✅ Initial launch |
| **Peru** 🇵🇪 | ✅ Initial launch |
| **Chile** 🇨🇱 | ✅ Initial launch |
| **Ecuador** 🇪🇨 | ✅ Initial launch |
| **Europe, Africa, Asia** | 🔜 Future expansion |

**Key Advantages for GSHOP**:

| Advantage | Detail |
|-----------|--------|
| **Colombia supported natively** | No workarounds needed — Colombia is a Day 1 market |
| **Stays in Stripe ecosystem** | GSHOP already uses Stripe — single vendor relationship |
| **Local transaction experience** | Merchant receives COP, card behaves like a local card |
| **USD-stable value storage** | Users hold USDC, protected from COP volatility |
| **Multi-country with one integration** | Same API works for CO, AR, MX, PE, CL, EC |
| **150M+ merchant locations** | Works anywhere Visa is accepted worldwide |
| **Programmatic card issuance** | Virtual + physical cards via API |

**Architecture with Bridge (Connect Model)**:

```
┌─────────────────────────────────────────────────────────────┐
│                      GSHOP Mobile App                       │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │ User Wallet    │  │ Visa Cards     │  │ Transactions │  │
│  │ (USDC balance) │  │ (Virtual/Phys) │  │ (History)    │  │
│  └────────┬───────┘  └────────┬───────┘  └──────┬───────┘  │
│           │                   │                  │          │
└───────────┼───────────────────┼──────────────────┼──────────┘
            │                   │                  │
            ▼                   ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│              GSHOP Backend (NestJS) — PLATFORM              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │             Virtual Cards Module (NEW)                 │ │
│  │  - ConnectService (onboard users as connected accts)   │ │
│  │  - FinancialAccountService (create USDC wallets)       │ │
│  │  - FundingService (USD → USDC via Outbound Payments)   │ │
│  │  - CardsService (Issuing v1 API — issue Visa cards)    │ │
│  │  - TransactionsService (Transactions v2 + webhooks)    │ │
│  │  - AuthorizationService (real-time approve/decline)    │ │
│  │  - CryptoTransferService (optional: USDC → ext wallet) │ │
│  └────────────────────────────────────────────────────────┘ │
│              │                                              │
│  Platform Financial Account (USD → USDC funding source)     │
│              │                                              │
└──────────────┼──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│          Stripe + Bridge APIs (mixed v1 + v2)               │
│                                                             │
│  v2 APIs (Money Management):                                │
│  - Financial Addresses v2 (bank wire/ACH funding)           │
│  - Financial Accounts v2 (USDC storage per user)            │
│  - Outbound Payments v2 (USD → USDC conversion + transfer)  │
│  - Outbound Transfers v2 (USDC → external crypto wallets)   │
│  - Transactions v2 (all money movement tracking)            │
│  - Received Debits v2 (card spend tracking)                 │
│                                                             │
│  v1 APIs (Card Issuing):                                    │
│  - Issuing Cardholders (create cardholder)                  │
│  - Issuing Cards (create virtual/physical Visa card)        │
│  - Issuing Authorizations (real-time approve/decline)       │
│                                                             │
│  Banking Partner: Lead Bank | Network: Visa                 │
│  Stablecoin: USDC on Base (L2)                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Visa Network                            │
│  - 150M+ merchant locations worldwide                        │
│  - USDC → local fiat conversion at point of sale             │
│  - Apple Pay / Google Pay support                            │
└─────────────────────────────────────────────────────────────┘
```

**Risks & Considerations**:

| Risk | Severity | Detail |
|------|----------|--------|
| **Private preview** | 🔴 High | More restrictive than early access — must be invited/approved by Stripe. Not GA. |
| **US platform only** | 🟡 Medium | Platform (GSHOP) must be US-based. Connected accounts can be in approved LATAM markets. GSHOP qualifies as US entity. |
| **Colombia not explicitly confirmed** | 🟡 Medium | Docs mention Mexico (MX) as example. Bridge/Visa announcement lists Colombia. Confirm with Stripe sales. |
| **Stablecoin regulation (CO)** | 🟡 Medium | Superfinanciera still defining crypto/stablecoin framework |
| **Bridge fees unknown** | 🟡 Medium | No fee structure in docs — must get from Stripe sales |
| **Physical cards ship from US** | 🟡 Medium | Express/priority only. Customs, delivery time, and cost for Colombian users. Virtual cards are instant. |
| **Card currency is USD** | 🟡 Medium | Card operates in USD, not COP. Bridge handles conversion at POS, but user balance is in USDC (pegged to USD). |
| **$10k max per authorization** | 🟢 Low | Unlikely to hit for typical consumer transactions |
| **Single vendor lock-in** | 🟡 Medium | Entire stack: Stripe + Bridge + Lead Bank + Visa |
| **KYC required** | 🟢 Low | Stripe + Bridge handle KYC for connected accounts |
| **Stablecoin depeg risk** | 🟢 Low | USDC is well-audited, but theoretical risk exists |
| **Mixed API versions** | 🟢 Low | Uses both v1 (Issuing) and v2 (Money Management) APIs — documented as interoperable |

**Estimated Implementation Plan**:

1. **Week 1-2**: Apply for Bridge early access, contact Stripe sales
2. **Week 3-4**: Get API credentials, review Bridge docs, legal review of stablecoin T&Cs
3. **Week 5-8**: Backend integration (BridgeCardsService, webhooks, wallet flow)
4. **Week 9-10**: Mobile UI (card display, deposit flow, transaction history)
5. **Week 11-12**: Testing, beta rollout

**Estimated Timeline**: 2-3 months
**Estimated Cost**: $20,000-$35,000 (less regulatory overhead than traditional Stripe Issuing)

---

### Option 1: Partner with Colombian Fintech

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

### Option 3: Crypto/Stablecoin Cards (Superseded by Option D)

**Providers**: Crypto.com, Binance Card (if expanding to LATAM)

**Concept**: Issue cards backed by stablecoins (USDC, USDT)

**Status**: ⚠️ Superseded — Bridge (Option D) achieves this within the Stripe ecosystem with better compliance, Visa partnership, and direct Colombia support. Third-party crypto card providers remain a fallback but add vendor complexity.

---

## 🎯 Recommendation

### For GSHOP Colombian Market: Use **Bridge (Stripe) + Visa Stablecoin Cards**

**Why Bridge is the best path**:
1. ✅ Colombia is a Day 1 supported market
2. ✅ Stays within Stripe ecosystem (GSHOP already uses Stripe)
3. ✅ Automatic stablecoin ↔ COP conversion — no user confusion
4. ✅ Merchant receives COP — card behaves like a local transaction
5. ✅ Single integration scales to 6 LATAM countries (CO, AR, MX, PE, CL, EC)
6. ✅ USD-stable value storage protects users from COP volatility
7. ✅ Estimated 2-3 months, ~$20k-$35k

**Important caveat**: Bridge is in **private preview** — GSHOP must apply and be approved. The card currency is USD (balance in USDC), with automatic conversion to local fiat at point of sale. This is not a COP-native card, but the UX is seamless for the user.

**Fallback**: If Bridge private preview access is not granted or timeline doesn't align, fall back to **Colombian Fintech Partner** (Option 1 — Rappipay, Ualá, Nequi).

### Recommended Action Plan

1. **Week 1-2**: Apply for Bridge private preview + parallel research
   - Contact Stripe sales for Bridge/Visa stablecoin card issuing program (private preview)
   - Simultaneously research Rappipay, Ualá APIs as fallback
   - Schedule demos with both Bridge and local providers

2. **Week 3-4**: Legal & Compliance
   - Review Bridge stablecoin T&Cs and Colombian regulatory implications
   - If Bridge approved: proceed with Bridge integration
   - If Bridge not available yet: pivot to Colombian fintech partner

3. **Week 5-8**: Implementation
   - Integrate Bridge API (or fallback provider)
   - Build wallet UI (deposit COP → card balance)
   - Implement webhook handlers for authorization events

4. **Week 9-10**: Mobile UI
   - Virtual card display screen
   - Transaction history
   - Top-up flow

5. **Week 11-12**: Testing & Launch
   - Beta test with 100 users
   - Monitor transactions and conversion rates
   - Full rollout

**Timeline**: 2-3 months

**Cost**: $20,000-$35,000 (Bridge) / $15,000-$30,000 (local fintech fallback)

**Success Metrics**:
- 30% user adoption (3,000 cards issued in Month 1)
- 5+ transactions per card per month
- <2% fraud rate
- User NPS >50

---

## 📚 Additional Resources

### Bridge (Stripe) + Visa Card Issuing
- **Bridge + Visa Announcement**: https://stripe.com/newsroom/news/bridge-partners-with-visa
- **Stablecoin-funded Issuing with Connect (Technical Docs)**: https://docs.stripe.com/issuing/stablecoins-connect
- **Stripe Issuing Global / Cross-Border**: https://docs.stripe.com/issuing/global
- **Stripe Stablecoin Financial Accounts**: https://docs.stripe.com/financial-accounts/stablecoins
- **Stripe Stablecoin Accounts (100+ countries)**: https://stripe.com/blog/introducing-stablecoin-payments-for-subscriptions

### Stripe Issuing Documentation (Traditional)
- Official Docs: https://docs.stripe.com/issuing
- API Reference: https://docs.stripe.com/api/issuing
- Country Availability: https://docs.stripe.com/issuing/global#local-issuing
- Real-time Authorizations (Webhooks): https://docs.stripe.com/issuing/controls/real-time-authorizations
- Webhooks for Issuing + Connect: https://docs.stripe.com/financial-accounts/connect/examples/webhooks

### Colombian Fintech Providers (Fallback)
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

### Primary Path: Bridge + Visa Stablecoin Cards (RECOMMENDED)

1. **Immediate** (This Week):
   - [ ] Apply for Bridge private preview via Stripe sales contact
   - [ ] Review technical docs: [stablecoins-connect](https://docs.stripe.com/issuing/stablecoins-connect)
   - [ ] Confirm Colombia is in the approved markets list for connected accounts
   - [ ] Begin legal review of stablecoin card issuance in Colombia
   - [ ] In parallel: research Rappipay/Ualá APIs as fallback

2. **Short-term** (Weeks 2-4):
   - [ ] Get Bridge API credentials and sandbox access (if approved)
   - [ ] Review v1 (Issuing) + v2 (Money Management) API interop
   - [ ] Test connected account onboarding + USDC financial account creation in sandbox
   - [ ] Clarify Bridge fee structure with Stripe sales
   - [ ] Legal opinion on stablecoin regulatory status in Colombia

3. **Medium-term** (Weeks 5-10):
   - [ ] Backend: ConnectService, FinancialAccountService, CardsService (v1+v2 APIs)
   - [ ] Implement funding flow: platform USD → connected account USDC → Visa card
   - [ ] Mobile: Virtual card UI, transaction history, top-up flow, Apple Pay/Google Pay
   - [ ] Integration testing with Bridge sandbox (supports both v1 and v2 APIs)

4. **Long-term** (Weeks 11-12):
   - [ ] Beta launch (100 users in Colombia)
   - [ ] Monitor transactions, conversion rates, user feedback
   - [ ] Full rollout

### Fallback Path: Colombian Fintech Partner

If Bridge private preview access is not granted or timeline doesn't align:

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

### Legacy Path: Traditional Stripe Issuing (NOT RECOMMENDED for Colombia)

Only relevant if GSHOP adds a US-only user segment:

1. **If needed**: Apply for Stripe Issuing (US cards for US users only)
2. **Do not** use traditional Stripe Issuing for Colombian users

---

## 📊 Decision Matrix

| Criteria | Bridge + Visa | Stripe Issuing (Traditional) | Colombian Partner | Wallet-Only |
|----------|---------------|------------------------------|-------------------|-------------|
| **Market Fit** | ✅ Excellent (CO Day 1) | ❌ Poor (no CO) | ✅ Excellent | 🟡 Good |
| **Regulatory** | 🟡 Medium (stablecoin) | ❌ Complex (cross-border) | ✅ Simple | ✅ Simple |
| **Cost** | 🟡 ~$20k-$35k (TBD) | ❌ High ($50k+) | ✅ Low ($15k-$30k) | ✅ Very Low ($5k) |
| **Timeline** | ✅ 2-3 months | ❌ 4-5 months | ✅ 2-3 months | ✅ 1 month |
| **User Experience** | ✅ Seamless (auto COP) | ❌ Confusing (USD) | ✅ Native (COP) | 🟡 Limited |
| **Utility** | ✅ Spend anywhere (Visa) | ✅ Spend anywhere | ✅ Spend anywhere | ❌ GSHOP only |
| **LATAM Scalability** | ✅ 6 countries, 1 API | ❌ Not available | ❌ Per-country partner | ❌ N/A |
| **Stripe Ecosystem** | ✅ Same vendor | ✅ Same vendor | ❌ New vendor | ✅ N/A |
| **Maintenance** | 🟡 Medium | ❌ High | 🟡 Medium | ✅ Low |
| **Availability** | 🟡 Private preview | ✅ GA (US/EU) | ✅ GA | ✅ GA |

**Winner**: **Bridge + Visa Stablecoin Cards** 🏆

**Fallback**: Colombian Fintech Partner (if Bridge early access unavailable)

---

**Questions?** Let me know if you want to explore the Bridge API integration or need help with implementation!
