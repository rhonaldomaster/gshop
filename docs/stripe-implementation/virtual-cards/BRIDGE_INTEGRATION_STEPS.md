# Bridge + Visa Stablecoin Card Issuing - Integration Steps

> Last updated: March 2026
> Status: Bridge is **live in 18 countries** including Colombia. No longer in private preview for basic card issuing.

## Overview

Bridge (a Stripe company) provides stablecoin infrastructure via API. Combined with Stripe Connect and Issuing, it enables GSHOP to issue Visa cards to Colombian users backed by USDC stablecoins.

**Two integration paths exist:**

| Path | Description | When to use |
|------|-------------|-------------|
| **Stripe Connect + Issuing (v1+v2 APIs)** | Full Stripe ecosystem integration. Users become connected accounts with USDC financial accounts and Visa cards. | If you want everything within Stripe. Requires US-based platform. |
| **Bridge Direct API** | Use Bridge's own API for wallets, cards, and stablecoin operations. | If you want faster deployment (~4 weeks) or non-custodial wallet support. |

This document covers **both paths**.

---

## Prerequisites

### Account Requirements

- [ ] Active Stripe account (live mode, not just test)
- [ ] Stripe Connect platform enabled
- [ ] US-based business entity (GSHOP qualifies)
- [ ] Bridge developer account at [bridge.xyz](https://www.bridge.xyz)

### Environment Variables (add to `backend/.env`)

```env
# Bridge API (if using Bridge Direct)
BRIDGE_API_KEY=your_bridge_api_key
BRIDGE_API_URL=https://api.bridge.xyz
BRIDGE_WEBHOOK_SECRET=your_bridge_webhook_secret

# Stripe v2 APIs (if using Stripe Connect path)
# Uses the same STRIPE_SECRET_KEY but requires API version 2026-02-25.preview
STRIPE_API_VERSION=2026-02-25.preview
```

---

## Path A: Stripe Connect + Issuing (v1 + v2 APIs)

This is the path described in the existing plan. Uses Stripe's native APIs.

### Step 1: Create Connected Account for User

Each GSHOP user becomes a Stripe connected account.

```
POST /v2/core/accounts
```

**Required capabilities:**

| Capability | Purpose |
|-----------|---------|
| `storer.holds_currencies.usdc` | Store USDC in financial account |
| `storer.outbound_transfer.crypto_wallet` | Transfer USDC to external wallets (optional) |
| `card_creator.commercial.lead.prepaid_card` | Issue Visa prepaid cards |

**Parameters:**
- `contact_email`: User's email
- `display_name`: User's name
- `identity.country`: User's country (e.g., `CO`)
- `identity.entity_type`: `individual`
- `configuration`: Capability requests
- `dashboard`: `none` (embedded finance)
- `defaults.currency`: `usdc`

**KYC:** Stripe + Bridge handle identity verification. Monitor status via webhooks or by retrieving account configuration.

### Step 2: Create Financial Account (USDC Wallet)

```
POST /v2/money_management/financial_accounts
```

**Parameters:**
- `type`: `storage`
- `storage.holds_currencies`: `["usdc"]`

This creates a custodial USDC wallet for the user. Bridge acts as custodian.

### Step 3: Fund Platform Account

Before funding users, the platform (GSHOP) needs USD in its own financial account.

```
GET /v2/money_management/financial_accounts
```

Get the platform's financial account ID, then create a bank funding address:

```
POST /v2/money_management/financial_addresses
```

**Parameters:**
- `type`: `us_bank_account`
- `financial_account`: Platform's FA ID

Retrieve account + routing numbers to receive ACH/wire transfers:

```
GET /v2/money_management/financial_addresses/{id}?include[0]=credentials.us_bank_account.account_number
```

### Step 4: Transfer USD to User (auto-converts to USDC)

```
POST /v2/money_management/outbound_payments
```

**Parameters:**
```json
{
  "from": {
    "financial_account": "<platform_fa_id>",
    "currency": "usd"
  },
  "to": {
    "recipient": "<connected_account_id>",
    "payout_method": "<connected_account_fa_id>",
    "currency": "usdc"
  },
  "amount": {
    "value": 500,
    "currency": "usd"
  }
}
```

USD is automatically converted to USDC during the transfer.

### Step 5: Create Cardholder

Uses standard Stripe Issuing v1 API:

```
POST /v1/issuing/cardholders
```

**Required fields for individuals:**
- `name`: Full name (mandatory for sanctions screening)
- `email`: User's email
- `phone_number`: User's phone
- `billing.address`: Full billing address
- `individual.first_name`, `individual.last_name`
- `individual.dob`: Date of birth
- `individual.card_issuing.user_terms_acceptance.date`: Unix timestamp
- `individual.card_issuing.user_terms_acceptance.ip`: User's IP address
- `type`: `individual`

### Step 6: Issue Visa Card

```
POST /v1/issuing/cards
```

**Parameters:**
- `cardholder`: Cardholder ID from step 5
- `financial_account_v2`: User's financial account ID from step 2
- `currency`: `usd`
- `status`: `active`
- `type`: `virtual` or `physical`

**Card specifications:**
- Product: Business Prepaid Debit
- Network: Visa
- Sponsor Bank: Lead Bank
- Funding: USDC on Base (L2)
- Max per authorization: $10,000 USD
- Digital wallets: Apple Pay, Google Pay supported

### Step 7: Monitor Transactions

```
GET /v2/money_management/transactions/{id}
GET /v2/money_management/received_debits/{id}
```

Card spending creates received debits. Track via webhooks or polling.

### Step 8: (Optional) External Crypto Wallet Transfers

Allow users to send USDC to external wallets:

```
POST /v2/money_management/outbound_setup_intents
```

**Supported networks:** Arbitrum, Avalanche C-Chain, Base, Ethereum, Optimism, Polygon, Solana, Stellar, Tempo

Then execute:

```
POST /v2/money_management/outbound_transfers
```

---

## Path B: Bridge Direct API

Faster deployment path using Bridge's own API. ~4 weeks to launch.

### Step 1: Create Customer (KYC)

Bridge handles KYC/KYB for each user. Create a customer through Bridge's Customers API.

### Step 2: Create Wallet

Bridge offers two wallet models:

1. **Bridge Wallets (custodial)**: Out-of-the-box, hold USDC or custom stablecoins
2. **Bring Your Own Wallet (non-custodial)**: Users spend from self-custodied wallets (MetaMask, Phantom, etc.) via smart contracts

### Step 3: Issue Card

Single API call to issue virtual or physical Visa cards. Push provisioning to Apple Pay / Google Pay supported.

### Step 4: Fund Card

Cards spend directly from the stablecoin wallet balance. No separate top-up needed with non-custodial wallets.

### Step 5: Monitor & Earn

- Dashboard for activation funnels, issuance, balances, transactions
- Earn interchange on every transaction
- Earn rewards on stablecoin reserves
- Programmable transaction fees

> **Note:** Bridge Direct API docs are at [apidocs.bridge.xyz](https://apidocs.bridge.xyz). Contact support@bridge.xyz for API credentials and sandbox access.

---

## Webhook Events to Handle

### Stripe Connect + Issuing webhooks:

| Event | Description |
|-------|-------------|
| `account.updated` | Connected account KYC status changed |
| `issuing_authorization.request` | Real-time spend approval (must respond quickly) |
| `issuing_authorization.created` | Authorization recorded |
| `issuing_transaction.created` | Transaction settled |
| `issuing_transaction.updated` | Transaction updated (refund, etc.) |
| `issuing_card.created` | Card created |
| `issuing_card.updated` | Card status changed |
| `issuing_cardholder.updated` | Cardholder status changed |

### Bridge webhooks:

Configured via Bridge dashboard. Events for card transactions, wallet balance changes, KYC status updates.

---

## Testing

### Stripe Sandbox

- Use Stripe **Sandbox** (not legacy test mode) for v2 API testing
- Legacy test mode does NOT support v2 APIs
- Sandbox supports both v1 (Issuing) and v2 (Money Management) APIs
- Use Stripe's Issuing testing guide to simulate purchases, refunds, disputes

### Bridge Sandbox

- Bridge provides sandbox environment with test API keys
- Contact support@bridge.xyz for sandbox access

---

## Supported Countries (as of March 2026)

### Currently Live (18 countries)

**Latin America (initial launch):**
- Colombia, Argentina, Mexico, Peru, Chile, Ecuador

**Expanding to 100+ countries by end of 2026:**
- Europe, Asia-Pacific, Africa, Middle East

### Supported Stablecoins

| Stablecoin | Networks |
|-----------|----------|
| **USDC** (Circle) | Arbitrum, Avalanche, Base, Ethereum, Optimism, Polygon, Solana, Stellar |
| **USDB** (Bridge) | Bridge-native |
| **USD1** (US only) | ACH, Wire |
| **EUR1** (US only) | SEPA |
| Custom stablecoins | Via Open Issuance platform |

---

## Backend Changes Needed (GSHOP)

### New/Modified Services

1. **BridgeConnectService** - Onboard users as connected accounts (v2 API)
2. **FinancialAccountService** - Create and manage USDC financial accounts
3. **BridgeFundingService** - Platform → user USDC transfers via outbound payments
4. **Update CardholdersService** - Add KYC fields (DOB, terms acceptance IP/date)
5. **Update CardsService** - Pass `financial_account_v2` when creating cards
6. **CryptoTransferService** (optional) - USDC to external wallet transfers

### New Entity Fields

The `Cardholder` entity already has placeholder fields:
- `stripeConnectedAccountId` - Store connected account ID
- `stripeFinancialAccountId` - Store USDC financial account ID

### New Environment Variables

```env
STRIPE_API_VERSION=2026-02-25.preview
BRIDGE_INTEGRATION_ENABLED=false
```

---

## Key Differences from Current Implementation

| Aspect | Current (Traditional Issuing) | Bridge Integration |
|--------|-------------------------------|-------------------|
| **Country support** | US/UK/EU only | Colombia + 17 more countries |
| **Card funding** | Wallet balance (internal) | USDC financial account |
| **Currency** | USD | USD (backed by USDC, auto-converts to local fiat at POS) |
| **KYC** | Manual (billing address only) | Stripe + Bridge handle full KYC |
| **API version** | v1 only | v1 (Issuing) + v2 (Money Management) |
| **Cardholder creation** | Basic fields | Requires DOB, terms acceptance with IP |
| **Card creation** | Standard | Requires `financial_account_v2` parameter |
| **User onboarding** | Create cardholder only | Create connected account → financial account → cardholder → card |

---

## References

- [Stripe: Stablecoin-backed card issuing with Connect](https://docs.stripe.com/issuing/stablecoins-connect)
- [Stripe: Stablecoins in Financial Accounts](https://docs.stripe.com/financial-accounts/stablecoins)
- [Bridge: Stablecoin Cards](https://www.bridge.xyz/product/cards)
- [Bridge: API Documentation](https://apidocs.bridge.xyz/docs/getting-started)
- [Bridge + Visa Announcement](https://stripe.com/newsroom/news/bridge-partners-with-visa)
- [Visa Expansion to 100+ Countries](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.22206.html)
