import { apiClient } from './api-client';

export interface Affiliate {
  id: string;
  email: string;
  name: string;
  username: string;
  phone?: string;
  documentType?: 'CC' | 'CE' | 'NIT' | 'PASSPORT';
  documentNumber?: string;
  website?: string;
  socialMedia?: string;
  affiliateCode: string;
  bio?: string;
  categories?: string[];
  avatarUrl?: string;
  coverImageUrl?: string;
  location?: string;
  followersCount: number;
  followingCount: number;
  totalViews: number;
  totalSales: number;
  productsPromoted: number;
  videosCount: number;
  liveStreamsCount: number;
  isVerified: boolean;
  isProfilePublic: boolean;
  commissionRate: number;
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  isActive: boolean;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PendingAffiliatesResponse {
  affiliates: Affiliate[];
  total: number;
  page: number;
  limit: number;
}

export interface ApproveAffiliateRequest {
  commissionRate?: number;
}

export interface RejectAffiliateRequest {
  reason?: string;
}

class AffiliatesService {
  /**
   * Get all pending affiliate applications
   */
  async getPendingAffiliates(page: number = 1, limit: number = 20): Promise<PendingAffiliatesResponse> {
    const response = await apiClient.get<any>(`/admin/creators?status=pending&page=${page}&limit=${limit}`);
    return {
      affiliates: response.creators || [],
      total: response.pagination?.total || 0,
      page: response.pagination?.page || page,
      limit: response.pagination?.limit || limit,
    };
  }

  /**
   * Get all affiliates (with optional status filter)
   */
  async getAffiliates(status?: string, page: number = 1, limit: number = 20): Promise<PendingAffiliatesResponse> {
    const statusQuery = status ? `&status=${status}` : '';
    const response = await apiClient.get<any>(`/admin/creators?page=${page}&limit=${limit}${statusQuery}`);
    return {
      affiliates: response.creators || [],
      total: response.pagination?.total || 0,
      page: response.pagination?.page || page,
      limit: response.pagination?.limit || limit,
    };
  }

  /**
   * Get affiliate by ID
   */
  async getAffiliateById(id: string): Promise<Affiliate> {
    return apiClient.get<Affiliate>(`/admin/creators/${id}`);
  }

  /**
   * Approve affiliate application
   */
  async approveAffiliate(id: string, data?: ApproveAffiliateRequest): Promise<Affiliate> {
    return apiClient.put<Affiliate>(`/admin/creators/${id}/approve`, data || {});
  }

  /**
   * Reject affiliate application
   */
  async rejectAffiliate(id: string, data?: RejectAffiliateRequest): Promise<Affiliate> {
    return apiClient.put<Affiliate>(`/admin/creators/${id}/reject`, data || {});
  }

  /**
   * Suspend affiliate account
   */
  async suspendAffiliate(id: string, reason?: string): Promise<Affiliate> {
    return apiClient.put<Affiliate>(`/admin/creators/${id}/suspend`, { reason });
  }

  /**
   * Reactivate suspended affiliate
   */
  async reactivateAffiliate(id: string): Promise<Affiliate> {
    return apiClient.put<Affiliate>(`/admin/creators/${id}/reactivate`, {});
  }

  /**
   * Update affiliate commission rate
   */
  async updateCommissionRate(id: string, commissionRate: number): Promise<Affiliate> {
    return apiClient.put<Affiliate>(`/admin/creators/${id}/commission`, { commissionRate });
  }

  /**
   * Get affiliate statistics
   */
  async getAffiliateStats(id: string): Promise<any> {
    return apiClient.get(`/affiliates/stats/${id}`);
  }

  /**
   * Get count of pending affiliates
   */
  async getPendingCount(): Promise<number> {
    const response = await this.getPendingAffiliates(1, 1);
    return response.total;
  }
}

export const affiliatesService = new AffiliatesService();
