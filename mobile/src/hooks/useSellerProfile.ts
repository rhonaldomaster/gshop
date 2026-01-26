/**
 * Seller Profile Hook
 *
 * React hook for fetching seller public profile, products, and streams.
 */

import { useState, useEffect, useCallback } from 'react';
import sellerProfileService from '../services/seller-profile.service';
import {
  SellerPublicProfile,
  SellerProductSummary,
  SellerStreamSummary,
  StreamStatus,
} from '../types/profiles';

// ==================== Profile Hook ====================

interface UseSellerProfileResult {
  profile: SellerPublicProfile | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching seller public profile
 */
export const useSellerProfile = (sellerId: string): UseSellerProfileResult => {
  const [profile, setProfile] = useState<SellerPublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!sellerId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await sellerProfileService.getPublicProfile(sellerId);
      setProfile(data);
    } catch (err) {
      console.error('[useSellerProfile] Failed to load profile:', err);
      setError('Failed to load seller profile');
    } finally {
      setIsLoading(false);
    }
  }, [sellerId]);

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

// ==================== Products Hook ====================

interface UseSellerProductsResult {
  products: SellerProductSummary[];
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
 * Hook for fetching seller products with pagination
 */
export const useSellerProducts = (
  sellerId: string,
  limit: number = 20
): UseSellerProductsResult => {
  const [products, setProducts] = useState<SellerProductSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      if (!sellerId) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await sellerProfileService.getProducts(sellerId, pageNum, limit);

        if (append) {
          setProducts((prev) => [...prev, ...result.products]);
        } else {
          setProducts(result.products);
        }

        setTotal(result.total);
        setPage(result.page);
        setTotalPages(result.totalPages);
      } catch (err) {
        console.error('[useSellerProducts] Failed to load products:', err);
        setError('Failed to load products');
      } finally {
        setIsLoading(false);
      }
    },
    [sellerId, limit]
  );

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const loadMore = useCallback(async () => {
    if (page < totalPages && !isLoading) {
      await loadProducts(page + 1, true);
    }
  }, [page, totalPages, isLoading, loadProducts]);

  const refresh = useCallback(async () => {
    await loadProducts(1, false);
  }, [loadProducts]);

  return {
    products,
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

// ==================== Streams Hook ====================

interface UseSellerStreamsResult {
  streams: SellerStreamSummary[];
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
 * Hook for fetching seller streams with pagination
 */
export const useSellerStreams = (
  sellerId: string,
  status?: StreamStatus,
  limit: number = 20
): UseSellerStreamsResult => {
  const [streams, setStreams] = useState<SellerStreamSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStreams = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      if (!sellerId) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await sellerProfileService.getStreams(sellerId, status, pageNum, limit);

        if (append) {
          setStreams((prev) => [...prev, ...result.streams]);
        } else {
          setStreams(result.streams);
        }

        setTotal(result.total);
        setPage(result.page);
        setTotalPages(result.totalPages);
      } catch (err) {
        console.error('[useSellerStreams] Failed to load streams:', err);
        setError('Failed to load streams');
      } finally {
        setIsLoading(false);
      }
    },
    [sellerId, status, limit]
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

export default useSellerProfile;
