import { apiClient } from './api';
import { Product } from './products.service';

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  subtotal: number;
  variantId?: string;
  savedForLater: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartResponse {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
  itemCount: number;
  couponCode?: string;
  couponDiscount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartDto {
  productId: string;
  quantity: number;
  variantId?: string;
}

export interface UpdateQuantityDto {
  quantity: number;
}

export interface ApplyCouponDto {
  code: string;
}

export interface SyncCartDto {
  items: {
    productId: string;
    quantity: number;
    variantId?: string;
  }[];
}

export interface StockValidationResponse {
  valid: boolean;
  updates: Array<{
    itemId: string;
    productId: string;
    oldQuantity: number;
    newQuantity: number;
    productName: string;
  }>;
}

class CartService {
  /**
   * Get user's cart from server
   */
  async getCart(): Promise<CartResponse> {
    const response = await apiClient.get<CartResponse>('/cart');
    return response.data;
  }

  /**
   * Add item to cart
   */
  async addItem(dto: AddToCartDto): Promise<CartResponse> {
    const response = await apiClient.post<CartResponse>('/cart/items', dto);
    return response.data;
  }

  /**
   * Update item quantity
   */
  async updateQuantity(itemId: string, dto: UpdateQuantityDto): Promise<CartResponse> {
    const response = await apiClient.put<CartResponse>(`/cart/items/${itemId}`, dto);
    return response.data;
  }

  /**
   * Remove item from cart
   */
  async removeItem(itemId: string): Promise<CartResponse> {
    await apiClient.delete(`/cart/items/${itemId}`);
    return this.getCart();
  }

  /**
   * Clear entire cart
   */
  async clearCart(): Promise<CartResponse> {
    await apiClient.delete('/cart');
    return this.getCart();
  }

  /**
   * Sync local cart with server
   */
  async syncCart(dto: SyncCartDto): Promise<CartResponse> {
    const response = await apiClient.post<CartResponse>('/cart/sync', dto);
    return response.data;
  }

  /**
   * Validate cart stock before checkout
   */
  async validateStock(): Promise<StockValidationResponse> {
    const response = await apiClient.post<StockValidationResponse>('/cart/validate-stock');
    return response.data;
  }

  /**
   * Apply coupon code
   */
  async applyCoupon(dto: ApplyCouponDto): Promise<CartResponse> {
    const response = await apiClient.post<CartResponse>('/cart/coupon', dto);
    return response.data;
  }

  /**
   * Remove coupon
   */
  async removeCoupon(): Promise<CartResponse> {
    await apiClient.delete('/cart/coupon');
    return this.getCart();
  }

  /**
   * Save item for later
   */
  async saveForLater(itemId: string): Promise<CartResponse> {
    const response = await apiClient.post<CartResponse>(`/cart/save-for-later/${itemId}`);
    return response.data;
  }

  /**
   * Move saved item back to cart
   */
  async moveToCart(itemId: string): Promise<CartResponse> {
    const response = await apiClient.post<CartResponse>(`/cart/move-to-cart/${itemId}`);
    return response.data;
  }

  /**
   * Get saved items
   */
  async getSavedItems(): Promise<CartItem[]> {
    const response = await apiClient.get<CartItem[]>('/cart/saved-items');
    return response.data;
  }
}

export const cartService = new CartService();
