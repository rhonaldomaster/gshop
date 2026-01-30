
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useProducts } from '../../hooks/useProducts';
import { useCart } from '../../hooks/useCart';
import GSText from '../../components/ui/GSText';
import GSInput from '../../components/ui/GSInput';
import GSButton from '../../components/ui/GSButton';
import { CachedImage } from '../../components/ui/CachedImage';
import { Product, ProductSearchFilters } from '../../services/products.service';
import {
  searchService,
  SellerSearchResult,
  CreatorSearchResult,
} from '../../services/search.service';
import { normalizeImageUrl } from '../../config/api.config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = (SCREEN_WIDTH - 60) / 2;

type SearchTab = 'products' | 'sellers' | 'creators';

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

              <View style={styles.filterSection}>
                <GSText variant="body" weight="semiBold" style={styles.filterTitle}>
                  {t('search.category')}
                </GSText>
                <FlatList
                  data={categories}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
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
      <View style={styles.productImageContainer}>
        {product.images && product.images.length > 0 ? (
          <CachedImage
            uri={normalizeImageUrl(product.images[0]) || ''}
            style={styles.productImage}
            cacheKey={`product-${product.id}-0`}
            fallbackIcon="image"
          />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <GSText variant="caption" color="textSecondary">{t('search.noImage')}</GSText>
          </View>
        )}

        {discountPercentage > 0 && (
          <View style={[styles.discountBadge, { backgroundColor: theme.colors.error }]}>
            <GSText variant="caption" color="white" weight="bold">
              -{discountPercentage}%
            </GSText>
          </View>
        )}
      </View>

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

        <GSText
          variant="caption"
          color={inStock ? 'success' : 'error'}
          style={styles.stockStatus}
        >
          {inStock ? t('products.inStock') : t('products.outOfStock')}
        </GSText>

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

// Seller Card Component
interface SellerCardProps {
  seller: SellerSearchResult;
  onPress: () => void;
}

const SellerCard: React.FC<SellerCardProps> = ({ seller, onPress }) => {
  const { theme } = useTheme();
  const { t } = useTranslation('translation');
  const logoUrl = normalizeImageUrl(seller.logoUrl);

  return (
    <TouchableOpacity
      style={[styles.userCard, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.userAvatarContainer}>
        {logoUrl ? (
          <Image source={{ uri: logoUrl }} style={styles.userAvatar} />
        ) : (
          <View style={[styles.userAvatarPlaceholder, { backgroundColor: '#10b981' }]}>
            <GSText variant="h4" color="white" weight="bold">
              {seller.businessName.charAt(0).toUpperCase()}
            </GSText>
          </View>
        )}
        {seller.isVerified && (
          <View style={[styles.verifiedBadge, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="checkmark" size={10} color="white" />
          </View>
        )}
      </View>

      <View style={styles.userInfo}>
        <GSText variant="body" weight="semiBold" numberOfLines={1}>
          {seller.businessName}
        </GSText>
        {seller.profileDescription && (
          <GSText variant="caption" color="textSecondary" numberOfLines={2}>
            {seller.profileDescription}
          </GSText>
        )}
        <View style={styles.userStats}>
          <GSText variant="caption" color="textSecondary">
            {seller.followersCount} {t('social.followers')}
          </GSText>
          <GSText variant="caption" color="textSecondary"> · </GSText>
          <GSText variant="caption" color="textSecondary">
            {seller.productsCount} {t('search.products')}
          </GSText>
        </View>
        {(seller.city || seller.state) && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={theme.colors.textSecondary} />
            <GSText variant="caption" color="textSecondary">
              {[seller.city, seller.state].filter(Boolean).join(', ')}
            </GSText>
          </View>
        )}
      </View>

      <View style={[styles.typeBadge, { backgroundColor: '#10b981' }]}>
        <GSText variant="caption" color="white" weight="bold">
          {t('social.seller')}
        </GSText>
      </View>
    </TouchableOpacity>
  );
};

// Creator Card Component
interface CreatorCardProps {
  creator: CreatorSearchResult;
  onPress: () => void;
}

const CreatorCard: React.FC<CreatorCardProps> = ({ creator, onPress }) => {
  const { theme } = useTheme();
  const { t } = useTranslation('translation');
  const avatarUrl = normalizeImageUrl(creator.avatarUrl);

  return (
    <TouchableOpacity
      style={[styles.userCard, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.userAvatarContainer}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.userAvatar} />
        ) : (
          <View style={[styles.userAvatarPlaceholder, { backgroundColor: '#8b5cf6' }]}>
            <GSText variant="h4" color="white" weight="bold">
              {creator.name.charAt(0).toUpperCase()}
            </GSText>
          </View>
        )}
        {creator.isVerified && (
          <View style={[styles.verifiedBadge, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="checkmark" size={10} color="white" />
          </View>
        )}
      </View>

      <View style={styles.userInfo}>
        <GSText variant="body" weight="semiBold" numberOfLines={1}>
          {creator.name}
        </GSText>
        <GSText variant="caption" color="textSecondary">
          @{creator.username}
        </GSText>
        {creator.bio && (
          <GSText variant="caption" color="textSecondary" numberOfLines={2}>
            {creator.bio}
          </GSText>
        )}
        <View style={styles.userStats}>
          <GSText variant="caption" color="textSecondary">
            {creator.followersCount} {t('social.followers')}
          </GSText>
          <GSText variant="caption" color="textSecondary"> · </GSText>
          <GSText variant="caption" color="textSecondary">
            {creator.videosCount} {t('search.videos')}
          </GSText>
        </View>
      </View>

      <View style={[styles.typeBadge, { backgroundColor: '#8b5cf6' }]}>
        <GSText variant="caption" color="white" weight="bold">
          {t('social.creator')}
        </GSText>
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
    isLoading: isProductsLoading,
    debouncedSearch,
    clearSearch,
    updateFilters,
    clearFilters,
  } = useProducts();
  const { addToCart } = useCart();

  // Local state
  const [activeTab, setActiveTab] = useState<SearchTab>('products');
  const [searchText, setSearchText] = useState(searchQuery);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  // Sellers search state
  const [sellers, setSellers] = useState<SellerSearchResult[]>([]);
  const [isSellersLoading, setIsSellersLoading] = useState(false);
  const [sellersTotal, setSellersTotal] = useState(0);

  // Creators search state
  const [creators, setCreators] = useState<CreatorSearchResult[]>([]);
  const [isCreatorsLoading, setIsCreatorsLoading] = useState(false);
  const [creatorsTotal, setCreatorsTotal] = useState(0);

  // Search sellers
  const searchSellers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSellers([]);
      setSellersTotal(0);
      return;
    }

    setIsSellersLoading(true);
    try {
      const result = await searchService.searchSellers(query);
      setSellers(result.sellers);
      setSellersTotal(result.total);
    } catch (error) {
      console.error('Failed to search sellers:', error);
      setSellers([]);
      setSellersTotal(0);
    } finally {
      setIsSellersLoading(false);
    }
  }, []);

  // Search creators
  const searchCreators = useCallback(async (query: string) => {
    if (!query.trim()) {
      setCreators([]);
      setCreatorsTotal(0);
      return;
    }

    setIsCreatorsLoading(true);
    try {
      const result = await searchService.searchCreators(query);
      setCreators(result.creators);
      setCreatorsTotal(result.total);
    } catch (error) {
      console.error('Failed to search creators:', error);
      setCreators([]);
      setCreatorsTotal(0);
    } finally {
      setIsCreatorsLoading(false);
    }
  }, []);

  // Handle search input change
  const handleSearchTextChange = useCallback((text: string) => {
    setSearchText(text);
    if (text.trim()) {
      debouncedSearch(text.trim(), activeFilters);
      searchSellers(text.trim());
      searchCreators(text.trim());
    } else {
      clearSearch();
      setSellers([]);
      setCreators([]);
      setSellersTotal(0);
      setCreatorsTotal(0);
    }
  }, [debouncedSearch, activeFilters, clearSearch, searchSellers, searchCreators]);

  // Handle product card press
  const handleProductPress = (product: Product) => {
    (navigation as any).navigate('ProductDetail', { productId: product.id });
  };

  // Handle seller card press
  const handleSellerPress = (seller: SellerSearchResult) => {
    (navigation as any).navigate('SellerProfile', { sellerId: seller.id });
  };

  // Handle creator card press
  const handleCreatorPress = (creator: CreatorSearchResult) => {
    (navigation as any).navigate('AffiliateProfile', { affiliateId: creator.id });
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
  const isLoading = activeTab === 'products' ? isProductsLoading :
                    activeTab === 'sellers' ? isSellersLoading : isCreatorsLoading;

  const tabs: { key: SearchTab; label: string; count: number }[] = [
    { key: 'products', label: t('search.products'), count: searchResults.length },
    { key: 'sellers', label: t('social.sellers'), count: sellersTotal },
    { key: 'creators', label: t('search.creators'), count: creatorsTotal },
  ];

  const renderEmptyState = () => {
    if (!searchText.trim()) {
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="search-outline" size={64} color={theme.colors.textSecondary} />
          <GSText variant="h3" weight="bold" color="textSecondary" style={{ marginTop: 16 }}>
            {t('search.searchForProducts')}
          </GSText>
          <GSText variant="body" color="textSecondary" style={styles.emptyStateText}>
            {t('search.enterSearchTerm')}
          </GSText>
        </View>
      );
    }

    const noResultsText = activeTab === 'products' ? t('search.noProductsFound') :
                          activeTab === 'sellers' ? t('search.noSellersFound') :
                          t('search.noCreatorsFound');

    return (
      <View style={styles.noResultsContainer}>
        <Ionicons name="search-outline" size={64} color={theme.colors.textSecondary} />
        <GSText variant="h3" weight="bold" color="textSecondary" style={{ marginTop: 16 }}>
          {noResultsText}
        </GSText>
        <GSText variant="body" color="textSecondary" style={styles.noResultsText}>
          {t('search.tryAdjusting')}
        </GSText>
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <GSText variant="body" style={styles.loadingText}>{t('search.searching')}</GSText>
        </View>
      );
    }

    if (activeTab === 'products') {
      if (searchResults.length === 0) return renderEmptyState();
      return (
        <>
          <GSText variant="body" color="textSecondary" style={styles.resultsCount}>
            {t('search.resultsFound', { count: searchResults.length })}
          </GSText>
          <FlatList
            key="products-grid"
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
      );
    }

    if (activeTab === 'sellers') {
      if (sellers.length === 0) return renderEmptyState();
      return (
        <>
          <GSText variant="body" color="textSecondary" style={styles.resultsCount}>
            {t('search.resultsFound', { count: sellersTotal })}
          </GSText>
          <FlatList
            key="sellers-list"
            data={sellers}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.usersList}
            renderItem={({ item }) => (
              <SellerCard seller={item} onPress={() => handleSellerPress(item)} />
            )}
          />
        </>
      );
    }

    if (activeTab === 'creators') {
      if (creators.length === 0) return renderEmptyState();
      return (
        <>
          <GSText variant="body" color="textSecondary" style={styles.resultsCount}>
            {t('search.resultsFound', { count: creatorsTotal })}
          </GSText>
          <FlatList
            key="creators-list"
            data={creators}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.usersList}
            renderItem={({ item }) => (
              <CreatorCard creator={item} onPress={() => handleCreatorPress(item)} />
            )}
          />
        </>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <GSInput
          placeholder={t('search.searchAll')}
          value={searchText}
          onChangeText={handleSearchTextChange}
          containerStyle={styles.searchInput}
          inputStyle={{ color: '#1A1A1A' }}
          autoFocus={true}
        />
        {activeTab === 'products' && (
          <TouchableOpacity
            style={[styles.filterButton, { borderColor: theme.colors.gray300 }]}
            onPress={() => setIsFilterModalVisible(true)}
          >
            <Ionicons name="options-outline" size={20} color={theme.colors.text} />
            {activeFilterCount > 0 && (
              <View style={[styles.filterBadge, { backgroundColor: theme.colors.primary }]}>
                <GSText variant="caption" color="white" weight="bold">
                  {activeFilterCount}
                </GSText>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <GSText
              variant="body"
              weight={activeTab === tab.key ? 'bold' : 'normal'}
              color={activeTab === tab.key ? 'primary' : 'textSecondary'}
            >
              {tab.label}
            </GSText>
            {searchText.trim() && tab.count > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: activeTab === tab.key ? theme.colors.primary : theme.colors.gray300 }]}>
                <GSText variant="caption" color={activeTab === tab.key ? 'white' : 'textSecondary'} weight="bold">
                  {tab.count > 99 ? '99+' : tab.count}
                </GSText>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Active Filters (only for products) */}
      {activeTab === 'products' && activeFilterCount > 0 && (
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
        {renderContent()}
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
    paddingBottom: 8,
    gap: 12,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  filterButton: {
    padding: 12,
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  activeFilters: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultsCount: {
    marginVertical: 12,
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
  usersList: {
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
    minHeight: 40,
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
  // User cards (sellers & creators)
  userCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  userAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  userStats: {
    flexDirection: 'row',
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
