/**
 * Followers Service
 *
 * Handles following/unfollowing streamers and managing notification preferences.
 */

import { apiClient } from './api';

export interface FollowStats {
  followersCount: number;
  followingCount: number;
}

export interface Follower {
  id: string;
  followerId: string;
  streamerId: string;
  notificationsEnabled: boolean;
  createdAt: string;
  streamer?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  follower?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface FollowResponse {
  success: boolean;
  follow: Follower;
}

export interface FollowingResponse {
  following: Follower[];
  total: number;
  page: number;
  totalPages: number;
}

export interface FollowersResponse {
  followers: Follower[];
  total: number;
  page: number;
  totalPages: number;
}

class FollowersService {
  private baseUrl = '/followers';

  /**
   * Follow a streamer
   */
  async followStreamer(streamerId: string): Promise<FollowResponse> {
    try {
      const response = await apiClient.post<FollowResponse>(`${this.baseUrl}/${streamerId}/follow`);
      return response.data;
    } catch (error) {
      console.error('[Followers] Failed to follow streamer:', error);
      throw error;
    }
  }

  /**
   * Unfollow a streamer
   */
  async unfollowStreamer(streamerId: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${streamerId}/follow`);
    } catch (error) {
      console.error('[Followers] Failed to unfollow streamer:', error);
      throw error;
    }
  }

  /**
   * Check if following a streamer
   */
  async isFollowing(streamerId: string): Promise<{ isFollowing: boolean; notificationsEnabled?: boolean }> {
    try {
      const response = await apiClient.get<{ isFollowing: boolean; notificationsEnabled?: boolean }>(
        `${this.baseUrl}/${streamerId}/is-following`
      );
      return response.data;
    } catch (error) {
      console.error('[Followers] Failed to check follow status:', error);
      throw error;
    }
  }

  /**
   * Toggle notifications for a streamer
   */
  async toggleNotifications(streamerId: string, enabled: boolean): Promise<{ notificationsEnabled: boolean }> {
    try {
      const response = await apiClient.put<{ notificationsEnabled: boolean }>(
        `${this.baseUrl}/${streamerId}/notifications`,
        { enabled }
      );
      return response.data;
    } catch (error) {
      console.error('[Followers] Failed to toggle notifications:', error);
      throw error;
    }
  }

  /**
   * Get list of streamers the user is following
   */
  async getFollowing(page: number = 1, limit: number = 20): Promise<FollowingResponse> {
    try {
      const response = await apiClient.get<FollowingResponse>(
        `${this.baseUrl}/following?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('[Followers] Failed to get following list:', error);
      throw error;
    }
  }

  /**
   * Get followers of a streamer
   */
  async getFollowers(streamerId: string, page: number = 1, limit: number = 20): Promise<FollowersResponse> {
    try {
      const response = await apiClient.get<FollowersResponse>(
        `${this.baseUrl}/${streamerId}?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('[Followers] Failed to get followers:', error);
      throw error;
    }
  }

  /**
   * Get follow stats for the current user
   */
  async getMyStats(): Promise<FollowStats> {
    try {
      const response = await apiClient.get<FollowStats>(`${this.baseUrl}/my/stats`);
      return response.data;
    } catch (error) {
      console.error('[Followers] Failed to get my stats:', error);
      throw error;
    }
  }

  /**
   * Get follow stats for a user
   */
  async getUserStats(userId: string): Promise<FollowStats> {
    try {
      const response = await apiClient.get<FollowStats>(`${this.baseUrl}/${userId}/stats`);
      return response.data;
    } catch (error) {
      console.error('[Followers] Failed to get user stats:', error);
      throw error;
    }
  }
}

export const followersService = new FollowersService();
export default followersService;
