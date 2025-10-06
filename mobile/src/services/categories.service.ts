import { apiClient } from './api';
import { API_CONFIG, buildEndpointUrl } from '../config/api.config';
import { Category } from './products.service';
import { Product, PaginatedResponse } from './products.service';

export interface CategoryDetails extends Category {
  children: Category[];
  breadcrumb?: string[];
  featuredProducts?: Product[];
  isActive: boolean;
  sortOrder: number;
}

export interface CategoryProductsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

class CategoriesService {
  /**
   * Get all root categories with their children
   */
  async getAllCategories(): Promise<Category[]> {
    try {
      const response = await apiClient.get<Category[]>(
        API_CONFIG.ENDPOINTS.CATEGORIES.LIST
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to load categories');
    } catch (error: any) {
      console.error('CategoriesService: Get all categories failed', error);
      throw new Error(error.message || 'Failed to load categories');
    }
  }

  /**
   * Get category details by ID with full hierarchy
   */
  async getCategoryDetails(categoryId: string): Promise<CategoryDetails> {
    try {
      const url = buildEndpointUrl(API_CONFIG.ENDPOINTS.CATEGORIES.DETAIL, { id: categoryId });
      const response = await apiClient.get<CategoryDetails>(url);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to load category details');
    } catch (error: any) {
      console.error('CategoriesService: Get category details failed', error);
      throw new Error(error.message || 'Failed to load category details');
    }
  }

  /**
   * Get products for a specific category with filters and pagination
   */
  async getCategoryProducts(
    categoryId: string,
    params: CategoryProductsParams = {}
  ): Promise<PaginatedResponse<Product>> {
    try {
      const url = buildEndpointUrl(API_CONFIG.ENDPOINTS.PRODUCTS.BY_CATEGORY, { categoryId });
      const response = await apiClient.get<PaginatedResponse<Product>>(
        url,
        { params }
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to load category products');
    } catch (error: any) {
      console.error('CategoriesService: Get category products failed', error);
      throw new Error(error.message || 'Failed to load category products');
    }
  }

  /**
   * Get subcategories for a parent category
   */
  async getSubcategories(parentId: string): Promise<Category[]> {
    try {
      // Get parent category details which includes children
      const categoryDetails = await this.getCategoryDetails(parentId);
      return categoryDetails.children || [];
    } catch (error: any) {
      console.error('CategoriesService: Get subcategories failed', error);
      throw new Error(error.message || 'Failed to load subcategories');
    }
  }

  /**
   * Search categories by name
   */
  async searchCategories(query: string): Promise<Category[]> {
    try {
      const allCategories = await this.getAllCategories();

      const searchTerm = query.toLowerCase();
      const results: Category[] = [];

      // Search in root categories and their children
      allCategories.forEach(category => {
        if (category.name.toLowerCase().includes(searchTerm)) {
          results.push(category);
        }

        // Search in subcategories
        if (category.subcategories) {
          category.subcategories.forEach(subcat => {
            if (subcat.name.toLowerCase().includes(searchTerm)) {
              results.push(subcat);
            }
          });
        }
      });

      return results;
    } catch (error: any) {
      console.error('CategoriesService: Search categories failed', error);
      throw new Error(error.message || 'Search failed');
    }
  }

  /**
   * Get featured/popular categories
   */
  async getFeaturedCategories(limit: number = 4): Promise<Category[]> {
    try {
      const allCategories = await this.getAllCategories();

      // Sort by product count and return top N
      return allCategories
        .filter(cat => (cat.productCount || 0) > 0)
        .sort((a, b) => (b.productCount || 0) - (a.productCount || 0))
        .slice(0, limit);
    } catch (error: any) {
      console.error('CategoriesService: Get featured categories failed', error);
      throw new Error(error.message || 'Failed to load featured categories');
    }
  }

  /**
   * Build breadcrumb path for a category
   */
  buildBreadcrumb(category: CategoryDetails): string[] {
    const breadcrumb: string[] = ['Home'];

    if (category.breadcrumb && category.breadcrumb.length > 0) {
      breadcrumb.push(...category.breadcrumb);
    }

    breadcrumb.push(category.name);

    return breadcrumb;
  }
}

export const categoriesService = new CategoriesService();
export default categoriesService;
