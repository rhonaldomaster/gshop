import { apiClient, ApiResponse } from './api';
import { API_CONFIG, PaginatedResponse, buildEndpointUrl } from '../config/api.config';
import { Product } from './products.service';

// Order types
export interface OrderItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  document?: string;
  documentType?: 'CC' | 'CE' | 'PA' | 'TI';
}

export interface ShippingOption {
  id: string;
  name: string;
  carrier: string;
  serviceName: string;
  price: number;
  estimatedDays: number;
  description?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'mercadopago' | 'crypto' | 'gshop_tokens';
  provider: string;
  details?: Record<string, any>;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  shippingAddress: ShippingAddress;
  shippingCarrier?: string;
  courierService?: string;
  trackingNumber?: string;
  easypostShipmentId?: string;
  isGuestOrder: boolean;
  liveSessionId?: string;
  affiliateId?: string;
  commissionRate?: number;
  commissionAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  IN_TRANSIT = 'in_transit',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURN_REQUESTED = 'return_requested',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export interface CreateOrderRequest {
  items: {
    productId: string;
    quantity: number;
  }[];
  shippingAddress: ShippingAddress;
  paymentMethodId?: string;
  isGuestOrder?: boolean;
  liveSessionId?: string;
  affiliateId?: string;
  notes?: string;
}

export interface OrderTrackingInfo {
  orderId: string;
  status: OrderStatus;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  trackingEvents: TrackingEvent[];
}

export interface TrackingEvent {
  id: string;
  status: string;
  description: string;
  location?: string;
  timestamp: string;
}

export interface ReturnRequest {
  orderId: string;
  reason: string;
  description?: string;
  images?: string[];
}

class OrdersService {
  // Get user orders with pagination
  async getOrders(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Order>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Order>>(
        API_CONFIG.ENDPOINTS.ORDERS.LIST,
        { params: { page, limit } }
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get orders');
      }
    } catch (error: any) {
      console.error('OrdersService: Get orders failed', error);
      throw new Error(error.message || 'Failed to load orders');
    }
  }

  // Get single order by ID
  async getOrder(orderId: string): Promise<Order> {
    try {
      const url = buildEndpointUrl(API_CONFIG.ENDPOINTS.ORDERS.DETAIL, { id: orderId });

      const response = await apiClient.get<Order>(url);

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Order not found');
      }
    } catch (error: any) {
      console.error('OrdersService: Get order failed', error);
      throw new Error(error.message || 'Failed to load order');
    }
  }

  // Get shipping options for order
  async getShippingOptions(orderData: {
    items: { productId: string; quantity: number }[];
    shippingAddress: ShippingAddress;
  }): Promise<ShippingOption[]> {
    try {
      // Map mobile ShippingAddress to backend format
      const requestData = {
        shippingAddress: {
          firstName: orderData.shippingAddress.firstName,
          lastName: orderData.shippingAddress.lastName,
          address1: orderData.shippingAddress.address,
          address2: '',
          city: orderData.shippingAddress.city,
          state: orderData.shippingAddress.state,
          postalCode: orderData.shippingAddress.postalCode,
          country: 'CO',
          phone: orderData.shippingAddress.phone,
        },
        packageDimensions: {
          length: 10,
          width: 8,
          height: 6,
          weight: 0.5,
        },
      };

      const response = await apiClient.post<any[]>(
        '/shipping/calculate-rates',
        requestData
      );

      if (response.success && response.data) {
        // Map backend response to mobile format
        const shippingOptions: ShippingOption[] = response.data.map((rate: any, index: number) => ({
          id: rate.easypostRateId || `rate_${index}`,
          name: `${rate.carrier} ${rate.service}`,
          carrier: rate.carrier,
          serviceName: rate.service,
          price: rate.rate,
          estimatedDays: parseInt(rate.deliveryTime) || 5,
          description: `${rate.deliveryTime} delivery`,
        }));

        return shippingOptions;
      } else {
        throw new Error(response.message || 'Failed to get shipping options');
      }
    } catch (error: any) {
      console.error('OrdersService: Get shipping options failed', error);
      throw new Error(error.message || 'Failed to calculate shipping');
    }
  }

  // Create new order
  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    try {
      const endpoint = orderData.isGuestOrder
        ? API_CONFIG.ENDPOINTS.ORDERS.GUEST
        : API_CONFIG.ENDPOINTS.ORDERS.CREATE;

      const response = await apiClient.post<Order>(endpoint, orderData);

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create order');
      }
    } catch (error: any) {
      console.error('OrdersService: Create order failed', error);
      throw new Error(error.message || 'Failed to create order');
    }
  }

  // Confirm shipping method for order
  async confirmShipping(orderId: string, shippingOptionId: string): Promise<Order> {
    try {
      const url = buildEndpointUrl(API_CONFIG.ENDPOINTS.ORDERS.CONFIRM_SHIPPING, { id: orderId });

      const response = await apiClient.post<Order>(url, {
        shippingOptionId,
      });

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to confirm shipping');
      }
    } catch (error: any) {
      console.error('OrdersService: Confirm shipping failed', error);
      throw new Error(error.message || 'Failed to confirm shipping');
    }
  }

  // Get order tracking information
  async getOrderTracking(orderId: string): Promise<OrderTrackingInfo> {
    try {
      const url = buildEndpointUrl(API_CONFIG.ENDPOINTS.ORDERS.TRACKING, { id: orderId });

      const response = await apiClient.get<OrderTrackingInfo>(url);

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get tracking info');
      }
    } catch (error: any) {
      console.error('OrdersService: Get tracking failed', error);
      throw new Error(error.message || 'Failed to load tracking information');
    }
  }

  // Process payment for order
  async processPayment(orderId: string, paymentData: {
    paymentMethodId: string;
    amount: number;
    currency?: string;
  }): Promise<{ success: boolean; paymentId: string; redirectUrl?: string }> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        paymentId: string;
        redirectUrl?: string;
      }>(`/orders/${orderId}/payment`, paymentData);

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Payment failed');
      }
    } catch (error: any) {
      console.error('OrdersService: Process payment failed', error);
      throw new Error(error.message || 'Payment failed');
    }
  }

  // Cancel order
  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    try {
      const response = await apiClient.patch<Order>(`/orders/${orderId}/cancel`, {
        reason,
      });

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to cancel order');
      }
    } catch (error: any) {
      console.error('OrdersService: Cancel order failed', error);
      throw new Error(error.message || 'Failed to cancel order');
    }
  }

  // Request return for delivered order
  async requestReturn(returnData: ReturnRequest): Promise<{ success: boolean; returnId: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; returnId: string }>(
        `/orders/${returnData.orderId}/return`,
        returnData
      );

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to request return');
      }
    } catch (error: any) {
      console.error('OrdersService: Request return failed', error);
      throw new Error(error.message || 'Failed to request return');
    }
  }

  // Get return details for order
  async getReturnDetails(orderId: string): Promise<{
    canReturn: boolean;
    returnWindow: number;
    returnReason?: string;
    returnStatus?: string;
  }> {
    try {
      const response = await apiClient.get<{
        canReturn: boolean;
        returnWindow: number;
        returnReason?: string;
        returnStatus?: string;
      }>(`/orders/${orderId}/return-details`);

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get return details');
      }
    } catch (error: any) {
      console.error('OrdersService: Get return details failed', error);
      throw new Error(error.message || 'Failed to load return information');
    }
  }

  // Helper methods
  canCancelOrder(order: Order): boolean {
    return [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status);
  }

  canRequestReturn(order: Order): boolean {
    return order.status === OrderStatus.DELIVERED;
  }

  isOrderDelivered(order: Order): boolean {
    return order.status === OrderStatus.DELIVERED;
  }

  getOrderStatusColor(status: OrderStatus): string {
    const colors: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: '#FFA500',
      [OrderStatus.CONFIRMED]: '#00BFFF',
      [OrderStatus.PROCESSING]: '#9370DB',
      [OrderStatus.IN_TRANSIT]: '#32CD32',
      [OrderStatus.SHIPPED]: '#228B22',
      [OrderStatus.DELIVERED]: '#008000',
      [OrderStatus.CANCELLED]: '#DC143C',
      [OrderStatus.RETURN_REQUESTED]: '#FF6347',
      [OrderStatus.REFUNDED]: '#B22222',
    };

    return colors[status] || '#808080';
  }

  getOrderStatusText(status: OrderStatus): string {
    const statusTexts: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'Pendiente',
      [OrderStatus.CONFIRMED]: 'Confirmado',
      [OrderStatus.PROCESSING]: 'Procesando',
      [OrderStatus.IN_TRANSIT]: 'En tránsito',
      [OrderStatus.SHIPPED]: 'Enviado',
      [OrderStatus.DELIVERED]: 'Entregado',
      [OrderStatus.CANCELLED]: 'Cancelado',
      [OrderStatus.RETURN_REQUESTED]: 'Devolución solicitada',
      [OrderStatus.REFUNDED]: 'Reembolsado',
    };

    return statusTexts[status] || status;
  }

  getPaymentStatusText(status: PaymentStatus): string {
    const statusTexts: Record<PaymentStatus, string> = {
      [PaymentStatus.PENDING]: 'Pendiente',
      [PaymentStatus.PAID]: 'Pagado',
      [PaymentStatus.FAILED]: 'Falló',
      [PaymentStatus.REFUNDED]: 'Reembolsado',
      [PaymentStatus.PARTIALLY_REFUNDED]: 'Reembolso parcial',
    };

    return statusTexts[status] || status;
  }

  formatOrderNumber(orderNumber: string): string {
    return `#${orderNumber}`;
  }

  calculateOrderTotals(items: OrderItem[], shipping: number = 0, tax: number = 0): {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  } {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

    return {
      subtotal,
      shipping,
      tax,
      total: subtotal + shipping + tax,
    };
  }

  formatPrice(price: number, currency: string = 'COP'): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
    }).format(price);
  }
}

// Create singleton instance
export const ordersService = new OrdersService();

// Export types
export type {
  Order,
  OrderItem,
  ShippingAddress,
  ShippingOption,
  PaymentMethod,
  CreateOrderRequest,
  OrderTrackingInfo,
  TrackingEvent,
  ReturnRequest,
};