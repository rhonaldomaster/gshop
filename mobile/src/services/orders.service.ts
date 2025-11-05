import { apiClient, ApiResponse } from './api';
import { API_CONFIG, PaginatedResponse, buildEndpointUrl } from '../config/api.config';
import { Product } from './products.service';

// Order types
export interface OrderItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  // Frontend names
  price?: number | string; // Mapped from unitPrice
  subtotal?: number | string; // Mapped from totalPrice
  // Backend names (for raw response)
  unitPrice?: number | string; // TypeORM decimal serialized as string
  totalPrice?: number | string; // TypeORM decimal serialized as string
  productSnapshot?: {
    name: string;
    sku: string;
    image?: string;
    variant?: any;
  };
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string; // Frontend uses 'address'
  address1?: string; // Backend uses 'address1'
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  phone: string;
  document?: string;
  documentType?: 'CC' | 'CE' | 'PA' | 'TI';
}

// Legacy interface - no longer used with seller-managed shipping
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
  subtotal: number | string; // TypeORM decimal serialized as string
  // Frontend names
  shipping?: number | string; // Mapped from shippingAmount
  tax?: number | string; // Mapped from taxAmount
  total?: number | string; // Mapped from totalAmount
  // Backend names (for raw response)
  shippingAmount?: number | string;
  taxAmount?: number | string;
  totalAmount?: number | string;
  discountAmount?: number | string;
  currency?: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  shippingAddress: ShippingAddress;
  // Seller-managed shipping fields
  shippingType?: 'local' | 'national';
  shippingCarrier?: string;
  shippingTrackingNumber?: string;
  shippingTrackingUrl?: string;
  shippingNotes?: string;
  // Legacy fields (backward compatibility)
  trackingNumber?: string;
  courierService?: string;
  isGuestOrder: boolean;
  liveSessionId?: string;
  affiliateId?: string;
  commissionRate?: number | string; // TypeORM decimal serialized as string
  commissionAmount?: number | string; // TypeORM decimal serialized as string
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
  // Seller-managed tracking
  shippingTrackingNumber?: string;
  shippingTrackingUrl?: string;
  shippingCarrier?: string;
  shippingNotes?: string;
  // Legacy fields
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
  // Map backend order item to frontend format
  private mapOrderItem(backendItem: any): OrderItem {
    return {
      ...backendItem,
      // Map backend field names to frontend
      price: backendItem.unitPrice ?? backendItem.price ?? 0,
      subtotal: backendItem.totalPrice ?? backendItem.subtotal ?? 0,
    };
  }

  // Map backend order response to frontend format
  private mapOrder(backendOrder: any): Order {
    return {
      ...backendOrder,
      // Map backend field names to frontend
      shipping: backendOrder.shippingAmount ?? backendOrder.shipping ?? 0,
      tax: backendOrder.taxAmount ?? backendOrder.tax ?? 0,
      total: backendOrder.totalAmount ?? backendOrder.total ?? 0,
      // Map order items
      items: backendOrder.items?.map((item: any) => this.mapOrderItem(item)) ?? [],
      // Normalize shippingAddress
      shippingAddress: {
        ...backendOrder.shippingAddress,
        address: backendOrder.shippingAddress?.address1 || backendOrder.shippingAddress?.address || '',
      },
    };
  }

  // Get user orders with pagination
  getOrders = async (page: number = 1, limit: number = 10): Promise<PaginatedResponse<Order>> => {
    try {
      const response = await apiClient.get<any>(
        API_CONFIG.ENDPOINTS.ORDERS.LIST,
        { params: { page, limit } }
      );

      if (response.success && response.data) {
        // Backend returns flat structure: { data, total, page, limit, totalPages }
        // Mobile expects nested structure: { data, pagination: { page, limit, total, totalPages } }

        // Map backend response to mobile format
        const mappedData: PaginatedResponse<Order> = {
          data: (response.data.data || []).map((order: any) => this.mapOrder(order)),
          pagination: {
            page: response.data.page || 1,
            limit: response.data.limit || 10,
            total: response.data.total || 0,
            totalPages: response.data.totalPages || 0,
          },
        };
        return mappedData;
      } else {
        throw new Error(response.message || 'Failed to get orders');
      }
    } catch (error: any) {
      console.error('OrdersService: Get orders failed', error);
      throw new Error(error.message || 'Failed to load orders');
    }
  }

  // Get single order by ID
  getOrder = async (orderId: string): Promise<Order> => {
    try {
      const url = buildEndpointUrl(API_CONFIG.ENDPOINTS.ORDERS.DETAIL, { id: orderId });

      const response = await apiClient.get<Order>(url);

      if (response.success && response.data) {
        // Map order to normalize field names
        return this.mapOrder(response.data);
      } else {
        throw new Error(response.message || 'Order not found');
      }
    } catch (error: any) {
      console.error('OrdersService: Get order failed', error);
      throw new Error(error.message || 'Failed to load order');
    }
  }

  /**
   * @deprecated No longer used with seller-managed shipping system.
   * Shipping cost is now calculated via POST /orders/calculate-shipping
   */
  getShippingOptions = async (orderData: {
    items: { productId: string; quantity: number }[];
    shippingAddress: ShippingAddress;
  }): Promise<ShippingOption[]> => {
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
  createOrder = async (orderData: CreateOrderRequest): Promise<Order> => {
    try {
      // Use the same endpoint for both guest and regular orders
      const endpoint = API_CONFIG.ENDPOINTS.ORDERS.CREATE;

      // Build notes with document info for guest orders
      let notes = orderData.notes || '';
      if (orderData.isGuestOrder && orderData.shippingAddress.document) {
        const docInfo = `Document: ${orderData.shippingAddress.documentType || 'CC'} ${orderData.shippingAddress.document}`;
        notes = notes ? `${notes}\n${docInfo}` : docInfo;
      }

      // Transform shippingAddress to backend format
      const backendOrderData = {
        items: orderData.items,
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
        paymentMethodId: orderData.paymentMethodId,
        liveSessionId: orderData.liveSessionId,
        affiliateId: orderData.affiliateId,
        notes: notes,
        // Note: customerDocument is NOT supported by backend CreateOrderDto
        // Document info is stored in notes field instead for guest orders
      };

      const response = await apiClient.post<Order>(endpoint, backendOrderData);

      if (response.success && response.data) {
        // Map the response to normalize field names
        return this.mapOrder(response.data);
      } else {
        throw new Error(response.message || 'Failed to create order');
      }
    } catch (error: any) {
      console.error('OrdersService: Create order failed', error);
      throw new Error(error.message || 'Failed to create order');
    }
  }

  /**
   * @deprecated No longer used with seller-managed shipping system.
   * Shipping cost is automatically included in order total during checkout.
   */
  confirmShipping = async (orderId: string, shippingOptionId: string): Promise<Order> => {
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
  getOrderTracking = async (orderId: string): Promise<OrderTrackingInfo> => {
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
  processPayment = async (orderId: string, paymentData: {
    paymentMethodId: string;
    amount: number;
    currency?: string;
  }): Promise<{ success: boolean; paymentId: string; redirectUrl?: string }> => {
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
  cancelOrder = async (orderId: string, reason?: string): Promise<Order> => {
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
  requestReturn = async (returnData: ReturnRequest): Promise<{ success: boolean; returnId: string }> => {
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
  getReturnDetails = async (orderId: string): Promise<{
    canReturn: boolean;
    returnWindow: number;
    returnReason?: string;
    returnStatus?: string;
  }> => {
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

  calculateOrderTotals(items: OrderItem[], shipping: number | string = 0, tax: number | string = 0): {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  } {
    const subtotal = items.reduce((sum, item) => {
      const itemSubtotal = typeof item.subtotal === 'string' ? parseFloat(item.subtotal) : (item.subtotal ?? 0);
      return sum + (isNaN(itemSubtotal) ? 0 : itemSubtotal);
    }, 0);

    const shippingNum = typeof shipping === 'string' ? parseFloat(shipping) : shipping;
    const taxNum = typeof tax === 'string' ? parseFloat(tax) : tax;

    const finalShipping = isNaN(shippingNum) ? 0 : shippingNum;
    const finalTax = isNaN(taxNum) ? 0 : taxNum;

    return {
      subtotal,
      shipping: finalShipping,
      tax: finalTax,
      total: subtotal + finalShipping + finalTax,
    };
  }

  formatPrice(price: number | string, currency: string = 'COP'): string {
    // Convert string to number if needed (TypeORM decimal fields are serialized as strings)
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

    // Return NaN-safe formatting
    if (isNaN(numericPrice)) {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency,
      }).format(0);
    }

    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
    }).format(numericPrice);
  }
}

// Create singleton instance
export const ordersService = new OrdersService();