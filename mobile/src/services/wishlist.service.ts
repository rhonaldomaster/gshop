import { apiClient } from './api';
import { Product } from './products.service';

// Wishlist types
export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  addedAt: string;
}

class WishlistService {
  // Get user's wishlist
  async getWishlist(): Promise<WishlistItem[]> {
    try {
      const response = await apiClient.get<WishlistItem[]>('/wishlist');

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get wishlist');
      }
    } catch (error: any) {
      console.error('WishlistService: Get wishlist failed', error);
      throw new Error(error.message || 'Failed to load wishlist');
    }
  }

  // Add product to wishlist
  async addToWishlist(productId: string): Promise<WishlistItem> {
    try {
      const response = await apiClient.post<WishlistItem>('/wishlist/items', {
        productId,
      });

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to add to wishlist');
      }
    } catch (error: any) {
      console.error('WishlistService: Add to wishlist failed', error);
      throw new Error(error.message || 'Failed to add to wishlist');
    }
  }

  // Remove product from wishlist
  async removeFromWishlist(productId: string): Promise<void> {
    try {
      const response = await apiClient.delete(`/wishlist/items/${productId}`);

      if (!response.success) {
        throw new Error(response.message || 'Failed to remove from wishlist');
      }
    } catch (error: any) {
      console.error('WishlistService: Remove from wishlist failed', error);
      throw new Error(error.message || 'Failed to remove from wishlist');
    }
  }

  // Check if product is in wishlist
  async isInWishlist(productId: string): Promise<boolean> {
    try {
      const response = await apiClient.get<{ isInWishlist: boolean }>(
        `/wishlist/check/${productId}`
      );

      if (response.success && response.data) {
        return response.data.isInWishlist;
      }
      return false;
    } catch (error: any) {
      console.error('WishlistService: Check wishlist failed', error);
      return false;
    }
  }

  // Get wishlist count
  async getWishlistCount(): Promise<number> {
    try {
      const response = await apiClient.get<{ count: number }>('/wishlist/count');

      if (response.success && response.data) {
        return response.data.count;
      }
      return 0;
    } catch (error: any) {
      console.error('WishlistService: Get wishlist count failed', error);
      return 0;
    }
  }

  // Clear entire wishlist
  async clearWishlist(): Promise<void> {
    try {
      const response = await apiClient.delete('/wishlist');

      if (!response.success) {
        throw new Error(response.message || 'Failed to clear wishlist');
      }
    } catch (error: any) {
      console.error('WishlistService: Clear wishlist failed', error);
      throw new Error(error.message || 'Failed to clear wishlist');
    }
  }
}

// Create singleton instance
export const wishlistService = new WishlistService();

// Export types
export type { WishlistItem };
