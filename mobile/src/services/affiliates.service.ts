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
    followingCount: number;
    totalViews: number;
    videosCount: number;
    liveStreamsCount: number;
    totalSales: number;
    productsPromoted: number;
  };
  earnings: {
    totalEarnings: number;
    availableBalance: number;
    pendingBalance: number;
    commissionRate: number;
    thisMonthEarnings: number;
    lastMonthEarnings: number;
  };
  content: {
    totalVideos: number;
    publishedVideos: number;
    draftVideos: number;
    totalVideoViews: number;
    totalVideoLikes: number;
    averageEngagement: number;
  };
  liveStreams: {
    totalStreams: number;
    scheduledStreams: number;
    totalStreamViews: number;
    totalStreamRevenue: number;
    averageViewers: number;
  };
  recent: {
    newFollowers: number;
    newComments: number;
    newLikes: number;
    unreadNotifications: number;
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
      // Silently throw - error handling happens in UI layer
      // Expected for non-affiliate users (will show "join program" view)
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

  // ========== AFFILIATE REGISTRATION ==========

  // Register as affiliate (for unauthenticated users - creates new account)
  async registerAffiliate(data: {
    name: string;
    username: string;
    email: string;
    password: string;
    phone?: string;
    documentType?: 'CC' | 'CE' | 'NIT' | 'PASSPORT';
    documentNumber?: string;
    bio?: string;
    website?: string;
    socialMedia?: string;
  }): Promise<{
    affiliate: any;
    access_token: string;
    token_type: string;
    expires_in: string;
  }> {
    try {
      const response = await api.post('/creators/register', data);
      return response.data;
    } catch (error) {
      console.error('Error registering affiliate:', error);
      throw error;
    }
  }

  // Convert existing user to affiliate (for authenticated users - no password needed)
  async convertToAffiliate(data: {
    username: string;
    phone?: string;
    documentType?: 'CC' | 'CE' | 'NIT' | 'PASSPORT';
    documentNumber?: string;
    bio?: string;
    website?: string;
    socialMedia?: string;
    categories?: string[];
  }): Promise<{
    affiliate: any;
  }> {
    try {
      const response = await api.post('/creators/convert', data);
      return response.data;
    } catch (error) {
      console.error('Error converting to affiliate:', error);
      throw error;
    }
  }

  // Check if current user is already an affiliate
  async checkAffiliateStatus(): Promise<{
    isAffiliate: boolean;
    affiliate: {
      id: string;
      username: string;
      status: string;
      commissionRate: number;
      affiliateCode: string;
    } | null;
  }> {
    try {
      const response = await api.get('/creators/status');
      return response.data;
    } catch (error) {
      console.error('Error checking affiliate status:', error);
      throw error;
    }
  }
}

export const affiliatesService = new AffiliatesService();