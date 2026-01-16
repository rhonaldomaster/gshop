import { apiClient } from './api';

export interface SellerProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  basePrice?: number;
  vatAmount?: number;
  vatType?: string;
  stock: number;
  images: string[];
  category: {
    id: string;
    name: string;
  };
  status: 'draft' | 'active' | 'sold_out' | 'discontinued';
  createdAt: string;
  updatedAt: string;
}

export interface SellerStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  rating: number;
  totalReviews: number;
}

export interface SellerOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  customer: {
    name: string;
    email: string;
  };
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    country: string;
  };
  createdAt: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  vatType?: 'excluido' | 'exento' | 'reducido' | 'general';
  stock: number;
  categoryId: string;
  images: string[];
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  status?: 'draft' | 'active' | 'sold_out' | 'discontinued';
}

class SellerService {
  // Get seller dashboard stats
  async getStats(): Promise<SellerStats> {
    try {
      const response = await apiClient.get<SellerStats>('/sellers/stats');

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to fetch seller stats');
    } catch (error: any) {
      console.error('SellerService: Failed to get stats', error);
      throw new Error(error.message || 'Failed to fetch seller statistics');
    }
  }

  // Get seller products
  async getProducts(page = 1, limit = 20, status?: string): Promise<{ products: SellerProduct[]; total: number }> {
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };

      if (status) {
        params.status = status;
      }

      const queryString = new URLSearchParams(params).toString();
      const response = await apiClient.get<{ products: SellerProduct[]; total: number }>(
        `/sellers/products?${queryString}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to fetch products');
    } catch (error: any) {
      console.error('SellerService: Failed to get products', error);
      throw new Error(error.message || 'Failed to fetch seller products');
    }
  }

  // Get single product
  async getProduct(productId: string): Promise<SellerProduct> {
    try {
      const response = await apiClient.get<SellerProduct>(`/sellers/products/${productId}`);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to fetch product');
    } catch (error: any) {
      console.error('SellerService: Failed to get product', error);
      throw new Error(error.message || 'Failed to fetch product details');
    }
  }

  // Create new product
  async createProduct(data: CreateProductRequest): Promise<SellerProduct> {
    try {
      const response = await apiClient.post<SellerProduct>('/sellers/products', data);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to create product');
    } catch (error: any) {
      console.error('SellerService: Failed to create product', error);
      throw new Error(error.message || 'Failed to create product');
    }
  }

  // Update product
  async updateProduct(productId: string, data: UpdateProductRequest): Promise<SellerProduct> {
    try {
      const response = await apiClient.put<SellerProduct>(`/sellers/products/${productId}`, data);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to update product');
    } catch (error: any) {
      console.error('SellerService: Failed to update product', error);
      throw new Error(error.message || 'Failed to update product');
    }
  }

  // Delete product
  async deleteProduct(productId: string): Promise<void> {
    try {
      const response = await apiClient.delete(`/sellers/products/${productId}`);

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete product');
      }
    } catch (error: any) {
      console.error('SellerService: Failed to delete product', error);
      throw new Error(error.message || 'Failed to delete product');
    }
  }

  // Upload product images
  async uploadProductImages(images: string[]): Promise<string[]> {
    try {
      const formData = new FormData();

      images.forEach((imageUri, index) => {
        const filename = imageUri.split('/').pop() || `image_${index}.jpg`;
        const fileType = filename.split('.').pop()?.toLowerCase() || 'jpg';

        const mimeTypeMap: { [key: string]: string } = {
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          gif: 'image/gif',
          webp: 'image/webp',
        };

        formData.append('images', {
          uri: imageUri,
          type: mimeTypeMap[fileType] || 'image/jpeg',
          name: filename,
        } as any);
      });

      const response = await apiClient.uploadFile<{ urls: string[]; provider: string }>(
        '/products/upload',
        formData
      );

      if (response.success && response.data) {
        return response.data.urls;
      }

      throw new Error(response.message || 'Failed to upload images');
    } catch (error: any) {
      console.error('SellerService: Failed to upload images', error);
      throw new Error(error.message || 'Failed to upload product images');
    }
  }

  // Get seller orders
  async getOrders(page = 1, limit = 20, status?: string): Promise<{ orders: SellerOrder[]; total: number }> {
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };

      if (status) {
        params.status = status;
      }

      const queryString = new URLSearchParams(params).toString();
      const response = await apiClient.get<{ orders: SellerOrder[]; total: number }>(
        `/sellers/orders?${queryString}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Failed to fetch orders');
    } catch (error: any) {
      console.error('SellerService: Failed to get orders', error);
      throw new Error(error.message || 'Failed to fetch seller orders');
    }
  }

  // Update order status
  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    try {
      const response = await apiClient.put(`/sellers/orders/${orderId}/status`, { status });

      if (!response.success) {
        throw new Error(response.message || 'Failed to update order status');
      }
    } catch (error: any) {
      console.error('SellerService: Failed to update order status', error);
      throw new Error(error.message || 'Failed to update order status');
    }
  }

  // Add tracking info to order
  async addTracking(orderId: string, trackingUrl: string, carrier?: string): Promise<void> {
    try {
      const response = await apiClient.put(`/orders/${orderId}/tracking`, {
        trackingUrl,
        carrier,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to add tracking');
      }
    } catch (error: any) {
      console.error('SellerService: Failed to add tracking', error);
      throw new Error(error.message || 'Failed to add tracking information');
    }
  }

  // Get seller live streams
  async getLiveStreams(): Promise<any[]> {
    try {
      const response = await apiClient.get<any[]>('/live/streams/seller/me');

      if (response.success && response.data) {
        return response.data;
      }

      return [];
    } catch (error: any) {
      console.error('SellerService: Failed to get live streams', error);
      return [];
    }
  }
}

export const sellerService = new SellerService();
