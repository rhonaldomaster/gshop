/**
 * Seller Profile Service
 *
 * Handles fetching seller public profiles, products, streams,
 * and follow/unfollow functionality.
 */

import { apiClient } from './api';
import {
  SellerPublicProfile,
  SellerProductsResponse,
  SellerStreamsResponse,
  FollowResponse,
  IsFollowingResponse,
  StreamStatus,
} from '../types/profiles';

class SellerProfileService {
  private baseUrl = '/sellers';

  /**
   * Get seller public profile
   */
  async getPublicProfile(sellerId: string): Promise<SellerPublicProfile> {
    try {
      const response = await apiClient.get<{ success: boolean; profile: SellerPublicProfile }>(
        `${this.baseUrl}/${sellerId}/public-profile`
      );
      return response.data.profile;
    } catch (error) {
      console.error('[SellerProfile] Failed to get public profile:', error);
      throw error;
    }
  }

  /**
   * Get seller public products with pagination
   */
  async getProducts(
    sellerId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<SellerProductsResponse> {
    try {
      const response = await apiClient.get<SellerProductsResponse>(
        `${this.baseUrl}/${sellerId}/products/public?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('[SellerProfile] Failed to get products:', error);
      throw error;
    }
  }

  /**
   * Get seller streams (live and past) with pagination
   */
  async getStreams(
    sellerId: string,
    status?: StreamStatus,
    page: number = 1,
    limit: number = 20
  ): Promise<SellerStreamsResponse> {
    try {
      let url = `${this.baseUrl}/${sellerId}/streams?page=${page}&limit=${limit}`;
      if (status) {
        url += `&status=${status}`;
      }
      const response = await apiClient.get<SellerStreamsResponse>(url);
      return response.data;
    } catch (error) {
      console.error('[SellerProfile] Failed to get streams:', error);
      throw error;
    }
  }

  /**
   * Follow a seller
   */
  async followSeller(sellerId: string): Promise<FollowResponse> {
    try {
      const response = await apiClient.post<FollowResponse>(
        `${this.baseUrl}/${sellerId}/follow`
      );
      return response.data;
    } catch (error) {
      console.error('[SellerProfile] Failed to follow seller:', error);
      throw error;
    }
  }

  /**
   * Unfollow a seller
   */
  async unfollowSeller(sellerId: string): Promise<FollowResponse> {
    try {
      const response = await apiClient.delete<FollowResponse>(
        `${this.baseUrl}/${sellerId}/follow`
      );
      return response.data;
    } catch (error) {
      console.error('[SellerProfile] Failed to unfollow seller:', error);
      throw error;
    }
  }

  /**
   * Check if following a seller
   */
  async isFollowing(sellerId: string): Promise<IsFollowingResponse> {
    try {
      const response = await apiClient.get<IsFollowingResponse>(
        `${this.baseUrl}/${sellerId}/is-following`
      );
      return response.data;
    } catch (error) {
      console.error('[SellerProfile] Failed to check follow status:', error);
      throw error;
    }
  }

  /**
   * Toggle notifications for a followed seller
   */
  async toggleNotifications(
    sellerId: string,
    enabled: boolean
  ): Promise<FollowResponse> {
    try {
      const response = await apiClient.put<FollowResponse>(
        `${this.baseUrl}/${sellerId}/follow/notifications`,
        { enabled }
      );
      return response.data;
    } catch (error) {
      console.error('[SellerProfile] Failed to toggle notifications:', error);
      throw error;
    }
  }

  /**
   * Get seller followers list with pagination
   */
  async getFollowers(
    sellerId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    followers: Array<{
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
      followedAt: string;
    }>;
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const response = await apiClient.get(
        `${this.baseUrl}/${sellerId}/followers?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('[SellerProfile] Failed to get followers:', error);
      throw error;
    }
  }
}

export const sellerProfileService = new SellerProfileService();
export default sellerProfileService;
