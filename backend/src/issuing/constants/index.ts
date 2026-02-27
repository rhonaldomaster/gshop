// Default spending limits for new cards
export const DEFAULT_SPENDING_LIMIT_CENTS = 0; // Cards start with $0 - must be funded
export const MAX_SPENDING_LIMIT_CENTS = 1_000_000; // $10,000 max per authorization

// Stripe Issuing card defaults
export const DEFAULT_CARD_CURRENCY = 'usd';
export const DEFAULT_CARD_BRAND = 'visa';

// Rate limiting for sensitive endpoints
export const SENSITIVE_ENDPOINT_TTL = 60_000; // 1 minute
export const SENSITIVE_ENDPOINT_LIMIT = 3; // 3 requests per minute

// Minimum funding amounts (in USD)
export const MIN_FUND_AMOUNT_USD = 0.5;
export const MAX_FUND_AMOUNT_USD = 10_000;
