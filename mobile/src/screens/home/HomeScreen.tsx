import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useProducts } from '../../hooks/useProducts';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Product, Category } from '../../services/products.service';
import { normalizeImageUrl } from '../../config/api.config';

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;

const { width } = Dimensions.get('window');

// Icon mapping for categories
const categoryIcons: Record<string, string> = {
  electronics: '📱',
  fashion: '👕',
  home: '🏠',
  sports: '⚽',
  'home & garden': '🏠',
  smartphones: '📱',
  laptops: '💻',
  "men's clothing": '👔',
  "women's clothing": '👗',
};

export default function HomeScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { t } = useTranslation('translation');
  const {
    trendingProducts,
    categories: allCategories,
    isLoading: productsLoading,
    loadTrendingProducts,
    loadCategories,
    formatPrice,
  } = useProducts();

  // Local state
  const [refreshing, setRefreshing] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    await Promise.all([
      loadTrendingProducts(true),
      loadCategories(true),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  };

  // Get first 4 categories for display
  const categories = allCategories.slice(0, 4);
  const featuredProducts = trendingProducts;

  const getCategoryIcon = (category: Category) => {
    const lowerName = category.name.toLowerCase();
    return categoryIcons[lowerName] || categoryIcons[category.slug] || '📦';
  };

  // Show loading only on first load (not on refresh)
  if (productsLoading && !refreshing && trendingProducts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <GSText variant="body" style={styles.loadingText}>{t('common.loading')}</GSText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Floating Wallet Button */}
      <TouchableOpacity
        style={[styles.floatingWalletButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('Profile' as any, { screen: 'Wallet' })}
        activeOpacity={0.8}
      >
        <Ionicons name="wallet-outline" size={24} color="white" />
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <GSText variant="body" color="#6B7280">
              {t('home.welcomeBack')},
            </GSText>
            <GSText variant="h3" weight="bold">
              {user?.firstName || t('home.user')}!
            </GSText>
          </View>

          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => navigation.navigate('Search', {})}
          >
            <Ionicons name="search" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Hero Banner */}
        <View style={[styles.heroBanner, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.heroContent}>
            <GSText variant="h2" color="white" weight="bold">
              {t('home.summerSale')}
            </GSText>
            <GSText variant="body" color="white" style={styles.heroSubtext}>
              {t('home.saleDescription')}
            </GSText>
            <GSButton
              title={t('home.shopNow')}
              variant="secondary"
              size="medium"
              fullWidth={false}
              style={styles.heroButton}
              onPress={() => navigation.navigate('Trending')}
            />
          </View>
          <View style={styles.heroImage}>
            <GSText style={styles.heroEmoji}>🛍️</GSText>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <GSText variant="h4" weight="bold">
              {t('home.categories')}
            </GSText>
            <TouchableOpacity onPress={() => navigation.navigate('Categories' as any)}>
              <GSText variant="body" style={{ color: theme.colors.primary }}>
                {t('common.viewAll')}
              </GSText>
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesGrid}>
            {categories.map((category, index) => {
              const colors = [
                theme.colors.primary,
                theme.colors.accent,
                theme.colors.warning,
                theme.colors.info,
              ];
              const color = colors[index % colors.length];

              return (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() =>
                    navigation.navigate('CategoryProducts', {
                      categoryId: category.id,
                      categoryName: category.name,
                    })
                  }
                >
                  <View style={[styles.categoryIcon, { backgroundColor: color + '20' }]}>
                    <GSText variant="h3">{getCategoryIcon(category)}</GSText>
                  </View>
                  <GSText variant="caption" style={styles.categoryName}>
                    {category.name}
                  </GSText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Featured Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <GSText variant="h4" weight="bold">
              {t('home.featuredProducts')}
            </GSText>
            <TouchableOpacity onPress={() => navigation.navigate('Trending')}>
              <GSText variant="body" style={{ color: theme.colors.primary }}>
                {t('common.viewAll')}
              </GSText>
            </TouchableOpacity>
          </View>

          <FlatList
            data={featuredProducts}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.productCard}
                onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
              >
                <View style={styles.productImage}>
                  {item.images && item.images.length > 0 ? (
                    <Image
                      source={{ uri: normalizeImageUrl(item.images[0]) || '' }}
                      style={styles.productImageView}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.productImagePlaceholder}>
                      <Ionicons name="image-outline" size={40} color="#9CA3AF" />
                    </View>
                  )}
                </View>
                <View style={styles.productInfo}>
                  <GSText variant="h6" weight="semiBold" numberOfLines={2}>
                    {item.name}
                  </GSText>
                  <GSText variant="h5" weight="bold" style={styles.productPrice}>
                    {formatPrice(item.price)}
                  </GSText>
                  <View style={styles.productMeta}>
                    <View style={styles.rating}>
                      <Ionicons name="star" size={14} color="#FFB800" />
                      <GSText variant="caption" color="#6B7280">
                        {item.rating || 0} ({item.reviewCount || 0})
                      </GSText>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsContainer}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <GSText variant="body" color="textSecondary">
                  {t('home.noProducts')}
                </GSText>
              </View>
            }
          />
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, styles.lastSection]}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            {t('home.quickActions')}
          </GSText>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Profile' as any, { screen: 'Orders' })}
            >
              <Ionicons name="bag-outline" size={24} color={theme.colors.primary} />
              <GSText variant="caption" style={styles.quickActionText}>
                {t('orders.myOrders')}
              </GSText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Wishlist')}
            >
              <Ionicons name="heart-outline" size={24} color={theme.colors.primary} />
              <GSText variant="caption" style={styles.quickActionText}>
                {t('wishlist.title')}
              </GSText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('PaymentMethods')}
            >
              <Ionicons name="card-outline" size={24} color={theme.colors.primary} />
              <GSText variant="caption" style={styles.quickActionText}>
                {t('home.payments')}
              </GSText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBanner: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroContent: {
    flex: 1,
  },
  heroSubtext: {
    opacity: 0.9,
    marginVertical: 8,
  },
  heroButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  heroImage: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 48,
  },
  section: {
    marginBottom: 24,
  },
  lastSection: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  categoryCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    textAlign: 'center',
  },
  productsContainer: {
    paddingHorizontal: 20,
  },
  productCard: {
    width: 180,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  productImageView: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  productInfo: {
    flex: 1,
  },
  productPrice: {
    marginVertical: 4,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  quickActionText: {
    marginTop: 8,
    textAlign: 'center',
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
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  floatingWalletButton: {
    position: 'absolute',
    right: 8,
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});