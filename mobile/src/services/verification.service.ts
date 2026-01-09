import { apiClient } from './api';

// Types for verification system
export type DocumentType = 'CC' | 'CE' | 'PA' | 'TI' | 'NIT';
export type VerificationLevel = 'none' | 'level_1' | 'level_2';
export type VerificationStatus =
  | 'not_started'
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'needs_update';

export interface VerificationResponse {
  id: string;
  userId: string;
  level: VerificationLevel;
  verificationStatus: VerificationStatus;
  fullLegalName?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  selfieUrl?: string;
  selfieVerified: boolean;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  sourceOfFunds?: string;
  occupation?: string;
  monthlyIncome?: string;
  rejectionReason?: string;
  verifiedAt?: string;
  level1SubmittedAt?: string;
  level1ApprovedAt?: string;
  level2SubmittedAt?: string;
  level2ApprovedAt?: string;
  reviewAttempts: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitLevel1Request {
  fullLegalName: string;
  documentType: DocumentType;
  documentNumber: string;
  documentFrontUrl: string;
  documentBackUrl?: string;
  selfieUrl: string;
  dateOfBirth?: string;
}

export interface SubmitLevel2Request {
  address: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
  sourceOfFunds: string;
  occupation?: string;
  monthlyIncome?: string;
}

export interface UploadDocumentResponse {
  url: string;
  provider: string;
}

export interface SubmitVerificationResponse {
  success: boolean;
  message: string;
  verification: VerificationResponse;
}

// Document type labels
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  CC: 'Cedula de Ciudadania',
  CE: 'Cedula de Extranjeria',
  PA: 'Pasaporte',
  TI: 'Tarjeta de Identidad',
  NIT: 'NIT (Empresas)',
};

// Source of funds options
export const SOURCE_OF_FUNDS_OPTIONS = [
  { value: 'salary', label: 'Salario/Sueldo' },
  { value: 'business', label: 'Negocio propio' },
  { value: 'investments', label: 'Inversiones' },
  { value: 'savings', label: 'Ahorros' },
  { value: 'inheritance', label: 'Herencia' },
  { value: 'retirement', label: 'Pension/Jubilacion' },
  { value: 'other', label: 'Otro' },
];

// Monthly income ranges
export const MONTHLY_INCOME_OPTIONS = [
  { value: '0-1smmlv', label: 'Menos de 1 SMMLV' },
  { value: '1-2smmlv', label: '1-2 SMMLV' },
  { value: '2-4smmlv', label: '2-4 SMMLV' },
  { value: '4-8smmlv', label: '4-8 SMMLV' },
  { value: '8-15smmlv', label: '8-15 SMMLV' },
  { value: '15+smmlv', label: 'Mas de 15 SMMLV' },
];

class VerificationService {
  // Get current user's verification status
  async getMyVerification(): Promise<VerificationResponse | null> {
    try {
      const response = await apiClient.get<VerificationResponse>(
        '/verifications/user/me'
      );

      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error: any) {
      // 404 means no verification record exists yet
      if (error.statusCode === 404) {
        return null;
      }
      console.error('VerificationService: Get verification failed', error);
      throw new Error(error.message || 'No se pudo obtener el estado de verificacion');
    }
  }

  // Upload a document image (front, back, or selfie)
  async uploadDocument(imageUri: string): Promise<string> {
    try {
      const formData = new FormData();

      // Extract filename from URI
      const filename = imageUri.split('/').pop() || 'document.jpg';
      const fileType = filename.split('.').pop()?.toLowerCase() || 'jpg';

      // Map file extension to mime type
      const mimeTypeMap: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
      };

      const mimeType = mimeTypeMap[fileType] || 'image/jpeg';

      // Append file to FormData
      formData.append('document', {
        uri: imageUri,
        type: mimeType,
        name: filename,
      } as any);

      const response = await apiClient.uploadFile<UploadDocumentResponse>(
        '/verifications/upload-document',
        formData
      );

      if (response.success && response.data) {
        return response.data.url;
      }
      throw new Error('Failed to upload document');
    } catch (error: any) {
      console.error('VerificationService: Upload document failed', error);
      throw new Error(error.message || 'No se pudo subir el documento');
    }
  }

  // Submit Level 1 verification (basic identity)
  async submitLevel1(data: SubmitLevel1Request): Promise<SubmitVerificationResponse> {
    try {
      const response = await apiClient.post<SubmitVerificationResponse>(
        '/verifications/submit/level1',
        data
      );

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to submit Level 1 verification');
    } catch (error: any) {
      console.error('VerificationService: Submit Level 1 failed', error);
      throw new Error(error.message || 'No se pudo enviar la verificacion');
    }
  }

  // Submit Level 2 verification (extended)
  async submitLevel2(data: SubmitLevel2Request): Promise<SubmitVerificationResponse> {
    try {
      const response = await apiClient.post<SubmitVerificationResponse>(
        '/verifications/submit/level2',
        data
      );

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to submit Level 2 verification');
    } catch (error: any) {
      console.error('VerificationService: Submit Level 2 failed', error);
      throw new Error(error.message || 'No se pudo enviar la verificacion');
    }
  }

  // Update verification after rejection
  async updateVerification(
    data: Partial<SubmitLevel1Request & SubmitLevel2Request>
  ): Promise<SubmitVerificationResponse> {
    try {
      const response = await apiClient.put<SubmitVerificationResponse>(
        '/verifications/update',
        data
      );

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to update verification');
    } catch (error: any) {
      console.error('VerificationService: Update verification failed', error);
      throw new Error(error.message || 'No se pudo actualizar la verificacion');
    }
  }

  // Get verification level display name
  getLevelDisplayName(level: VerificationLevel): string {
    switch (level) {
      case 'none':
        return 'Sin verificar';
      case 'level_1':
        return 'Nivel 1';
      case 'level_2':
        return 'Nivel 2 (Maximo)';
      default:
        return 'Desconocido';
    }
  }

  // Get verification status display info
  getStatusDisplayInfo(status: VerificationStatus): {
    label: string;
    color: string;
    icon: string;
  } {
    switch (status) {
      case 'not_started':
        return { label: 'No iniciada', color: '#6B7280', icon: 'help-circle-outline' };
      case 'pending':
        return { label: 'En revision', color: '#F59E0B', icon: 'time-outline' };
      case 'under_review':
        return { label: 'En revision', color: '#F59E0B', icon: 'time-outline' };
      case 'approved':
        return { label: 'Aprobada', color: '#10B981', icon: 'checkmark-circle' };
      case 'rejected':
        return { label: 'Rechazada', color: '#EF4444', icon: 'close-circle' };
      case 'needs_update':
        return { label: 'Requiere cambios', color: '#F97316', icon: 'alert-circle' };
      default:
        return { label: 'Desconocido', color: '#6B7280', icon: 'help-circle-outline' };
    }
  }

  // Check if user can submit Level 1
  canSubmitLevel1(verification: VerificationResponse | null): boolean {
    if (!verification) return true;
    if (verification.level !== 'none') return false;
    return (
      verification.verificationStatus !== 'pending' &&
      verification.verificationStatus !== 'under_review'
    );
  }

  // Check if user can submit Level 2
  canSubmitLevel2(verification: VerificationResponse | null): boolean {
    if (!verification) return false;
    if (verification.level !== 'level_1') return false;
    return (
      verification.verificationStatus !== 'pending' &&
      verification.verificationStatus !== 'under_review'
    );
  }

  // Check if user can update their verification
  canUpdateVerification(verification: VerificationResponse | null): boolean {
    if (!verification) return false;
    return (
      verification.verificationStatus === 'rejected' ||
      verification.verificationStatus === 'needs_update'
    );
  }

  // Get limits for each verification level
  getLevelLimits(level: VerificationLevel): {
    dailyLimit: string;
    monthlyLimit: string;
    maxPerTransaction: string;
  } {
    switch (level) {
      case 'none':
        return {
          dailyLimit: '$1.200.000',
          monthlyLimit: '$4.000.000',
          maxPerTransaction: '$1.000.000',
        };
      case 'level_1':
        return {
          dailyLimit: '$8.000.000',
          monthlyLimit: '$40.000.000',
          maxPerTransaction: '$5.000.000',
        };
      case 'level_2':
        return {
          dailyLimit: '$40.000.000',
          monthlyLimit: '$200.000.000',
          maxPerTransaction: '$20.000.000',
        };
      default:
        return {
          dailyLimit: '$0',
          monthlyLimit: '$0',
          maxPerTransaction: '$0',
        };
    }
  }
}

export const verificationService = new VerificationService();
