import { apiClient, ApiResponse } from './api';
import { API_CONFIG, PaginatedResponse, buildEndpointUrl } from '../config/api.config';

// Product types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  category: string;
  subcategory?: string;
  brand?: string;
  sku: string;
  stock: number;
  status: 'active' | 'inactive' | 'out_of_stock' | 'discontinued';
  sellerId: string;
  seller?: {
    id: string;
    name: string;
    avatar?: string;
    rating?: number;
    totalSales?: number;
  };
  rating?: number;
  reviewCount?: number;
  tags?: string[];
  attributes?: Record<string, any>;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  shippingInfo?: {
    freeShipping: boolean;
    estimatedDays: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  parentId?: string;
  subcategories?: Category[];
  productCount?: number;
}

export interface ProductSearchFilters {
  query?: string;
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  sellerId?: string;
  tags?: string[];
  inStock?: boolean;
  sortBy?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'rating' | 'popularity' | 'sales';
  page?: number;
  limit?: number;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  verified: boolean;
  helpful: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  productId: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
}

class ProductsService {
  // Get products with filters and pagination
  async getProducts(filters: ProductSearchFilters = {}): Promise<PaginatedResponse<Product>> {
    try {
      const params = this.buildSearchParams(filters);

      const response = await apiClient.get<PaginatedResponse<Product>>(
        API_CONFIG.ENDPOINTS.PRODUCTS.LIST,
        { params }
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get products');
      }
    } catch (error: any) {
      console.error('ProductsService: Get products failed', error);
      throw new Error(error.message || 'Failed to load products');
    }
  }

  // Get single product by ID
  async getProduct(productId: string): Promise<Product> {
    try {
      const url = buildEndpointUrl(API_CONFIG.ENDPOINTS.PRODUCTS.DETAIL, { id: productId });

      const response = await apiClient.get<Product>(url);

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Product not found');
      }
    } catch (error: any) {
      console.error('ProductsService: Get product failed', error);
      throw new Error(error.message || 'Failed to load product');
    }
  }

  // Search products with text query
  async searchProducts(query: string, filters: Omit<ProductSearchFilters, 'query'> = {}): Promise<PaginatedResponse<Product>> {
    try {
      const searchFilters: ProductSearchFilters = {
        ...filters,
        query,
      };

      const params = this.buildSearchParams(searchFilters);

      const response = await apiClient.get<PaginatedResponse<Product>>(
        API_CONFIG.ENDPOINTS.PRODUCTS.SEARCH,
        { params }
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Search failed');
      }
    } catch (error: any) {
      console.error('ProductsService: Search products failed', error);
      throw new Error(error.message || 'Search failed');
    }
  }

  // Get product categories
  async getCategories(): Promise<Category[]> {
    try {
      const response = await apiClient.get<Category[]>(
        API_CONFIG.ENDPOINTS.PRODUCTS.CATEGORIES
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get categories');
      }
    } catch (error: any) {
      console.error('ProductsService: Get categories failed', error);
      throw new Error(error.message || 'Failed to load categories');
    }
  }

  // Get trending products
  async getTrendingProducts(limit: number = 10): Promise<Product[]> {
    try {
      const response = await apiClient.get<Product[]>(
        API_CONFIG.ENDPOINTS.PRODUCTS.TRENDING,
        { params: { limit } }
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get trending products');
      }
    } catch (error: any) {
      console.error('ProductsService: Get trending products failed', error);
      throw new Error(error.message || 'Failed to load trending products');
    }
  }

  // Get products by category
  async getProductsByCategory(categoryId: string, filters: ProductSearchFilters = {}): Promise<PaginatedResponse<Product>> {
    try {
      const searchFilters: ProductSearchFilters = {
        ...filters,
        category: categoryId,
      };

      return await this.getProducts(searchFilters);
    } catch (error: any) {
      console.error('ProductsService: Get products by category failed', error);
      throw new Error(error.message || 'Failed to load category products');
    }
  }

  // Get products by seller
  async getProductsBySeller(sellerId: string, filters: ProductSearchFilters = {}): Promise<PaginatedResponse<Product>> {
    try {
      const searchFilters: ProductSearchFilters = {
        ...filters,
        sellerId,
      };

      return await this.getProducts(searchFilters);
    } catch (error: any) {
      console.error('ProductsService: Get products by seller failed', error);
      throw new Error(error.message || 'Failed to load seller products');
    }
  }

  // Get product reviews
  async getProductReviews(productId: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<ProductReview>> {
    try {
      const response = await apiClient.get<PaginatedResponse<ProductReview>>(
        `/products/${productId}/reviews`,
        { params: { page, limit } }
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get reviews');
      }
    } catch (error: any) {
      console.error('ProductsService: Get product reviews failed', error);
      throw new Error(error.message || 'Failed to load reviews');
    }
  }

  // Create product review
  async createReview(reviewData: CreateReviewRequest): Promise<ProductReview> {
    try {
      const response = await apiClient.post<ProductReview>(
        API_CONFIG.ENDPOINTS.MARKETPLACE.REVIEWS,
        reviewData
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create review');
      }
    } catch (error: any) {
      console.error('ProductsService: Create review failed', error);
      throw new Error(error.message || 'Failed to submit review');
    }
  }

  // Get related products (recommendations)
  async getRelatedProducts(productId: string, limit: number = 6): Promise<Product[]> {
    try {
      const response = await apiClient.get<Product[]>(
        `/products/${productId}/related`,
        { params: { limit } }
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get related products');
      }
    } catch (error: any) {
      console.error('ProductsService: Get related products failed', error);
      throw new Error(error.message || 'Failed to load related products');
    }
  }

  // Track product interaction for recommendations
  async trackProductInteraction(productId: string, interactionType: 'view' | 'click' | 'add_to_cart' | 'purchase'): Promise<void> {
    try {
      await apiClient.post(API_CONFIG.ENDPOINTS.RECOMMENDATIONS.INTERACTIONS, {
        productId,
        interactionType,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Don't throw error for tracking failures
      console.warn('ProductsService: Failed to track interaction', error);
    }
  }

  // Get personalized recommendations
  async getRecommendations(limit: number = 10): Promise<Product[]> {
    try {
      const response = await apiClient.post<Product[]>(
        API_CONFIG.ENDPOINTS.RECOMMENDATIONS.GENERATE,
        { limit }
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get recommendations');
      }
    } catch (error: any) {
      console.error('ProductsService: Get recommendations failed', error);
      // Return empty array if recommendations fail
      return [];
    }
  }

  // Helper method to build search parameters
  private buildSearchParams(filters: ProductSearchFilters): Record<string, any> {
    const params: Record<string, any> = {};

    // Add all filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Map 'query' to 'search' for backend compatibility
        const paramKey = key === 'query' ? 'search' : key;

        if (Array.isArray(value)) {
          params[paramKey] = value.join(',');
        } else {
          params[paramKey] = value;
        }
      }
    });

    // Set default pagination if not provided
    if (!params.page) params.page = 1;
    if (!params.limit) params.limit = 20;

    return params;
  }

  // Check if product is in stock
  isInStock(product: Product): boolean {
    return product.status === 'active' && product.stock > 0;
  }

  // Calculate discount percentage
  getDiscountPercentage(product: Product): number {
    if (product.originalPrice && product.originalPrice > product.price) {
      return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    }
    return product.discount || 0;
  }

  // Format product price with currency
  formatPrice(price: number, currency: string = 'COP'): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
    }).format(price);
  }

  // Get product display images
  getProductImages(product: Product): string[] {
    return product.images && product.images.length > 0
      ? product.images
      : ['https://via.placeholder.com/300x300?text=No+Image'];
  }

  // Get product rating display
  getRatingDisplay(product: Product): { rating: number; reviewCount: number } {
    return {
      rating: product.rating || 0,
      reviewCount: product.reviewCount || 0,
    };
  }
}

// Create singleton instance
export const productsService = new ProductsService();

// Export types
export type {
  Product,
  Category,
  ProductSearchFilters,
  ProductReview,
  CreateReviewRequest,
};