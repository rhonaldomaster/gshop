import { apiClient } from './api';

// Types for transfer system
export interface TransferLimits {
  level: 'NONE' | 'LEVEL_1' | 'LEVEL_2';
  dailyRemaining: number;
  monthlyRemaining: number;
  maxPerTransaction: number;
  minPerTransaction: number;
  dailyLimit: number;
  monthlyLimit: number;
  dailyTransferred: number;
  monthlyTransferred: number;
}

export interface SearchUserResult {
  userId: string;
  firstName: string;
  lastName: string;
  maskedEmail: string;
  avatar?: string;
}

export interface TransferPreviewRequest {
  toUserId: string;
  amount: number;
}

export interface TransferPreviewResponse {
  amountSent: number;
  amountReceived: number;
  platformFee: number;
  recipientNetAmount: number;
  feePercentage: string;
  recipientName: string;
}

export interface TransferExecuteRequest {
  toUserId: string;
  amount: number;
  note?: string;
}

export interface TransferTransaction {
  id: string;
  type: 'TRANSFER_OUT' | 'TRANSFER_IN' | 'PLATFORM_FEE';
  amount: number;
  userId: string;
  description: string;
  createdAt: string;
}

export interface TransferExecuteResponse {
  success: boolean;
  transferId: string;
  transactions: TransferTransaction[];
  summary: {
    amountSent: number;
    feeCharged: number;
    recipientNetBalance: number;
  };
  timestamp: string;
}

class TransferService {
  // Search for user by email or phone
  async searchUser(query: string): Promise<SearchUserResult | null> {
    try {
      const response = await apiClient.get<SearchUserResult>(
        `/tokens/search-user?query=${encodeURIComponent(query)}`
      );

      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error: any) {
      console.error('TransferService: Search user failed', error);
      throw new Error(error.message || 'No se encontro el usuario');
    }
  }

  // Get current user transfer limits
  async getTransferLimits(): Promise<TransferLimits> {
    try {
      const response = await apiClient.get<any>('/tokens/transfer-limits');

      if (response.success && response.data) {
        const data = response.data;
        // Map API response to expected interface
        return {
          level: data.level,
          dailyRemaining: data.usage?.dailyRemaining ?? 0,
          monthlyRemaining: data.usage?.monthlyRemaining ?? 0,
          maxPerTransaction: data.limits?.maxPerTransaction ?? 0,
          minPerTransaction: data.limits?.minPerTransaction ?? 0,
          dailyLimit: data.limits?.dailyLimit ?? 0,
          monthlyLimit: data.limits?.monthlyLimit ?? 0,
          dailyTransferred: data.usage?.dailyTransferred ?? 0,
          monthlyTransferred: data.usage?.monthlyTransferred ?? 0,
        };
      }
      throw new Error('Failed to get transfer limits');
    } catch (error: any) {
      console.error('TransferService: Get limits failed', error);
      throw new Error(error.message || 'No se pudieron obtener los limites');
    }
  }

  // Get transfer preview with fee breakdown
  async getTransferPreview(data: TransferPreviewRequest): Promise<TransferPreviewResponse> {
    try {
      const response = await apiClient.post<TransferPreviewResponse>(
        '/tokens/transfer/preview',
        data
      );

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to get transfer preview');
    } catch (error: any) {
      console.error('TransferService: Get preview failed', error);
      throw new Error(error.message || 'No se pudo obtener el preview de la transferencia');
    }
  }

  // Execute the transfer
  async executeTransfer(data: TransferExecuteRequest): Promise<TransferExecuteResponse> {
    try {
      const response = await apiClient.post<TransferExecuteResponse>(
        '/tokens/transfer/execute',
        data
      );

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to execute transfer');
    } catch (error: any) {
      console.error('TransferService: Execute transfer failed', error);
      throw new Error(error.message || 'No se pudo completar la transferencia');
    }
  }

  // Format currency for display (COP)
  formatCOP(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Parse amount string to number
  parseAmount(amountStr: string): number {
    // Remove currency symbols, spaces, and thousands separators
    const cleaned = amountStr.replace(/[^\d]/g, '');
    return parseInt(cleaned, 10) || 0;
  }

  // Format amount as string for input display
  formatAmountInput(amount: number): string {
    if (amount === 0) return '';
    return new Intl.NumberFormat('es-CO').format(amount);
  }

  // Validate amount against limits
  validateAmount(
    amount: number,
    limits: TransferLimits,
    balance: number
  ): { valid: boolean; error?: string } {
    if (amount < limits.minPerTransaction) {
      return {
        valid: false,
        error: `El monto minimo es ${this.formatCOP(limits.minPerTransaction)}`,
      };
    }

    if (amount > limits.maxPerTransaction) {
      return {
        valid: false,
        error: `El monto maximo por transaccion es ${this.formatCOP(limits.maxPerTransaction)}`,
      };
    }

    if (amount > limits.dailyRemaining) {
      return {
        valid: false,
        error: `Excede tu limite diario. Disponible: ${this.formatCOP(limits.dailyRemaining)}`,
      };
    }

    if (amount > limits.monthlyRemaining) {
      return {
        valid: false,
        error: `Excede tu limite mensual. Disponible: ${this.formatCOP(limits.monthlyRemaining)}`,
      };
    }

    if (amount > balance) {
      return {
        valid: false,
        error: 'Saldo insuficiente',
      };
    }

    return { valid: true };
  }

  // Get level display name
  getLevelDisplayName(level: TransferLimits['level']): string {
    switch (level) {
      case 'NONE':
        return 'Sin verificar';
      case 'LEVEL_1':
        return 'Verificado Nivel 1';
      case 'LEVEL_2':
        return 'Verificado Nivel 2';
      default:
        return 'Desconocido';
    }
  }
}

export const transferService = new TransferService();
