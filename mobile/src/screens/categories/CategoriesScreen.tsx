import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../contexts/ThemeContext';
import GSText from '../../components/ui/GSText';
import GSInput from '../../components/ui/GSInput';
import CategoryCard from '../../components/categories/CategoryCard';
import categoriesService, { CategoryDetails } from '../../services/categories.service';
import { Category } from '../../services/products.service';
import { Ionicons } from '@expo/vector-icons';

type CategoriesNavigationProp = StackNavigationProp<any>;

export default function CategoriesScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<CategoriesNavigationProp>();

  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredCategories, setFeaturedCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const [allCategories, featured] = await Promise.all([
        categoriesService.getAllCategories(),
        categoriesService.getFeaturedCategories(4),
      ]);
      setCategories(allCategories);
      setFeaturedCategories(featured);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  };

  const handleCategoryPress = (category: Category) => {
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;

    if (hasSubcategories) {
      // Navigate to subcategories screen
      navigation.navigate('Subcategories', {
        categoryId: category.id,
        categoryName: category.name,
      });
    } else {
      // Navigate directly to products
      navigation.navigate('CategoryProducts', {
        categoryId: category.id,
        categoryName: category.name,
      });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadCategories();
      return;
    }

    try {
      const results = await categoriesService.searchCategories(searchQuery);
      setCategories(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const filteredCategories = searchQuery
    ? categories
    : categories;

  if (loading && !refreshing && categories.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <GSText variant="body" style={styles.loadingText}>Loading categories...</GSText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <GSText variant="h2" weight="bold">Categories</GSText>
        <TouchableOpacity
          onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          style={styles.viewModeButton}
        >
          <Ionicons
            name={viewMode === 'grid' ? 'list' : 'grid'}
            size={24}
            color={theme.colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <GSInput
          placeholder="Search categories..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          containerStyle={styles.searchInput}
          rightIcon={
            searchQuery ? (
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                loadCategories();
              }}>
                <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            ) : undefined
          }
          leftIcon={<Ionicons name="search" size={20} color={theme.colors.textSecondary} />}
        />
      </View>

      <FlatList
        data={filteredCategories}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode} // Force re-render when changing view mode
        renderItem={({ item }) => (
          <CategoryCard
            category={item}
            onPress={() => handleCategoryPress(item)}
            variant={viewMode}
          />
        )}
        ListHeaderComponent={
          !searchQuery && featuredCategories.length > 0 ? (
            <View style={styles.featuredSection}>
              <GSText variant="h3" weight="semibold" style={styles.sectionTitle}>
                Featured Categories
              </GSText>
              <View style={styles.featuredGrid}>
                {featuredCategories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onPress={() => handleCategoryPress(category)}
                    variant="grid"
                  />
                ))}
              </View>
              <GSText variant="h3" weight="semibold" style={styles.sectionTitle}>
                All Categories
              </GSText>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="albums-outline" size={64} color={theme.colors.textSecondary} />
            <GSText variant="body" color="textSecondary" style={styles.emptyText}>
              {searchQuery ? 'No categories found' : 'No categories available'}
            </GSText>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  viewModeButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchInput: {
    marginBottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  featuredSection: {
    marginBottom: 16,
  },
  featuredGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 8,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
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
    textAlign: 'center',
  },
});
