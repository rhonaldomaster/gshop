import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  getPendingActions,
  removePendingAction,
  queuePendingAction,
  updateLastSync,
} from '../utils/offlineStorage';

interface OfflineSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSync: Date | null;
}

interface UseOfflineSyncReturn extends OfflineSyncState {
  syncNow: () => Promise<void>;
  queueAction: (type: string, payload: any) => Promise<void>;
}

/**
 * Hook for managing offline sync state
 * Automatically syncs pending actions when connection is restored
 */
export const useOfflineSync = (
  syncHandler: (action: any) => Promise<void>
): UseOfflineSyncReturn => {
  const [state, setState] = useState<OfflineSyncState>({
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
    lastSync: null,
  });

  useEffect(() => {
    // Subscribe to network state
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected && state.isInternetReachable !== false;
      setState(prev => ({ ...prev, isOnline: isConnected }));

      // Trigger sync when coming back online
      if (isConnected && !state.isSyncing) {
        syncPendingActions();
      }
    });

    // Initial sync check
    checkPendingCount();

    return () => unsubscribe();
  }, []);

  const checkPendingCount = async () => {
    const actions = await getPendingActions();
    setState(prev => ({ ...prev, pendingCount: actions.length }));
  };

  const syncPendingActions = async () => {
    try {
      setState(prev => ({ ...prev, isSyncing: true }));

      const actions = await getPendingActions();

      for (const action of actions) {
        try {
          await syncHandler(action);
          await removePendingAction(action.id);
        } catch (error) {
          console.error('Failed to sync action:', action.id, error);
          // Leave failed action in queue
        }
      }

      await updateLastSync();
      setState(prev => ({
        ...prev,
        isSyncing: false,
        pendingCount: 0,
        lastSync: new Date(),
      }));
    } catch (error) {
      console.error('Sync error:', error);
      setState(prev => ({ ...prev, isSyncing: false }));
    }
  };

  const syncNow = useCallback(async () => {
    if (!state.isOnline) {
      console.warn('Cannot sync while offline');
      return;
    }

    await syncPendingActions();
  }, [state.isOnline]);

  const queueAction = useCallback(async (type: string, payload: any) => {
    await queuePendingAction(type, payload);
    await checkPendingCount();
  }, []);

  return {
    ...state,
    syncNow,
    queueAction,
  };
};

/**
 * Simple online/offline status hook
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected && state.isInternetReachable !== false);
    });

    return () => unsubscribe();
  }, []);

  return isOnline;
};