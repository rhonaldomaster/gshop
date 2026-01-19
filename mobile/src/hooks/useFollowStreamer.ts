/**
 * Follow Streamer Hook
 *
 * React hook for following/unfollowing streamers and managing notification preferences.
 */

import { useState, useEffect, useCallback } from 'react';
import followersService, { FollowStats, Follower } from '../services/followers.service';

interface UseFollowStreamerResult {
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
 * Hook for following/unfollowing a specific streamer
 */
export const useFollowStreamer = (streamerId: string): UseFollowStreamerResult => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkFollowStatus = useCallback(async () => {
    if (!streamerId) return;

    setIsLoading(true);
    setError(null);

    try {
      const status = await followersService.isFollowing(streamerId);
      setIsFollowing(status.isFollowing);
      setNotificationsEnabled(status.notificationsEnabled ?? true);
    } catch (err) {
      console.error('[useFollowStreamer] Failed to check follow status:', err);
      setError('Failed to load follow status');
    } finally {
      setIsLoading(false);
    }
  }, [streamerId]);

  useEffect(() => {
    checkFollowStatus();
  }, [checkFollowStatus]);

  const follow = useCallback(async () => {
    if (!streamerId) return;

    setIsLoading(true);
    setError(null);

    try {
      await followersService.followStreamer(streamerId);
      setIsFollowing(true);
      setNotificationsEnabled(true);
    } catch (err) {
      console.error('[useFollowStreamer] Failed to follow:', err);
      setError('Failed to follow streamer');
    } finally {
      setIsLoading(false);
    }
  }, [streamerId]);

  const unfollow = useCallback(async () => {
    if (!streamerId) return;

    setIsLoading(true);
    setError(null);

    try {
      await followersService.unfollowStreamer(streamerId);
      setIsFollowing(false);
      setNotificationsEnabled(false);
    } catch (err) {
      console.error('[useFollowStreamer] Failed to unfollow:', err);
      setError('Failed to unfollow streamer');
    } finally {
      setIsLoading(false);
    }
  }, [streamerId]);

  const toggleNotifications = useCallback(async () => {
    if (!streamerId || !isFollowing) return;

    setIsLoading(true);
    setError(null);

    try {
      const newState = !notificationsEnabled;
      const result = await followersService.toggleNotifications(streamerId, newState);
      setNotificationsEnabled(result.notificationsEnabled);
    } catch (err) {
      console.error('[useFollowStreamer] Failed to toggle notifications:', err);
      setError('Failed to update notification settings');
    } finally {
      setIsLoading(false);
    }
  }, [streamerId, isFollowing, notificationsEnabled]);

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

interface UseFollowingListResult {
  following: Follower[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for getting the list of streamers the user is following
 */
export const useFollowingList = (): UseFollowingListResult => {
  const [following, setFollowing] = useState<Follower[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFollowing = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await followersService.getFollowing(pageNum);

      if (append) {
        setFollowing((prev) => [...prev, ...result.following]);
      } else {
        setFollowing(result.following);
      }

      setTotal(result.total);
      setPage(result.page);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('[useFollowingList] Failed to load following:', err);
      setError('Failed to load following list');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFollowing();
  }, [loadFollowing]);

  const loadMore = useCallback(async () => {
    if (page < totalPages && !isLoading) {
      await loadFollowing(page + 1, true);
    }
  }, [page, totalPages, isLoading, loadFollowing]);

  const refresh = useCallback(async () => {
    await loadFollowing(1, false);
  }, [loadFollowing]);

  return {
    following,
    total,
    page,
    totalPages,
    isLoading,
    error,
    loadMore,
    refresh,
  };
};

interface UseFollowStatsResult {
  stats: FollowStats | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for getting follow stats
 */
export const useFollowStats = (userId?: string): UseFollowStatsResult => {
  const [stats, setStats] = useState<FollowStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = userId
        ? await followersService.getUserStats(userId)
        : await followersService.getMyStats();
      setStats(result);
    } catch (err) {
      console.error('[useFollowStats] Failed to load stats:', err);
      setError('Failed to load stats');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    isLoading,
    error,
    refresh: loadStats,
  };
};

export default useFollowStreamer;
