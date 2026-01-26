/**
 * Product Grid Component
 *
 * Displays a grid of products for seller profile screens.
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
import { useTheme } from '../../contexts/ThemeContext';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_COLUMNS = 2;
const GRID_SPACING = 8;
const ITEM_WIDTH = (SCREEN_WIDTH - GRID_SPACING * (GRID_COLUMNS + 1)) / GRID_COLUMNS;

interface ProductItem {
  id: string;
  name: string;
  price: number;
  images: string[];
  vatType?: string;
  stock?: number;
}

interface ProductGridProps {
  products: ProductItem[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onProductPress?: (product: ProductItem) => void;
  emptyTitle?: string;
  emptyMessage?: string;
  currency?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore,
  onProductPress,
  emptyTitle = 'No products',
  emptyMessage = 'No products available yet',
  currency = 'COP',
}) => {
  const { theme } = useTheme();

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const renderProductItem = ({ item }: { item: ProductItem }) => {
    const imageUrl = item.images && item.images.length > 0 ? item.images[0] : null;
    const isOutOfStock = item.stock !== undefined && item.stock <= 0;

    return (
      <TouchableOpacity
        style={styles.productItem}
        onPress={() => onProductPress?.(item)}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.gray200 }]}>
              <Ionicons name="image-outline" size={32} color={theme.colors.gray400} />
            </View>
          )}

          {/* Out of Stock Badge */}
          {isOutOfStock && (
            <View style={[styles.outOfStockBadge, { backgroundColor: theme.colors.gray700 }]}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <Text
            style={[styles.productName, { color: theme.colors.text }]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
          <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
            {formatPrice(item.price)}
          </Text>
          {item.vatType && (
            <Text style={[styles.vatLabel, { color: theme.colors.textSecondary }]}>
              IVA {item.vatType}
            </Text>
          )}
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
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={styles.productItem}>
              <Skeleton width={ITEM_WIDTH - 16} height={ITEM_WIDTH} borderRadius={8} />
              <View style={{ marginTop: 8 }}>
                <Skeleton width="90%" height={14} style={{ marginBottom: 4 }} />
                <Skeleton width="60%" height={16} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon="cube-outline"
        title={emptyTitle}
        message={emptyMessage}
      />
    );
  }

  return (
    <FlatList
      data={products}
      renderItem={renderProductItem}
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
  productItem: {
    width: ITEM_WIDTH,
    marginBottom: GRID_SPACING * 2,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  productInfo: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  productName: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  vatLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

export default ProductGrid;
