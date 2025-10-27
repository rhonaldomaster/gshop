
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../hooks/useCart';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import {
  ordersService,
  Order,
  PaymentStatus,
  OrderTrackingInfo,
} from '../../services/orders.service';

type OrderDetailScreenParams = {
  orderId: string;
};

type OrderDetailScreenRouteProp = RouteProp<{ params: OrderDetailScreenParams }, 'params'>;

interface OrderItemComponentProps {
  item: any;
  onReorder?: (productId: string) => void;
}

const OrderItemComponent: React.FC<OrderItemComponentProps> = ({ item, onReorder }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.orderItemCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.orderItemImage}>
        {item.product?.images && item.product.images.length > 0 ? (
          <Image
            source={{ uri: item.product.images[0] }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="image-outline" size={24} color="#9CA3AF" />
          </View>
        )}
      </View>

      <View style={styles.orderItemInfo}>
        <GSText variant="body" weight="semiBold" numberOfLines={2}>
          {item.product?.name || `Product ${item.productId}`}
        </GSText>

        <View style={styles.orderItemDetails}>
          <GSText variant="caption" color="textSecondary">
            Quantity: {item.quantity}
          </GSText>
          <GSText variant="caption" color="textSecondary">
            Price: {ordersService.formatPrice(item.price)}
          </GSText>
        </View>

        <View style={styles.orderItemFooter}>
          <GSText variant="body" weight="semiBold" color="primary">
            Subtotal: {ordersService.formatPrice(item.subtotal)}
          </GSText>

          {onReorder && (
            <TouchableOpacity
              style={styles.reorderButton}
              onPress={() => onReorder(item.productId)}
            >
              <Ionicons name="refresh-outline" size={16} color={theme.colors.primary} />
              <GSText variant="caption" color="primary" style={{ marginLeft: 4 }}>
                Reorder
              </GSText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

interface TrackingTimelineProps {
  trackingInfo: OrderTrackingInfo;
}

const TrackingTimeline: React.FC<TrackingTimelineProps> = ({ trackingInfo }) => {
  const { theme } = useTheme();

  const getStatusIcon = (status: string, isActive: boolean) => {
    const iconProps = {
      size: 20,
      color: isActive ? theme.colors.primary : theme.colors.textSecondary,
    };

    switch (status.toLowerCase()) {
      case 'pending':
      case 'created':
        return <Ionicons name="time-outline" {...iconProps} />;
      case 'confirmed':
      case 'processing':
        return <Ionicons name="checkmark-circle-outline" {...iconProps} />;
      case 'shipped':
      case 'in_transit':
        return <Ionicons name="car-outline" {...iconProps} />;
      case 'delivered':
        return <Ionicons name="home-outline" {...iconProps} />;
      default:
        return <Ionicons name="ellipse-outline" {...iconProps} />;
    }
  };

  return (
    <View style={styles.trackingTimeline}>
      <GSText variant="h4" weight="bold" style={styles.trackingTitle}>
        Tracking Timeline
      </GSText>

      {trackingInfo.trackingEvents.map((event, index) => {
        const isLast = index === trackingInfo.trackingEvents.length - 1;
        const isActive = index === 0; // Most recent event is active

        return (
          <View key={event.id} style={styles.trackingEvent}>
            <View style={styles.trackingEventIcon}>
              {getStatusIcon(event.status, isActive)}
              {!isLast && (
                <View
                  style={[
                    styles.trackingEventLine,
                    { backgroundColor: theme.colors.gray300 },
                  ]}
                />
              )}
            </View>

            <View style={styles.trackingEventContent}>
              <GSText
                variant="body"
                weight={isActive ? 'semiBold' : 'normal'}
                color={isActive ? 'primary' : 'text'}
              >
                {event.description}
              </GSText>

              {event.location && (
                <GSText variant="caption" color="textSecondary">
                  {event.location}
                </GSText>
              )}

              <GSText variant="caption" color="textSecondary">
                {new Date(event.timestamp).toLocaleString('es-CO', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </GSText>
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default function OrderDetailScreen() {
  const { theme } = useTheme();
  const route = useRoute<OrderDetailScreenRouteProp>();
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const { orderId } = route.params;

  const [order, setOrder] = useState<Order | null>(null);
  const [trackingInfo, setTrackingInfo] = useState<OrderTrackingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load order details
  const loadOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const orderData = await ordersService.getOrder(orderId);
      setOrder(orderData);

      // Load tracking info if order has tracking number
      if (orderData.trackingNumber) {
        setTrackingLoading(true);
        try {
          const tracking = await ordersService.getOrderTracking(orderId);
          setTrackingInfo(tracking);
        } catch (trackingError) {
          console.warn('Failed to load tracking info:', trackingError);
        } finally {
          setTrackingLoading(false);
        }
      }
    } catch (err: any) {
      console.error('Failed to load order:', err);
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (isAuthenticated && orderId) {
      loadOrderDetails();
    }
  }, [isAuthenticated, orderId, loadOrderDetails]);

  // Handle reorder
  const handleReorder = useCallback(async (productId: string) => {
    try {
      const orderItem = order?.items.find(item => item.productId === productId);
      if (!orderItem?.product) {
        Alert.alert('Error', 'Product information not available');
        return;
      }

      const success = await addToCart(orderItem.product, orderItem.quantity, false);
      if (success) {
        Alert.alert(
          'Added to Cart',
          `${orderItem.product.name} has been added to your cart`,
          [
            { text: 'Continue Shopping', style: 'cancel' },
            { text: 'View Cart', onPress: () => (navigation as any).navigate('Cart') },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add to cart');
    }
  }, [order, addToCart, navigation]);

  // Handle cancel order
  const handleCancelOrder = useCallback(() => {
    if (!order) return;

    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await ordersService.cancelOrder(order.id, 'Cancelled by customer');
              Alert.alert('Success', 'Order has been cancelled');
              loadOrderDetails();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel order');
            }
          },
        },
      ]
    );
  }, [order, loadOrderDetails]);

  // Handle return request (placeholder for future implementation)
  const handleRequestReturn = useCallback(async () => {
    if (!order) return;

    Alert.alert(
      'Request Return',
      'Return functionality will be available soon.',
      [{ text: 'OK' }]
    );
  }, [order]);

  // Handle open tracking URL
  const handleOpenTracking = useCallback(() => {
    if (order?.trackingNumber && order?.shippingCarrier) {
      // Create tracking URL based on carrier
      let trackingUrl = '';

      switch (order.shippingCarrier.toLowerCase()) {
        case 'servientrega':
          trackingUrl = `https://www.servientrega.com/wps/portal/canal-de-atencion/seguimiento-de-envios`;
          break;
        case 'coordinadora':
          trackingUrl = `https://www.coordinadora.com/seguimiento-de-envios/`;
          break;
        case 'dhl':
          trackingUrl = `https://www.dhl.com/co-es/home/tracking.html?tracking-id=${order.trackingNumber}`;
          break;
        case 'fedex':
          trackingUrl = `https://www.fedex.com/fedextrack/?tracknumber=${order.trackingNumber}`;
          break;
        default:
          trackingUrl = `https://www.google.com/search?q=track+${order.trackingNumber}+${order.shippingCarrier}`;
      }

      Linking.openURL(trackingUrl).catch(() => {
        Alert.alert('Error', 'Could not open tracking link');
      });
    }
  }, [order]);

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <GSText variant="body" color="textSecondary" style={{ marginTop: 16 }}>
            Loading order details...
          </GSText>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error || !order) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={theme.colors.error} />
          <GSText variant="h3" weight="bold" style={styles.errorTitle}>
            Error Loading Order
          </GSText>
          <GSText variant="body" color="textSecondary" style={styles.errorMessage}>
            {error || 'Order not found'}
          </GSText>
          <GSButton
            title="Retry"
            onPress={loadOrderDetails}
            style={styles.retryButton}
          />
          <GSButton
            title="Go Back"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.goBackButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.headerContent}>
            <GSText variant="h3" weight="bold">
              {ordersService.formatOrderNumber(order.orderNumber)}
            </GSText>
            <GSText variant="caption" color="textSecondary">
              Ordered on {new Date(order.createdAt).toLocaleDateString('es-CO', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </GSText>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: ordersService.getOrderStatusColor(order.status) + '20' },
            ]}
          >
            <GSText
              variant="body"
              weight="semiBold"
              style={{ color: ordersService.getOrderStatusColor(order.status) }}
            >
              {ordersService.getOrderStatusText(order.status)}
            </GSText>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            Order Items
          </GSText>
          {order.items.map((item) => (
            <OrderItemComponent
              key={item.id}
              item={item}
              onReorder={ordersService.isOrderDelivered(order) ? handleReorder : undefined}
            />
          ))}
        </View>

        {/* Order Summary */}
        <View style={[styles.section, styles.summarySection, { backgroundColor: theme.colors.surface }]}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            Order Summary
          </GSText>

          <View style={styles.summaryRow}>
            <GSText variant="body">Subtotal</GSText>
            <GSText variant="body">{ordersService.formatPrice(order.subtotal)}</GSText>
          </View>

          <View style={styles.summaryRow}>
            <GSText variant="body">Shipping</GSText>
            <GSText variant="body">
              {parseFloat(String(order.shipping || 0)) === 0 ? 'Free' : ordersService.formatPrice(order.shipping || 0)}
            </GSText>
          </View>

          <View style={styles.summaryRow}>
            <GSText variant="body">Tax</GSText>
            <GSText variant="body">{ordersService.formatPrice(order.tax || 0)}</GSText>
          </View>

          <View style={[styles.summaryRow, styles.totalRow]}>
            <GSText variant="h4" weight="bold">Total</GSText>
            <GSText variant="h4" weight="bold" color="primary">
              {ordersService.formatPrice(order.total || 0)}
            </GSText>
          </View>
        </View>

        {/* Tracking Information */}
        {order.trackingNumber && (
          <View style={styles.section}>
            <View style={styles.trackingHeader}>
              <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
                Tracking Information
              </GSText>

              <TouchableOpacity
                style={styles.trackingButton}
                onPress={handleOpenTracking}
              >
                <Ionicons name="open-outline" size={16} color={theme.colors.primary} />
                <GSText variant="caption" color="primary" style={{ marginLeft: 4 }}>
                  Open Tracking
                </GSText>
              </TouchableOpacity>
            </View>

            <View style={[styles.trackingCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.trackingInfo}>
                <GSText variant="body" weight="semiBold">
                  Tracking Number: {order.trackingNumber}
                </GSText>
                <GSText variant="caption" color="textSecondary">
                  Carrier: {order.shippingCarrier || 'N/A'}
                </GSText>
                {order.estimatedDelivery && (
                  <GSText variant="caption" color="textSecondary">
                    Estimated Delivery: {new Date(order.estimatedDelivery).toLocaleDateString('es-CO')}
                  </GSText>
                )}
              </View>
            </View>

            {trackingLoading ? (
              <View style={styles.trackingLoading}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <GSText variant="caption" color="textSecondary" style={{ marginLeft: 8 }}>
                  Loading tracking details...
                </GSText>
              </View>
            ) : (
              trackingInfo && <TrackingTimeline trackingInfo={trackingInfo} />
            )}
          </View>
        )}

        {/* Shipping Address */}
        <View style={styles.section}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            Shipping Address
          </GSText>
          <View style={[styles.addressCard, { backgroundColor: theme.colors.surface }]}>
            <GSText variant="body" weight="semiBold">
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}
            </GSText>
            <GSText variant="body">{order.shippingAddress.address}</GSText>
            <GSText variant="body">
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
            </GSText>
            <GSText variant="body">{order.shippingAddress.phone}</GSText>
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            Payment Information
          </GSText>
          <View style={[styles.paymentCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.paymentRow}>
              <GSText variant="body">Payment Method:</GSText>
              <GSText variant="body" weight="semiBold">
                {order.paymentMethod?.provider || 'N/A'}
              </GSText>
            </View>
            <View style={styles.paymentRow}>
              <GSText variant="body">Payment Status:</GSText>
              <GSText
                variant="body"
                weight="semiBold"
                color={order.paymentStatus === PaymentStatus.PAID ? 'success' : 'warning'}
              >
                {ordersService.getPaymentStatusText(order.paymentStatus)}
              </GSText>
            </View>
          </View>
        </View>

        {/* Order Actions */}
        <View style={styles.section}>
          <View style={styles.actionsContainer}>
            {ordersService.canCancelOrder(order) && (
              <GSButton
                title="Cancel Order"
                variant="outline"
                onPress={handleCancelOrder}
                style={styles.actionButton}
              />
            )}

            {ordersService.canRequestReturn(order) && (
              <GSButton
                title="Request Return"
                variant="outline"
                onPress={handleRequestReturn}
                style={styles.actionButton}
              />
            )}

            <GSButton
              title="Reorder Items"
              onPress={() => {
                order.items.forEach(item => {
                  if (item.product) {
                    handleReorder(item.productId);
                  }
                });
              }}
              style={styles.actionButton}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    marginBottom: 12,
    minWidth: 120,
  },
  goBackButton: {
    minWidth: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    marginBottom: 8,
  },
  headerContent: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  orderItemCard: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderItemImage: {
    marginRight: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  orderItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  summarySection: {
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalRow: {
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 0,
  },
  trackingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  trackingCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  trackingInfo: {
    gap: 4,
  },
  trackingLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  trackingTimeline: {
    marginTop: 8,
  },
  trackingTitle: {
    marginBottom: 16,
  },
  trackingEvent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  trackingEventIcon: {
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  trackingEventLine: {
    position: 'absolute',
    top: 24,
    left: 9,
    width: 2,
    height: 32,
  },
  trackingEventContent: {
    flex: 1,
    gap: 2,
  },
  addressCard: {
    padding: 16,
    borderRadius: 12,
    gap: 4,
  },
  paymentCard: {
    padding: 16,
    borderRadius: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
});
