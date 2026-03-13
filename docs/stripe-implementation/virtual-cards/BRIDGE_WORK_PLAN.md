# Bridge + Visa Stablecoin Cards - Work Plan

> Last updated: March 2026
> Estimated timeline: 6-8 weeks
> Depends on: Bridge/Stripe account approval, sandbox access

---

## Current State

### What's Already Built (feature/issuing-cards branch)

- Backend: Full Stripe Issuing module (controllers, services, entities, DTOs, webhooks)
- Mobile: 4 screens (cardholder setup, cards list, card detail, fund card)
- Admin: Dashboard with stats, cardholders/cards/transactions tables
- Database: Migration with issuing tables, Cardholder entity has `stripeConnectedAccountId` and `stripeFinancialAccountId` fields ready
- Tested: All endpoints working with Stripe Issuing traditional (US addresses)

### What Needs to Change for Bridge

- User onboarding flow (connected accounts + financial accounts)
- Card creation (add `financial_account_v2` parameter)
- Funding flow (USD → USDC via outbound payments instead of internal wallet transfer)
- KYC flow (DOB, terms acceptance with IP/timestamp)
- Stripe API version upgrade to `2026-02-25.preview` for v2 endpoints
- Mobile screens updated for new onboarding flow

---

## Phase 0: Account Setup & Access (Week 1)

**Goal:** Get sandbox credentials and confirm Colombia support.

| # | Task | Owner | Status |
|---|------|-------|--------|
| 0.1 | Create account at [bridge.xyz](https://www.bridge.xyz) | Rhonalf | [ ] |
| 0.2 | Enable Stripe Connect on live Stripe account | Rhonalf | [ ] |
| 0.3 | Contact Stripe sales to confirm Bridge card issuing access for Colombia | Rhonalf | [ ] |
| 0.4 | Get Bridge sandbox/test API credentials | Rhonalf | [ ] |
| 0.5 | Get Stripe sandbox with v2 API support (not legacy test mode) | Rhonalf | [ ] |
| 0.6 | Review Bridge API docs at [apidocs.bridge.xyz](https://apidocs.bridge.xyz) | Rhonalf | [ ] |
| 0.7 | Confirm fee structure with Stripe/Bridge sales | Rhonalf | [ ] |

**Blocker:** Cannot proceed to Phase 1 without sandbox credentials.

**Decision point:** Choose integration path:
- **Path A: Stripe Connect + Issuing (v1+v2)** — more complex, full Stripe ecosystem
- **Path B: Bridge Direct API** — faster (~4 weeks), may have different features

---

## Phase 1: Backend - Connected Accounts & Financial Accounts (Week 2-3)

**Goal:** Onboard users as connected accounts with USDC wallets.

| # | Task | Effort | Status |
|---|------|--------|--------|
| 1.1 | Create `BridgeConnectService` — onboard user as Stripe connected account (v2 API) | 8h | [ ] |
| 1.2 | Create `FinancialAccountService` — create USDC financial accounts per user | 6h | [ ] |
| 1.3 | Update `Cardholder` entity — add fields for DOB, terms acceptance IP/date | 2h | [ ] |
| 1.4 | Create migration for new cardholder fields | 1h | [ ] |
| 1.5 | Update `CardholdersService` — add full KYC data (DOB, terms acceptance) to Stripe cardholder creation | 4h | [ ] |
| 1.6 | Update `CreateCardholderDto` — add DOB, terms acceptance fields | 1h | [ ] |
| 1.7 | Create `BridgeOnboardingController` — endpoints for connected account creation + status check | 4h | [ ] |
| 1.8 | Handle KYC webhooks — `account.updated` events for verification status | 4h | [ ] |
| 1.9 | Update `StripeIssuingService` — support API version `2026-02-25.preview` for v2 calls | 2h | [ ] |
| 1.10 | Write integration tests with Stripe sandbox | 4h | [ ] |

**Deliverable:** Users can be onboarded as connected accounts with USDC financial accounts.

---

## Phase 2: Backend - Funding & Card Issuance (Week 3-4)

**Goal:** Fund user USDC wallets and issue cards linked to them.

| # | Task | Effort | Status |
|---|------|--------|--------|
| 2.1 | Create `PlatformFundingService` — manage platform financial account, create bank funding address | 6h | [ ] |
| 2.2 | Update `FundingService` — implement USD → USDC transfers via outbound payments (v2 API) | 8h | [ ] |
| 2.3 | Update `CardsService.createCard()` — pass `financial_account_v2` parameter | 2h | [ ] |
| 2.4 | Update card creation to set cardholder terms acceptance (IP + timestamp) | 2h | [ ] |
| 2.5 | Create `CryptoTransferService` (optional) — USDC transfers to external wallets | 6h | [ ] |
| 2.6 | Update `FundCardDto` — support USDC amounts and crypto wallet addresses | 2h | [ ] |
| 2.7 | Add transaction tracking via v2 Transactions API + Received Debits API | 4h | [ ] |
| 2.8 | Update webhook controller — handle v2 money management events | 4h | [ ] |
| 2.9 | Write integration tests for funding flow | 4h | [ ] |

**Deliverable:** Full flow working: platform funds → user USDC wallet → Visa card → spend.

---

## Phase 3: Mobile - Updated Screens (Week 4-5)

**Goal:** Update mobile UI for new onboarding and funding flow.

| # | Task | Effort | Status |
|---|------|--------|--------|
| 3.1 | Update `CardholderSetupScreen` — add DOB field, terms acceptance checkbox with IP capture | 4h | [ ] |
| 3.2 | Create `KYCStatusScreen` — show verification progress, handle pending/rejected states | 6h | [ ] |
| 3.3 | Update `CardsListScreen` — show USDC balance from financial account | 2h | [ ] |
| 3.4 | Update `CardDetailScreen` — show USDC balance, add COP equivalent display | 4h | [ ] |
| 3.5 | Update `FundCardScreen` — fund from platform (USD → USDC), show exchange rate | 6h | [ ] |
| 3.6 | Create `CryptoWithdrawScreen` (optional) — send USDC to external wallet | 6h | [ ] |
| 3.7 | Add Apple Pay / Google Pay provisioning button (if using push provisioning) | 8h | [ ] |
| 3.8 | Update i18n translations (es.json) for new screens/fields | 2h | [ ] |
| 3.9 | Update navigation flow — KYC status gates card creation | 2h | [ ] |

**Deliverable:** Mobile app supports full Bridge onboarding and card management.

---

## Phase 4: Admin Panel Updates (Week 5-6)

**Goal:** Admin can monitor Bridge-specific data.

| # | Task | Effort | Status |
|---|------|--------|--------|
| 4.1 | Update cardholder table — show connected account ID, KYC status | 2h | [ ] |
| 4.2 | Update cards table — show financial account ID, USDC balance | 2h | [ ] |
| 4.3 | Add USDC balance column to admin stats | 2h | [ ] |
| 4.4 | Add platform funding status dashboard (platform FA balance) | 4h | [ ] |
| 4.5 | Update i18n translations | 1h | [ ] |

**Deliverable:** Admin panel shows Bridge-specific data and platform funding status.

---

## Phase 5: Testing & QA (Week 6-7)

**Goal:** Validate everything works end-to-end in sandbox.

| # | Task | Effort | Status |
|---|------|--------|--------|
| 5.1 | End-to-end test: register → KYC → create card → fund → simulate purchase | 4h | [ ] |
| 5.2 | Test with Colombian user data (CO address, CO phone, CO identity) | 2h | [ ] |
| 5.3 | Test webhook handling for all event types | 4h | [ ] |
| 5.4 | Test error scenarios: KYC rejected, insufficient funds, card declined | 4h | [ ] |
| 5.5 | Test crypto wallet transfer flow (if implemented) | 2h | [ ] |
| 5.6 | Security review: no sensitive data leaks, proper auth on all endpoints | 4h | [ ] |
| 5.7 | Simulate refunds and disputes | 2h | [ ] |
| 5.8 | Load testing on webhook endpoints | 2h | [ ] |

**Deliverable:** All flows tested and validated in sandbox environment.

---

## Phase 6: Launch Prep & Beta (Week 7-8)

**Goal:** Go live with a small group of beta users.

| # | Task | Effort | Status |
|---|------|--------|--------|
| 6.1 | Switch from sandbox to live API keys | 1h | [ ] |
| 6.2 | Configure production webhook endpoints | 1h | [ ] |
| 6.3 | Set up monitoring/alerting for card transactions and webhook failures | 4h | [ ] |
| 6.4 | Create user-facing documentation (how to get your virtual card) | 4h | [ ] |
| 6.5 | Beta rollout: 50-100 users in Colombia | - | [ ] |
| 6.6 | Monitor: transaction success rate, KYC pass rate, funding flow | - | [ ] |
| 6.7 | Collect user feedback, iterate | - | [ ] |
| 6.8 | Full rollout | - | [ ] |

**Deliverable:** Live stablecoin Visa cards for Colombian users.

---

## Effort Summary

| Phase | Estimated Hours |
|-------|----------------|
| Phase 0: Account Setup | ~8h (mostly waiting) |
| Phase 1: Connected Accounts | ~36h |
| Phase 2: Funding & Cards | ~38h |
| Phase 3: Mobile Screens | ~40h |
| Phase 4: Admin Panel | ~11h |
| Phase 5: Testing | ~24h |
| Phase 6: Launch | ~10h |
| **Total** | **~167h** |

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Bridge approval delayed | Medium | High | Start with traditional Issuing (already working for US). Apply early. |
| Colombia not in approved markets | Low | Critical | Confirm with Stripe sales before starting Phase 1. Bridge/Visa announcement explicitly lists Colombia. |
| v2 API breaking changes (preview) | Medium | Medium | Pin API version. Monitor Stripe changelog. |
| KYC rejection rate too high for CO users | Medium | Medium | Test with real Colombian data in sandbox. Work with Stripe on requirements. |
| Platform funding logistics (ACH to Stripe) | Low | Medium | Set up bank transfers early in Phase 0. |
| Fee structure makes it unprofitable | Low | High | Get fee details in Phase 0 before building. |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-11 | Traditional Stripe Issuing tested and working | Validates backend architecture, good foundation for Bridge upgrade |
| 2026-03-11 | Bridge no longer in private preview (live in 18 countries) | Removes biggest blocker from original plan |
| TBD | Choose Path A vs Path B | Depends on sales conversation and API access |

---

## References

- [BRIDGE_INTEGRATION_STEPS.md](./BRIDGE_INTEGRATION_STEPS.md) — Technical integration steps
- [STRIPE_ISSUING_PLAN.md](./STRIPE_ISSUING_PLAN.md) — Original analysis and plan
- [Stripe: Stablecoin-backed card issuing](https://docs.stripe.com/issuing/stablecoins-connect)
- [Bridge: Cards product](https://www.bridge.xyz/product/cards)
- [Bridge: API docs](https://apidocs.bridge.xyz/docs/getting-started)
