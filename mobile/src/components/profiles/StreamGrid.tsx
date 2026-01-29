/**
 * Stream Grid Component
 *
 * Displays a grid of streams (live or past) for profile screens.
 * Supports pagination via load more functionality.
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import { normalizeImageUrl } from '../../config/api.config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_COLUMNS = 2;
const GRID_SPACING = 8;
const ITEM_WIDTH = (SCREEN_WIDTH - GRID_SPACING * (GRID_COLUMNS + 1)) / GRID_COLUMNS;

interface StreamItem {
  id: string;
  title: string;
  thumbnailUrl?: string;
  status: 'scheduled' | 'live' | 'ended';
  viewerCount: number;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
}

interface StreamGridProps {
  streams: StreamItem[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onStreamPress?: (stream: StreamItem) => void;
  emptyTitle?: string;
  emptyMessage?: string;
  showLiveBadge?: boolean;
  /** When true, renders as a simple View grid instead of FlatList (use when nested in ScrollView) */
  nestedScrollEnabled?: boolean;
}

export const StreamGrid: React.FC<StreamGridProps> = ({
  streams,
  isLoading,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore,
  onStreamPress,
  emptyTitle,
  emptyMessage,
  showLiveBadge = true,
  nestedScrollEnabled = false,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const formatViewerCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return t('common.today');
    }
    if (diffDays === 1) {
      return t('common.yesterday');
    }
    if (diffDays < 7) {
      return t('common.daysAgo', { count: diffDays });
    }
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return t('common.weeksAgo', { count: weeks });
    }

    return date.toLocaleDateString('es-CO', {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderStreamItem = ({ item }: { item: StreamItem }) => {
    const isLive = item.status === 'live';
    const thumbnailUrl = normalizeImageUrl(item.thumbnailUrl);

    return (
      <TouchableOpacity
        style={styles.streamItem}
        onPress={() => onStreamPress?.(item)}
        activeOpacity={0.8}
      >
        <View style={styles.thumbnailContainer}>
          {thumbnailUrl ? (
            <Image
              source={{ uri: thumbnailUrl }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.thumbnailPlaceholder, { backgroundColor: theme.colors.gray200 }]}>
              <Ionicons name="videocam" size={32} color={theme.colors.gray400} />
            </View>
          )}

          {/* Live Badge */}
          {showLiveBadge && isLive && (
            <View style={[styles.liveBadge, { backgroundColor: theme.colors.error }]}>
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
          )}

          {/* Viewer Count */}
          <View style={styles.viewerCount}>
            <Ionicons name="eye" size={12} color="#fff" />
            <Text style={styles.viewerCountText}>
              {formatViewerCount(item.viewerCount)}
            </Text>
          </View>
        </View>

        <View style={styles.streamInfo}>
          <Text
            style={[styles.streamTitle, { color: theme.colors.text }]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <Text style={[styles.streamDate, { color: theme.colors.textSecondary }]}>
            {isLive ? t('live.liveNow') : formatDate(item.endedAt || item.startedAt || item.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  const handleEndReached = () => {
    if (hasMore && !isLoadingMore && onLoadMore) {
      onLoadMore();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.gridContainer}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.streamItem}>
              <Skeleton width={ITEM_WIDTH - 16} height={ITEM_WIDTH * 0.56} borderRadius={8} />
              <View style={{ marginTop: 8 }}>
                <Skeleton width="90%" height={14} style={{ marginBottom: 4 }} />
                <Skeleton width="60%" height={12} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (streams.length === 0) {
    return (
      <EmptyState
        icon="videocam-off"
        title={emptyTitle || t('profile.noLiveStreams')}
        message={emptyMessage || t('profile.noLiveStreamsMessage')}
      />
    );
  }

  // When nested in a ScrollView, render as simple grid to avoid VirtualizedList warning
  if (nestedScrollEnabled) {
    const rows: StreamItem[][] = [];
    for (let i = 0; i < streams.length; i += GRID_COLUMNS) {
      rows.push(streams.slice(i, i + GRID_COLUMNS));
    }

    return (
      <View style={styles.listContent}>
        {rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.columnWrapper}>
            {row.map((item) => (
              <React.Fragment key={item.id}>
                {renderStreamItem({ item })}
              </React.Fragment>
            ))}
            {row.length < GRID_COLUMNS && (
              <View style={styles.streamItem} />
            )}
          </View>
        ))}
        {renderFooter()}
      </View>
    );
  }

  return (
    <FlatList
      data={streams}
      renderItem={renderStreamItem}
      keyExtractor={(item) => item.id}
      numColumns={GRID_COLUMNS}
      contentContainerStyle={styles.listContent}
      columnWrapperStyle={styles.columnWrapper}
      showsVerticalScrollIndicator={false}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: GRID_SPACING,
  },
  listContent: {
    padding: GRID_SPACING,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  streamItem: {
    width: ITEM_WIDTH,
    marginBottom: GRID_SPACING * 2,
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  viewerCount: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  viewerCountText: {
    color: '#fff',
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '500',
  },
  streamInfo: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  streamTitle: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  streamDate: {
    fontSize: 12,
    marginTop: 4,
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

export default StreamGrid;
