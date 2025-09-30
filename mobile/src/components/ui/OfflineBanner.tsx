import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNetworkStatus } from '../../hooks/useOfflineSync';

/**
 * Banner that displays when app is offline
 */
export const OfflineBanner: React.FC = () => {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <MaterialIcons name="cloud-off" size={16} color="#fff" />
      <Text style={styles.text}>You're offline</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b6b',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  text: {
    marginLeft: 8,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

/**
 * Sync status banner with pending actions count
 */
interface SyncBannerProps {
  pendingCount: number;
  isSyncing: boolean;
  onSync: () => void;
}

export const SyncBanner: React.FC<SyncBannerProps> = ({
  pendingCount,
  isSyncing,
  onSync,
}) => {
  if (pendingCount === 0 && !isSyncing) return null;

  return (
    <View style={styles.syncBanner}>
      <MaterialIcons
        name={isSyncing ? 'sync' : 'cloud-upload'}
        size={16}
        color="#fff"
      />
      <Text style={styles.text}>
        {isSyncing
          ? 'Syncing...'
          : `${pendingCount} action${pendingCount > 1 ? 's' : ''} pending`}
      </Text>
    </View>
  );
};

const syncStyles = StyleSheet.create({
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffa500',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});

Object.assign(styles, syncStyles);