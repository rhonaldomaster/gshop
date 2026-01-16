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
}

export const liveService = new LiveService();
