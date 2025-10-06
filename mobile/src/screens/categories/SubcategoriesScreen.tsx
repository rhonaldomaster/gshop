import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../contexts/ThemeContext';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import CategoryCard from '../../components/categories/CategoryCard';
import categoriesService, { CategoryDetails } from '../../services/categories.service';
import { Category } from '../../services/products.service';
import { Ionicons } from '@expo/vector-icons';

type SubcategoriesRouteProp = RouteProp<{
  params: {
    categoryId: string;
    categoryName: string;
  };
}, 'params'>;

type SubcategoriesNavigationProp = StackNavigationProp<any>;

export default function SubcategoriesScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<SubcategoriesNavigationProp>();
  const route = useRoute<SubcategoriesRouteProp>();

  const { categoryId, categoryName } = route.params;

  const [categoryDetails, setCategoryDetails] = useState<CategoryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCategoryDetails();
  }, [categoryId]);

  const loadCategoryDetails = async () => {
    try {
      setLoading(true);
      const details = await categoriesService.getCategoryDetails(categoryId);
      setCategoryDetails(details);
    } catch (error) {
      console.error('Failed to load category details:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCategoryDetails();
    setRefreshing(false);
  };

  const handleSubcategoryPress = (subcategory: Category) => {
    navigation.navigate('CategoryProducts', {
      categoryId: subcategory.id,
      categoryName: subcategory.name,
    });
  };

  const handleViewAllProducts = () => {
    navigation.navigate('CategoryProducts', {
      categoryId,
      categoryName,
    });
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <GSText variant="body" style={styles.loadingText}>Loading subcategories...</GSText>
        </View>
      </SafeAreaView>
    );
  }

  const subcategories = categoryDetails?.children || [];
  const totalProducts = categoryDetails?.productCount || 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header with Category Info */}
      <View style={styles.header}>
        <GSText variant="h2" weight="bold">{categoryName}</GSText>
        {categoryDetails?.description && (
          <GSText variant="body" color="textSecondary" style={styles.description}>
            {categoryDetails.description}
          </GSText>
        )}
        {totalProducts > 0 && (
          <GSText variant="caption" color="textSecondary" style={styles.productCount}>
            {totalProducts} {totalProducts === 1 ? 'product' : 'products'} total
          </GSText>
        )}
      </View>

      {/* View All Products Button */}
      {totalProducts > 0 && (
        <View style={styles.viewAllContainer}>
          <GSButton
            title={`View All ${categoryName} Products`}
            onPress={handleViewAllProducts}
            variant="outline"
            fullWidth
            leftIcon={<Ionicons name="grid-outline" size={20} color={theme.colors.primary} />}
          />
        </View>
      )}

      {/* Subcategories Section */}
      {subcategories.length > 0 && (
        <View style={styles.subcategoriesHeader}>
          <GSText variant="h3" weight="semibold">
            Browse by Subcategory
          </GSText>
          <GSText variant="caption" color="textSecondary">
            {subcategories.length} {subcategories.length === 1 ? 'subcategory' : 'subcategories'}
          </GSText>
        </View>
      )}

      {/* Subcategories Grid */}
      <FlatList
        data={subcategories}
        keyExtractor={(item) => item.id}
        numColumns={2}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        renderItem={({ item }) => (
          <CategoryCard
            category={item}
            onPress={() => handleSubcategoryPress(item)}
            variant="grid"
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={64} color={theme.colors.textSecondary} />
            <GSText variant="body" color="textSecondary" style={styles.emptyText}>
              No subcategories available
            </GSText>
            {totalProducts > 0 && (
              <GSButton
                title="Browse All Products"
                onPress={handleViewAllProducts}
                variant="primary"
                style={styles.browseButton}
              />
            )}
          </View>
        }
        contentContainerStyle={styles.listContent}
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  description: {
    marginTop: 8,
  },
  productCount: {
    marginTop: 4,
  },
  viewAllContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  subcategoriesHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  browseButton: {
    marginHorizontal: 32,
  },
});
