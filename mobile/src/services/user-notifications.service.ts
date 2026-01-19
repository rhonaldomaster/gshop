/**
 * User Notifications Service
 *
 * Handles in-app notifications from the backend (not push notifications).
 * This service fetches and manages notifications stored in the database.
 */

import { apiClient } from './api';

export type UserNotificationType = 'order' | 'promotion' | 'system' | 'live' | 'price_drop';

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: UserNotificationType;
  isRead: boolean;
  data?: Record<string, any>;
  imageUrl?: string;
  actionUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserNotificationsResponse {
  notifications: UserNotification[];
  total: number;
  unreadCount: number;
}

export interface GetUserNotificationsOptions {
  unreadOnly?: boolean;
  type?: UserNotificationType;
  limit?: number;
  offset?: number;
}

class UserNotificationsService {
  private baseUrl = '/notifications';

  /**
   * Get all notifications for the current user
   */
  async getNotifications(options?: GetUserNotificationsOptions): Promise<UserNotificationsResponse> {
    try {
      const params = new URLSearchParams();

      if (options?.unreadOnly) {
        params.append('unreadOnly', 'true');
      }
      if (options?.type) {
        params.append('type', options.type);
      }
      if (options?.limit) {
        params.append('limit', options.limit.toString());
      }
      if (options?.offset) {
        params.append('offset', options.offset.toString());
      }

      const url = params.toString()
        ? `${this.baseUrl}?${params.toString()}`
        : this.baseUrl;

      const response = await apiClient.get<UserNotificationsResponse>(url);
      return response.data;
    } catch (error) {
      console.error('[UserNotifications] Failed to get notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get<{ count: number }>(`${this.baseUrl}/unread-count`);
      return response.data.count;
    } catch (error) {
      console.error('[UserNotifications] Failed to get unread count:', error);
      throw error;
    }
  }

  /**
   * Get a single notification
   */
  async getNotification(id: string): Promise<UserNotification> {
    try {
      const response = await apiClient.get<UserNotification>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('[UserNotifications] Failed to get notification:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<UserNotification> {
    try {
      const response = await apiClient.put<UserNotification>(`${this.baseUrl}/${id}/read`);
      return response.data;
    } catch (error) {
      console.error('[UserNotifications] Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      await apiClient.put<{ success: boolean; message: string }>(`${this.baseUrl}/mark-all-read`);
    } catch (error) {
      console.error('[UserNotifications] Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string): Promise<void> {
    try {
      await apiClient.delete<{ success: boolean; message: string }>(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('[UserNotifications] Failed to delete notification:', error);
      throw error;
    }
  }

  /**
   * Delete multiple notifications
   */
  async deleteMultiple(ids: string[]): Promise<void> {
    try {
      await apiClient.delete<{ success: boolean; message: string }>(`${this.baseUrl}/bulk`, {
        data: { ids },
      });
    } catch (error) {
      console.error('[UserNotifications] Failed to delete notifications:', error);
      throw error;
    }
  }
}

export const userNotificationsService = new UserNotificationsService();
export default userNotificationsService;
