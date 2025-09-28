import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../contexts/ThemeContext';
import { useProducts } from '../../hooks/useProducts';
import { useCart } from '../../hooks/useCart';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import { Product, ProductSearchFilters } from '../../services/products.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = (SCREEN_WIDTH - 60) / 2; // 2 columns with margins

// Navigation types
type ProductListStackParamList = {
  ProductList: {
    title?: string;
    categoryId?: string;
    sellerId?: string;
    filters?: ProductSearchFilters;
  };
};

type ProductListScreenRouteProp = RouteProp<ProductListStackParamList, 'ProductList'>;
type ProductListScreenNavigationProp = StackNavigationProp<ProductListStackParamList, 'ProductList'>;

interface Props {
  route: ProductListScreenRouteProp;
  navigation: ProductListScreenNavigationProp;
}

// Product Card Component (Optimized for List View)
interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onAddToCart: () => void;
}

const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, onPress, onAddToCart }) => {
  const { theme } = useTheme();
  const { formatPrice, getDiscountPercentage, isInStock } = useProducts();

  const discountPercentage = getDiscountPercentage(product);
  const inStock = isInStock(product);

  return (
    <TouchableOpacity
      style={[styles.productCard, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Product Image */}
      <View style={styles.productImageContainer}>
        {product.images && product.images.length > 0 ? (
          <View style={styles.productImagePlaceholder}>
            <GSText variant="caption" color="textSecondary">IMG</GSText>
          </View>
        ) : (
          <View style={styles.productImagePlaceholder}>
            <GSText variant="caption" color="textSecondary">No Image</GSText>
          </View>
        )}

        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <View style={[styles.discountBadge, { backgroundColor: theme.colors.error }]}>
            <GSText variant="caption" color="white" weight="bold">
              -{discountPercentage}%
            </GSText>
          </View>
        )}

        {/* Stock Badge */}
        {!inStock && (
          <View style={[styles.stockBadge, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
            <GSText variant="caption" color="white" weight="medium">
              Out of Stock
            </GSText>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <GSText
          variant="body"
          weight="medium"
          numberOfLines={2}
          style={styles.productName}
        >
          {product.name}
        </GSText>

        {/* Price */}
        <View style={styles.priceContainer}>
          <GSText variant="body" weight="bold" color="primary">
            {formatPrice(product.price)}
          </GSText>
          {product.originalPrice && product.originalPrice > product.price && (
            <GSText
              variant="caption"
              color="textSecondary"
              style={styles.originalPrice}
            >
              {formatPrice(product.originalPrice)}
            </GSText>
          )}
        </View>

        {/* Rating */}
        {product.rating && product.rating > 0 && (
          <View style={styles.ratingContainer}>
            <GSText variant="caption" color="textSecondary">
              ⭐ {product.rating.toFixed(1)} ({product.reviewCount || 0})
            </GSText>
          </View>
        )}

        {/* Add to Cart Button */}
        <TouchableOpacity
          style={[
            styles.addToCartButton,
            {
              backgroundColor: inStock ? theme.colors.primary : theme.colors.border,
            }
          ]}
          onPress={onAddToCart}
          disabled={!inStock}
        >
          <GSText
            variant="caption"
            color={inStock ? 'white' : 'textSecondary'}
            weight="medium"
          >
            {inStock ? 'Add to Cart' : 'Unavailable'}
          </GSText>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

// Sort Options Modal
interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (sortBy: string) => void;
  currentSort?: string;
}

const SortModal: React.FC<SortModalProps> = ({ visible, onClose, onSelect, currentSort }) => {
  const { theme } = useTheme();

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Best Rated' },
    { value: 'popularity', label: 'Most Popular' },
    { value: 'sales', label: 'Best Sellers' },
  ];

  if (!visible) return null;

  return (
    <View style={styles.sortModalOverlay}>
      <TouchableOpacity style={styles.sortModalBackdrop} onPress={onClose} />
      <View style={[styles.sortModal, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.sortModalHeader}>
          <GSText variant="h4" weight="bold">Sort By</GSText>
          <TouchableOpacity onPress={onClose}>
            <GSText variant="body" color="primary">Done</GSText>
          </TouchableOpacity>
        </View>

        {sortOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.sortOption,
              {
                backgroundColor: currentSort === option.value
                  ? theme.colors.primary + '20'
                  : 'transparent',
              }
            ]}
            onPress={() => {
              onSelect(option.value);
              onClose();
            }}
          >
            <GSText
              variant="body"
              color={currentSort === option.value ? 'primary' : 'text'}
              weight={currentSort === option.value ? 'medium' : 'normal'}
            >
              {option.label}
            </GSText>
            {currentSort === option.value && (
              <GSText variant="body" color="primary">✓</GSText>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Main ProductListScreen Component
export default function ProductListScreen({ route, navigation }: Props) {
  const { title, categoryId, sellerId, filters: initialFilters } = route.params || {};
  const { theme } = useTheme();
  const {
    products,
    hasMore,
    isLoading,
    isLoadingMore,
    isRefreshing,
    currentPage,
    totalProducts,
    loadProducts,
    loadMoreProducts,
    refreshAllData,
    getProductsByCategory,
    getProductsBySeller,
    updateFilters,
  } = useProducts();
  const { addToCart } = useCart();

  // Local state
  const [currentFilters, setCurrentFilters] = useState<ProductSearchFilters>(initialFilters || {});
  const [showSortModal, setShowSortModal] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Set navigation title
  useEffect(() => {
    if (title) {
      navigation.setOptions({ title });
    }
  }, [title, navigation]);

  // Load products based on route params
  useEffect(() => {
    loadInitialProducts();
  }, [categoryId, sellerId, initialFilters]);

  const loadInitialProducts = async () => {
    try {
      setIsInitialLoad(true);

      const filters = { ...currentFilters, ...initialFilters };

      if (categoryId) {
        await getProductsByCategory(categoryId, filters);
      } else if (sellerId) {
        await getProductsBySeller(sellerId, filters);
      } else {
        await loadProducts(filters, true);
      }
    } catch (error) {
      console.error('Failed to load initial products:', error);
    } finally {
      setIsInitialLoad(false);
    }
  };

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await loadInitialProducts();
  }, [categoryId, sellerId, currentFilters]);

  // Handle load more
  const handleLoadMore = useCallback(async () => {
    if (hasMore && !isLoadingMore && !isLoading) {
      await loadMoreProducts();
    }
  }, [hasMore, isLoadingMore, isLoading, loadMoreProducts]);

  // Handle product press
  const handleProductPress = useCallback((product: Product) => {
    navigation.navigate('ProductDetail' as any, { productId: product.id });
  }, [navigation]);

  // Handle add to cart
  const handleAddToCart = useCallback(async (product: Product) => {
    await addToCart(product, 1);
  }, [addToCart]);

  // Handle sort change
  const handleSortChange = useCallback(async (sortBy: string) => {
    const newFilters = { ...currentFilters, sortBy: sortBy as any };
    setCurrentFilters(newFilters);
    updateFilters(newFilters);

    // Reload products with new sort
    if (categoryId) {
      await getProductsByCategory(categoryId, newFilters);
    } else if (sellerId) {
      await getProductsBySeller(sellerId, newFilters);
    } else {
      await loadProducts(newFilters, true);
    }
  }, [currentFilters, categoryId, sellerId, updateFilters, getProductsByCategory, getProductsBySeller, loadProducts]);

  // Render product item
  const renderProduct = useCallback(({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      onPress={() => handleProductPress(item)}
      onAddToCart={() => handleAddToCart(item)}
    />
  ), [handleProductPress, handleAddToCart]);

  // Render footer
  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <GSText variant="body" color="textSecondary" style={styles.loadingFooterText}>
          Loading more products...
        </GSText>
      </View>
    );
  }, [isLoadingMore, theme.colors.primary]);

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <GSText variant="h3" weight="bold" color="textSecondary">
        No products found
      </GSText>
      <GSText variant="body" color="textSecondary" style={styles.emptyStateText}>
        {categoryId
          ? 'No products in this category yet'
          : sellerId
          ? 'This seller has no products yet'
          : 'No products match your criteria'}
      </GSText>
      <GSButton
        title="Refresh"
        onPress={handleRefresh}
        style={styles.refreshButton}
        variant="outlined"
      />
    </View>
  );

  // Show initial loading
  if (isInitialLoad) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <GSText variant="body" style={styles.loadingText}>Loading products...</GSText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header with results count and sort */}
      <View style={styles.header}>
        <GSText variant="body" color="textSecondary">
          {totalProducts} product{totalProducts !== 1 ? 's' : ''} found
        </GSText>
        <TouchableOpacity
          style={[styles.sortButton, { borderColor: theme.colors.border }]}
          onPress={() => setShowSortModal(true)}
        >
          <GSText variant="body">Sort</GSText>
          <GSText variant="body" color="textSecondary">⌄</GSText>
        </TouchableOpacity>
      </View>

      {/* Products List */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.productsList,
          products.length === 0 && styles.emptyList,
        ]}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        getItemLayout={(data, index) => ({
          length: 280, // Approximate item height
          offset: 280 * Math.floor(index / 2),
          index,
        })}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={6}
      />

      {/* Sort Modal */}
      <SortModal
        visible={showSortModal}
        onClose={() => setShowSortModal(false)}
        onSelect={handleSortChange}
        currentSort={currentFilters.sortBy}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 6,
    gap: 4,
  },
  productsList: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: ITEM_WIDTH,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  productImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  stockBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  productInfo: {
    gap: 4,
  },
  productName: {
    minHeight: 40, // 2 lines minimum
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  originalPrice: {
    textDecorationLine: 'line-through',
  },
  ratingContainer: {
    marginTop: 2,
  },
  addToCartButton: {
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  loadingFooterText: {
    textAlign: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    marginTop: 8,
    marginBottom: 20,
    textAlign: 'center',
  },
  refreshButton: {
    minWidth: 120,
  },

  // Sort Modal Styles
  sortModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  sortModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sortModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '50%',
  },
  sortModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
});