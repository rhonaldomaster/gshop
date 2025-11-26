
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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('translation');
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
          {item.product?.name || t('orders.product', { id: item.productId })}
        </GSText>

        <View style={styles.orderItemDetails}>
          <GSText variant="caption" color="textSecondary">
            {t('orders.quantity')}: {item.quantity}
          </GSText>
          <GSText variant="caption" color="textSecondary">
            {t('orders.price')}: {ordersService.formatPrice(item.price)}
          </GSText>
        </View>

        <View style={styles.orderItemFooter}>
          <GSText variant="body" weight="semiBold" color="primary">
            {t('orders.subtotal')}: {ordersService.formatPrice(item.subtotal)}
          </GSText>

          {onReorder && (
            <TouchableOpacity
              style={styles.reorderButton}
              onPress={() => onReorder(item.productId)}
            >
              <Ionicons name="refresh-outline" size={16} color={theme.colors.primary} />
              <GSText variant="caption" color="primary" style={{ marginLeft: 4 }}>
                {t('orders.reorder')}
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
  const { t } = useTranslation('translation');
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
        {t('orders.trackingTimeline')}
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
  const { t } = useTranslation('translation');
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

      // Load tracking info if order has tracking number (new seller-managed system)
      if (orderData.shippingTrackingNumber) {
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
        Alert.alert(t('common.error'), t('orders.productNotAvailable'));
        return;
      }

      const success = await addToCart(orderItem.product, orderItem.quantity, false);
      if (success) {
        Alert.alert(
          t('orders.addedToCart'),
          t('orders.addedToCartMessage', { name: orderItem.product.name }),
          [
            { text: t('orders.continueShopping'), style: 'cancel' },
            { text: t('orders.viewCart'), onPress: () => (navigation as any).navigate('Cart') },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('orders.addToCartError'));
    }
  }, [order, addToCart, navigation]);

  // Handle cancel order
  const handleCancelOrder = useCallback(() => {
    if (!order) return;

    Alert.alert(
      t('orders.cancelOrder'),
      t('orders.cancelOrderConfirm'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('orders.yesCancelOrder'),
          style: 'destructive',
          onPress: async () => {
            try {
              await ordersService.cancelOrder(order.id, t('orders.cancelledByCustomer'));
              Alert.alert(t('common.success'), t('orders.orderCancelled'));
              loadOrderDetails();
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message || t('orders.cancelOrderError'));
            }
          },
        },
      ]
    );
  }, [order, loadOrderDetails, t]);

  // Handle return request (placeholder for future implementation)
  const handleRequestReturn = useCallback(async () => {
    if (!order) return;

    Alert.alert(
      t('orders.requestReturn'),
      t('orders.returnFunctionalitySoon'),
      [{ text: t('common.ok') }]
    );
  }, [order, t]);

  // Handle open tracking URL (new seller-managed system)
  const handleOpenTracking = useCallback(() => {
    if (!order) return;

    // Use seller-provided tracking URL if available
    if (order.shippingTrackingUrl) {
      Linking.openURL(order.shippingTrackingUrl).catch(() => {
        Alert.alert(t('common.error'), t('orders.trackingLinkError'));
      });
      return;
    }

    // Fallback: construct URL based on carrier (for backward compatibility)
    if (order.shippingTrackingNumber && order.shippingCarrier) {
      let trackingUrl = '';

      switch (order.shippingCarrier.toLowerCase()) {
        case 'servientrega':
          trackingUrl = `https://www.servientrega.com/wps/portal/canal-de-atencion/seguimiento-de-envios`;
          break;
        case 'coordinadora':
          trackingUrl = `https://www.coordinadora.com/seguimiento-de-envios/`;
          break;
        case 'dhl':
          trackingUrl = `https://www.dhl.com/co-es/home/tracking.html?tracking-id=${order.shippingTrackingNumber}`;
          break;
        case 'fedex':
          trackingUrl = `https://www.fedex.com/fedextrack/?tracknumber=${order.shippingTrackingNumber}`;
          break;
        default:
          trackingUrl = `https://www.google.com/search?q=track+${order.shippingTrackingNumber}+${order.shippingCarrier}`;
      }

      Linking.openURL(trackingUrl).catch(() => {
        Alert.alert(t('common.error'), t('orders.trackingLinkError'));
      });
    }
  }, [order, t]);

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <GSText variant="body" color="textSecondary" style={{ marginTop: 16 }}>
            {t('orders.loadingDetails')}
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
            {t('orders.errorLoadingOrder')}
          </GSText>
          <GSText variant="body" color="textSecondary" style={styles.errorMessage}>
            {error || t('orders.orderNotFound')}
          </GSText>
          <GSButton
            title={t('common.retry')}
            onPress={loadOrderDetails}
            style={styles.retryButton}
          />
          <GSButton
            title={t('common.goBack')}
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
              {t(ordersService.getOrderStatusTranslationKey(order.status))}
            </GSText>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            {t('orders.orderItems')}
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
            {t('orders.orderSummary')}
          </GSText>

          <View style={styles.summaryRow}>
            <GSText variant="body">{t('orders.subtotal')}</GSText>
            <GSText variant="body">{ordersService.formatPrice(order.subtotal)}</GSText>
          </View>

          <View style={styles.summaryRow}>
            <GSText variant="body">{t('orders.shipping')}</GSText>
            <GSText variant="body">
              {parseFloat(String(order.shipping || 0)) === 0 ? t('orders.free') : ordersService.formatPrice(order.shipping || 0)}
            </GSText>
          </View>

          {/* Platform Fee */}
          {order.platformFeeAmount && parseFloat(String(order.platformFeeAmount)) > 0 && (
            <View style={styles.summaryRow}>
              <GSText variant="body" color="textSecondary">
                {t('orders.platformFee', { rate: order.platformFeeRate || 0 })}
              </GSText>
              <GSText variant="body" color="textSecondary">
                {ordersService.formatPrice(order.platformFeeAmount)}
              </GSText>
            </View>
          )}

          <GSText variant="caption" color="textSecondary" style={{ marginTop: 4, marginBottom: 8 }}>
            {t('orders.vatIncluded')}
          </GSText>

          <View style={[styles.summaryRow, styles.totalRow]}>
            <GSText variant="h4" weight="bold">{t('orders.total')}</GSText>
            <GSText variant="h4" weight="bold" color="primary">
              {ordersService.formatPrice(order.total || 0)}
            </GSText>
          </View>
        </View>

        {/* Tracking Information - New seller-managed system */}
        {order.shippingTrackingNumber && (
          <View style={styles.section}>
            <View style={styles.trackingHeader}>
              <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
                {t('orders.trackingInformation')}
              </GSText>

              {order.shippingTrackingUrl && (
                <TouchableOpacity
                  style={styles.trackingButton}
                  onPress={handleOpenTracking}
                >
                  <Ionicons name="open-outline" size={16} color={theme.colors.primary} />
                  <GSText variant="caption" color="primary" style={{ marginLeft: 4 }}>
                    {t('orders.trackOrder')}
                  </GSText>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.trackingCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.trackingInfo}>
                <GSText variant="body" weight="semiBold">
                  {t('orders.carrier')}: {order.shippingCarrier || 'N/A'}
                </GSText>
                <GSText variant="body" color="textSecondary">
                  {t('orders.trackingNumber')}: {order.shippingTrackingNumber}
                </GSText>
                {order.shippingNotes && (
                  <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' }}>
                    <GSText variant="caption" weight="semiBold">
                      {t('orders.sellerNotes')}:
                    </GSText>
                    <GSText variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
                      {order.shippingNotes}
                    </GSText>
                  </View>
                )}
                {order.estimatedDelivery && (
                  <GSText variant="caption" color="textSecondary" style={{ marginTop: 8 }}>
                    {t('orders.estimatedDelivery')}: {new Date(order.estimatedDelivery).toLocaleDateString('es-CO')}
                  </GSText>
                )}
              </View>
            </View>

            {trackingLoading ? (
              <View style={styles.trackingLoading}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <GSText variant="caption" color="textSecondary" style={{ marginLeft: 8 }}>
                  {t('orders.loadingTracking')}
                </GSText>
              </View>
            ) : (
              trackingInfo && <TrackingTimeline trackingInfo={trackingInfo} />
            )}
          </View>
        )}

        {/* Waiting for tracking message */}
        {!order.shippingTrackingNumber && (order.status === 'confirmed' || order.status === 'processing') && (
          <View style={styles.section}>
            <View style={[styles.waitingCard, { backgroundColor: theme.colors.warning + '10', borderColor: theme.colors.warning, borderWidth: 1, borderRadius: 12, padding: 16 }]}>
              <GSText variant="body" weight="semiBold" style={{ marginBottom: 8 }}>
                ⏳ {t('orders.orderBeingPrepared')}
              </GSText>
              <GSText variant="caption" color="textSecondary">
                {t('orders.sellerWillAddShipping')}
              </GSText>
            </View>
          </View>
        )}

        {/* Shipping Address */}
        <View style={styles.section}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            {t('orders.shippingAddress')}
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
            {t('orders.paymentInformation')}
          </GSText>
          <View style={[styles.paymentCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.paymentRow}>
              <GSText variant="body">{t('orders.paymentMethod')}:</GSText>
              <GSText variant="body" weight="semiBold">
                {order.paymentMethod?.provider || 'N/A'}
              </GSText>
            </View>
            <View style={styles.paymentRow}>
              <GSText variant="body">{t('orders.paymentStatusLabel')}:</GSText>
              <GSText
                variant="body"
                weight="semiBold"
                color={order.paymentStatus === PaymentStatus.PAID ? 'success' : 'warning'}
              >
                {t(ordersService.getPaymentStatusTranslationKey(order.paymentStatus))}
              </GSText>
            </View>
          </View>
        </View>

        {/* Order Actions */}
        <View style={styles.section}>
          <View style={styles.actionsContainer}>
            {ordersService.canCancelOrder(order) && (
              <GSButton
                title={t('orders.cancelOrder')}
                variant="outline"
                onPress={handleCancelOrder}
                style={styles.actionButton}
              />
            )}

            {ordersService.canRequestReturn(order) && (
              <GSButton
                title={t('orders.requestReturn')}
                variant="outline"
                onPress={handleRequestReturn}
                style={styles.actionButton}
              />
            )}

            <GSButton
              title={t('orders.reorderItems')}
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
  waitingCard: {
    // Styles defined inline in JSX
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
