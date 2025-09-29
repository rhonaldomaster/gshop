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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { recommendationsService, Recommendation } from '../../services/recommendations.service';
import { productsService } from '../../services/products.service';
import { ProductCard } from '../../components/ui/ProductCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';

const { width } = Dimensions.get('window');

interface RecommendationSection {
  title: string;
  algorithm: 'collaborative' | 'content' | 'popular' | 'hybrid';
  icon: string;
  description: string;
  recommendations: any[];
  loading: boolean;
}

export const RecommendationsScreen = () => {
  const { user } = useAuth();
  const [sections, setSections] = useState<RecommendationSection[]>([
    {
      title: 'For You',
      algorithm: 'hybrid',
      icon: '✨',
      description: 'Personalized picks based on your activity',
      recommendations: [],
      loading: true,
    },
    {
      title: 'People Also Bought',
      algorithm: 'collaborative',
      icon: '👥',
      description: 'Popular among users like you',
      recommendations: [],
      loading: true,
    },
    {
      title: 'Similar to Your Purchases',
      algorithm: 'content',
      icon: '🔍',
      description: 'Products similar to what you liked',
      recommendations: [],
      loading: true,
    },
    {
      title: 'Trending Now',
      algorithm: 'popular',
      icon: '🔥',
      description: 'What everyone is buying',
      recommendations: [],
      loading: true,
    },
  ]);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Categories for filtering
  const categories = [
    { id: null, name: 'All', icon: '🌟' },
    { id: 'electronics', name: 'Electronics', icon: '📱' },
    { id: 'fashion', name: 'Fashion', icon: '👕' },
    { id: 'home', name: 'Home', icon: '🏠' },
    { id: 'sports', name: 'Sports', icon: '⚽' },
    { id: 'beauty', name: 'Beauty', icon: '💄' },
  ];

  const loadRecommendations = useCallback(async () => {
    if (!user?.id) return;

    try {
      const updatedSections = await Promise.all(
        sections.map(async (section) => {
          try {
            const recommendations = await recommendationsService.getUserRecommendations(
              user.id,
              section.algorithm,
              8,
              selectedCategory || undefined,
              true
            );

            // Fetch product details for each recommendation
            const productsWithDetails = await Promise.all(
              recommendations.map(async (rec: Recommendation) => {
                try {
                  const product = await productsService.getProduct(rec.productId);
                  return {
                    ...product,
                    recommendationScore: rec.score,
                    algorithm: rec.algorithm,
                  };
                } catch (error) {
                  console.warn(`Failed to fetch product ${rec.productId}:`, error);
                  return null;
                }
              })
            );

            return {
              ...section,
              recommendations: productsWithDetails.filter(Boolean),
              loading: false,
            };
          } catch (error) {
            console.error(`Error loading ${section.title}:`, error);
            return {
              ...section,
              recommendations: [],
              loading: false,
            };
          }
        })
      );

      setSections(updatedSections);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      Alert.alert('Error', 'Failed to load recommendations. Please try again.');
    }
  }, [user?.id, selectedCategory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setSections(prev => prev.map(section => ({ ...section, loading: true })));
    await loadRecommendations();
    setRefreshing(false);
  }, [loadRecommendations]);

  const trackInteraction = useCallback(async (productId: string, type: 'view' | 'click') => {
    if (!user?.id) return;

    try {
      await recommendationsService.trackInteraction({
        productId,
        interactionType: type,
        metadata: {
          source: 'recommendations_screen',
          section: sections.find(s => s.recommendations.some(r => r.id === productId))?.title,
        },
      });
    } catch (error) {
      console.warn('Failed to track interaction:', error);
    }
  }, [user?.id, sections]);

  const handleProductPress = useCallback((product: any) => {
    trackInteraction(product.id, 'click');
    // Navigate to product detail
    // navigation.navigate('ProductDetail', { productId: product.id });
  }, [trackInteraction]);

  const handleCategoryPress = useCallback((categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setSections(prev => prev.map(section => ({ ...section, loading: true })));
  }, []);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Sign in Required"
          description="Please sign in to see personalized recommendations"
          icon="🔐"
        />
      </SafeAreaView>
    );
  }

  const renderCategoryTabs = () => (
    <ScrollView
      horizontal
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
          onPress={() => handleCategoryPress(category.id)}
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

  const renderSection = (section: RecommendationSection) => {
    if (section.loading) {
      return (
        <View key={section.title} style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>{section.icon}</Text>
            <View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionDescription}>{section.description}</Text>
            </View>
          </View>
          <LoadingState style={styles.loadingSection} />
        </View>
      );
    }

    if (section.recommendations.length === 0) {
      return (
        <View key={section.title} style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>{section.icon}</Text>
            <View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionDescription}>No recommendations found</Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View key={section.title} style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>{section.icon}</Text>
          <View style={styles.sectionInfo}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionDescription}>{section.description}</Text>
          </View>
          <Text style={styles.sectionCount}>
            {section.recommendations.length} items
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.productsScrollView}
          contentContainerStyle={styles.productsContainer}
        >
          {section.recommendations.map((product, index) => (
            <TouchableOpacity
              key={`${product.id}-${index}`}
              style={styles.productContainer}
              onPress={() => handleProductPress(product)}
            >
              <ProductCard
                product={product}
                onPress={() => handleProductPress(product)}
                style={styles.productCard}
              />
              {product.recommendationScore && (
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreText}>
                    {Math.round(product.recommendationScore * 100)}% match
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recommendations</Text>
        <Text style={styles.headerSubtitle}>Discover products you'll love</Text>
      </View>

      {renderCategoryTabs()}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {sections.map(renderSection)}
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
  sectionContainer: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
  },
  sectionCount: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  productsScrollView: {
    paddingLeft: 20,
  },
  productsContainer: {
    paddingRight: 20,
  },
  productContainer: {
    marginRight: 16,
    width: width * 0.4,
  },
  productCard: {
    width: '100%',
  },
  scoreContainer: {
    marginTop: 8,
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1976d2',
  },
  loadingSection: {
    height: 200,
    marginHorizontal: 20,
  },
});