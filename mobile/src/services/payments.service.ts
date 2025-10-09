import { apiClient, ApiResponse } from './api';
import { API_CONFIG, buildEndpointUrl } from '../config/api.config';

// Payment types
export interface PaymentMethod {
  id: string;
  type: 'card' | 'mercadopago' | 'crypto' | 'gshop_tokens';
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
  paymentId: string;
  status: PaymentStatus;
  redirectUrl?: string;
  transactionId?: string;
  receipt?: PaymentReceipt;
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
  type: 'reward' | 'purchase' | 'transfer' | 'topup' | 'withdrawal';
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

class PaymentsService {
  // Get user payment methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await apiClient.get<any[]>(
        API_CONFIG.ENDPOINTS.PAYMENTS.METHODS
      );

      if (response.success && response.data) {
        // Transform backend response to match frontend interface
        return response.data.map(method => this.transformPaymentMethod(method));
      } else {
        throw new Error(response.message || 'Failed to get payment methods');
      }
    } catch (error: any) {
      console.error('PaymentsService: Get payment methods failed', error);
      throw new Error(error.message || 'Failed to load payment methods');
    }
  }

  // Transform backend payment method to frontend format
  private transformPaymentMethod(backendMethod: any): PaymentMethod {
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
  }

  // Map backend payment types to frontend enum
  private mapPaymentTypeToFrontend(type: string): PaymentMethod['type'] {
    const typeMap: Record<string, PaymentMethod['type']> = {
      stripe_card: 'card',
      mercadopago: 'mercadopago',
      usdc_polygon: 'crypto',
      stripe_bank: 'card',
    };

    return typeMap[type] || 'card';
  }

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
    } catch (error: any) {
      console.error('PaymentsService: Create payment failed', error);
      throw new Error(error.message || 'Payment creation failed');
    }
  }

  // Process Stripe payment
  async processStripePayment(
    paymentId: string,
    cardData: StripePaymentRequest
  ): Promise<PaymentResponse> {
    try {
      const url = buildEndpointUrl(API_CONFIG.ENDPOINTS.PAYMENTS.PROCESS_STRIPE, { id: paymentId });

      const response = await apiClient.post<PaymentResponse>(url, cardData);

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Stripe payment failed');
      }
    } catch (error: any) {
      console.error('PaymentsService: Stripe payment failed', error);
      throw new Error(error.message || 'Card payment failed');
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
      console.error('PaymentsService: MercadoPago payment failed', error);
      throw new Error(error.message || 'MercadoPago payment failed');
    }
  }

  // Get wallet balance
  async getWalletBalance(): Promise<WalletBalance> {
    try {
      const response = await apiClient.get<WalletBalance>('/tokens/wallet');

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get wallet balance');
      }
    } catch (error: any) {
      console.error('PaymentsService: Get wallet balance failed', error);
      throw new Error(error.message || 'Failed to load wallet balance');
    }
  }

  // Top up wallet
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
    } catch (error: any) {
      console.error('PaymentsService: Wallet topup failed', error);
      throw new Error(error.message || 'Failed to top up wallet');
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
    } catch (error: any) {
      console.error('PaymentsService: Add payment method failed', error);
      throw new Error(error.message || 'Failed to save payment method');
    }
  }

  // Map frontend payment types to backend enum values
  private mapPaymentTypeToBackend(type: PaymentMethod['type']): string {
    const typeMap: Record<PaymentMethod['type'], string> = {
      card: 'stripe_card',
      mercadopago: 'mercadopago',
      crypto: 'usdc_polygon',
      gshop_tokens: 'stripe_card', // Use stripe_card for token topups
    };

    return typeMap[type] || 'stripe_card';
  }

  // Remove payment method
  async removePaymentMethod(methodId: string): Promise<boolean> {
    try {
      const response = await apiClient.delete<{ success: boolean }>(`/payments/methods/${methodId}`);

      if (response.success && response.data) {
        return response.data.success;
      } else {
        throw new Error(response.message || 'Failed to remove payment method');
      }
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
      console.error('PaymentsService: Get receipt failed', error);
      throw new Error(error.message || 'Failed to load payment receipt');
    }
  }

  // Helper methods
  getPaymentMethodIcon(type: PaymentMethod['type']): string {
    const icons = {
      card: 'card-outline',
      mercadopago: 'wallet-outline',
      crypto: 'logo-bitcoin',
      gshop_tokens: 'diamond-outline',
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

  formatPrice(price: number, currency: string = 'COP'): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
    }).format(price);
  }

  formatTokenAmount(amount: number): string {
    return `${amount.toFixed(2)} GSHOP`;
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

// Export types
export type {
  PaymentMethod,
  PaymentRequest,
  PaymentResponse,
  PaymentReceipt,
  StripePaymentRequest,
  CryptoPaymentRequest,
  TokenPaymentRequest,
  WalletBalance,
  TokenTransaction,
  TopupRequest,
};