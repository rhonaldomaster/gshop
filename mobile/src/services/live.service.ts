import { api } from './api';

export interface NativeStreamCredentials {
  ingestEndpoint: string;
  streamKey: string;
  channelArn: string;
  playbackUrl: string;
  streamId: string;
  title: string;
  recommendedBitrate: number;
  recommendedResolution: string;
  maxBitrate: number;
}

export interface OBSSetupInfo {
  rtmpUrl: string;
  streamKey: string;
  qrCodeDataUrl?: string;
  recommendedSettings: {
    encoder: string;
    bitrate: number;
    keyframeInterval: number;
    resolution: string;
    fps: number;
  };
}

export interface LiveStreamDetails {
  id: string;
  title: string;
  description?: string;
  status: 'scheduled' | 'live' | 'ended';
  hostType: 'seller' | 'affiliate';
  sellerId: string;
  affiliateId?: string;
  rtmpUrl?: string;
  hlsUrl?: string;
  streamKey?: string;
  viewerCount: number;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
  seller?: {
    id: string;
    businessName: string;
    logo?: string;
  };
  affiliate?: {
    id: string;
    username: string;
    displayName: string;
    profileImage?: string;
  };
}

export interface StreamProduct {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    stock: number;
  };
  specialPrice?: number;
  isHighlighted: boolean;
  isActive: boolean;
  position: number;
}

export interface StreamStats {
  currentViewers: number;
  peakViewers: number;
  messagesCount: number;
  productsClicked: number;
  purchaseCount: number;
  revenue: number;
}

class LiveService {
  // Get native streaming credentials for seller
  async getNativeCredentials(streamId: string): Promise<NativeStreamCredentials> {
    try {
      const response = await api.get<NativeStreamCredentials>(
        `/live/streams/${streamId}/native-credentials`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching native credentials:', error);
      throw error;
    }
  }

  // Get native streaming credentials for affiliate
  async getAffiliateNativeCredentials(streamId: string): Promise<NativeStreamCredentials> {
    try {
      const response = await api.get<NativeStreamCredentials>(
        `/live/affiliate/streams/${streamId}/native-credentials`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching affiliate native credentials:', error);
      throw error;
    }
  }

  // Get OBS setup info for seller
  async getOBSSetupInfo(streamId: string): Promise<OBSSetupInfo> {
    try {
      const response = await api.get<OBSSetupInfo>(
        `/live/streams/${streamId}/obs-setup`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching OBS setup info:', error);
      throw error;
    }
  }

  // Get OBS setup info for affiliate
  async getAffiliateOBSSetupInfo(streamId: string): Promise<OBSSetupInfo> {
    try {
      const response = await api.get<OBSSetupInfo>(
        `/live/affiliate/streams/${streamId}/obs-setup`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching affiliate OBS setup info:', error);
      throw error;
    }
  }

  // Regenerate stream key for seller
  async regenerateStreamKey(streamId: string): Promise<{ streamKey: string }> {
    try {
      const response = await api.post<{ streamKey: string }>(
        `/live/streams/${streamId}/regenerate-key`
      );
      return response.data;
    } catch (error) {
      console.error('Error regenerating stream key:', error);
      throw error;
    }
  }

  // Regenerate stream key for affiliate
  async regenerateAffiliateStreamKey(streamId: string): Promise<{ streamKey: string }> {
    try {
      const response = await api.post<{ streamKey: string }>(
        `/live/affiliate/streams/${streamId}/regenerate-key`
      );
      return response.data;
    } catch (error) {
      console.error('Error regenerating affiliate stream key:', error);
      throw error;
    }
  }

  // Get stream details
  async getStreamDetails(streamId: string): Promise<LiveStreamDetails> {
    try {
      const response = await api.get<LiveStreamDetails>(`/live/streams/${streamId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stream details:', error);
      throw error;
    }
  }

  // Start live stream
  async startStream(streamId: string): Promise<LiveStreamDetails> {
    try {
      const response = await api.post<LiveStreamDetails>(`/live/streams/${streamId}/start`);
      return response.data;
    } catch (error) {
      console.error('Error starting stream:', error);
      throw error;
    }
  }

  // End live stream
  async endStream(streamId: string): Promise<LiveStreamDetails> {
    try {
      const response = await api.post<LiveStreamDetails>(`/live/streams/${streamId}/end`);
      return response.data;
    } catch (error) {
      console.error('Error ending stream:', error);
      throw error;
    }
  }

  // Get stream products
  async getStreamProducts(streamId: string): Promise<StreamProduct[]> {
    try {
      const response = await api.get<StreamProduct[]>(`/live/streams/${streamId}/products`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stream products:', error);
      throw error;
    }
  }

  // Add product to stream (seller)
  async addProductToStream(streamId: string, productId: string, specialPrice?: number): Promise<void> {
    try {
      await api.post(`/live/streams/${streamId}/products`, {
        productId,
        specialPrice,
      });
    } catch (error) {
      console.error('Error adding product to stream:', error);
      throw error;
    }
  }

  // Add product to affiliate stream
  async addProductToAffiliateStream(streamId: string, productId: string, specialPrice?: number): Promise<void> {
    try {
      await api.post(`/live/affiliate/streams/${streamId}/products`, {
        productId,
        specialPrice,
      });
    } catch (error) {
      console.error('Error adding product to affiliate stream:', error);
      throw error;
    }
  }

  // Add multiple products to stream (seller)
  async addProductsToStream(streamId: string, productIds: string[]): Promise<void> {
    try {
      await Promise.all(
        productIds.map(productId => this.addProductToStream(streamId, productId))
      );
    } catch (error) {
      console.error('Error adding products to stream:', error);
      throw error;
    }
  }

  // Add multiple products to affiliate stream
  async addProductsToAffiliateStream(streamId: string, productIds: string[]): Promise<void> {
    try {
      await Promise.all(
        productIds.map(productId => this.addProductToAffiliateStream(streamId, productId))
      );
    } catch (error) {
      console.error('Error adding products to affiliate stream:', error);
      throw error;
    }
  }

  // Toggle product visibility
  async toggleProductVisibility(streamId: string, productId: string): Promise<StreamProduct> {
    try {
      const response = await api.put<StreamProduct>(
        `/live/streams/${streamId}/products/${productId}/toggle`
      );
      return response.data;
    } catch (error) {
      console.error('Error toggling product visibility:', error);
      throw error;
    }
  }

  // Get stream stats
  async getStreamStats(streamId: string): Promise<StreamStats> {
    try {
      const response = await api.get<StreamStats>(`/live/streams/${streamId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stream stats:', error);
      throw error;
    }
  }

  // Get active streams
  async getActiveStreams(page: number = 1, limit: number = 20): Promise<{ streams: LiveStreamDetails[]; total: number }> {
    try {
      const response = await api.get<{ streams: LiveStreamDetails[]; total: number }>(
        `/live/streams/active?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching active streams:', error);
      throw error;
    }
  }

  // Create seller live stream
  async createSellerStream(data: {
    title: string;
    description?: string;
    scheduledAt?: string;
  }): Promise<LiveStreamDetails> {
    try {
      const response = await api.post<LiveStreamDetails>('/live/streams', data);
      return response.data;
    } catch (error) {
      console.error('Error creating seller stream:', error);
      throw error;
    }
  }

  // Create affiliate live stream
  async createAffiliateStream(data: {
    title: string;
    description?: string;
    sellerId: string;
    scheduledAt?: string;
  }): Promise<LiveStreamDetails> {
    try {
      const response = await api.post<LiveStreamDetails>('/live/affiliate/streams', data);
      return response.data;
    } catch (error) {
      console.error('Error creating affiliate stream:', error);
      throw error;
    }
  }

  // ==================== VOD Methods ====================

  // Get all VODs with pagination
  async getVods(params?: {
    page?: number;
    limit?: number;
    sellerId?: string;
    affiliateId?: string;
  }): Promise<VodListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.sellerId) queryParams.append('sellerId', params.sellerId);
      if (params?.affiliateId) queryParams.append('affiliateId', params.affiliateId);

      const response = await api.get<VodListResponse>(`/vod?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching VODs:', error);
      throw error;
    }
  }

  // Get trending VODs
  async getTrendingVods(limit: number = 10): Promise<Vod[]> {
    try {
      const response = await api.get<Vod[]>(`/vod/trending?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trending VODs:', error);
      throw error;
    }
  }

  // Get recent VODs
  async getRecentVods(limit: number = 10): Promise<Vod[]> {
    try {
      const response = await api.get<Vod[]>(`/vod/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent VODs:', error);
      throw error;
    }
  }

  // Get VOD by ID
  async getVodById(vodId: string): Promise<Vod> {
    try {
      const response = await api.get<Vod>(`/vod/${vodId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching VOD:', error);
      throw error;
    }
  }

  // Get VOD by stream ID
  async getVodByStreamId(streamId: string): Promise<Vod | null> {
    try {
      const response = await api.get<Vod | null>(`/vod/stream/${streamId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching VOD by stream ID:', error);
      throw error;
    }
  }

  // Increment VOD view count
  async incrementVodViewCount(vodId: string): Promise<void> {
    try {
      await api.post(`/vod/${vodId}/view`);
    } catch (error) {
      console.error('Error incrementing VOD view count:', error);
      // Don't throw - view count is not critical
    }
  }

  // Get seller's VODs
  async getSellerVods(page: number = 1, limit: number = 20): Promise<VodListResponse> {
    try {
      const response = await api.get<VodListResponse>(
        `/vod/seller/my-vods?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching seller VODs:', error);
      throw error;
    }
  }

  // Get affiliate's VODs
  async getAffiliateVods(page: number = 1, limit: number = 20): Promise<VodListResponse> {
    try {
      const response = await api.get<VodListResponse>(
        `/vod/affiliate/my-vods?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching affiliate VODs:', error);
      throw error;
    }
  }

  // Delete VOD (seller)
  async deleteSellerVod(vodId: string): Promise<void> {
    try {
      await api.delete(`/vod/seller/${vodId}`);
    } catch (error) {
      console.error('Error deleting VOD:', error);
      throw error;
    }
  }

  // Delete VOD (affiliate)
  async deleteAffiliateVod(vodId: string): Promise<void> {
    try {
      await api.delete(`/vod/affiliate/${vodId}`);
    } catch (error) {
      console.error('Error deleting VOD:', error);
      throw error;
    }
  }

  // Create VOD from ended stream (seller)
  async createSellerVodFromStream(streamId: string): Promise<Vod> {
    try {
      const response = await api.post<Vod>('/vod/seller/create-from-stream', { streamId });
      return response.data;
    } catch (error) {
      console.error('Error creating VOD from stream:', error);
      throw error;
    }
  }

  // Create VOD from ended stream (affiliate)
  async createAffiliateVodFromStream(streamId: string): Promise<Vod> {
    try {
      const response = await api.post<Vod>('/vod/affiliate/create-from-stream', { streamId });
      return response.data;
    } catch (error) {
      console.error('Error creating VOD from stream:', error);
      throw error;
    }
  }
}

// VOD Interfaces
export interface Vod {
  id: string;
  streamId: string;
  videoUrl: string;
  thumbnailUrl: string;
  hlsManifestUrl: string;
  duration: number;
  fileSize: number;
  viewCount: number;
  status: 'processing' | 'available' | 'failed' | 'deleted';
  storageProvider: 'r2' | 's3' | 'cloudflare_stream';
  qualities: string[];
  createdAt: string;
  processedAt: string;
  stream?: {
    id: string;
    title: string;
    description: string;
    hostType: 'seller' | 'affiliate';
    sellerId: string;
    affiliateId: string;
    thumbnailUrl: string;
    totalSales: number;
    peakViewers: number;
    category: string;
    tags: string[];
  };
  host?: {
    id: string;
    name: string;
    avatar: string;
    type: 'seller' | 'affiliate';
  };
  products?: Array<{
    id: string;
    name: string;
    price: number;
    specialPrice?: number;
    imageUrl: string;
    orderCount: number;
  }>;
}

export interface VodListResponse {
  vods: Vod[];
  total: number;
  page: number;
  totalPages: number;
}

export const liveService = new LiveService();
