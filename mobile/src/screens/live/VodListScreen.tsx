import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { liveService, Vod } from '../../services/live.service';
import { normalizeImageUrl } from '../../config/api.config';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface VodListScreenProps {
  navigation: any;
}

export default function VodListScreen({ navigation }: VodListScreenProps) {
  const { t } = useTranslation('translation');
  const [vods, setVods] = useState<Vod[]>([]);
  const [trendingVods, setTrendingVods] = useState<Vod[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<'recent' | 'trending'>('recent');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [recentResponse, trendingResponse] = await Promise.all([
        liveService.getRecentVods(20),
        liveService.getTrendingVods(10),
      ]);
      setVods(recentResponse);
      setTrendingVods(trendingResponse);
      setPage(1);
      setHasMore(recentResponse.length >= 20);
    } catch (error) {
      console.error('Error fetching VODs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchInitialData();
  }, []);

  const loadMore = async () => {
    if (loadingMore || !hasMore || activeTab === 'trending') return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const response = await liveService.getVods({ page: nextPage, limit: 20 });

      if (response.vods.length > 0) {
        setVods(prev => [...prev, ...response.vods]);
        setPage(nextPage);
        setHasMore(response.page < response.totalPages);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more VODs:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 7) {
      return date.toLocaleDateString();
    }
    if (diffDays > 0) {
      return t('vod.daysAgo', { count: diffDays });
    }
    if (diffHours > 0) {
      return t('vod.hoursAgo', { count: diffHours });
    }
    if (diffMinutes > 0) {
      return t('vod.minutesAgo', { count: diffMinutes });
    }
    return t('vod.justNow');
  };

  const navigateToVod = (vod: Vod) => {
    navigation.navigate('VodPlayer', { vodId: vod.id });
  };

  const renderVodCard = ({ item }: { item: Vod }) => (
    <TouchableOpacity
      style={styles.vodCard}
      onPress={() => navigateToVod(item)}
      activeOpacity={0.8}
    >
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: normalizeImageUrl(item.thumbnailUrl) || 'https://via.placeholder.com/320x180?text=VOD' }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.thumbnailGradient}
        />
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
        </View>
        {item.status === 'processing' && (
          <View style={styles.processingBadge}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.processingText}>{t('vod.processing')}</Text>
          </View>
        )}
      </View>

      <View style={styles.vodInfo}>
        <View style={styles.hostRow}>
          {item.host?.avatar ? (
            <Image
              source={{ uri: normalizeImageUrl(item.host.avatar) || undefined }}
              style={styles.hostAvatar}
            />
          ) : (
            <View style={[styles.hostAvatar, styles.hostAvatarPlaceholder]}>
              <MaterialIcons name="person" size={14} color="#666" />
            </View>
          )}
          <Text style={styles.hostName} numberOfLines={1}>
            {item.host?.name || t('vod.unknownHost')}
          </Text>
          {item.host?.type === 'seller' && (
            <View style={styles.hostBadge}>
              <MaterialIcons name="storefront" size={10} color="#FF6B6B" />
            </View>
          )}
        </View>

        <Text style={styles.vodTitle} numberOfLines={2}>
          {item.stream?.title || t('vod.untitled')}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <MaterialIcons name="visibility" size={12} color="#888" />
            <Text style={styles.statText}>{formatViewCount(item.viewCount)}</Text>
          </View>
          <Text style={styles.statDot}>•</Text>
          <Text style={styles.statText}>{formatTimeAgo(item.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTrendingCard = ({ item, index }: { item: Vod; index: number }) => (
    <TouchableOpacity
      style={styles.trendingCard}
      onPress={() => navigateToVod(item)}
      activeOpacity={0.8}
    >
      <View style={styles.trendingThumbnailContainer}>
        <Image
          source={{ uri: normalizeImageUrl(item.thumbnailUrl) || 'https://via.placeholder.com/200x280?text=VOD' }}
          style={styles.trendingThumbnail}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.trendingGradient}
        />
        <View style={styles.trendingRank}>
          <Text style={styles.trendingRankText}>{index + 1}</Text>
        </View>
        <View style={styles.trendingInfo}>
          <Text style={styles.trendingTitle} numberOfLines={2}>
            {item.stream?.title || t('vod.untitled')}
          </Text>
          <Text style={styles.trendingHost} numberOfLines={1}>
            {item.host?.name || t('vod.unknownHost')}
          </Text>
          <View style={styles.trendingStats}>
            <MaterialIcons name="visibility" size={12} color="#fff" />
            <Text style={styles.trendingStatText}>{formatViewCount(item.viewCount)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{t('vod.replays')}</Text>
      <Text style={styles.headerSubtitle}>{t('vod.watchPastStreams')}</Text>

      {trendingVods.length > 0 && (
        <View style={styles.trendingSection}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="local-fire-department" size={20} color="#FF6B6B" />
            <Text style={styles.sectionTitle}>{t('vod.trending')}</Text>
          </View>
          <FlatList
            data={trendingVods}
            renderItem={renderTrendingCard}
            keyExtractor={(item) => `trending-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingList}
          />
        </View>
      )}

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recent' && styles.tabActive]}
          onPress={() => setActiveTab('recent')}
        >
          <MaterialIcons
            name="schedule"
            size={18}
            color={activeTab === 'recent' ? '#FF6B6B' : '#888'}
          />
          <Text style={[styles.tabText, activeTab === 'recent' && styles.tabTextActive]}>
            {t('vod.recent')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'trending' && styles.tabActive]}
          onPress={() => setActiveTab('trending')}
        >
          <MaterialIcons
            name="trending-up"
            size={18}
            color={activeTab === 'trending' ? '#FF6B6B' : '#888'}
          />
          <Text style={[styles.tabText, activeTab === 'trending' && styles.tabTextActive]}>
            {t('vod.popular')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="video-library" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>{t('vod.noReplays')}</Text>
      <Text style={styles.emptySubtitle}>{t('vod.noReplaysDescription')}</Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#FF6B6B" />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>{t('vod.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayVods = activeTab === 'recent' ? vods : trendingVods;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={displayVods}
        renderItem={renderVodCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B6B"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  trendingSection: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  trendingList: {
    paddingRight: 16,
  },
  trendingCard: {
    width: 140,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  trendingThumbnailContainer: {
    width: 140,
    height: 200,
    position: 'relative',
  },
  trendingThumbnail: {
    width: '100%',
    height: '100%',
  },
  trendingGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  trendingRank: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendingRankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  trendingInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  trendingTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  trendingHost: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
  },
  trendingStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  trendingStatText: {
    color: '#fff',
    fontSize: 11,
    marginLeft: 4,
  },
  tabs: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#fff0f0',
  },
  tabText: {
    fontSize: 14,
    color: '#888',
    marginLeft: 6,
  },
  tabTextActive: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  row: {
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  vodCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnailContainer: {
    width: '100%',
    height: 100,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
  processingBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  processingText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 8,
  },
  vodInfo: {
    padding: 10,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  hostAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  hostAvatarPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostName: {
    flex: 1,
    fontSize: 12,
    color: '#666',
  },
  hostBadge: {
    marginLeft: 4,
  },
  vodTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    lineHeight: 18,
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 11,
    color: '#888',
    marginLeft: 4,
  },
  statDot: {
    color: '#888',
    marginHorizontal: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
