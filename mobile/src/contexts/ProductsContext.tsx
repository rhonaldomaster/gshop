import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  Product,
  Category,
  ProductSearchFilters,
  productsService
} from '../services/products.service';
import { PaginatedResponse } from '../config/api.config';

// Products state interface
interface ProductsState {
  // Product listings
  products: Product[];
  filteredProducts: Product[];
  trendingProducts: Product[];
  recommendedProducts: Product[];

  // Categories
  categories: Category[];

  // Search & filters
  searchQuery: string;
  activeFilters: ProductSearchFilters;
  searchResults: Product[];

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

  // Cache timestamps
  lastProductsUpdate: string | null;
  lastCategoriesUpdate: string | null;
  lastTrendingUpdate: string | null;
}

// Products context interface
interface ProductsContextType extends ProductsState {
  // Product operations
  loadProducts: (filters?: ProductSearchFilters, refresh?: boolean) => Promise<void>;
  loadMoreProducts: () => Promise<void>;
  searchProducts: (query: string, filters?: ProductSearchFilters) => Promise<void>;
  getProduct: (productId: string) => Promise<Product | null>;

  // Categories operations
  loadCategories: (refresh?: boolean) => Promise<void>;
  getProductsByCategory: (categoryId: string, filters?: ProductSearchFilters) => Promise<void>;

  // Trending & recommendations
  loadTrendingProducts: (refresh?: boolean) => Promise<void>;
  loadRecommendedProducts: (refresh?: boolean) => Promise<void>;

  // Filters & search
  updateFilters: (filters: Partial<ProductSearchFilters>) => void;
  clearFilters: () => void;
  clearSearch: () => void;

  // Utils
  refreshAllData: () => Promise<void>;
  clearError: () => void;
  getProductFromCache: (productId: string) => Product | undefined;
}

// Products actions
type ProductsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOADING_MORE'; payload: boolean }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PRODUCTS'; payload: { products: Product[]; pagination: any; append?: boolean } }
  | { type: 'SET_TRENDING_PRODUCTS'; payload: Product[] }
  | { type: 'SET_RECOMMENDED_PRODUCTS'; payload: Product[] }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SEARCH_RESULTS'; payload: Product[] }
  | { type: 'SET_FILTERS'; payload: ProductSearchFilters }
  | { type: 'UPDATE_FILTERS'; payload: Partial<ProductSearchFilters> }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'CLEAR_SEARCH' }
  | { type: 'UPDATE_PRODUCT'; payload: Product };

// Initial state
const initialState: ProductsState = {
  products: [],
  filteredProducts: [],
  trendingProducts: [],
  recommendedProducts: [],
  categories: [],
  searchQuery: '',
  activeFilters: {},
  searchResults: [],
  currentPage: 1,
  totalPages: 1,
  totalProducts: 0,
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  isRefreshing: false,
  error: null,
  lastProductsUpdate: null,
  lastCategoriesUpdate: null,
  lastTrendingUpdate: null,
};

// Products reducer
const productsReducer = (state: ProductsState, action: ProductsAction): ProductsState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_LOADING_MORE':
      return { ...state, isLoadingMore: action.payload };

    case 'SET_REFRESHING':
      return { ...state, isRefreshing: action.payload };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        isLoadingMore: false,
        isRefreshing: false,
      };

    case 'SET_PRODUCTS': {
      const { products, pagination, append = false } = action.payload;

      return {
        ...state,
        products: append ? [...state.products, ...products] : products,
        filteredProducts: append ? [...state.filteredProducts, ...products] : products,
        currentPage: pagination.page,
        totalPages: pagination.totalPages,
        totalProducts: pagination.total,
        hasMore: pagination.page < pagination.totalPages,
        lastProductsUpdate: new Date().toISOString(),
        isLoading: false,
        isLoadingMore: false,
        isRefreshing: false,
        error: null,
      };
    }

    case 'SET_TRENDING_PRODUCTS':
      return {
        ...state,
        trendingProducts: action.payload,
        lastTrendingUpdate: new Date().toISOString(),
      };

    case 'SET_RECOMMENDED_PRODUCTS':
      return {
        ...state,
        recommendedProducts: action.payload,
      };

    case 'SET_CATEGORIES':
      return {
        ...state,
        categories: action.payload,
        lastCategoriesUpdate: new Date().toISOString(),
      };

    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };

    case 'SET_SEARCH_RESULTS':
      return {
        ...state,
        searchResults: action.payload,
        isLoading: false,
        error: null,
      };

    case 'SET_FILTERS':
      return { ...state, activeFilters: action.payload };

    case 'UPDATE_FILTERS':
      return {
        ...state,
        activeFilters: { ...state.activeFilters, ...action.payload },
      };

    case 'CLEAR_FILTERS':
      return {
        ...state,
        activeFilters: {},
        filteredProducts: state.products,
      };

    case 'CLEAR_SEARCH':
      return {
        ...state,
        searchQuery: '',
        searchResults: [],
      };

    case 'UPDATE_PRODUCT': {
      const updatedProduct = action.payload;

      return {
        ...state,
        products: state.products.map(p => p.id === updatedProduct.id ? updatedProduct : p),
        filteredProducts: state.filteredProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p),
        trendingProducts: state.trendingProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p),
        recommendedProducts: state.recommendedProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p),
        searchResults: state.searchResults.map(p => p.id === updatedProduct.id ? updatedProduct : p),
      };
    }

    default:
      return state;
  }
};

// Create context
const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

// Products provider props
interface ProductsProviderProps {
  children: ReactNode;
}

// Products provider component
export function ProductsProvider({ children }: ProductsProviderProps) {
  const [state, dispatch] = useReducer(productsReducer, initialState);

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load initial data
  const loadInitialData = async (): Promise<void> => {
    await Promise.all([
      loadCategories(),
      loadTrendingProducts(),
      loadProducts(),
    ]);
  };

  // Load products with filters
  const loadProducts = async (
    filters: ProductSearchFilters = {},
    refresh: boolean = false
  ): Promise<void> => {
    try {
      if (refresh) {
        dispatch({ type: 'SET_REFRESHING', payload: true });
      } else {
        dispatch({ type: 'SET_LOADING', payload: true });
      }

      const response: PaginatedResponse<Product> = await productsService.getProducts({
        ...state.activeFilters,
        ...filters,
        page: 1, // Always start from page 1 for new loads
      });

      dispatch({
        type: 'SET_PRODUCTS',
        payload: {
          products: response.data,
          pagination: response.pagination,
          append: false,
        },
      });

      dispatch({ type: 'SET_FILTERS', payload: { ...state.activeFilters, ...filters } });
    } catch (error: any) {
      console.error('ProductsContext: Load products failed', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to load products' });
    }
  };

  // Load more products (pagination)
  const loadMoreProducts = async (): Promise<void> => {
    if (state.isLoadingMore || !state.hasMore) {
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING_MORE', payload: true });

      const nextPage = state.currentPage + 1;
      const response: PaginatedResponse<Product> = await productsService.getProducts({
        ...state.activeFilters,
        page: nextPage,
      });

      dispatch({
        type: 'SET_PRODUCTS',
        payload: {
          products: response.data,
          pagination: response.pagination,
          append: true,
        },
      });
    } catch (error: any) {
      console.error('ProductsContext: Load more products failed', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to load more products' });
    }
  };

  // Search products
  const searchProducts = async (
    query: string,
    filters: ProductSearchFilters = {}
  ): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_SEARCH_QUERY', payload: query });

      if (!query.trim()) {
        dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
        return;
      }

      const response: PaginatedResponse<Product> = await productsService.searchProducts(query, filters);
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: response.data });
    } catch (error: any) {
      console.error('ProductsContext: Search products failed', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Search failed' });
    }
  };

  // Get single product
  const getProduct = async (productId: string): Promise<Product | null> => {
    try {
      // First check cache
      const cachedProduct = getProductFromCache(productId);
      if (cachedProduct) {
        return cachedProduct;
      }

      // Fetch from API
      const product = await productsService.getProduct(productId);

      // Update cache
      dispatch({ type: 'UPDATE_PRODUCT', payload: product });

      return product;
    } catch (error: any) {
      console.error('ProductsContext: Get product failed', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to load product' });
      return null;
    }
  };

  // Load categories
  const loadCategories = async (refresh: boolean = false): Promise<void> => {
    try {
      // Skip if we have recent data and not refreshing
      if (!refresh && state.categories.length > 0 && state.lastCategoriesUpdate) {
        const lastUpdate = new Date(state.lastCategoriesUpdate);
        const now = new Date();
        const hoursDiff = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

        if (hoursDiff < 24) { // Cache for 24 hours
          return;
        }
      }

      const categories = await productsService.getCategories();
      dispatch({ type: 'SET_CATEGORIES', payload: categories });
    } catch (error: any) {
      console.error('ProductsContext: Load categories failed', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to load categories' });
    }
  };

  // Get products by category
  const getProductsByCategory = async (
    categoryId: string,
    filters: ProductSearchFilters = {}
  ): Promise<void> => {
    await loadProducts({ ...filters, category: categoryId });
  };

  // Load trending products
  const loadTrendingProducts = async (refresh: boolean = false): Promise<void> => {
    try {
      // Skip if we have recent data and not refreshing
      if (!refresh && state.trendingProducts.length > 0 && state.lastTrendingUpdate) {
        const lastUpdate = new Date(state.lastTrendingUpdate);
        const now = new Date();
        const hoursDiff = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

        if (hoursDiff < 1) { // Cache for 1 hour
          return;
        }
      }

      const trendingProducts = await productsService.getTrendingProducts(20);
      dispatch({ type: 'SET_TRENDING_PRODUCTS', payload: trendingProducts });
    } catch (error: any) {
      console.error('ProductsContext: Load trending products failed', error);
      // Don't set error for trending products, it's not critical
    }
  };

  // Load recommended products
  const loadRecommendedProducts = async (refresh: boolean = false): Promise<void> => {
    try {
      const recommendedProducts = await productsService.getRecommendations(15);
      dispatch({ type: 'SET_RECOMMENDED_PRODUCTS', payload: recommendedProducts });
    } catch (error: any) {
      console.error('ProductsContext: Load recommended products failed', error);
      // Don't set error for recommendations, it's not critical
    }
  };

  // Update filters
  const updateFilters = (filters: Partial<ProductSearchFilters>): void => {
    dispatch({ type: 'UPDATE_FILTERS', payload: filters });
  };

  // Clear filters
  const clearFilters = (): void => {
    dispatch({ type: 'CLEAR_FILTERS' });
  };

  // Clear search
  const clearSearch = (): void => {
    dispatch({ type: 'CLEAR_SEARCH' });
  };

  // Refresh all data
  const refreshAllData = async (): Promise<void> => {
    await Promise.all([
      loadCategories(true),
      loadTrendingProducts(true),
      loadProducts({}, true),
      loadRecommendedProducts(true),
    ]);
  };

  // Clear error
  const clearError = (): void => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  // Get product from cache
  const getProductFromCache = (productId: string): Product | undefined => {
    // Check in all product arrays
    const allProducts = [
      ...state.products,
      ...state.trendingProducts,
      ...state.recommendedProducts,
      ...state.searchResults,
    ];

    return allProducts.find(product => product.id === productId);
  };

  return (
    <ProductsContext.Provider
      value={{
        ...state,
        loadProducts,
        loadMoreProducts,
        searchProducts,
        getProduct,
        loadCategories,
        getProductsByCategory,
        loadTrendingProducts,
        loadRecommendedProducts,
        updateFilters,
        clearFilters,
        clearSearch,
        refreshAllData,
        clearError,
        getProductFromCache,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

// Custom hook to use products context
export function useProducts(): ProductsContextType {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
}

// Export types
export type { ProductsState, ProductsContextType };