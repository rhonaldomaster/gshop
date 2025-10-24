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
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLiveStreams();
  }, []);

  const fetchLiveStreams = async () => {
    try {
      // In a real app, this would be an API call
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/live/streams/active`);
      if (response.ok) {
        const data = await response.json();
        setStreams(data);
      }
    } catch (error) {
      console.error('Failed to fetch live streams:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLiveStreams();
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
            uri: item.products[0]?.product.images[0] || 'https://via.placeholder.com/300x200'
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
                  {item.hostType === 'seller' ? t('live.seller').toUpperCase() : t('live.affiliate').toUpperCase()}
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

      <FlatList
        data={streams}
        renderItem={renderStreamCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

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
    paddingVertical: 8,
    flexGrow: 1,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
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
});