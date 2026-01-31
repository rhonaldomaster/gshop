/**
 * Follow Seller Hook
 *
 * React hook for following/unfollowing sellers and managing notification preferences.
 */

import { useState, useEffect, useCallback } from 'react';
import sellerProfileService from '../services/seller-profile.service';

interface UseFollowSellerResult {
  isFollowing: boolean;
  notificationsEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  follow: () => Promise<void>;
  unfollow: () => Promise<void>;
  toggleNotifications: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for following/unfollowing a specific seller
 */
export const useFollowSeller = (sellerId: string): UseFollowSellerResult => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkFollowStatus = useCallback(async () => {
    if (!sellerId) return;

    setIsLoading(true);
    setError(null);

    try {
      const status = await sellerProfileService.isFollowing(sellerId);
      setIsFollowing(status.isFollowing);
      setNotificationsEnabled(status.notificationsEnabled ?? true);
    } catch (err) {
      console.error('[useFollowSeller] Failed to check follow status:', err);
      setError('Failed to load follow status');
      // Don't throw - user might not be authenticated
      setIsFollowing(false);
      setNotificationsEnabled(false);
    } finally {
      setIsLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    checkFollowStatus();
  }, [checkFollowStatus]);

  const follow = useCallback(async () => {
    if (!sellerId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await sellerProfileService.followSeller(sellerId);
      setIsFollowing(result.isFollowing ?? true);
      setNotificationsEnabled(result.notificationsEnabled ?? true);
    } catch (err) {
      console.error('[useFollowSeller] Failed to follow:', err);
      setError('Failed to follow seller');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sellerId]);

  const unfollow = useCallback(async () => {
    if (!sellerId) return;

    setIsLoading(true);
    setError(null);

    try {
      await sellerProfileService.unfollowSeller(sellerId);
      setIsFollowing(false);
      setNotificationsEnabled(false);
    } catch (err) {
      console.error('[useFollowSeller] Failed to unfollow:', err);
      setError('Failed to unfollow seller');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sellerId]);

  const toggleNotifications = useCallback(async () => {
    if (!sellerId || !isFollowing) return;

    setIsLoading(true);
    setError(null);

    try {
      const newState = !notificationsEnabled;
      const result = await sellerProfileService.toggleNotifications(sellerId, newState);
      setNotificationsEnabled(result.notificationsEnabled ?? newState);
    } catch (err) {
      console.error('[useFollowSeller] Failed to toggle notifications:', err);
      setError('Failed to update notification settings');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sellerId, isFollowing, notificationsEnabled]);

  return {
    isFollowing,
    notificationsEnabled,
    isLoading,
    error,
    follow,
    unfollow,
    toggleNotifications,
    refresh: checkFollowStatus,
  };
};

export default useFollowSeller;
