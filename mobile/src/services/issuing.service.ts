import { apiClient } from './api';

// --- Cardholder types ---

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export type CardholderStatus = 'pending' | 'active' | 'inactive' | 'rejected';

export interface Cardholder {
  id: string;
  userId: string;
  stripeCardholderId: string;
  status: CardholderStatus;
  phoneNumber?: string;
  billingAddress: BillingAddress;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCardholderRequest {
  name: string;
  phoneNumber?: string;
  billingAddress: BillingAddress;
}

// --- Card types ---

export type CardStatus = 'active' | 'inactive' | 'canceled' | 'pending';
export type CardType = 'virtual' | 'physical';

export interface SpendingLimit {
  amount: number;
  interval: string;
  categories?: string[];
}

export interface SpendingControls {
  spendingLimits?: SpendingLimit[];
  allowedCategories?: string[];
  blockedCategories?: string[];
}

export interface VirtualCard {
  id: string;
  userId: string;
  cardholderId: string;
  stripeCardId: string;
  status: CardStatus;
  type: CardType;
  last4: string;
  expMonth: string;
  expYear: string;
  brand: string;
  currency: string;
  spendingControls: SpendingControls | null;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CardSensitiveDetails {
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
}

export interface CreateCardRequest {
  type?: CardType;
  spendingControls?: {
    spendingLimits?: Array<{
      amount: number;
      interval: string;
    }>;
  };
}

export interface UpdateCardRequest {
  status?: 'active' | 'inactive';
  spendingControls?: {
    spendingLimits?: Array<{
      amount: number;
      interval: string;
    }>;
  };
}

export interface FundCardRequest {
  amountUSD: number;
}

// --- Transaction types ---

export type CardTransactionStatus = 'pending' | 'approved' | 'declined' | 'reversed' | 'settled';
export type CardTransactionType = 'authorization' | 'capture' | 'refund' | 'funding' | 'withdrawal';

export interface CardTransaction {
  id: string;
  cardId: string;
  userId: string;
  type: CardTransactionType;
  status: CardTransactionStatus;
  amountCents: number;
  currency: string;
  merchantName?: string;
  merchantCategory?: string;
  merchantCity?: string;
  merchantCountry?: string;
  declineReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CardTransactionQuery {
  type?: CardTransactionType;
  status?: CardTransactionStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedTransactions {
  data: CardTransaction[];
  total: number;
  page: number;
  limit: number;
}

class IssuingService {
  // --- Cardholder methods ---

  async createCardholder(data: CreateCardholderRequest): Promise<Cardholder> {
    try {
      const response = await apiClient.post<Cardholder>('/issuing/cardholders', data);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to create cardholder');
    } catch (error: any) {
      console.error('IssuingService: Create cardholder failed', error);
      throw new Error(error.message || 'Failed to create cardholder profile');
    }
  }

  async getMyCardholder(): Promise<Cardholder | null> {
    try {
      const response = await apiClient.get<Cardholder>('/issuing/cardholders/me');
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error: any) {
      // 404 means no cardholder exists yet
      if (error.statusCode === 404) {
        return null;
      }
      console.error('IssuingService: Get cardholder failed', error);
      throw new Error(error.message || 'Failed to get cardholder profile');
    }
  }

  // --- Card methods ---

  async createCard(data?: CreateCardRequest): Promise<VirtualCard> {
    try {
      const response = await apiClient.post<VirtualCard>('/issuing/cards', data || {});
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to create card');
    } catch (error: any) {
      console.error('IssuingService: Create card failed', error);
      throw new Error(error.message || 'Failed to create virtual card');
    }
  }

  async getMyCards(): Promise<VirtualCard[]> {
    try {
      const response = await apiClient.get<VirtualCard[]>('/issuing/cards');
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error: any) {
      console.error('IssuingService: Get cards failed', error);
      throw new Error(error.message || 'Failed to get cards');
    }
  }

  async getCard(cardId: string): Promise<VirtualCard> {
    try {
      const response = await apiClient.get<VirtualCard>(`/issuing/cards/${cardId}`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Card not found');
    } catch (error: any) {
      console.error('IssuingService: Get card failed', error);
      throw new Error(error.message || 'Failed to get card details');
    }
  }

  async getCardSensitive(cardId: string): Promise<CardSensitiveDetails> {
    try {
      const response = await apiClient.get<CardSensitiveDetails>(`/issuing/cards/${cardId}/sensitive`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to get sensitive details');
    } catch (error: any) {
      console.error('IssuingService: Get card sensitive failed', error);
      throw new Error(error.message || 'Failed to get card details');
    }
  }

  async updateCard(cardId: string, data: UpdateCardRequest): Promise<VirtualCard> {
    try {
      const response = await apiClient.put<VirtualCard>(`/issuing/cards/${cardId}`, data);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to update card');
    } catch (error: any) {
      console.error('IssuingService: Update card failed', error);
      throw new Error(error.message || 'Failed to update card');
    }
  }

  async cancelCard(cardId: string): Promise<VirtualCard> {
    try {
      const response = await apiClient.delete<VirtualCard>(`/issuing/cards/${cardId}`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to cancel card');
    } catch (error: any) {
      console.error('IssuingService: Cancel card failed', error);
      throw new Error(error.message || 'Failed to cancel card');
    }
  }

  // --- Funding methods ---

  async fundCard(cardId: string, amountUSD: number): Promise<any> {
    try {
      const response = await apiClient.post<any>(`/issuing/cards/${cardId}/fund`, { amountUSD });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to fund card');
    } catch (error: any) {
      console.error('IssuingService: Fund card failed', error);
      throw new Error(error.message || 'Failed to fund card');
    }
  }

  async withdrawFromCard(cardId: string, amountUSD: number): Promise<any> {
    try {
      const response = await apiClient.post<any>(`/issuing/cards/${cardId}/withdraw`, { amountUSD });
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to withdraw from card');
    } catch (error: any) {
      console.error('IssuingService: Withdraw from card failed', error);
      throw new Error(error.message || 'Failed to withdraw from card');
    }
  }

  // --- Transaction methods ---

  async getCardTransactions(cardId: string, query?: CardTransactionQuery): Promise<PaginatedTransactions> {
    try {
      const params: Record<string, string> = {};
      if (query?.type) params.type = query.type;
      if (query?.status) params.status = query.status;
      if (query?.startDate) params.startDate = query.startDate;
      if (query?.endDate) params.endDate = query.endDate;
      if (query?.page) params.page = String(query.page);
      if (query?.limit) params.limit = String(query.limit);

      const response = await apiClient.get<PaginatedTransactions>(
        `/issuing/cards/${cardId}/transactions`,
        { params },
      );
      if (response.success && response.data) {
        return response.data;
      }
      return { data: [], total: 0, page: 1, limit: 20 };
    } catch (error: any) {
      console.error('IssuingService: Get transactions failed', error);
      throw new Error(error.message || 'Failed to get transactions');
    }
  }

  // --- Utility methods ---

  formatUSD(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  formatCentsToUSD(amountCents: number): string {
    return this.formatUSD(amountCents / 100);
  }

  getStatusColor(status: CardStatus): string {
    switch (status) {
      case 'active':
        return '#22c55e';
      case 'inactive':
        return '#f59e0b';
      case 'canceled':
        return '#ef4444';
      case 'pending':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  }

  getTransactionTypeLabel(type: CardTransactionType): string {
    switch (type) {
      case 'authorization':
        return 'Compra';
      case 'capture':
        return 'Cobro';
      case 'refund':
        return 'Reembolso';
      case 'funding':
        return 'Fondeo';
      case 'withdrawal':
        return 'Retiro';
      default:
        return type;
    }
  }
}

export const issuingService = new IssuingService();
