import { apiClient } from './api';
import { API_CONFIG, buildEndpointUrl } from '../config/api.config';

// Payment types
export interface PaymentMethod {
  id: string;
  type: 'card' | 'mercadopago' | 'crypto' | 'gshop_tokens' | 'wallet';
  provider: string;
  details: {
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    holderName?: string;
    walletAddress?: string;
    tokenBalance?: number;
  };
  isDefault: boolean;
  createdAt: string;
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethodId?: string;
  guestPayment?: boolean;
  savePaymentMethod?: boolean;
}

export interface PaymentResponse {
  success: boolean;
  id?: string;
  paymentId: string;
  status: PaymentStatus;
  redirectUrl?: string;
  paymentUrl?: string;
  transactionId?: string;
  receipt?: PaymentReceipt;
  paymentMetadata?: {
    mercadopago_init_point?: string;
    mercadopago_preference_id?: string;
    [key: string]: any;
  };
}

export interface PaymentReceipt {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  method: string;
  provider: string;
  transactionId: string;
  status: PaymentStatus;
  createdAt: string;
  pdfUrl?: string;
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export interface StripePaymentRequest {
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  cvc: string;
  holderName: string;
  saveCard?: boolean;
}

export interface CryptoPaymentRequest {
  walletAddress: string;
  amount: number;
  currency: 'USDC';
  gasPrice?: number;
}

export interface TokenPaymentRequest {
  tokenAmount: number;
  usePartialTokens?: boolean;
  supplementaryPaymentMethodId?: string;
}

export interface WalletBalance {
  tokenBalance: number;
  usdValue: number;
  pendingRewards: number;
  transactions: TokenTransaction[];
}

export interface TokenTransaction {
  id: string;
  type: 'reward' | 'purchase' | 'transfer' | 'topup' | 'withdrawal' | 'transfer_out' | 'transfer_in' | 'platform_fee';
  amount: number;
  description: string;
  createdAt: string;
  status: 'pending' | 'completed' | 'failed';
  orderId?: string;
}

export interface TopupRequest {
  amount: number;
  paymentMethodId: string;
  currency?: string;
}

export interface StripeTopupIntentResponse {
  topupId: string;
  clientSecret: string;
  publishableKey: string;
  amountCOP: number;
  amountUSD: number;
  exchangeRate: number;
  expiresAt: string;
}

export interface TopupStatusResponse {
  topupId: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  stripePaymentIntentId?: string;
  processedAt?: string;
  createdAt: string;
}

class PaymentsService {
  // Get user payment methods
  getPaymentMethods = async (): Promise<PaymentMethod[]> => {
    try {
      const response = await apiClient.get<any[]>(
        API_CONFIG.ENDPOINTS.PAYMENTS.METHODS
      );

      if (response.success && response.data) {
        // Transform backend response to match frontend interface
        if (!Array.isArray(response.data)) {
          console.warn('PaymentsService: Response data is not an array', response.data);
          return [];
        }
        return response.data.map((method) => this.transformPaymentMethod(method));
      } else {
        throw new Error(response.message || 'Failed to get payment methods');
      }
    } catch (error) {
      console.error('PaymentsService: Get payment methods failed', error);
      throw new Error(error.message || 'Failed to load payment methods');
    }
  };

  // Transform backend payment method to frontend format
  private transformPaymentMethod = (backendMethod: any): PaymentMethod => {
    return {
      id: backendMethod.id,
      type: this.mapPaymentTypeToFrontend(backendMethod.type),
      provider: backendMethod.displayName || backendMethod.type,
      details: {
        last4: backendMethod.lastFourDigits,
        brand: backendMethod.brand,
        expiryMonth: backendMethod.expiryMonth,
        expiryYear: backendMethod.expiryYear,
        holderName: backendMethod.holderName,
        walletAddress: backendMethod.polygonAddress,
      },
      isDefault: backendMethod.isDefault,
      createdAt: backendMethod.createdAt,
    };
  };

  // Map backend payment types to frontend enum
  private mapPaymentTypeToFrontend = (type: string): PaymentMethod['type'] => {
    const typeMap: Record<string, PaymentMethod['type']> = {
      stripe_card: 'card',
      mercadopago: 'mercadopago',
      usdc_polygon: 'crypto',
      stripe_bank: 'card',
    };

    return typeMap[type] || 'card';
  };

  // Create new payment
  async createPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await apiClient.post<PaymentResponse>(
        API_CONFIG.ENDPOINTS.PAYMENTS.CREATE,
        paymentData
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create payment');
      }
    } catch (error) {
      console.error('PaymentsService: Create payment failed', error);
      throw new Error(error.message || 'Payment creation failed');
    }
  }

  // Process Stripe payment (returns client_secret for SDK)
  async processStripePayment(
    paymentId: string
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    try {
      const url = buildEndpointUrl(API_CONFIG.ENDPOINTS.PAYMENTS.PROCESS_STRIPE, { id: paymentId });

      const response = await apiClient.post<any>(url, {});

      if (response.success && response.data) {
        // Backend returns { clientSecret, paymentIntentId }
        return {
          clientSecret: response.data.clientSecret || response.data.client_secret,
          paymentIntentId: response.data.paymentIntentId || response.data.payment_intent_id,
        };
      } else {
        throw new Error(response.message || 'Stripe payment failed');
      }
    } catch (error) {
      console.error('PaymentsService: Stripe payment failed', error);
      throw new Error(error.message || 'Card payment failed');
    }
  }

  // Create Stripe Checkout Session for WebView payment
  async createStripeCheckoutSession(
    paymentId: string
  ): Promise<{ sessionUrl: string; sessionId: string }> {
    try {
      const response = await apiClient.post<{ sessionUrl: string; sessionId: string }>(
        `/payments-v2/${paymentId}/stripe-checkout`,
        {}
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create Stripe checkout session');
      }
    } catch (error) {
      console.error('PaymentsService: Create Stripe checkout session failed', error);
      throw new Error(error.message || 'Failed to load Stripe checkout');
    }
  }

  // Get available payment providers (Stripe, MercadoPago)
  async getAvailableProviders(): Promise<any> {
    try {
      const response = await apiClient.get<any>('/payments-v2/config/providers');

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get payment providers');
      }
    } catch (error) {
      console.error('PaymentsService: Get providers failed', error);
      // Return default providers on error
      return {
        providers: [
          { id: 'stripe', name: 'Credit/Debit Card', icon: '💳', enabled: true },
          { id: 'mercadopago', name: 'MercadoPago', icon: '💵', enabled: true },
        ],
      };
    }
  }

  // Process crypto payment
  async processCryptoPayment(
    paymentId: string,
    cryptoData: CryptoPaymentRequest
  ): Promise<PaymentResponse> {
    try {
      const url = buildEndpointUrl(API_CONFIG.ENDPOINTS.PAYMENTS.PROCESS_CRYPTO, { id: paymentId });

      const response = await apiClient.post<PaymentResponse>(url, cryptoData);

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Crypto payment failed');
      }
    } catch (error) {
      console.error('PaymentsService: Crypto payment failed', error);
      throw new Error(error.message || 'Cryptocurrency payment failed');
    }
  }

  // Process token payment
  async processTokenPayment(
    paymentId: string,
    tokenData: TokenPaymentRequest
  ): Promise<PaymentResponse> {
    try {
      const response = await apiClient.post<PaymentResponse>(
        `/payments/${paymentId}/process/tokens`,
        tokenData
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Token payment failed');
      }
    } catch (error) {
      console.error('PaymentsService: Token payment failed', error);
      throw new Error(error.message || 'GSHOP token payment failed');
    }
  }

  // Process MercadoPago payment
  async processMercadoPagoPayment(
    paymentId: string,
    mercadoPagoData: any
  ): Promise<PaymentResponse> {
    try {
      const response = await apiClient.post<PaymentResponse>(
        `/payments/${paymentId}/process/mercadopago`,
        mercadoPagoData
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'MercadoPago payment failed');
      }
    } catch (error) {
      console.error('PaymentsService: MercadoPago payment failed', error);
      throw new Error(error.message || 'MercadoPago payment failed');
    }
  }

  // Get wallet balance
  async getWalletBalance(): Promise<WalletBalance> {
    try {
      // Fetch wallet and transactions in parallel
      const [walletResponse, transactionsResponse] = await Promise.all([
        apiClient.get<any>('/tokens/wallet'),
        apiClient.get<any>('/tokens/wallet/transactions?limit=10'),
      ]);

      if (walletResponse.success && walletResponse.data) {
        const walletData = walletResponse.data;
        const transactions = transactionsResponse.success && transactionsResponse.data
          ? transactionsResponse.data
          : [];

        // Map API response to WalletBalance interface
        return {
          tokenBalance: parseFloat(walletData.balance) || 0,
          usdValue: parseFloat(walletData.balance) || 0, // Same value for now since it's COP
          pendingRewards: parseFloat(walletData.lockedBalance) || 0,
          transactions: transactions.map((tx: any) => ({
            id: tx.id,
            type: tx.type,
            amount: parseFloat(tx.amount) || 0,
            description: tx.description || tx.type,
            createdAt: tx.createdAt,
            status: tx.status,
            orderId: tx.orderId,
          })),
        };
      } else {
        throw new Error(walletResponse.message || 'Failed to get wallet balance');
      }
    } catch (error) {
      console.error('PaymentsService: Get wallet balance failed', error);
      throw new Error(error.message || 'Failed to load wallet balance');
    }
  }

  // Top up wallet (legacy method)
  async topupWallet(topupData: TopupRequest): Promise<{ success: boolean; transactionId: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; transactionId: string }>(
        '/tokens/topup',
        topupData
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Wallet topup failed');
      }
    } catch (error) {
      console.error('PaymentsService: Wallet topup failed', error);
      throw new Error(error.message || 'Failed to top up wallet');
    }
  }

  /**
   * Create Stripe Payment Intent for wallet topup
   * Returns clientSecret for Stripe SDK to confirm payment
   * @param amountCOP Amount in Colombian Pesos (COP)
   */
  async createStripeTopupIntent(amountCOP: number): Promise<StripeTopupIntentResponse> {
    try {
      const response = await apiClient.post<StripeTopupIntentResponse>(
        '/tokens/topup/stripe-intent',
        { amount: amountCOP }
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create topup intent');
      }
    } catch (error) {
      console.error('PaymentsService: Create Stripe topup intent failed', error);
      throw new Error(error.message || 'Failed to initialize payment');
    }
  }

  /**
   * Get topup status by ID
   * Use this to check if payment was confirmed after Stripe SDK completes
   */
  async getTopupStatus(topupId: string): Promise<TopupStatusResponse> {
    try {
      const response = await apiClient.get<TopupStatusResponse>(
        `/tokens/topup/${topupId}/status`
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get topup status');
      }
    } catch (error) {
      console.error('PaymentsService: Get topup status failed', error);
      throw new Error(error.message || 'Failed to check payment status');
    }
  }

  /**
   * Poll topup status until completed or timeout
   * Useful after Stripe SDK confirms payment - webhooks may take a moment
   */
  async pollTopupStatus(
    topupId: string,
    maxAttempts = 10,
    intervalMs = 2000
  ): Promise<TopupStatusResponse> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.getTopupStatus(topupId);

      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }

      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    // Return last status even if still pending
    return this.getTopupStatus(topupId);
  }

  /**
   * Check if user can pay an order with wallet balance
   * Returns balance info and whether payment is possible
   */
  async checkCanPayWithWallet(paymentId: string): Promise<{
    canPay: boolean;
    paymentAmount: number;
    currentBalance: number;
    shortfall: number;
    currency: string;
    error?: string;
  }> {
    try {
      const response = await apiClient.get<{
        canPay: boolean;
        paymentAmount: number;
        currentBalance: number;
        shortfall: number;
        currency: string;
        error?: string;
      }>(`/payments-v2/${paymentId}/can-pay-with-wallet`);

      if (response.success && response.data) {
        return response.data;
      } else {
        return {
          canPay: false,
          paymentAmount: 0,
          currentBalance: 0,
          shortfall: 0,
          currency: 'COP',
          error: response.message || 'Failed to check wallet eligibility'
        };
      }
    } catch (error: any) {
      console.error('PaymentsService: Check wallet eligibility failed', error);
      return {
        canPay: false,
        paymentAmount: 0,
        currentBalance: 0,
        shortfall: 0,
        currency: 'COP',
        error: error?.message || 'Failed to check wallet balance'
      };
    }
  }

  /**
   * Process payment using wallet balance
   * Debits the user's wallet and marks order as paid
   */
  async processWalletPayment(paymentId: string): Promise<{
    success: boolean;
    paymentId?: string;
    orderId?: string;
    amount?: number;
    walletTransactionId?: string;
    newWalletBalance?: number;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        paymentId: string;
        orderId: string;
        amount: number;
        walletTransactionId: string;
        newWalletBalance: number;
        message: string;
      }>(`/payments-v2/${paymentId}/process/wallet`, {});

      if (response.success && response.data) {
        return response.data;
      } else {
        return {
          success: false,
          error: response.message || 'Wallet payment failed'
        };
      }
    } catch (error: any) {
      console.error('PaymentsService: Wallet payment failed', error);
      return {
        success: false,
        error: error?.message || 'Failed to process wallet payment'
      };
    }
  }

  // Add payment method
  async addPaymentMethod(methodData: {
    type: PaymentMethod['type'];
    details: PaymentMethod['details'];
    setAsDefault?: boolean;
  }): Promise<PaymentMethod> {
    try {
      // Map frontend types to backend types
      const backendType = this.mapPaymentTypeToBackend(methodData.type);

      const response = await apiClient.post<any>(
        '/payments/methods',
        {
          ...methodData,
          type: backendType,
        }
      );

      if (response.success && response.data) {
        // Transform backend response to match frontend interface
        return this.transformPaymentMethod(response.data);
      } else {
        throw new Error(response.message || 'Failed to add payment method');
      }
    } catch (error) {
      console.error('PaymentsService: Add payment method failed', error);
      throw new Error(error.message || 'Failed to save payment method');
    }
  }

  // Map frontend payment types to backend enum values
  private mapPaymentTypeToBackend = (type: PaymentMethod['type']): string => {
    const typeMap: Record<PaymentMethod['type'], string> = {
      card: 'stripe_card',
      mercadopago: 'mercadopago',
      crypto: 'usdc_polygon',
      gshop_tokens: 'stripe_card', // Use stripe_card for token topups
      wallet: 'wallet_balance', // GSHOP Wallet balance
    };

    return typeMap[type] || 'stripe_card';
  };

  // Remove payment method
  async removePaymentMethod(methodId: string): Promise<boolean> {
    try {
      const response = await apiClient.delete<{ success: boolean }>(`/payments/methods/${methodId}`);

      if (response.success && response.data) {
        return response.data.success;
      } else {
        throw new Error(response.message || 'Failed to remove payment method');
      }
    } catch (error) {
      console.error('PaymentsService: Remove payment method failed', error);
      throw new Error(error.message || 'Failed to remove payment method');
    }
  }

  // Set default payment method
  async setDefaultPaymentMethod(methodId: string): Promise<boolean> {
    try {
      const response = await apiClient.put<{ success: boolean }>(
        `/payments/methods/${methodId}/default`,
        {}
      );

      if (response.success && response.data) {
        return response.data.success;
      } else {
        throw new Error(response.message || 'Failed to set default payment method');
      }
    } catch (error) {
      console.error('PaymentsService: Set default payment method failed', error);
      throw new Error(error.message || 'Failed to update default payment method');
    }
  }

  // Get payment receipt
  async getPaymentReceipt(paymentId: string): Promise<PaymentReceipt> {
    try {
      const response = await apiClient.get<PaymentReceipt>(`/payments/${paymentId}/receipt`);

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Receipt not found');
      }
    } catch (error) {
      console.error('PaymentsService: Get receipt failed', error);
      throw new Error(error.message || 'Failed to load payment receipt');
    }
  }

  // Helper methods
  getPaymentMethodIcon(type: PaymentMethod['type']): string {
    const icons: Record<PaymentMethod['type'], string> = {
      card: 'card-outline',
      mercadopago: 'wallet-outline',
      crypto: 'logo-bitcoin',
      gshop_tokens: 'diamond-outline',
      wallet: 'wallet',
    };

    return icons[type] || 'payment-outline';
  }

  getPaymentStatusColor(status: PaymentStatus): string {
    const colors = {
      [PaymentStatus.PENDING]: '#FFA500',
      [PaymentStatus.PROCESSING]: '#00BFFF',
      [PaymentStatus.COMPLETED]: '#008000',
      [PaymentStatus.FAILED]: '#DC143C',
      [PaymentStatus.CANCELLED]: '#808080',
      [PaymentStatus.REFUNDED]: '#B22222',
    };

    return colors[status] || '#808080';
  }

  getPaymentStatusText(status: PaymentStatus): string {
    const texts = {
      [PaymentStatus.PENDING]: 'Pendiente',
      [PaymentStatus.PROCESSING]: 'Procesando',
      [PaymentStatus.COMPLETED]: 'Completado',
      [PaymentStatus.FAILED]: 'Falló',
      [PaymentStatus.CANCELLED]: 'Cancelado',
      [PaymentStatus.REFUNDED]: 'Reembolsado',
    };

    return texts[status] || status;
  }

  formatPrice(price: number | string, currency: string = 'COP'): string {
    // Convert string to number if needed (TypeORM decimal fields are serialized as strings)
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

    // Return NaN-safe formatting
    if (isNaN(numericPrice)) {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency,
      }).format(0);
    }

    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
    }).format(numericPrice);
  }

  formatTokenAmount(amount: number | string): string {
    // Convert string to number if needed
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    // Return NaN-safe formatting
    if (isNaN(numericAmount)) {
      return `0.00 GSHOP`;
    }

    return `${numericAmount.toFixed(2)} GSHOP`;
  }

  // Validate card number using Luhn algorithm
  validateCardNumber(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/\D/g, '');

    if (cleaned.length < 13 || cleaned.length > 19) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  // Get card brand from number
  getCardBrand(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\D/g, '');

    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6(?:011|5)/.test(cleaned)) return 'discover';

    return 'unknown';
  }

  // Format card number with spaces
  formatCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\D/g, '');
    const matches = cleaned.match(/.{1,4}/g);
    return matches ? matches.join(' ') : cleaned;
  }

  // Validate expiry date
  validateExpiryDate(month: number, year: number): boolean {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (month < 1 || month > 12) return false;
    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;

    return true;
  }

  // Validate CVC
  validateCVC(cvc: string, cardBrand: string): boolean {
    const cleaned = cvc.replace(/\D/g, '');

    if (cardBrand === 'amex') {
      return cleaned.length === 4;
    } else {
      return cleaned.length === 3;
    }
  }
}

// Create singleton instance
export const paymentsService = new PaymentsService();