/**
 * Affiliate Profile Hook
 *
 * React hook for fetching affiliate public profile, streams, and follow state.
 */

import { useState, useEffect, useCallback } from 'react';
import affiliateProfileService from '../services/affiliate-profile.service';
import {
  AffiliatePublicProfile,
  AffiliateStreamSummary,
  StreamStatus,
} from '../types/profiles';

// ==================== Profile Hook ====================

interface UseAffiliateProfileResult {
  profile: AffiliatePublicProfile | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching affiliate public profile by ID
 */
export const useAffiliateProfile = (
  affiliateId: string,
  viewerId?: string
): UseAffiliateProfileResult => {
  const [profile, setProfile] = useState<AffiliatePublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!affiliateId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await affiliateProfileService.getPublicProfile(affiliateId, viewerId);
      setProfile(data);
    } catch (err) {
      console.error('[useAffiliateProfile] Failed to load profile:', err);
      setError('Failed to load affiliate profile');
    } finally {
      setIsLoading(false);
    }
  }, [affiliateId, viewerId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    isLoading,
    error,
    refresh: loadProfile,
  };
};

/**
 * Hook for fetching affiliate public profile by username
 */
export const useAffiliateProfileByUsername = (
  username: string,
  viewerId?: string
): UseAffiliateProfileResult => {
  const [profile, setProfile] = useState<AffiliatePublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!username) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await affiliateProfileService.getPublicProfileByUsername(username, viewerId);
      setProfile(data);
    } catch (err) {
      console.error('[useAffiliateProfileByUsername] Failed to load profile:', err);
      setError('Failed to load affiliate profile');
    } finally {
      setIsLoading(false);
    }
  }, [username, viewerId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    isLoading,
    error,
    refresh: loadProfile,
  };
};

// ==================== Streams Hook ====================

interface UseAffiliateStreamsResult {
  streams: AffiliateStreamSummary[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  hasMore: boolean;
}

/**
 * Hook for fetching affiliate streams with pagination
 */
export const useAffiliateStreams = (
  affiliateId: string,
  status?: StreamStatus,
  limit: number = 20
): UseAffiliateStreamsResult => {
  const [streams, setStreams] = useState<AffiliateStreamSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStreams = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      if (!affiliateId) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await affiliateProfileService.getStreams(affiliateId, status, pageNum, limit);

        if (append) {
          setStreams((prev) => [...prev, ...result.streams]);
        } else {
          setStreams(result.streams);
        }

        setTotal(result.pagination.total);
        setPage(result.pagination.page);
        setTotalPages(result.pagination.totalPages);
      } catch (err) {
        console.error('[useAffiliateStreams] Failed to load streams:', err);
        setError('Failed to load streams');
      } finally {
        setIsLoading(false);
      }
    },
    [affiliateId, status, limit]
  );

  useEffect(() => {
    loadStreams();
  }, [loadStreams]);

  const loadMore = useCallback(async () => {
    if (page < totalPages && !isLoading) {
      await loadStreams(page + 1, true);
    }
  }, [page, totalPages, isLoading, loadStreams]);

  const refresh = useCallback(async () => {
    await loadStreams(1, false);
  }, [loadStreams]);

  return {
    streams,
    total,
    page,
    totalPages,
    isLoading,
    error,
    loadMore,
    refresh,
    hasMore: page < totalPages,
  };
};

// ==================== Follow Hook ====================

interface UseFollowAffiliateResult {
  isFollowing: boolean;
  isLoading: boolean;
  error: string | null;
  follow: () => Promise<void>;
  unfollow: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for following/unfollowing an affiliate
 */
export const useFollowAffiliate = (affiliateId: string): UseFollowAffiliateResult => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkFollowStatus = useCallback(async () => {
    // Follow status is included in the profile response via followStats.isFollowing
    // This hook is for actions only, initial state comes from profile
  }, []);

  const follow = useCallback(async () => {
    if (!affiliateId) return;

    setIsLoading(true);
    setError(null);

    try {
      await affiliateProfileService.followCreator(affiliateId);
      setIsFollowing(true);
    } catch (err) {
      console.error('[useFollowAffiliate] Failed to follow:', err);
      setError('Failed to follow creator');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [affiliateId]);

  const unfollow = useCallback(async () => {
    if (!affiliateId) return;

    setIsLoading(true);
    setError(null);

    try {
      await affiliateProfileService.unfollowCreator(affiliateId);
      setIsFollowing(false);
    } catch (err) {
      console.error('[useFollowAffiliate] Failed to unfollow:', err);
      setError('Failed to unfollow creator');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [affiliateId]);

  return {
    isFollowing,
    isLoading,
    error,
    follow,
    unfollow,
    refresh: checkFollowStatus,
  };
};

export default useAffiliateProfile;
