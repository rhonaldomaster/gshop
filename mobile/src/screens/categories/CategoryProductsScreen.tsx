import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../contexts/ThemeContext';
import GSText from '../../components/ui/GSText';
import categoriesService, { CategoryProductsParams } from '../../services/categories.service';
import { Product } from '../../services/products.service';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '../../hooks/useProducts';

type CategoryProductsRouteProp = RouteProp<{
  params: {
    categoryId: string;
    categoryName: string;
  };
}, 'params'>;

type CategoryProductsNavigationProp = StackNavigationProp<any>;

export default function CategoryProductsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<CategoryProductsNavigationProp>();
  const route = useRoute<CategoryProductsRouteProp>();
  const { formatPrice } = useProducts();

  const { categoryId, categoryName } = route.params;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);

  const [filters] = useState<CategoryProductsParams>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });

  useEffect(() => {
    loadProducts(true);
  }, [categoryId]);

  const loadProducts = async (reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
        setProducts([]);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 1 : page;
      const response = await categoriesService.getCategoryProducts(categoryId, {
        ...filters,
        page: currentPage,
      });

      if (reset) {
        setProducts(response.data);
      } else {
        setProducts(prev => [...prev, ...response.data]);
      }

      setTotalProducts(response.pagination.total);
      setHasMore(currentPage < response.pagination.totalPages);
      setPage(currentPage + 1);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts(true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadProducts(false);
    }
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  const renderProductCard = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[styles.productCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => handleProductPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.productImage}>
        {item.images && item.images.length > 0 ? (
          <Image
            source={{ uri: item.images[0] }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="cube-outline" size={48} color={theme.colors.textSecondary} />
          </View>
        )}
      </View>

      <View style={styles.productInfo}>
        <GSText variant="body" weight="semibold" numberOfLines={2} style={styles.productName}>
          {item.name}
        </GSText>

        {item.shortDescription && (
          <GSText variant="caption" color="textSecondary" numberOfLines={2} style={styles.productDescription}>
            {item.shortDescription}
          </GSText>
        )}

        <View style={styles.priceContainer}>
          <GSText variant="h4" weight="bold" color="primary">
            {formatPrice(item.price)}
          </GSText>
          {item.comparePrice && item.comparePrice > item.price && (
            <GSText variant="caption" color="textSecondary" style={styles.comparePrice}>
              {formatPrice(item.comparePrice)}
            </GSText>
          )}
        </View>

        <View style={styles.productFooter}>
          {item.stock > 0 ? (
            <View style={styles.stockBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <GSText variant="caption" style={{ color: '#10B981', marginLeft: 4 }}>
                In Stock
              </GSText>
            </View>
          ) : (
            <View style={styles.stockBadge}>
              <Ionicons name="close-circle" size={14} color="#EF4444" />
              <GSText variant="caption" style={{ color: '#EF4444', marginLeft: 4 }}>
                Out of Stock
              </GSText>
            </View>
          )}

          {item.rating && Number(item.rating) > 0 && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FBBF24" />
              <GSText variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
                {Number(item.rating).toFixed(1)}
              </GSText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing && products.length === 0) {
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
      {/* Header */}
      <View style={styles.header}>
        <GSText variant="h3" weight="bold">{categoryName}</GSText>
        <GSText variant="caption" color="textSecondary">
          {totalProducts} {totalProducts === 1 ? 'product' : 'products'}
        </GSText>
      </View>

      {/* Products Grid */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProductCard}
        numColumns={2}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color={theme.colors.textSecondary} />
            <GSText variant="body" color="textSecondary" style={styles.emptyText}>
              No products found in this category
            </GSText>
          </View>
        }
        contentContainerStyle={products.length === 0 ? styles.emptyContentContainer : styles.listContent}
        columnWrapperStyle={products.length > 0 ? styles.columnWrapper : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
  columnWrapper: {
    paddingHorizontal: 8,
  },
  productCard: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    marginBottom: 4,
    minHeight: 38,
  },
  productDescription: {
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  comparePrice: {
    marginLeft: 8,
    textDecorationLine: 'line-through',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContentContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
  },
});
