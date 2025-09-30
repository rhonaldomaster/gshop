import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Offline storage utilities for caching data
 * Enables basic offline functionality
 */

const STORAGE_KEYS = {
  PRODUCTS: '@gshop:products',
  CART: '@gshop:cart',
  USER: '@gshop:user',
  ORDERS: '@gshop:orders',
  WISHLIST: '@gshop:wishlist',
  PENDING_ACTIONS: '@gshop:pending_actions',
  LAST_SYNC: '@gshop:last_sync',
} as const;

interface CachedData<T> {
  data: T;
  timestamp: number;
  expiresIn?: number; // milliseconds
}

interface PendingAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
}

/**
 * Save data to offline storage with optional expiration
 */
export const saveToCache = async <T>(
  key: string,
  data: T,
  expiresIn?: number
): Promise<void> => {
  try {
    const cachedData: CachedData<T> = {
      data,
      timestamp: Date.now(),
      expiresIn,
    };
    await AsyncStorage.setItem(key, JSON.stringify(cachedData));
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
};

/**
 * Load data from offline storage
 * Returns null if expired or not found
 */
export const loadFromCache = async <T>(key: string): Promise<T | null> => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const cachedData: CachedData<T> = JSON.parse(cached);

    // Check expiration
    if (cachedData.expiresIn) {
      const age = Date.now() - cachedData.timestamp;
      if (age > cachedData.expiresIn) {
        await AsyncStorage.removeItem(key);
        return null;
      }
    }

    return cachedData.data;
  } catch (error) {
    console.error('Error loading from cache:', error);
    return null;
  }
};

/**
 * Clear specific cache key
 */
export const clearCache = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

/**
 * Clear all app cache
 */
export const clearAllCache = async (): Promise<void> => {
  try {
    const keys = Object.values(STORAGE_KEYS);
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
};

/**
 * Queue an action to be executed when back online
 */
export const queuePendingAction = async (
  type: string,
  payload: any
): Promise<void> => {
  try {
    const existingActions = await loadFromCache<PendingAction[]>(
      STORAGE_KEYS.PENDING_ACTIONS
    );
    const actions = existingActions || [];

    const newAction: PendingAction = {
      id: `${Date.now()}_${Math.random()}`,
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
    };

    actions.push(newAction);
    await saveToCache(STORAGE_KEYS.PENDING_ACTIONS, actions);
  } catch (error) {
    console.error('Error queuing action:', error);
  }
};

/**
 * Get all pending actions
 */
export const getPendingActions = async (): Promise<PendingAction[]> => {
  const actions = await loadFromCache<PendingAction[]>(
    STORAGE_KEYS.PENDING_ACTIONS
  );
  return actions || [];
};

/**
 * Remove a pending action
 */
export const removePendingAction = async (actionId: string): Promise<void> => {
  try {
    const actions = await getPendingActions();
    const filtered = actions.filter(a => a.id !== actionId);
    await saveToCache(STORAGE_KEYS.PENDING_ACTIONS, filtered);
  } catch (error) {
    console.error('Error removing pending action:', error);
  }
};

/**
 * Clear all pending actions
 */
export const clearPendingActions = async (): Promise<void> => {
  await clearCache(STORAGE_KEYS.PENDING_ACTIONS);
};

/**
 * Update last sync timestamp
 */
export const updateLastSync = async (): Promise<void> => {
  await saveToCache(STORAGE_KEYS.LAST_SYNC, Date.now());
};

/**
 * Get last sync timestamp
 */
export const getLastSync = async (): Promise<number | null> => {
  return await loadFromCache<number>(STORAGE_KEYS.LAST_SYNC);
};

/**
 * Check if data is stale (older than threshold)
 */
export const isDataStale = async (
  key: string,
  thresholdMs: number
): Promise<boolean> => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return true;

    const cachedData: CachedData<any> = JSON.parse(cached);
    const age = Date.now() - cachedData.timestamp;

    return age > thresholdMs;
  } catch (error) {
    return true;
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = async (): Promise<{
  totalKeys: number;
  totalSize: number;
}> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const gshopKeys = keys.filter(k => k.startsWith('@gshop:'));

    // Note: Can't easily get size in React Native AsyncStorage
    return {
      totalKeys: gshopKeys.length,
      totalSize: 0, // Would need native module for actual size
    };
  } catch (error) {
    return { totalKeys: 0, totalSize: 0 };
  }
};

export { STORAGE_KEYS };