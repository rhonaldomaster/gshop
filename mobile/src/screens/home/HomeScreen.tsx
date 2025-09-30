import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const featuredProducts = [
  {
    id: '1',
    name: 'iPhone 15 Pro Max',
    price: 1299999.99,
    image: '/api/placeholder/200/200',
    rating: 4.8,
    reviews: 234,
  },
  {
    id: '2',
    name: 'MacBook Air M3',
    price: 1749999.99,
    image: '/api/placeholder/200/200',
    rating: 4.9,
    reviews: 145,
  },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();

  // Mock data with theme colors
  const categories = [
    { id: '1', name: 'Electronics', icon: '📱', color: theme.colors.primary },
    { id: '2', name: 'Fashion', icon: '👕', color: theme.colors.accent },
    { id: '3', name: 'Home', icon: '🏠', color: theme.colors.warning },
    { id: '4', name: 'Sports', icon: '⚽', color: theme.colors.info },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <GSText variant="body" color="#6B7280">
              Welcome back,
            </GSText>
            <GSText variant="h3" weight="bold">
              {user?.firstName || 'User'}!
            </GSText>
          </View>

          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Hero Banner */}
        <View style={[styles.heroBanner, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.heroContent}>
            <GSText variant="h2" color="white" weight="bold">
              Summer Sale
            </GSText>
            <GSText variant="body" color="white" style={styles.heroSubtext}>
              Up to 50% off on selected items
            </GSText>
            <GSButton
              title="Shop Now"
              variant="secondary"
              size="medium"
              fullWidth={false}
              style={styles.heroButton}
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
              Categories
            </GSText>
            <TouchableOpacity>
              <GSText variant="body" style={{ color: theme.colors.primary }}>
                View All
              </GSText>
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity key={category.id} style={styles.categoryCard}>
                <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                  <GSText variant="h3">{category.icon}</GSText>
                </View>
                <GSText variant="caption" style={styles.categoryName}>
                  {category.name}
                </GSText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <GSText variant="h4" weight="bold">
              Featured Products
            </GSText>
            <TouchableOpacity>
              <GSText variant="body" style={{ color: theme.colors.primary }}>
                View All
              </GSText>
            </TouchableOpacity>
          </View>

          <FlatList
            data={featuredProducts}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.productCard}>
                <View style={styles.productImage}>
                  <GSText variant="h1">📱</GSText>
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
                        {item.rating} ({item.reviews})
                      </GSText>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsContainer}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          />
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, styles.lastSection]}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            Quick Actions
          </GSText>

          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction}>
              <Ionicons name="bag-outline" size={24} color={theme.colors.primary} />
              <GSText variant="caption" style={styles.quickActionText}>
                My Orders
              </GSText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAction}>
              <Ionicons name="heart-outline" size={24} color={theme.colors.primary} />
              <GSText variant="caption" style={styles.quickActionText}>
                Wishlist
              </GSText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAction}>
              <Ionicons name="card-outline" size={24} color={theme.colors.primary} />
              <GSText variant="caption" style={styles.quickActionText}>
                Payments
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
});