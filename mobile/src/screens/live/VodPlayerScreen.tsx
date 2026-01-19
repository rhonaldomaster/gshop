import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '../../components/live/ProductCard';
import { LiveCheckoutModal } from '../../components/live/LiveCheckoutModal';
import { liveService, Vod } from '../../services/live.service';
import { CachedImage } from '../../components/ui/CachedImage';

const { width, height } = Dimensions.get('window');

interface VodPlayerScreenProps {
  route: {
    params: {
      vodId: string;
    };
  };
  navigation: any;
}

export default function VodPlayerScreen({ route, navigation }: VodPlayerScreenProps) {
  const { t } = useTranslation('translation');
  const { vodId } = route.params;

  const [vod, setVod] = useState<Vod | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showProducts, setShowProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showQuickCheckout, setShowQuickCheckout] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const videoRef = useRef<Video>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchVodData();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [vodId]);

  const fetchVodData = async () => {
    try {
      const data = await liveService.getVodById(vodId);
      setVod(data);
      // Increment view count
      liveService.incrementVodViewCount(vodId);
    } catch (error) {
      console.error('Failed to fetch VOD data:', error);
      Alert.alert(t('common.error'), t('vod.failedToLoadVod'));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error('Video error:', status.error);
      }
      return;
    }

    setIsPlaying(status.isPlaying);
    setDuration(status.durationMillis || 0);
    setPosition(status.positionMillis || 0);
    setIsBuffering(status.isBuffering);

    // Handle video end
    if (status.didJustFinish) {
      setIsPlaying(false);
      setShowControls(true);
    }
  }, []);

  const togglePlayPause = async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  const seekTo = async (positionMs: number) => {
    if (!videoRef.current) return;
    await videoRef.current.setPositionAsync(positionMs);
  };

  const skipForward = async () => {
    const newPosition = Math.min(position + 10000, duration);
    await seekTo(newPosition);
  };

  const skipBackward = async () => {
    const newPosition = Math.max(position - 10000, 0);
    await seekTo(newPosition);
  };

  const handleVideoPress = () => {
    setShowControls(!showControls);
    resetControlsTimeout();
  };

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (count: number): string => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
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

  const onProductPress = (productId: string) => {
    navigation.navigate('ProductDetail', { productId });
  };

  const quickBuyProduct = (product: any) => {
    setSelectedProduct(product);
    setShowQuickCheckout(true);
  };

  const handleCheckoutSuccess = useCallback(() => {
    setShowQuickCheckout(false);
    setSelectedProduct(null);
    Alert.alert(t('common.success'), t('vod.purchaseSuccess'));
  }, [t]);

  const renderProduct = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => onProductPress(item.id)}
    >
      <CachedImage
        uri={item.imageUrl}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.priceRow}>
          {item.specialPrice ? (
            <>
              <Text style={styles.specialPrice}>
                ${item.specialPrice.toLocaleString()}
              </Text>
              <Text style={styles.originalPrice}>
                ${item.price.toLocaleString()}
              </Text>
            </>
          ) : (
            <Text style={styles.productPrice}>
              ${item.price.toLocaleString()}
            </Text>
          )}
        </View>
        {item.orderCount > 0 && (
          <Text style={styles.orderCount}>
            {item.orderCount} {t('vod.sold')}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.buyButton}
        onPress={() => quickBuyProduct(item)}
      >
        <MaterialIcons name="shopping-cart" size={18} color="white" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>{t('vod.loadingVod')}</Text>
      </View>
    );
  }

  if (!vod) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color="#9ca3af" />
        <Text style={styles.errorText}>{t('vod.vodNotFound')}</Text>
        <TouchableOpacity
          style={styles.backButtonLarge}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>{t('common.goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const videoSource = vod.hlsManifestUrl || vod.videoUrl;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Video Player */}
      <TouchableOpacity
        style={styles.videoContainer}
        activeOpacity={1}
        onPress={handleVideoPress}
      >
        <Video
          ref={videoRef}
          style={styles.video}
          source={{ uri: videoSource }}
          useNativeControls={false}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={true}
          isLooping={false}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />

        {/* Buffering Indicator */}
        {isBuffering && (
          <View style={styles.bufferingOverlay}>
            <ActivityIndicator size="large" color="white" />
          </View>
        )}

        {/* Video Controls Overlay */}
        {showControls && (
          <View style={styles.controlsOverlay}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <MaterialIcons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <View style={styles.headerInfo}>
                <Text style={styles.vodTitle} numberOfLines={1}>
                  {vod.stream?.title || t('vod.untitled')}
                </Text>
                {vod.host && (
                  <View style={styles.hostRow}>
                    <Text style={styles.hostName}>{vod.host.name}</Text>
                    <View style={[
                      styles.hostTypeBadge,
                      { backgroundColor: vod.host.type === 'seller' ? '#3b82f6' : '#f59e0b' }
                    ]}>
                      <Text style={styles.hostTypeText}>
                        {vod.host.type === 'seller' ? t('vod.seller') : t('vod.affiliate')}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Center Controls */}
            <View style={styles.centerControls}>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={skipBackward}
              >
                <MaterialIcons name="replay-10" size={32} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.playPauseButton}
                onPress={togglePlayPause}
              >
                <MaterialIcons
                  name={isPlaying ? 'pause' : 'play-arrow'}
                  size={48}
                  color="white"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={skipForward}
              >
                <MaterialIcons name="forward-10" size={32} color="white" />
              </TouchableOpacity>
            </View>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBackground}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: duration > 0 ? `${(position / duration) * 100}%` : '0%' }
                      ]}
                    />
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.progressThumb,
                      { left: duration > 0 ? `${(position / duration) * 100}%` : '0%' }
                    ]}
                    onPress={() => {}}
                  />
                </View>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* VOD Info & Products */}
      <View style={styles.infoContainer}>
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <MaterialIcons name="visibility" size={16} color="#6b7280" />
            <Text style={styles.statText}>
              {formatViewCount(vod.viewCount)} {t('vod.views')}
            </Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="schedule" size={16} color="#6b7280" />
            <Text style={styles.statText}>
              {formatDuration(vod.duration)}
            </Text>
          </View>
          {vod.stream?.peakViewers && vod.stream.peakViewers > 0 && (
            <View style={styles.statItem}>
              <MaterialIcons name="trending-up" size={16} color="#6b7280" />
              <Text style={styles.statText}>
                {formatViewCount(vod.stream.peakViewers)} {t('vod.peakViewers')}
              </Text>
            </View>
          )}
        </View>

        {/* Description */}
        {vod.stream?.description && (
          <Text style={styles.description} numberOfLines={2}>
            {vod.stream.description}
          </Text>
        )}

        {/* Products Section */}
        {vod.products && vod.products.length > 0 && (
          <View style={styles.productsSection}>
            <TouchableOpacity
              style={styles.productsHeader}
              onPress={() => setShowProducts(!showProducts)}
            >
              <View style={styles.productsHeaderLeft}>
                <MaterialIcons name="shopping-bag" size={20} color="#8b5cf6" />
                <Text style={styles.productsTitle}>
                  {t('vod.productsInStream')} ({vod.products.length})
                </Text>
              </View>
              <MaterialIcons
                name={showProducts ? 'expand-less' : 'expand-more'}
                size={24}
                color="#6b7280"
              />
            </TouchableOpacity>

            {showProducts && (
              <FlatList
                data={vod.products}
                renderItem={renderProduct}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                style={styles.productsList}
                scrollEnabled={false}
              />
            )}
          </View>
        )}

        {/* Tags */}
        {vod.stream?.tags && vod.stream.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {vod.stream.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Quick Checkout Modal */}
      {selectedProduct && (
        <LiveCheckoutModal
          visible={showQuickCheckout}
          product={{
            id: selectedProduct.id,
            name: selectedProduct.name,
            price: selectedProduct.price,
            images: [selectedProduct.imageUrl],
            specialPrice: selectedProduct.specialPrice,
          }}
          liveSessionId={vod?.streamId || ''}
          affiliateId={vod?.host?.type === 'affiliate' ? vod?.host?.id : undefined}
          onClose={() => setShowQuickCheckout(false)}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 24,
  },
  errorText: {
    color: '#6b7280',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  backButtonLarge: {
    marginTop: 24,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  videoContainer: {
    width: width,
    height: width * (9 / 16),
    backgroundColor: '#000000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  vodTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  hostName: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginRight: 8,
  },
  hostTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  hostTypeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  centerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  skipButton: {
    padding: 8,
  },
  playPauseButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(139, 92, 246, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    padding: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    color: 'white',
    fontSize: 12,
    minWidth: 45,
    textAlign: 'center',
  },
  progressBarContainer: {
    flex: 1,
    height: 20,
    justifyContent: 'center',
    position: 'relative',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#8b5cf6',
    marginLeft: -6,
  },
  infoContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#6b7280',
    fontSize: 13,
  },
  description: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  productsSection: {
    marginTop: 16,
  },
  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  productsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  productsList: {
    marginTop: 8,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  specialPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  orderCount: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  buyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    marginTop: 16,
    paddingBottom: 16,
  },
  tag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  tagText: {
    fontSize: 13,
    color: '#6b7280',
  },
});
