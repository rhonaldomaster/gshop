import { useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useProducts as useProductsContext } from '../contexts/ProductsContext';
import {
  Product,
  Category,
  ProductSearchFilters,
  ProductReview,
  CreateReviewRequest,
  productsService,
} from '../services/products.service';
import { useApi, useDebouncedApi } from './useApi';

// Extended products hook interface
interface UseProductsReturn {
  // Products state
  products: Product[];
  filteredProducts: Product[];
  trendingProducts: Product[];
  recommendedProducts: Product[];
  searchResults: Product[];
  categories: Category[];

  // Search & filters
  searchQuery: string;
  activeFilters: ProductSearchFilters;

  // Pagination
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  hasMore: boolean;

  // UI states
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Products operations
  loadProducts: (filters?: ProductSearchFilters, refresh?: boolean) => Promise<void>;
  loadMoreProducts: () => Promise<void>;
  searchProducts: (query: string, filters?: ProductSearchFilters) => Promise<void>;
  debouncedSearch: (query: string, filters?: ProductSearchFilters) => void;
  getProduct: (productId: string) => Promise<Product | null>;
  getProductDetails: (productId: string) => Promise<{
    product: Product | null;
    relatedProducts: Product[];
    reviews: ProductReview[];
  }>;

  // Categories operations
  loadCategories: (refresh?: boolean) => Promise<void>;
  getProductsByCategory: (categoryId: string, filters?: ProductSearchFilters) => Promise<void>;

  // Trending & recommendations
  loadTrendingProducts: (refresh?: boolean) => Promise<void>;
  loadRecommendedProducts: (refresh?: boolean) => Promise<void>;

  // Reviews operations
  getProductReviews: (productId: string, page?: number) => Promise<ProductReview[]>;
  createProductReview: (reviewData: CreateReviewRequest) => Promise<ProductReview | null>;

  // Filters & search management
  updateFilters: (filters: Partial<ProductSearchFilters>) => void;
  clearFilters: () => void;
  clearSearch: () => void;
  applyFilters: (filters: ProductSearchFilters) => Promise<void>;

  // Product utilities
  isInStock: (product: Product) => boolean;
  getDiscountPercentage: (product: Product) => number;
  formatPrice: (price: number) => string;
  getProductImages: (product: Product) => string[];
  getRatingDisplay: (product: Product) => { rating: number; reviewCount: number };
  trackProductView: (productId: string) => Promise<void>;

  // Data management
  refreshAllData: () => Promise<void>;
  clearError: () => void;
  getProductFromCache: (productId: string) => Product | undefined;
}

/**
 * Enhanced products hook with additional utilities and API integrations
 */
export function useProducts(): UseProductsReturn {
  const productsContext = useProductsContext();

  // Debounced search API for better UX
  const debouncedSearchApi = useDebouncedApi(
    async (query: string, filters: ProductSearchFilters = {}) => {
      return productsContext.searchProducts(query, filters);
    },
    300
  );

  // API hooks for specific operations
  const productDetailsApi = useApi(
    async (productId: string) => {
      const [product, relatedProducts, reviewsResponse] = await Promise.all([
        productsService.getProduct(productId),
        productsService.getRelatedProducts(productId, 6),
        productsService.getProductReviews(productId, 1, 5),
      ]);

      return {
        product,
        relatedProducts,
        reviews: reviewsResponse.data,
      };
    }
  );

  const reviewsApi = useApi(
    async (productId: string, page: number = 1) => {
      const response = await productsService.getProductReviews(productId, page, 10);
      return response.data;
    }
  );

  const createReviewApi = useApi(
    async (reviewData: CreateReviewRequest) => {
      return await productsService.createReview(reviewData);
    }
  );

  // Get product with additional details
  const getProductDetails = useCallback(
    async (productId: string) => {
      await trackProductView(productId);
      return await productDetailsApi.execute(productId);
    },
    [productDetailsApi]
  );

  // Get product (from cache or API)
  const getProduct = useCallback(
    async (productId: string): Promise<Product | null> => {
      // Track view
      await trackProductView(productId);
      return await productsContext.getProduct(productId);
    },
    [productsContext]
  );

  // Debounced search
  const debouncedSearch = useCallback(
    (query: string, filters: ProductSearchFilters = {}) => {
      debouncedSearchApi.debouncedExecute(query, filters);
    },
    [debouncedSearchApi]
  );

  // Get product reviews
  const getProductReviews = useCallback(
    async (productId: string, page: number = 1): Promise<ProductReview[]> => {
      const reviews = await reviewsApi.execute(productId, page);
      return reviews || [];
    },
    [reviewsApi]
  );

  // Create product review
  const createProductReview = useCallback(
    async (reviewData: CreateReviewRequest): Promise<ProductReview | null> => {
      try {
        const review = await createReviewApi.execute(reviewData);

        if (review) {
          Alert.alert(
            'Review Submitted',
            'Thank you for your review! It will help other customers.',
            [{ text: 'OK' }]
          );
        }

        return review;
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to submit review');
        return null;
      }
    },
    [createReviewApi]
  );

  // Apply filters with loading state
  const applyFilters = useCallback(
    async (filters: ProductSearchFilters): Promise<void> => {
      productsContext.updateFilters(filters);
      await productsContext.loadProducts(filters);
    },
    [productsContext]
  );

  // Track product view for recommendations
  const trackProductView = useCallback(
    async (productId: string): Promise<void> => {
      try {
        await productsService.trackProductInteraction(productId, 'view');
      } catch (error) {
        // Don't throw error for tracking failures
        console.warn('Failed to track product view:', error);
      }
    },
    []
  );

  // Product utility functions
  const isInStock = useCallback(
    (product: Product): boolean => {
      return productsService.isInStock(product);
    },
    []
  );

  const getDiscountPercentage = useCallback(
    (product: Product): number => {
      return productsService.getDiscountPercentage(product);
    },
    []
  );

  const formatPrice = useCallback(
    (price: number): string => {
      return productsService.formatPrice(price);
    },
    []
  );

  const getProductImages = useCallback(
    (product: Product): string[] => {
      return productsService.getProductImages(product);
    },
    []
  );

  const getRatingDisplay = useCallback(
    (product: Product): { rating: number; reviewCount: number } => {
      return productsService.getRatingDisplay(product);
    },
    []
  );

  // Enhanced search with analytics
  const searchProducts = useCallback(
    async (query: string, filters: ProductSearchFilters = {}): Promise<void> => {
      await productsContext.searchProducts(query, filters);

      // Track search for analytics (if user is logged in)
      try {
        await productsService.trackProductInteraction('search', 'click');
      } catch (error) {
        // Don't throw error for tracking failures
        console.warn('Failed to track search:', error);
      }
    },
    [productsContext]
  );

  // Get category with products count
  const getCategoryWithCount = useCallback(
    (categoryId: string): Category | undefined => {
      return productsContext.categories.find(cat => cat.id === categoryId);
    },
    [productsContext.categories]
  );

  // Get popular categories (with most products)
  const getPopularCategories = useCallback(
    (limit: number = 6): Category[] => {
      return productsContext.categories
        .filter(cat => cat.productCount && cat.productCount > 0)
        .sort((a, b) => (b.productCount || 0) - (a.productCount || 0))
        .slice(0, limit);
    },
    [productsContext.categories]
  );

  // Get products on sale
  const getProductsOnSale = useCallback(
    (): Product[] => {
      return productsContext.products.filter(product =>
        product.originalPrice && product.originalPrice > product.price
      );
    },
    [productsContext.products]
  );

  // Get new arrivals (products created in last 30 days)
  const getNewArrivals = useCallback(
    (): Product[] => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      return productsContext.products.filter(product =>
        new Date(product.createdAt) > thirtyDaysAgo
      );
    },
    [productsContext.products]
  );

  // Get product availability status
  const getAvailabilityStatus = useCallback(
    (product: Product): {
      status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
      message: string;
      color: string;
    } => {
      if (product.status === 'discontinued') {
        return {
          status: 'discontinued',
          message: 'Discontinued',
          color: '#DC143C',
        };
      }

      if (product.stock === 0) {
        return {
          status: 'out_of_stock',
          message: 'Out of Stock',
          color: '#FF6347',
        };
      }

      if (product.stock <= 5) {
        return {
          status: 'low_stock',
          message: `Only ${product.stock} left`,
          color: '#FFA500',
        };
      }

      return {
        status: 'in_stock',
        message: 'In Stock',
        color: '#32CD32',
      };
    },
    []
  );

  // Memoized return object
  return useMemo(
    () => ({
      // Products state from context
      products: productsContext.products,
      filteredProducts: productsContext.filteredProducts,
      trendingProducts: productsContext.trendingProducts,
      recommendedProducts: productsContext.recommendedProducts,
      searchResults: productsContext.searchResults,
      categories: productsContext.categories,

      // Search & filters
      searchQuery: productsContext.searchQuery,
      activeFilters: productsContext.activeFilters,

      // Pagination
      currentPage: productsContext.currentPage,
      totalPages: productsContext.totalPages,
      totalProducts: productsContext.totalProducts,
      hasMore: productsContext.hasMore,

      // UI states
      isLoading: productsContext.isLoading || productDetailsApi.isLoading,
      isLoadingMore: productsContext.isLoadingMore,
      isRefreshing: productsContext.isRefreshing,
      error: productsContext.error || productDetailsApi.error,

      // Products operations
      loadProducts: productsContext.loadProducts,
      loadMoreProducts: productsContext.loadMoreProducts,
      searchProducts,
      debouncedSearch,
      getProduct,
      getProductDetails,

      // Categories operations
      loadCategories: productsContext.loadCategories,
      getProductsByCategory: productsContext.getProductsByCategory,

      // Trending & recommendations
      loadTrendingProducts: productsContext.loadTrendingProducts,
      loadRecommendedProducts: productsContext.loadRecommendedProducts,

      // Reviews operations
      getProductReviews,
      createProductReview,

      // Filters & search management
      updateFilters: productsContext.updateFilters,
      clearFilters: productsContext.clearFilters,
      clearSearch: productsContext.clearSearch,
      applyFilters,

      // Product utilities
      isInStock,
      getDiscountPercentage,
      formatPrice,
      getProductImages,
      getRatingDisplay,
      trackProductView,

      // Data management
      refreshAllData: productsContext.refreshAllData,
      clearError: productsContext.clearError,
      getProductFromCache: productsContext.getProductFromCache,

      // Additional utilities
      getCategoryWithCount,
      getPopularCategories,
      getProductsOnSale,
      getNewArrivals,
      getAvailabilityStatus,
    }),
    [
      productsContext,
      productDetailsApi,
      searchProducts,
      debouncedSearch,
      getProduct,
      getProductDetails,
      getProductReviews,
      createProductReview,
      applyFilters,
      isInStock,
      getDiscountPercentage,
      formatPrice,
      getProductImages,
      getRatingDisplay,
      trackProductView,
      getCategoryWithCount,
      getPopularCategories,
      getProductsOnSale,
      getNewArrivals,
      getAvailabilityStatus,
    ]
  );
}

// Export type
export type { UseProductsReturn };