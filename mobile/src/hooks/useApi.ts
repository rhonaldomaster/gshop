import { useState, useCallback, useRef, useEffect } from 'react';
import { apiClient, ApiResponse, ApiError } from '../services/api';

// Hook state interface
interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
}

// Hook return interface
interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
  clearError: () => void;
}

// Hook options interface
interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  resetOnExecute?: boolean;
}

/**
 * Custom hook for managing API calls with loading states and error handling
 *
 * @param apiFunction - The API function to call
 * @param options - Configuration options
 * @returns Object with data, loading state, error, and execute function
 */
export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const {
    immediate = false,
    onSuccess,
    onError,
    resetOnExecute = true,
  } = options;

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
    isSuccess: false,
  });

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Execute API call
  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      try {
        // Cancel previous request if still pending
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        // Reset state if configured
        if (resetOnExecute) {
          setState(prev => ({
            ...prev,
            isLoading: true,
            error: null,
            isSuccess: false,
          }));
        } else {
          setState(prev => ({
            ...prev,
            isLoading: true,
            error: null,
          }));
        }

        // Execute API function
        const result = await apiFunction(...args);

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setState({
            data: result,
            isLoading: false,
            error: null,
            isSuccess: true,
          });

          // Call success callback
          if (onSuccess) {
            onSuccess(result);
          }
        }

        return result;
      } catch (error: any) {
        // Only update state if component is still mounted and not aborted
        if (isMountedRef.current && error.name !== 'AbortError') {
          const errorMessage = error.message || 'An error occurred';

          setState(prev => ({
            ...prev,
            isLoading: false,
            error: errorMessage,
            isSuccess: false,
          }));

          // Call error callback
          if (onError) {
            onError(errorMessage);
          }
        }

        return null;
      } finally {
        abortControllerRef.current = null;
      }
    },
    [apiFunction, onSuccess, onError, resetOnExecute]
  );

  // Reset hook state
  const reset = useCallback(() => {
    setState({
      data: null,
      isLoading: false,
      error: null,
      isSuccess: false,
    });
  }, []);

  // Clear error only
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  // Execute immediately if configured
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate]); // Don't include execute to avoid infinite loops

  return {
    ...state,
    execute,
    reset,
    clearError,
  };
}

/**
 * Hook for API calls that need to be executed immediately on mount
 */
export function useApiImmediate<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  dependencies: any[] = [],
  options: Omit<UseApiOptions, 'immediate'> = {}
): UseApiReturn<T> {
  const api = useApi(apiFunction, { ...options, immediate: false });

  useEffect(() => {
    api.execute();
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  return api;
}

/**
 * Hook for paginated API calls
 */
export function usePaginatedApi<T>(
  apiFunction: (page: number, ...args: any[]) => Promise<{ data: T[]; pagination: any }>,
  options: UseApiOptions & { pageSize?: number } = {}
): UseApiReturn<{ data: T[]; pagination: any }> & {
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  hasMore: boolean;
  currentPage: number;
} {
  const { pageSize = 20, ...apiOptions } = options;
  const [currentPage, setCurrentPage] = useState(1);
  const [allData, setAllData] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const api = useApi(apiFunction, apiOptions);

  // Load more data (next page)
  const loadMore = useCallback(async () => {
    if (!hasMore || api.isLoading) return;

    const result = await api.execute(currentPage + 1);
    if (result) {
      setCurrentPage(prev => prev + 1);
      setAllData(prev => [...prev, ...result.data]);
      setHasMore(result.pagination.page < result.pagination.totalPages);
    }
  }, [currentPage, hasMore, api]);

  // Refresh (reset to page 1)
  const refresh = useCallback(async () => {
    setCurrentPage(1);
    setAllData([]);
    setHasMore(true);

    const result = await api.execute(1);
    if (result) {
      setAllData(result.data);
      setHasMore(result.pagination.page < result.pagination.totalPages);
    }
  }, [api]);

  // Initial load
  useEffect(() => {
    refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data: api.data ? { data: allData, pagination: api.data.pagination } : null,
    isLoading: api.isLoading,
    error: api.error,
    isSuccess: api.isSuccess,
    execute: api.execute,
    reset: api.reset,
    clearError: api.clearError,
    loadMore,
    refresh,
    hasMore,
    currentPage,
  };
}

/**
 * Hook for API calls with optimistic updates
 */
export function useOptimisticApi<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  optimisticUpdate: (args: any[]) => T,
  options: UseApiOptions = {}
): UseApiReturn<T> & {
  executeOptimistic: (...args: any[]) => Promise<T | null>;
} {
  const api = useApi(apiFunction, options);

  const executeOptimistic = useCallback(
    async (...args: any[]): Promise<T | null> => {
      // Apply optimistic update immediately
      const optimisticData = optimisticUpdate(args);
      setState(prev => ({
        ...prev,
        data: optimisticData,
        isLoading: true,
        error: null,
      }));

      // Execute actual API call
      const result = await api.execute(...args);

      // If API call fails, the error state will be set by useApi
      // If it succeeds, the real data will replace optimistic data

      return result;
    },
    [api.execute, optimisticUpdate]
  );

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: false,
    error: null,
    isSuccess: false,
  });

  // Sync with main api state
  useEffect(() => {
    setState({
      data: api.data,
      isLoading: api.isLoading,
      error: api.error,
      isSuccess: api.isSuccess,
    });
  }, [api.data, api.isLoading, api.error, api.isSuccess]);

  return {
    ...state,
    execute: api.execute,
    reset: api.reset,
    clearError: api.clearError,
    executeOptimistic,
  };
}

/**
 * Hook for debounced API calls (useful for search)
 */
export function useDebouncedApi<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  delay: number = 300,
  options: UseApiOptions = {}
): UseApiReturn<T> & {
  debouncedExecute: (...args: any[]) => void;
} {
  const api = useApi(apiFunction, options);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedExecute = useCallback(
    (...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        api.execute(...args);
      }, delay);
    },
    [api.execute, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...api,
    debouncedExecute,
  };
}

// Export types
export type { UseApiReturn, UseApiOptions, UseApiState };