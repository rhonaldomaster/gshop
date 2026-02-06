import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { buildApiUrl, API_CONFIG, normalizeImageUrl } from '../../config/api.config';
import { affiliatesService } from '../../services/affiliates.service';

interface LiveStream {
  id: string;
  title: string;
  description: string;
  status: 'scheduled' | 'live' | 'ended';
  viewerCount: number;
  hostType: 'seller' | 'affiliate';
  seller?: {
    businessName: string;
    profileImage?: string;
  };
  affiliate?: {
    name: string;
    profileImage?: string;
  };
  products: Array<{
    id: string;
    product: {
      name: string;
      price: number;
      images: string[];
    };
  }>;
  startedAt?: string;
  scheduledAt?: string;
}

export default function LiveStreamsScreen({ navigation }: any) {
  const { t } = useTranslation('translation');
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [filteredStreams, setFilteredStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'live' | 'scheduled'>('all');
  const [hostTypeFilter, setHostTypeFilter] = useState<'all' | 'seller' | 'affiliate'>('all');
  const [sortBy, setSortBy] = useState<'viewers' | 'recent' | 'trending'>('viewers');
  const [isApprovedAffiliate, setIsApprovedAffiliate] = useState(false);

  useEffect(() => {
    fetchLiveStreams();
    checkAffiliateStatus();
  }, []);

  const checkAffiliateStatus = async () => {
    try {
      const res = await affiliatesService.checkAffiliateStatus();
      setIsApprovedAffiliate(res.isAffiliate && res.affiliate?.status === 'approved');
    } catch {
      setIsApprovedAffiliate(false);
    }
  };

  useEffect(() => {
    filterAndSortStreams();
  }, [streams, searchQuery, selectedFilter, hostTypeFilter, sortBy]);

  const fetchLiveStreams = async () => {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.LIVE.ACTIVE), {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStreams(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch live streams:', response.status, response.statusText);
        setStreams([]);
      }
    } catch (error) {
      console.error('Failed to fetch live streams:', error);
      setStreams([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLiveStreams();
  };

  const filterAndSortStreams = () => {
    let filtered = [...streams];

    // Apply text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(stream =>
        stream.title.toLowerCase().includes(query) ||
        (stream.hostType === 'seller' && stream.seller?.businessName.toLowerCase().includes(query)) ||
        (stream.hostType === 'affiliate' && stream.affiliate?.name.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(stream => stream.status === selectedFilter);
    }

    // Apply host type filter
    if (hostTypeFilter !== 'all') {
      filtered = filtered.filter(stream => stream.hostType === hostTypeFilter);
    }

    // Apply sorting
    switch (sortBy) {
      case 'viewers':
        filtered.sort((a, b) => b.viewerCount - a.viewerCount);
        break;
      case 'recent':
        filtered.sort((a, b) => {
          const dateA = new Date(a.startedAt || a.scheduledAt || 0).getTime();
          const dateB = new Date(b.startedAt || b.scheduledAt || 0).getTime();
          return dateB - dateA;
        });
        break;
      case 'trending':
        // Trending = combination of viewers and recency
        filtered.sort((a, b) => {
          const scoreA = a.viewerCount * (a.status === 'live' ? 2 : 1);
          const scoreB = b.viewerCount * (b.status === 'live' ? 2 : 1);
          return scoreB - scoreA;
        });
        break;
    }

    setFilteredStreams(filtered);
  };

  const formatViewerCount = (count: number) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return '#ef4444'; // red
      case 'scheduled':
        return '#3b82f6'; // blue
      case 'ended':
        return '#6b7280'; // gray
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live':
        return t('live.liveNow');
      case 'scheduled':
        return t('live.scheduled');
      case 'ended':
        return t('live.ended');
      default:
        return status.toUpperCase();
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderStreamCard = ({ item }: { item: LiveStream }) => (
    <TouchableOpacity
      style={styles.streamCard}
      onPress={() => {
        if (item.status === 'ended') {
          Alert.alert(t('live.streamEnded'), t('live.streamEndedMessage'));
          return;
        }
        navigation.navigate('LiveStream', { streamId: item.id });
      }}
      activeOpacity={0.7}
    >
      {/* Stream Preview */}
      <View style={styles.streamPreview}>
        <Image
          source={{
            uri: normalizeImageUrl(item.products[0]?.product.images[0]) || 'https://via.placeholder.com/300x200'
          }}
          style={styles.previewImage}
        />

        {/* Gradient Overlay for better text readability */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)']}
          style={styles.gradientOverlay}
        />

        {/* Live Badge with pulsing animation for live streams */}
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) },
          item.status === 'live' && styles.livePulsing
        ]}>
          {item.status === 'live' && (
            <MaterialIcons name="fiber-manual-record" size={8} color="white" style={styles.liveIcon} />
          )}
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>

        {/* Viewer Count */}
        {item.status === 'live' && (
          <View style={styles.viewerBadge}>
            <MaterialIcons name="visibility" size={12} color="white" />
            <Text style={styles.viewerCount}>{formatViewerCount(item.viewerCount)}</Text>
          </View>
        )}

        {/* Host Type Corner Badge */}
        <View style={[styles.hostCornerBadge, {
          backgroundColor: item.hostType === 'seller' ? '#3b82f6' : '#f59e0b'
        }]}>
          <MaterialIcons
            name={item.hostType === 'seller' ? 'store' : 'person'}
            size={12}
            color="white"
          />
        </View>
      </View>

      {/* Stream Info */}
      <View style={styles.streamInfo}>
        <View style={styles.sellerInfo}>
          <View style={styles.sellerAvatar}>
            <Text style={styles.sellerInitial}>
              {item.hostType === 'seller'
                ? item.seller?.businessName.charAt(0).toUpperCase()
                : item.affiliate?.name.charAt(0).toUpperCase()
              }
            </Text>
          </View>
          <View style={styles.streamDetails}>
            <Text style={styles.streamTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.hostInfo}>
              <Text style={styles.sellerName}>
                {item.hostType === 'seller' ? item.seller?.businessName : item.affiliate?.name}
              </Text>
              <View style={[styles.hostTypeBadge, {
                backgroundColor: item.hostType === 'seller' ? '#3b82f6' : '#f59e0b'
              }]}>
                <Text style={styles.hostTypeText}>
                  {item.hostType === 'seller' ? t('live.seller').toUpperCase() : t('live.affiliateLabel').toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.productCount}>
              {t('live.productCount', { count: item.products.length })}
            </Text>
          </View>
        </View>

        {item.status === 'scheduled' && item.scheduledAt && (
          <View style={styles.scheduleInfo}>
            <MaterialIcons name="schedule" size={14} color="#6b7280" />
            <Text style={styles.scheduleText}>
              {t('live.startsAt', { time: formatTime(item.scheduledAt) })}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="live-tv" size={64} color="#d1d5db" />
      <Text style={styles.emptyTitle}>{t('live.noActiveStreams')}</Text>
      <Text style={styles.emptySubtitle}>
        {t('live.checkBackLater')}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>{t('live.loadingStreams')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('live.liveShoppingTitle')}</Text>
        <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
          <MaterialIcons
            name="refresh"
            size={24}
            color={refreshing ? "#d1d5db" : "#374151"}
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('live.searchStreams')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="close" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {/* For You Button */}
        <TouchableOpacity
          style={styles.forYouButton}
          onPress={() => navigation.navigate('LiveForYouFeed')}
        >
          <LinearGradient
            colors={['#ec4899', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.forYouGradient}
          >
            <MaterialIcons name="auto-awesome" size={16} color="#fff" />
            <Text style={styles.forYouText}>{t('live.forYou')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* VOD/Replays Button */}
        <TouchableOpacity
          style={styles.vodButton}
          onPress={() => navigation.navigate('VodList')}
        >
          <MaterialIcons name="play-circle-filled" size={16} color="#8b5cf6" />
          <Text style={styles.vodButtonText}>{t('vod.replays')}</Text>
        </TouchableOpacity>

        <View style={styles.filterDivider} />

        <TouchableOpacity
          style={[styles.filterChip, selectedFilter === 'all' && styles.filterChipActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
            {t('live.all')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, selectedFilter === 'live' && styles.filterChipActive]}
          onPress={() => setSelectedFilter('live')}
        >
          <View style={styles.liveDot} />
          <Text style={[styles.filterText, selectedFilter === 'live' && styles.filterTextActive]}>
            {t('live.liveNow')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, selectedFilter === 'scheduled' && styles.filterChipActive]}
          onPress={() => setSelectedFilter('scheduled')}
        >
          <MaterialIcons name="schedule" size={16} color={selectedFilter === 'scheduled' ? '#8b5cf6' : '#6b7280'} />
          <Text style={[styles.filterText, selectedFilter === 'scheduled' && styles.filterTextActive]}>
            {t('live.scheduled')}
          </Text>
        </TouchableOpacity>

        <View style={styles.filterDivider} />

        {/* Host Type Filters */}
        <TouchableOpacity
          style={[styles.filterChip, hostTypeFilter === 'all' && styles.filterChipActive]}
          onPress={() => setHostTypeFilter('all')}
        >
          <MaterialIcons name="groups" size={16} color={hostTypeFilter === 'all' ? '#8b5cf6' : '#6b7280'} />
          <Text style={[styles.filterText, hostTypeFilter === 'all' && styles.filterTextActive]}>
            {t('live.allHosts')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, hostTypeFilter === 'seller' && styles.filterChipActive]}
          onPress={() => setHostTypeFilter('seller')}
        >
          <MaterialIcons name="store" size={16} color={hostTypeFilter === 'seller' ? '#10b981' : '#6b7280'} />
          <Text style={[styles.filterText, hostTypeFilter === 'seller' && styles.filterTextActive, hostTypeFilter === 'seller' && { color: '#10b981' }]}>
            {t('live.sellers')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, hostTypeFilter === 'affiliate' && styles.filterChipActive]}
          onPress={() => setHostTypeFilter('affiliate')}
        >
          <MaterialIcons name="person" size={16} color={hostTypeFilter === 'affiliate' ? '#8b5cf6' : '#6b7280'} />
          <Text style={[styles.filterText, hostTypeFilter === 'affiliate' && styles.filterTextActive]}>
            {t('live.creators')}
          </Text>
        </TouchableOpacity>

        <View style={styles.filterDivider} />

        <TouchableOpacity
          style={[styles.filterChip, sortBy === 'viewers' && styles.filterChipActive]}
          onPress={() => setSortBy('viewers')}
        >
          <MaterialIcons name="visibility" size={16} color={sortBy === 'viewers' ? '#8b5cf6' : '#6b7280'} />
          <Text style={[styles.filterText, sortBy === 'viewers' && styles.filterTextActive]}>
            {t('live.mostViewers')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, sortBy === 'recent' && styles.filterChipActive]}
          onPress={() => setSortBy('recent')}
        >
          <MaterialIcons name="access-time" size={16} color={sortBy === 'recent' ? '#8b5cf6' : '#6b7280'} />
          <Text style={[styles.filterText, sortBy === 'recent' && styles.filterTextActive]}>
            {t('live.recent')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, sortBy === 'trending' && styles.filterChipActive]}
          onPress={() => setSortBy('trending')}
        >
          <MaterialIcons name="trending-up" size={16} color={sortBy === 'trending' ? '#8b5cf6' : '#6b7280'} />
          <Text style={[styles.filterText, sortBy === 'trending' && styles.filterTextActive]}>
            {t('live.trending')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <FlatList
        data={filteredStreams}
        renderItem={renderStreamCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          filteredStreams.length === 0 && { paddingTop: 0, flexGrow: 0 },
          isApprovedAffiliate && { paddingBottom: 80 }
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {isApprovedAffiliate && (
        <TouchableOpacity
          style={styles.goLiveFab}
          onPress={() => navigation.navigate('Profile', { screen: 'CreateAffiliateLiveStream' })}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#ef4444', '#ec4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.goLiveGradient}
          >
            <MaterialIcons name="videocam" size={20} color="#fff" />
            <Text style={styles.goLiveText}>{t('live.goLive')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  streamCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streamPreview: {
    position: 'relative',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f3f4f6',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  livePulsing: {
    // Add subtle pulsing animation
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  hostCornerBadge: {
    position: 'absolute',
    top: 12,
    right: 52, // Position next to viewer count
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  liveIcon: {
    marginRight: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewerBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  viewerCount: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
  },
  streamInfo: {
    padding: 16,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sellerInitial: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  streamDetails: {
    flex: 1,
  },
  streamTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  sellerName: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  hostTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  hostTypeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  productCount: {
    fontSize: 12,
    color: '#9ca3af',
  },
  scheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  scheduleText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  filtersContainer: {
    marginBottom: 8,
    height: 48,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    gap: 6,
    height: 40,
  },
  filterChipActive: {
    backgroundColor: '#ede9fe',
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  filterText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
  forYouButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  forYouGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    height: 40,
  },
  forYouText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#fff',
    fontWeight: '700',
  },
  filterDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#d1d5db',
    marginHorizontal: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  vodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ede9fe',
    borderWidth: 1,
    borderColor: '#8b5cf6',
    gap: 6,
    height: 40,
  },
  vodButtonText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  goLiveFab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  goLiveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  goLiveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});