import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  FlatList,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { normalizeImageUrl } from '../../config/api.config';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StreamProduct {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    stock?: number;
  };
  specialPrice?: number;
  isActive: boolean;
}

interface ProductOverlayTikTokProps {
  products: StreamProduct[];
  pinnedProductId: string | null;
  purchaseCount: number;
  onQuickBuy: (product: StreamProduct) => void;
  onViewProduct: (productId: string) => void;
  onExpandProducts: () => void;
  timerEndTime?: Date | null;
  isHost?: boolean;
  onPinProduct?: (productId: string) => void;
}

export function ProductOverlayTikTok({
  products,
  pinnedProductId,
  purchaseCount,
  onQuickBuy,
  onViewProduct,
  onExpandProducts,
  timerEndTime,
  isHost = false,
  onPinProduct,
}: ProductOverlayTikTokProps) {
  const { t } = useTranslation('translation');
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [showAllProducts, setShowAllProducts] = useState(false);

  const pinnedProduct = products.find(p => p?.product?.id === pinnedProductId);
  const activeProducts = products.filter(p => p?.isActive && p?.product);

  // Animations
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const purchaseCountAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  // Pinned product bounce animation
  useEffect(() => {
    if (pinnedProductId) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }

    return () => {
      bounceAnim.setValue(1);
      glowAnim.setValue(0);
    };
  }, [pinnedProductId]);

  // Purchase count animation
  useEffect(() => {
    if (purchaseCount > 0) {
      Animated.sequence([
        Animated.timing(purchaseCountAnim, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(purchaseCountAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // Haptic feedback on new purchase
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [purchaseCount]);

  // Slide in animation
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!timerEndTime) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const diff = timerEndTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining(null);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [timerEndTime]);

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`;
  };

  const calculateDiscount = (original: number, special: number) => {
    return Math.round(((original - special) / original) * 100);
  };

  const handleQuickBuy = (product: StreamProduct) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onQuickBuy(product);
  };

  const handlePinProduct = (productId: string) => {
    if (onPinProduct) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPinProduct(productId);
    }
  };

  const glowStyle = {
    shadowColor: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['#8b5cf6', '#f59e0b'],
    }),
    shadowOpacity: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.8],
    }),
    shadowRadius: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [8, 16],
    }),
  };

  const renderPinnedProduct = () => {
    if (!pinnedProduct?.product) return null;

    const hasDiscount = pinnedProduct.specialPrice && pinnedProduct.specialPrice < pinnedProduct.product.price;
    const displayPrice = pinnedProduct.specialPrice || pinnedProduct.product.price;

    return (
      <Animated.View
        style={[
          styles.pinnedContainer,
          {
            transform: [
              { scale: bounceAnim },
              { translateX: slideAnim },
            ],
          },
          glowStyle,
        ]}
      >
        {/* Timer badge */}
        {timeRemaining && (
          <View style={styles.timerBadge}>
            <MaterialIcons name="timer" size={12} color="#ef4444" />
            <Text style={styles.timerText}>{timeRemaining}</Text>
          </View>
        )}

        {/* Pinned badge */}
        <View style={styles.pinnedBadge}>
          <MaterialIcons name="push-pin" size={12} color="white" />
          <Text style={styles.pinnedBadgeText}>{t('live.pinned')}</Text>
        </View>

        <TouchableOpacity
          style={styles.pinnedProductCard}
          onPress={() => onViewProduct(pinnedProduct.product.id)}
          activeOpacity={0.9}
        >
          <Image
            source={{
              uri: normalizeImageUrl(pinnedProduct.product.images?.[0]) || 'https://via.placeholder.com/80x80',
            }}
            style={styles.pinnedProductImage}
          />

          <View style={styles.pinnedProductInfo}>
            <Text style={styles.pinnedProductName} numberOfLines={1}>
              {pinnedProduct.product.name}
            </Text>

            <View style={styles.priceRow}>
              <Text style={styles.pinnedPrice}>{formatPrice(displayPrice)}</Text>
              {hasDiscount && (
                <>
                  <Text style={styles.originalPrice}>
                    {formatPrice(pinnedProduct.product.price)}
                  </Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>
                      -{calculateDiscount(pinnedProduct.product.price, displayPrice)}%
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Purchase counter */}
            {purchaseCount > 0 && (
              <Animated.View
                style={[
                  styles.purchaseCounter,
                  { transform: [{ scale: purchaseCountAnim }] },
                ]}
              >
                <MaterialIcons name="local-fire-department" size={14} color="#ef4444" />
                <Text style={styles.purchaseCountText}>
                  {purchaseCount} {t('live.soldDuringStream')}
                </Text>
              </Animated.View>
            )}
          </View>

          <TouchableOpacity
            style={styles.quickBuyButton}
            onPress={() => handleQuickBuy(pinnedProduct)}
          >
            <MaterialIcons name="flash-on" size={18} color="white" />
            <Text style={styles.quickBuyText}>{t('live.buy')}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderMiniProduct = ({ item, index }: { item: StreamProduct; index: number }) => {
    if (!item?.product?.id || item.product.id === pinnedProductId) return null;

    const hasDiscount = item.specialPrice && item.specialPrice < item.product.price;
    const displayPrice = item.specialPrice || item.product.price;

    return (
      <TouchableOpacity
        style={styles.miniProductCard}
        onPress={() => onViewProduct(item.product.id)}
        onLongPress={() => isHost && handlePinProduct(item.product.id)}
        delayLongPress={500}
      >
        <Image
          source={{
            uri: normalizeImageUrl(item.product.images?.[0]) || 'https://via.placeholder.com/50x50',
          }}
          style={styles.miniProductImage}
        />
        {hasDiscount && (
          <View style={styles.miniDiscountBadge}>
            <Text style={styles.miniDiscountText}>
              -{calculateDiscount(item.product.price, displayPrice)}%
            </Text>
          </View>
        )}
        <View style={styles.miniPriceTag}>
          <Text style={styles.miniPrice}>{formatPrice(displayPrice)}</Text>
        </View>

        {/* Quick add button */}
        <TouchableOpacity
          style={styles.miniAddButton}
          onPress={() => handleQuickBuy(item)}
        >
          <MaterialIcons name="add-shopping-cart" size={14} color="white" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Pinned product - always visible */}
      {renderPinnedProduct()}

      {/* Products carousel - bottom */}
      {activeProducts.length > (pinnedProductId ? 1 : 0) && (
        <View style={styles.carouselContainer}>
          <TouchableOpacity
            style={styles.expandButton}
            onPress={onExpandProducts}
          >
            <MaterialIcons name="shopping-bag" size={16} color="white" />
            <Text style={styles.expandButtonText}>
              {activeProducts.length} {t('live.products')}
            </Text>
            <MaterialIcons name="expand-less" size={16} color="white" />
          </TouchableOpacity>

          <FlatList
            data={activeProducts}
            renderItem={renderMiniProduct}
            keyExtractor={(item, index) => item?.id || `product-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
          />
        </View>
      )}

      {/* Host hint */}
      {isHost && (
        <View style={styles.hostHint}>
          <MaterialIcons name="info-outline" size={12} color="rgba(255,255,255,0.7)" />
          <Text style={styles.hostHintText}>{t('live.longPressToPin')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 160,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
  },
  pinnedContainer: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'visible',
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  timerBadge: {
    position: 'absolute',
    top: -10,
    right: 60,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    zIndex: 10,
  },
  timerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  pinnedBadge: {
    position: 'absolute',
    top: -10,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    zIndex: 10,
  },
  pinnedBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  pinnedProductCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 10,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  pinnedProductImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  pinnedProductInfo: {
    flex: 1,
    marginLeft: 12,
  },
  pinnedProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  pinnedPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#b45309',
  },
  purchaseCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  purchaseCountText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '500',
  },
  quickBuyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
    marginLeft: 8,
  },
  quickBuyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  carouselContainer: {
    marginTop: 8,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 8,
    gap: 6,
  },
  expandButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  carouselContent: {
    paddingHorizontal: 4,
  },
  miniProductCard: {
    width: 80,
    marginRight: 10,
    position: 'relative',
  },
  miniProductImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  miniDiscountBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#ef4444',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniDiscountText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: 'white',
  },
  miniPriceTag: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  miniPrice: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
  },
  miniAddButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#8b5cf6',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  hostHintText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
