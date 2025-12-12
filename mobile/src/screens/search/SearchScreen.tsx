
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useProducts } from '../../hooks/useProducts';
import { useCart } from '../../hooks/useCart';
import GSText from '../../components/ui/GSText';
import GSInput from '../../components/ui/GSInput';
import GSButton from '../../components/ui/GSButton';
import { CachedImage } from '../../components/ui/CachedImage';
import { Product, ProductSearchFilters } from '../../services/products.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = (SCREEN_WIDTH - 60) / 2; // 2 columns with margins

// Filter Modal Component
interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: ProductSearchFilters) => void;
  currentFilters: ProductSearchFilters;
  categories: any[];
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  currentFilters,
  categories,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation('translation');
  const [localFilters, setLocalFilters] = useState<ProductSearchFilters>(currentFilters);

  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    setLocalFilters({});
    onApply({});
    onClose();
  };

  const sortOptions = [
    { value: 'newest', label: t('products.sortByNewest') },
    { value: 'oldest', label: t('search.oldestFirst') },
    { value: 'price_asc', label: t('products.sortByPriceLowToHigh') },
    { value: 'price_desc', label: t('products.sortByPriceHighToLow') },
    { value: 'rating', label: t('search.bestRated') },
    { value: 'popularity', label: t('products.sortByPopular') },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.filterModal, { backgroundColor: theme.colors.background }]}>
        <View style={styles.filterHeader}>
          <GSText variant="h3" weight="bold">{t('search.filters')}</GSText>
          <TouchableOpacity onPress={onClose}>
            <GSText variant="body" color="primary">{t('common.done')}</GSText>
          </TouchableOpacity>
        </View>

        <FlatList
          style={styles.filterContent}
          showsVerticalScrollIndicator={false}
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={
            <View>
              {/* Price Range */}
              <View style={styles.filterSection}>
                <GSText variant="body" weight="semiBold" style={styles.filterTitle}>
                  {t('search.priceRange')}
                </GSText>
                <View style={styles.priceInputs}>
                  <GSInput
                    placeholder={t('search.minPrice')}
                    value={localFilters.minPrice?.toString() || ''}
                    onChangeText={(text) => setLocalFilters(prev => ({
                      ...prev,
                      minPrice: text ? parseFloat(text) : undefined
                    }))}
                    keyboardType="numeric"
                    style={styles.priceInput}
                  />
                  <GSText variant="body" style={styles.priceInputSeparator}>{t('search.to')}</GSText>
                  <GSInput
                    placeholder={t('search.maxPrice')}
                    value={localFilters.maxPrice?.toString() || ''}
                    onChangeText={(text) => setLocalFilters(prev => ({
                      ...prev,
                      maxPrice: text ? parseFloat(text) : undefined
                    }))}
                    keyboardType="numeric"
                    style={styles.priceInput}
                  />
                </View>
              </View>

              {/* Categories */}
              <View style={styles.filterSection}>
                <GSText variant="body" weight="semiBold" style={styles.filterTitle}>
                  {t('search.category')}
                </GSText>
                <FlatList
                  data={categories}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.categoryOption,
                        {
                          backgroundColor: localFilters.category === item.id
                            ? theme.colors.primary + '20'
                            : 'transparent',
                          borderColor: theme.colors.gray300,
                        }
                      ]}
                      onPress={() => setLocalFilters(prev => ({
                        ...prev,
                        category: prev.category === item.id ? undefined : item.id
                      }))}
                    >
                      <GSText
                        variant="body"
                        color={localFilters.category === item.id ? 'primary' : 'text'}
                      >
                        {item.name}
                      </GSText>
                    </TouchableOpacity>
                  )}
                />
              </View>

              {/* Sort By */}
              <View style={styles.filterSection}>
                <GSText variant="body" weight="semiBold" style={styles.filterTitle}>
                  {t('products.sortBy')}
                </GSText>
                {sortOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.sortOption,
                      {
                        backgroundColor: localFilters.sortBy === option.value
                          ? theme.colors.primary + '20'
                          : 'transparent',
                        borderColor: theme.colors.gray300,
                      }
                    ]}
                    onPress={() => setLocalFilters(prev => ({
                      ...prev,
                      sortBy: option.value as any
                    }))}
                  >
                    <GSText
                      variant="body"
                      color={localFilters.sortBy === option.value ? 'primary' : 'text'}
                    >
                      {option.label}
                    </GSText>
                  </TouchableOpacity>
                ))}
              </View>

              {/* In Stock Only */}
              <View style={styles.filterSection}>
                <TouchableOpacity
                  style={[
                    styles.checkboxOption,
                    {
                      backgroundColor: localFilters.inStock
                        ? theme.colors.primary + '20'
                        : 'transparent',
                      borderColor: theme.colors.gray300,
                    }
                  ]}
                  onPress={() => setLocalFilters(prev => ({
                    ...prev,
                    inStock: !prev.inStock
                  }))}
                >
                  <GSText
                    variant="body"
                    color={localFilters.inStock ? 'primary' : 'text'}
                  >
                    {t('search.inStockOnly')}
                  </GSText>
                </TouchableOpacity>
              </View>
            </View>
          }
        />

        <View style={styles.filterActions}>
          <GSButton
            title={t('search.clearAll')}
            onPress={handleClear}
            variant="outline"
            style={styles.filterActionButton}
          />
          <GSButton
            title={t('search.applyFilters')}
            onPress={handleApply}
            style={styles.filterActionButton}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// Product Card Component
interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onAddToCart: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, onAddToCart }) => {
  const { theme } = useTheme();
  const { t } = useTranslation('translation');
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
          <CachedImage
            uri={product.images[0]}
            style={styles.productImage}
            cacheKey={`product-${product.id}-0`}
            fallbackIcon="image"
          />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <GSText variant="caption" color="textSecondary">{t('search.noImage')}</GSText>
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
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <GSText
          variant="body"
          weight="semiBold"
          numberOfLines={2}
          style={styles.productName}
        >
          {product.name}
        </GSText>

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

        {/* Stock Status */}
        <GSText
          variant="caption"
          color={inStock ? 'success' : 'error'}
          style={styles.stockStatus}
        >
          {inStock ? t('products.inStock') : t('products.outOfStock')}
        </GSText>

        {/* Add to Cart Button */}
        <TouchableOpacity
          style={[
            styles.addToCartButton,
            {
              backgroundColor: inStock ? theme.colors.primary : theme.colors.gray300,
            }
          ]}
          onPress={onAddToCart}
          disabled={!inStock}
        >
          <GSText
            variant="caption"
            color={inStock ? 'white' : 'textSecondary'}
            weight="semiBold"
          >
            {t('products.addToCart')}
          </GSText>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// Main Search Screen Component
export default function SearchScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation('translation');
  const {
    searchResults,
    searchQuery,
    activeFilters,
    categories,
    isLoading,
    debouncedSearch,
    clearSearch,
    updateFilters,
    clearFilters,
  } = useProducts();
  const { addToCart } = useCart();

  // Local state
  const [searchText, setSearchText] = useState(searchQuery);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  // Handle search input change
  const handleSearchTextChange = useCallback((text: string) => {
    setSearchText(text);
    if (text.trim()) {
      debouncedSearch(text.trim(), activeFilters);
    } else {
      clearSearch();
    }
  }, [debouncedSearch, activeFilters, clearSearch]);

  // Handle product card press
  const handleProductPress = (product: Product) => {
    (navigation as any).navigate('ProductDetail', { productId: product.id });
  };

  // Handle add to cart
  const handleAddToCart = async (product: Product) => {
    await addToCart(product, 1);
  };

  // Handle filter apply
  const handleFilterApply = (filters: ProductSearchFilters) => {
    updateFilters(filters);
    if (searchText.trim()) {
      debouncedSearch(searchText.trim(), filters);
    }
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (activeFilters.category) count++;
    if (activeFilters.minPrice) count++;
    if (activeFilters.maxPrice) count++;
    if (activeFilters.sortBy) count++;
    if (activeFilters.inStock) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <GSInput
          placeholder={t('home.searchProducts')}
          value={searchText}
          onChangeText={handleSearchTextChange}
          containerStyle={styles.searchInput}
          inputStyle={{ color: '#1A1A1A' }}
          autoFocus={true}
        />
        <TouchableOpacity
          style={[styles.filterButton, { borderColor: theme.colors.gray300 }]}
          onPress={() => setIsFilterModalVisible(true)}
        >
          <GSText variant="body">{t('search.filters')}</GSText>
          {activeFilterCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: theme.colors.primary }]}>
              <GSText variant="caption" color="white" weight="bold">
                {activeFilterCount}
              </GSText>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <View style={styles.activeFilters}>
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={clearFilters}
          >
            <GSText variant="caption" color="primary">{t('search.clearAll')}</GSText>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Results */}
      <View style={styles.resultsContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <GSText variant="body" style={styles.loadingText}>{t('search.searching')}</GSText>
          </View>
        ) : searchResults.length > 0 ? (
          <>
            <GSText variant="body" color="textSecondary" style={styles.resultsCount}>
              {t('search.resultsFound', { count: searchResults.length })}
            </GSText>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.row}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.productsList}
              renderItem={({ item }) => (
                <ProductCard
                  product={item}
                  onPress={() => handleProductPress(item)}
                  onAddToCart={() => handleAddToCart(item)}
                />
              )}
            />
          </>
        ) : searchText.trim() ? (
          <View style={styles.noResultsContainer}>
            <GSText variant="h3" weight="bold" color="textSecondary">
              {t('search.noProductsFound')}
            </GSText>
            <GSText variant="body" color="textSecondary" style={styles.noResultsText}>
              {t('search.tryAdjusting')}
            </GSText>
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <GSText variant="h3" weight="bold" color="textSecondary">
              {t('search.searchForProducts')}
            </GSText>
            <GSText variant="body" color="textSecondary" style={styles.emptyStateText}>
              {t('search.enterProductName')}
            </GSText>
          </View>
        )}
      </View>

      {/* Filter Modal */}
      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApply={handleFilterApply}
        currentFilters={activeFilters}
        categories={categories}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFilters: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultsCount: {
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    marginTop: 8,
    textAlign: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    marginTop: 8,
    textAlign: 'center',
  },
  productsList: {
    paddingBottom: 20,
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
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
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
  stockStatus: {
    marginTop: 2,
  },
  addToCartButton: {
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },

  // Filter Modal Styles
  filterModal: {
    flex: 1,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  filterContent: {
    flex: 1,
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterTitle: {
    marginBottom: 12,
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInput: {
    flex: 1,
  },
  priceInputSeparator: {
    paddingHorizontal: 8,
  },
  categoryOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  sortOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  checkboxOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  filterActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  filterActionButton: {
    flex: 1,
  },
});
