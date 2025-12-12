import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { recommendationsService, Recommendation } from '../../services/recommendations.service';
import { productsService } from '../../services/products.service';
import { useAuth } from '../../contexts/AuthContext';
import { ProductCard } from '../../components/ui/ProductCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';

const { width } = Dimensions.get('window');

interface TrendingProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  seller?: any;
  trendingScore: number;
  trendingRank: number;
  viewsGrowth: number;
  salesGrowth: number;
  category: string;
}

interface TrendingSection {
  title: string;
  subtitle: string;
  icon: string;
  timeframe: 'today' | 'week' | 'month';
  products: TrendingProduct[];
  loading: boolean;
}

export const TrendingScreen = () => {
  const { user } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month'>('today');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [trendingProducts, setTrendingProducts] = useState<TrendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [featuredProduct, setFeaturedProduct] = useState<TrendingProduct | null>(null);

  const timeframes = [
    { key: 'today', label: 'Today', icon: '🔥' },
    { key: 'week', label: 'This Week', icon: '📈' },
    { key: 'month', label: 'This Month', icon: '🏆' },
  ];

  const categories = [
    { id: null, name: 'All', icon: '🌟' },
    { id: 'electronics', name: 'Electronics', icon: '📱' },
    { id: 'fashion', name: 'Fashion', icon: '👕' },
    { id: 'home', name: 'Home', icon: '🏠' },
    { id: 'sports', name: 'Sports', icon: '⚽' },
    { id: 'beauty', name: 'Beauty', icon: '💄' },
  ];

  const loadTrendingProducts = useCallback(async () => {
    try {
      setLoading(true);

      const recommendations = await recommendationsService.getTrending(
        selectedCategory || undefined,
        20
      );

      // Fetch product details for each recommendation
      const productsWithDetails = await Promise.all(
        recommendations.map(async (rec: Recommendation, index: number) => {
          try {
            const product = await productsService.getProduct(rec.productId);

            // Simulate trending metrics (in real app, these would come from backend)
            const trendingScore = rec.score;
            const viewsGrowth = Math.random() * 200 + 50; // 50-250% growth
            const salesGrowth = Math.random() * 150 + 25; // 25-175% growth

            return {
              ...product,
              trendingScore,
              trendingRank: index + 1,
              viewsGrowth,
              salesGrowth,
              category: product.category || 'general',
            } as TrendingProduct;
          } catch (error) {
            console.warn(`Failed to fetch product ${rec.productId}:`, error);
            return null;
          }
        })
      );

      const validProducts = productsWithDetails.filter(Boolean) as TrendingProduct[];
      setTrendingProducts(validProducts);

      // Set featured product (highest trending score)
      if (validProducts.length > 0) {
        setFeaturedProduct(validProducts[0]);
      }

      // Track interaction only if user is authenticated
      if (user?.id) {
        try {
          await recommendationsService.trackInteraction({
            userId: user.id,
            productId: 'trending_view',
            interactionType: 'view',
            metadata: {
              source: 'trending_screen',
              timeframe: selectedTimeframe,
              category: selectedCategory,
            },
          });
        } catch (error) {
          console.warn('Failed to track trending view:', error);
          // Non-critical, continue loading products
        }
      }
    } catch (error) {
      console.error('Error loading trending products:', error);
      Alert.alert('Error', 'Failed to load trending products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedTimeframe, user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTrendingProducts();
    setRefreshing(false);
  }, [loadTrendingProducts]);

  const handleProductPress = useCallback((product: TrendingProduct) => {
    if (user?.id) {
      recommendationsService.trackInteraction({
        userId: user.id,
        productId: product.id,
        interactionType: 'click',
        metadata: {
          source: 'trending_screen',
          rank: product.trendingRank,
          timeframe: selectedTimeframe,
        },
      }).catch(err => console.warn('Failed to track click:', err));
    }
    // Navigate to product detail
    // navigation.navigate('ProductDetail', { productId: product.id });
  }, [user?.id, selectedTimeframe]);

  const handleTimeframeChange = useCallback((timeframe: 'today' | 'week' | 'month') => {
    setSelectedTimeframe(timeframe);
    setLoading(true);
  }, []);

  const handleCategoryChange = useCallback((categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setLoading(true);
  }, []);

  useEffect(() => {
    loadTrendingProducts();
  }, [loadTrendingProducts]);

  const renderTimeframeTabs = () => (
    <View style={styles.timeframeContainer}>
      {timeframes.map((timeframe) => (
        <TouchableOpacity
          key={timeframe.key}
          style={[
            styles.timeframeTab,
            selectedTimeframe === timeframe.key && styles.timeframeTabActive,
          ]}
          onPress={() => handleTimeframeChange(timeframe.key as any)}
        >
          <Text style={styles.timeframeIcon}>{timeframe.icon}</Text>
          <Text
            style={[
              styles.timeframeText,
              selectedTimeframe === timeframe.key && styles.timeframeTextActive,
            ]}
          >
            {timeframe.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCategoryTabs = () => (
    <ScrollView
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      style={styles.categoriesContainer}
      contentContainerStyle={styles.categoriesContent}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id || 'all'}
          style={[
            styles.categoryTab,
            selectedCategory === category.id && styles.categoryTabActive,
          ]}
          onPress={() => handleCategoryChange(category.id)}
        >
          <Text style={styles.categoryIcon}>{category.icon}</Text>
          <Text
            style={[
              styles.categoryText,
              selectedCategory === category.id && styles.categoryTextActive,
            ]}
          >
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderFeaturedProduct = () => {
    if (!featuredProduct) return null;

    return (
      <TouchableOpacity
        style={styles.featuredContainer}
        onPress={() => handleProductPress(featuredProduct)}
      >
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredBadgeText}>🏆 #1 Trending</Text>
        </View>

        <Image
          source={{ uri: featuredProduct.image }}
          style={styles.featuredImage}
          resizeMode="cover"
        />

        <View style={styles.featuredOverlay}>
          <View style={styles.featuredContent}>
            <Text style={styles.featuredTitle} numberOfLines={2}>
              {featuredProduct.name}
            </Text>
            <Text style={styles.featuredPrice}>
              ${featuredProduct.price.toFixed(2)}
            </Text>

            <View style={styles.trendingMetrics}>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>
                  +{Math.round(featuredProduct.viewsGrowth)}%
                </Text>
                <Text style={styles.metricLabel}>Views</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>
                  +{Math.round(featuredProduct.salesGrowth)}%
                </Text>
                <Text style={styles.metricLabel}>Sales</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTrendingList = () => {
    if (loading) {
      return <LoadingState style={styles.loadingContainer} />;
    }

    if (trendingProducts.length === 0) {
      return (
        <EmptyState
          title="No Trending Products"
          description="Check back later for trending items"
          icon="📈"
        />
      );
    }

    return (
      <View style={styles.trendingList}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending Products</Text>
          <Text style={styles.sectionSubtitle}>
            {trendingProducts.length} items rising in popularity
          </Text>
        </View>

        {trendingProducts.map((product, index) => (
          <TouchableOpacity
            key={product.id}
            style={styles.trendingItem}
            onPress={() => handleProductPress(product)}
          >
            <View style={styles.rankContainer}>
              <Text style={styles.rankNumber}>#{product.trendingRank}</Text>
              {product.trendingRank <= 3 && (
                <Text style={styles.rankIcon}>
                  {product.trendingRank === 1 ? '🥇' : product.trendingRank === 2 ? '🥈' : '🥉'}
                </Text>
              )}
            </View>

            <Image
              source={{ uri: product.image }}
              style={styles.trendingImage}
              resizeMode="cover"
            />

            <View style={styles.trendingInfo}>
              <Text style={styles.trendingTitle} numberOfLines={2}>
                {product.name}
              </Text>
              <Text style={styles.trendingPrice}>
                ${product.price.toFixed(2)}
              </Text>

              <View style={styles.trendingMetrics}>
                <View style={styles.trendingMetricItem}>
                  <Text style={styles.trendingMetricValue}>
                    +{Math.round(product.viewsGrowth)}%
                  </Text>
                  <Text style={styles.trendingMetricLabel}>Views</Text>
                </View>
                <View style={styles.trendingMetricItem}>
                  <Text style={styles.trendingMetricValue}>
                    +{Math.round(product.salesGrowth)}%
                  </Text>
                  <Text style={styles.trendingMetricLabel}>Sales</Text>
                </View>
              </View>
            </View>

            <View style={styles.trendingArrow}>
              <Text style={styles.arrowIcon}>📈</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trending</Text>
        <Text style={styles.headerSubtitle}>What's hot right now</Text>
      </View>

      {renderTimeframeTabs()}
      {renderCategoryTabs()}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderFeaturedProduct()}
        {renderTrendingList()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  timeframeContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timeframeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  timeframeTabActive: {
    backgroundColor: '#ff6b35',
    borderColor: '#ff6b35',
  },
  timeframeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  timeframeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  timeframeTextActive: {
    color: '#fff',
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  categoryTabActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  categoryTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  featuredContainer: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  featuredBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#ff6b35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 2,
  },
  featuredBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  featuredImage: {
    width: '100%',
    height: 200,
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
  },
  featuredContent: {
    flex: 1,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  featuredPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: 12,
  },
  trendingMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  metricLabel: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 2,
  },
  loadingContainer: {
    height: 400,
    margin: 20,
  },
  trendingList: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  rankContainer: {
    width: 60,
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  rankIcon: {
    fontSize: 16,
    marginTop: 2,
  },
  trendingImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  trendingInfo: {
    flex: 1,
  },
  trendingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  trendingPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: 8,
  },
  trendingMetrics: {
    flexDirection: 'row',
  },
  trendingMetricItem: {
    marginRight: 20,
  },
  trendingMetricValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  trendingMetricLabel: {
    fontSize: 10,
    color: '#999',
  },
  trendingArrow: {
    marginLeft: 12,
  },
  arrowIcon: {
    fontSize: 20,
  },
});