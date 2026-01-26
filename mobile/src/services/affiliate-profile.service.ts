/**
 * Affiliate Profile Service
 *
 * Handles fetching affiliate/creator public profiles and streams.
 * Follow functionality is handled by the existing affiliates.service.ts
 */

import { apiClient } from './api';
import {
  AffiliatePublicProfile,
  AffiliateStreamsResponse,
  StreamStatus,
} from '../types/profiles';

class AffiliateProfileService {
  private baseUrl = '/creators';

  /**
   * Get affiliate public profile by ID
   */
  async getPublicProfile(affiliateId: string, viewerId?: string): Promise<AffiliatePublicProfile> {
    try {
      let url = `${this.baseUrl}/${affiliateId}/public-profile`;
      if (viewerId) {
        url += `?viewerId=${viewerId}`;
      }
      const response = await apiClient.get<AffiliatePublicProfile>(url);
      return response.data;
    } catch (error) {
      console.error('[AffiliateProfile] Failed to get public profile:', error);
      throw error;
    }
  }

  /**
   * Get affiliate public profile by username
   */
  async getPublicProfileByUsername(username: string, viewerId?: string): Promise<AffiliatePublicProfile> {
    try {
      let url = `${this.baseUrl}/profile/${username}`;
      if (viewerId) {
        url += `?viewerId=${viewerId}`;
      }
      const response = await apiClient.get<AffiliatePublicProfile>(url);
      return response.data;
    } catch (error) {
      console.error('[AffiliateProfile] Failed to get public profile by username:', error);
      throw error;
    }
  }

  /**
   * Get affiliate streams with pagination
   */
  async getStreams(
    affiliateId: string,
    status?: StreamStatus,
    page: number = 1,
    limit: number = 20
  ): Promise<AffiliateStreamsResponse> {
    try {
      let url = `${this.baseUrl}/${affiliateId}/streams?page=${page}&limit=${limit}`;
      if (status) {
        url += `&status=${status}`;
      }
      const response = await apiClient.get<AffiliateStreamsResponse>(url);
      return response.data;
    } catch (error) {
      console.error('[AffiliateProfile] Failed to get streams:', error);
      throw error;
    }
  }

  /**
   * Follow an affiliate/creator
   */
  async followCreator(creatorId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>(
        `${this.baseUrl}/follow/${creatorId}`
      );
      return response.data;
    } catch (error) {
      console.error('[AffiliateProfile] Failed to follow creator:', error);
      throw error;
    }
  }

  /**
   * Unfollow an affiliate/creator
   */
  async unfollowCreator(creatorId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(
        `${this.baseUrl}/follow/${creatorId}`
      );
      return response.data;
    } catch (error) {
      console.error('[AffiliateProfile] Failed to unfollow creator:', error);
      throw error;
    }
  }

  /**
   * Get creator followers
   */
  async getFollowers(
    creatorId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    followers: Array<{
      id: string;
      user: any;
      followedAt: string;
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    try {
      const response = await apiClient.get(
        `${this.baseUrl}/${creatorId}/followers?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('[AffiliateProfile] Failed to get followers:', error);
      throw error;
    }
  }

  /**
   * Search creators
   */
  async searchCreators(
    query: string,
    category?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    creators: Array<{
      id: string;
      username: string;
      name: string;
      bio?: string;
      avatarUrl?: string;
      location?: string;
      categories?: string[];
      isVerified: boolean;
      followersCount: number;
      totalViews: number;
      videosCount: number;
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    try {
      let url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
      if (category) {
        url += `&category=${encodeURIComponent(category)}`;
      }
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('[AffiliateProfile] Failed to search creators:', error);
      throw error;
    }
  }
}

export const affiliateProfileService = new AffiliateProfileService();
export default affiliateProfileService;
