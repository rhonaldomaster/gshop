import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Animated,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

interface LiveStream {
  id: string;
  title: string;
  description: string;
  status: 'scheduled' | 'live' | 'ended';
  viewerCount: number;
  peakViewers: number;
  hostType: 'seller' | 'affiliate';
  thumbnailUrl?: string;
  category?: string;
  tags?: string[];
  seller?: {
    id: string;
    businessName: string;
    profileImage?: string;
  };
  affiliate?: {
    id: string;
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
  scheduledAt?: string;
  startedAt?: string;
}

interface RecommendedStream {
  stream: LiveStream;
  score: number;
  reason: string;
}

export default function LiveForYouFeedScreen({ navigation }: any) {
  const { t } = useTranslation('translation');
  const [recommendations, setRecommendations] = useState<RecommendedStream[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cachedData, setCachedData] = useState<RecommendedStream[]>([]);

  const position = useRef(new Animated.ValueXY()).current;
  const swipeDirection = useRef<'left' | 'right' | null>(null);

  useEffect(() => {
    loadCachedData();
    fetchForYouFeed();
  }, []);

  // Cache data for offline/fast loading
  const loadCachedData = async () => {
    try {
      const cached = await AsyncStorage.getItem('forYouFeedCache');
      if (cached) {
        const parsedCache = JSON.parse(cached);
        setCachedData(parsedCache);
        setRecommendations(parsedCache);
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to load cached data:', error);
    }
  };

  const cacheData = async (data: RecommendedStream[]) => {
    try {
      await AsyncStorage.setItem('forYouFeedCache', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  };

  const fetchForYouFeed = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);

      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${process.env.API_BASE_URL}/live/for-you?limit=20`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.streams || []);
        await cacheData(data.streams || []);
      }
    } catch (error) {
      console.error('Failed to fetch For You feed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setCurrentIndex(0);
    position.setValue({ x: 0, y: 0 });
    fetchForYouFeed(true);
  };

  // Swipe gesture handler
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });

        // Determine swipe direction
        if (Math.abs(gesture.dx) > 10) {
          swipeDirection.current = gesture.dx > 0 ? 'right' : 'left';
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (Math.abs(gesture.dx) >= SWIPE_THRESHOLD) {
          // Swipe detected
          const direction = gesture.dx > 0 ? 'right' : 'left';
          forceSwipe(direction);
        } else {
          // Return to original position
          resetPosition();
        }
      },
    })
  ).current;

  const forceSwipe = (direction: 'left' | 'right') => {
    const x = direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;

    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => onSwipeComplete(direction));
  };

  const onSwipeComplete = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      // Skipped - move to next
      setCurrentIndex((prev) => Math.min(prev + 1, recommendations.length - 1));
    } else {
      // Liked - navigate to stream
      const currentStream = recommendations[currentIndex];
      if (currentStream) {
        navigation.navigate('LiveStream', { streamId: currentStream.stream.id });
      }
    }

    position.setValue({ x: 0, y: 0 });
    swipeDirection.current = null;

    // Load more when reaching end
    if (currentIndex >= recommendations.length - 3) {
      fetchForYouFeed();
    }
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const getCardStyle = () => {
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
      outputRange: ['-30deg', '0deg', '30deg'],
    });

    const opacity = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      outputRange: [0.5, 1, 0.5],
    });

    return {
      ...position.getLayout(),
      transform: [{ rotate }],
      opacity,
    };
  };

  const formatViewerCount = (count: number) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const getReasonIcon = (reason: string) => {
    if (reason.toLowerCase().includes('following') || reason.toLowerCase().includes('siguiendo')) {
      return 'person-add';
    }
    if (reason.toLowerCase().includes('popular') || reason.toLowerCase().includes('trending')) {
      return 'trending-up';
    }
    if (reason.toLowerCase().includes('similar')) {
      return 'thumb-up';
    }
    return 'star';
  };

  const getReasonColor = (reason: string) => {
    if (reason.toLowerCase().includes('following') || reason.toLowerCase().includes('siguiendo')) {
      return '#3b82f6'; // blue
    }
    if (reason.toLowerCase().includes('popular') || reason.toLowerCase().includes('trending')) {
      return '#ef4444'; // red
    }
    if (reason.toLowerCase().includes('similar')) {
      return '#8b5cf6'; // purple
    }
    return '#f59e0b'; // amber
  };

  const renderRecommendationReason = (reason: string) => {
    const reasonParts = reason.split('•').map(r => r.trim()).filter(Boolean);

    return (
      <View style={styles.reasonsContainer}>
        {reasonParts.map((part, index) => (
          <View
            key={`reason-${index}`}
            style={[styles.reasonBadge, { backgroundColor: getReasonColor(part) }] as any}
          >
            <MaterialIcons name={getReasonIcon(part) as any} size={14} color="#fff" />
            <Text style={styles.reasonText}>{part}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderCard = (item: RecommendedStream, index: number) => {
    if (index < currentIndex) return null;
    if (index > currentIndex) {
      // Show next card slightly behind
      return (
        <View style={[styles.card, { marginTop: (index - currentIndex) * 10 }]}>
          <Image
            source={{ uri: item.stream.thumbnailUrl || 'https://via.placeholder.com/400x600' }}
            style={styles.cardImage}
          />
        </View>
      );
    }

    // Current card - interactive
    const isLive = item.stream.status === 'live';
    const hostName = item.stream.hostType === 'seller'
      ? item.stream.seller?.businessName
      : item.stream.affiliate?.name;
    const hostImage = item.stream.hostType === 'seller'
      ? item.stream.seller?.profileImage
      : item.stream.affiliate?.profileImage;

    return (
      <Animated.View
        style={[styles.card, getCardStyle()]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('LiveStream', { streamId: item.stream.id })}
          style={styles.cardTouchable}
        >
          <Image
            source={{ uri: item.stream.thumbnailUrl || 'https://via.placeholder.com/400x600' }}
            style={styles.cardImage}
            resizeMode="cover"
          />

          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          />

          {/* Top badges */}
          <View style={styles.topBadges}>
            {isLive && (
              <View style={styles.liveBadge}>
                <View style={styles.liveIndicator} />
                <Text style={styles.liveBadgeText}>{t('live.live')}</Text>
              </View>
            )}
            <View style={styles.viewerBadge}>
              <MaterialIcons name="visibility" size={16} color="#fff" />
              <Text style={styles.viewerCount}>{formatViewerCount(item.stream.viewerCount)}</Text>
            </View>
          </View>

          {/* Recommendation reasons */}
          <View style={styles.topReasons}>
            {renderRecommendationReason(item.reason)}
          </View>

          {/* Bottom content */}
          <View style={styles.bottomContent}>
            {/* Host info */}
            <View style={styles.hostInfo}>
              {hostImage && (
                <Image source={{ uri: hostImage }} style={styles.hostAvatar} />
              )}
              <View style={styles.hostDetails}>
                <Text style={styles.hostName}>{hostName}</Text>
                <View style={styles.hostTypeBadge}>
                  <MaterialIcons
                    name={item.stream.hostType === 'seller' ? 'store' : 'person'}
                    size={12}
                    color="#fff"
                  />
                  <Text style={styles.hostTypeText}>
                    {item.stream.hostType === 'seller' ? t('live.seller') : t('live.affiliateLabel')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Stream info */}
            <Text style={styles.streamTitle} numberOfLines={2}>
              {item.stream.title}
            </Text>

            {item.stream.description && (
              <Text style={styles.streamDescription} numberOfLines={2}>
                {item.stream.description}
              </Text>
            )}

            {/* Product preview */}
            {item.stream.products && item.stream.products.length > 0 && (
              <View style={styles.productsPreview}>
                <MaterialIcons name="shopping-bag" size={16} color="#fff" />
                <Text style={styles.productsText}>
                  {item.stream.products.length} {t('live.products')}
                </Text>
              </View>
            )}
          </View>

          {/* Swipe hints */}
          <View style={styles.swipeHints}>
            <View style={styles.swipeHintLeft}>
              <MaterialIcons name="close" size={32} color="#ef4444" />
              <Text style={styles.swipeHintText}>{t('live.skip')}</Text>
            </View>
            <View style={styles.swipeHintRight}>
              <MaterialIcons name="favorite" size={32} color="#10b981" />
              <Text style={styles.swipeHintText}>{t('live.watch')}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading && recommendations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ec4899" />
          <Text style={styles.loadingText}>{t('live.loadingRecommendations')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!loading && recommendations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <MaterialIcons name="explore" size={64} color="#9ca3af" />
          <Text style={styles.emptyTitle}>{t('live.noRecommendations')}</Text>
          <Text style={styles.emptyText}>{t('live.noRecommendationsDesc')}</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <MaterialIcons name="refresh" size={20} color="#fff" />
            <Text style={styles.refreshButtonText}>{t('common.refresh')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('live.forYou')}</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshIconButton}>
          <MaterialIcons name="refresh" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Cards container */}
      <View style={styles.cardsContainer}>
        {recommendations
          .slice(currentIndex, currentIndex + 3)
          .map((item, index) => (
            <React.Fragment key={item.stream.id}>
              {renderCard(item, currentIndex + index)}
            </React.Fragment>
          ))}
      </View>

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {recommendations.length}
        </Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.skipButton]}
          onPress={() => forceSwipe('left')}
        >
          <MaterialIcons name="close" size={32} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.watchButton]}
          onPress={() => forceSwipe('right')}
        >
          <MaterialIcons name="favorite" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ec4899',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  refreshIconButton: {
    padding: 8,
  },
  cardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 32,
    height: SCREEN_HEIGHT * 0.7,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardTouchable: {
    flex: 1,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  topBadges: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  liveBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  viewerCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  topReasons: {
    position: 'absolute',
    top: 70,
    left: 16,
    right: 16,
  },
  reasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  reasonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  bottomContent: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  hostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#fff',
  },
  hostDetails: {
    flex: 1,
  },
  hostName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  hostTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hostTypeText: {
    fontSize: 12,
    color: '#e5e7eb',
    fontWeight: '500',
  },
  streamTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  streamDescription: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 12,
  },
  productsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  productsText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  swipeHints: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    transform: [{ translateY: -50 }],
  },
  swipeHintLeft: {
    alignItems: 'center',
    opacity: 0.3,
  },
  swipeHintRight: {
    alignItems: 'center',
    opacity: 0.3,
  },
  swipeHintText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  progressContainer: {
    padding: 12,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingHorizontal: 32,
    paddingBottom: 16,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  skipButton: {
    backgroundColor: '#ef4444',
  },
  watchButton: {
    backgroundColor: '#10b981',
  },
});
