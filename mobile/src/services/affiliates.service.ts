import { api } from './api';

export interface AffiliateLink {
  id: string;
  affiliateId: string;
  productId?: string;
  sellerId?: string;
  originalUrl: string;
  shortCode: string;
  fullUrl: string;
  clicks: number;
  conversions: number;
  revenue: number;
  isActive: boolean;
  createdAt: Date;
}

export interface AffiliateStats {
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  conversionRate: number;
  topLinks: AffiliateLink[];
  monthlyData: {
    month: string;
    clicks: number;
    conversions: number;
    revenue: number;
  }[];
}

export interface CreatorProfile {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  profileImage?: string;
  followersCount: number;
  followingCount: number;
  totalViews: number;
  isVerified: boolean;
  commissionRate: number;
}

export interface DashboardStats {
  profile: {
    followersCount: number;
    totalViews: number;
    engagementRate: number;
  };
  earnings: {
    totalEarnings: number;
    availableBalance: number;
    pendingEarnings: number;
    monthlyEarnings: number;
  };
  content: {
    totalVideos: number;
    totalViews: number;
    averageEngagement: number;
  };
  liveStreams: {
    totalStreams: number;
    totalViewers: number;
    averageViewers: number;
  };
}

export interface LiveStream {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  status: 'scheduled' | 'live' | 'ended';
  hostType: 'seller' | 'affiliate';
  affiliateId?: string;
  sellerId: string;
  rtmpUrl?: string;
  hlsUrl?: string;
  viewerCount: number;
  scheduledAt?: Date;
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

class AffiliatesService {
  // ========== AFFILIATE LINKS ==========

  // Create affiliate link
  async createAffiliateLink(originalUrl: string, productId?: string, sellerId?: string): Promise<AffiliateLink> {
    try {
      const response = await api.post('/affiliates/links', {
        originalUrl,
        productId,
        sellerId
      });
      return response.data;
    } catch (error) {
      console.error('Error creating affiliate link:', error);
      throw error;
    }
  }

  // Get affiliate links
  async getAffiliateLinks(page: number = 1, limit: number = 20): Promise<{ links: AffiliateLink[]; total: number }> {
    try {
      const response = await api.get(`/affiliates/links?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching affiliate links:', error);
      throw error;
    }
  }

  // Get affiliate statistics
  async getAffiliateStats(timeframe: 'week' | 'month' | 'year' = 'month'): Promise<AffiliateStats> {
    try {
      const response = await api.get(`/affiliates/stats?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching affiliate stats:', error);
      throw error;
    }
  }

  // Track click (for app-internal tracking)
  async trackClick(shortCode: string, metadata?: any): Promise<any> {
    try {
      const response = await api.post(`/affiliates/track/${shortCode}`, metadata);
      return response.data;
    } catch (error) {
      console.error('Error tracking click:', error);
      throw error;
    }
  }

  // ========== CREATOR PROFILE ==========

  // Get creator profile
  async getCreatorProfile(username?: string, viewerId?: string): Promise<CreatorProfile> {
    try {
      const endpoint = username ? `/creators/profile/${username}` : '/creators/profile/me';
      const params = viewerId ? `?viewerId=${viewerId}` : '';
      const response = await api.get(`${endpoint}${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching creator profile:', error);
      throw error;
    }
  }

  // Update creator profile
  async updateCreatorProfile(profileData: Partial<CreatorProfile>): Promise<CreatorProfile> {
    try {
      const response = await api.put('/creators/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating creator profile:', error);
      throw error;
    }
  }

  // Follow/Unfollow creator
  async followCreator(creatorId: string): Promise<any> {
    try {
      const response = await api.post(`/creators/follow/${creatorId}`);
      return response.data;
    } catch (error) {
      console.error('Error following creator:', error);
      throw error;
    }
  }

  async unfollowCreator(creatorId: string): Promise<any> {
    try {
      const response = await api.delete(`/creators/follow/${creatorId}`);
      return response.data;
    } catch (error) {
      console.error('Error unfollowing creator:', error);
      throw error;
    }
  }

  // Search creators
  async searchCreators(
    query: string,
    page: number = 1,
    limit: number = 20,
    category?: string
  ): Promise<{ creators: CreatorProfile[]; total: number }> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (category) params.append('category', category);

      const response = await api.get(`/creators/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error searching creators:', error);
      throw error;
    }
  }

  // ========== DASHBOARD ==========

  // Get dashboard stats
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await api.get('/creators/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  // Get dashboard overview
  async getDashboardOverview(): Promise<any> {
    try {
      const response = await api.get('/creators/dashboard/overview');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      throw error;
    }
  }

  // Get performance metrics
  async getPerformanceMetrics(days: number = 30): Promise<any> {
    try {
      const response = await api.get(`/creators/dashboard/performance?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      throw error;
    }
  }

  // Get top content
  async getTopPerformingContent(limit: number = 10): Promise<any> {
    try {
      const response = await api.get(`/creators/dashboard/top-content?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching top content:', error);
      throw error;
    }
  }

  // ========== LIVE STREAMING ==========

  // Create live stream
  async createLiveStream(streamData: {
    title: string;
    description?: string;
    sellerId: string;
    productIds?: string[];
  }): Promise<LiveStream> {
    try {
      const response = await api.post('/creators/live/streams', streamData);
      return response.data;
    } catch (error) {
      console.error('Error creating live stream:', error);
      throw error;
    }
  }

  // Schedule live stream
  async scheduleLiveStream(streamData: {
    title: string;
    description?: string;
    sellerId: string;
    scheduledAt: string;
    productIds?: string[];
  }): Promise<LiveStream> {
    try {
      const response = await api.post('/creators/live/streams/schedule', streamData);
      return response.data;
    } catch (error) {
      console.error('Error scheduling live stream:', error);
      throw error;
    }
  }

  // Start live stream
  async startLiveStream(streamId: string): Promise<LiveStream> {
    try {
      const response = await api.post(`/creators/live/streams/${streamId}/start`);
      return response.data;
    } catch (error) {
      console.error('Error starting live stream:', error);
      throw error;
    }
  }

  // End live stream
  async endLiveStream(streamId: string): Promise<LiveStream> {
    try {
      const response = await api.post(`/creators/live/streams/${streamId}/end`);
      return response.data;
    } catch (error) {
      console.error('Error ending live stream:', error);
      throw error;
    }
  }

  // Get creator live streams
  async getMyLiveStreams(
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<{ streams: LiveStream[]; total: number }> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (status) params.append('status', status);

      const response = await api.get(`/creators/live/streams?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching live streams:', error);
      throw error;
    }
  }

  // Get active live streams
  async getActiveLiveStreams(page: number = 1, limit: number = 20): Promise<{ streams: LiveStream[]; total: number }> {
    try {
      const response = await api.get(`/creators/live/streams/active?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching active live streams:', error);
      throw error;
    }
  }

  // Get upcoming streams
  async getUpcomingStreams(
    creatorId?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ streams: LiveStream[]; total: number }> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (creatorId) params.append('creatorId', creatorId);

      const response = await api.get(`/creators/live/streams/upcoming?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming streams:', error);
      throw error;
    }
  }

  // Get live stream analytics
  async getLiveStreamAnalytics(streamId: string): Promise<any> {
    try {
      const response = await api.get(`/creators/live/streams/${streamId}/analytics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stream analytics:', error);
      throw error;
    }
  }

  // ========== SHARING TOOLS ==========

  // Generate share link for product
  async generateShareLink(productId: string, platform?: string): Promise<{ link: string; qrCode?: string }> {
    try {
      const response = await api.post('/affiliates/share', {
        productId,
        platform
      });
      return response.data;
    } catch (error) {
      console.error('Error generating share link:', error);
      throw error;
    }
  }

  // Get sharing analytics
  async getShareAnalytics(linkId: string): Promise<any> {
    try {
      const response = await api.get(`/affiliates/share/${linkId}/analytics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching share analytics:', error);
      throw error;
    }
  }
}

export const affiliatesService = new AffiliatesService();