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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('translation');
  const { user } = useAuth();
  const [sections, setSections] = useState<RecommendationSection[]>([
    {
      title: t('recommendations.forYou'),
      algorithm: 'hybrid',
      icon: '✨',
      description: t('recommendations.personalizedPicks'),
      recommendations: [],
      loading: true,
    },
    {
      title: t('recommendations.peopleAlsoBought'),
      algorithm: 'collaborative',
      icon: '👥',
      description: t('recommendations.popularAmongUsers'),
      recommendations: [],
      loading: true,
    },
    {
      title: t('recommendations.similarToYourPurchases'),
      algorithm: 'content',
      icon: '🔍',
      description: t('recommendations.productsSimilar'),
      recommendations: [],
      loading: true,
    },
    {
      title: t('recommendations.trendingNow'),
      algorithm: 'popular',
      icon: '🔥',
      description: t('recommendations.everyoneBuying'),
      recommendations: [],
      loading: true,
    },
  ]);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Categories for filtering
  const categories = [
    { id: null, name: t('recommendations.all'), icon: '🌟' },
    { id: 'electronics', name: t('recommendations.electronics'), icon: '📱' },
    { id: 'fashion', name: t('recommendations.fashion'), icon: '👕' },
    { id: 'home', name: t('recommendations.home'), icon: '🏠' },
    { id: 'sports', name: t('recommendations.sports'), icon: '⚽' },
    { id: 'beauty', name: t('recommendations.beauty'), icon: '💄' },
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
      Alert.alert(t('common.error'), t('recommendations.failedToLoad'));
    }
  }, [user?.id, selectedCategory, t]);

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
        userId: user.id,
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
          title={t('auth.loginRequired')}
          description={t('recommendations.signInToSee')}
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
              <Text style={styles.sectionDescription}>{t('recommendations.noRecommendationsFound')}</Text>
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
            {t('recommendations.itemsCount', { count: section.recommendations.length })}
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
                    {Math.round(product.recommendationScore * 100)}% {t('recommendations.match')}
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
        <Text style={styles.headerTitle}>{t('recommendations.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('recommendations.discoverProducts')}</Text>
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