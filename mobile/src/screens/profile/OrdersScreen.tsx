
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import { ordersService, Order, OrderStatus, PaymentStatus } from '../../services/orders.service';
import { PaginatedResponse } from '../../config/api.config';

interface OrderCardProps {
  order: Order;
  onPress: (order: Order) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onPress }) => {
  const { theme } = useTheme();
  const { t } = useTranslation('translation');

  const renderOrderItem = (item: any, index: number) => {
    const showMore = index === 2 && order.items.length > 3;

    if (showMore) {
      return (
        <View key={`more-${index}`} style={styles.orderItemMore}>
          <GSText variant="caption" color="textSecondary">
            +{order.items.length - 2} {t('orders.moreItems')}
          </GSText>
        </View>
      );
    }

    if (index >= 3) return null;

    return (
      <View key={item.id} style={styles.orderItem}>
        <View style={styles.orderItemImage}>
          {item.product?.images && item.product.images.length > 0 ? (
            <Image
              source={{ uri: item.product.images[0] }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Ionicons name="image-outline" size={20} color="#9CA3AF" />
            </View>
          )}
        </View>
        <View style={styles.orderItemInfo}>
          <GSText variant="caption" numberOfLines={1}>
            {item.product?.name || `${t('products.product')} ${item.productId}`}
          </GSText>
          <GSText variant="caption" color="textSecondary">
            {t('cart.quantity')}: {item.quantity} × {ordersService.formatPrice(item.price)}
          </GSText>
        </View>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.orderCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => onPress(order)}
    >
      {/* Order Header */}
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderLeft}>
          <GSText variant="body" weight="medium">
            {ordersService.formatOrderNumber(order.orderNumber)}
          </GSText>
          <GSText variant="caption" color="textSecondary">
            {new Date(order.createdAt).toLocaleDateString('es-CO', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </GSText>
        </View>
        <View style={styles.orderHeaderRight}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: ordersService.getOrderStatusColor(order.status) + '20' },
            ]}
          >
            <GSText
              variant="caption"
              weight="medium"
              style={{ color: ordersService.getOrderStatusColor(order.status) }}
            >
              {ordersService.getOrderStatusText(order.status)}
            </GSText>
          </View>
        </View>
      </View>

      {/* Order Items Preview */}
      <View style={styles.orderItems}>
        {order.items.map((item, index) => renderOrderItem(item, index))}
      </View>

      {/* Order Footer */}
      <View style={styles.orderFooter}>
        <View style={styles.orderTotal}>
          <GSText variant="caption" color="textSecondary">
            {t('cart.total')}:
          </GSText>
          <GSText variant="body" weight="medium" color="primary">
            {ordersService.formatPrice(order.total)}
          </GSText>
        </View>

        {/* Payment Status */}
        <View style={styles.paymentStatus}>
          <Ionicons
            name={order.paymentStatus === PaymentStatus.PAID ? 'checkmark-circle' : 'time'}
            size={16}
            color={
              order.paymentStatus === PaymentStatus.PAID
                ? theme.colors.success
                : theme.colors.warning
            }
          />
          <GSText
            variant="caption"
            color={
              order.paymentStatus === PaymentStatus.PAID ? 'success' : 'warning'
            }
            style={{ marginLeft: 4 }}
          >
            {ordersService.getPaymentStatusText(order.paymentStatus)}
          </GSText>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.orderActions}>
        {order.trackingNumber && (
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: theme.colors.primary }]}
            onPress={() => onPress(order)}
          >
            <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
            <GSText variant="caption" color="primary" style={{ marginLeft: 4 }}>
              {t('orders.track')}
            </GSText>
          </TouchableOpacity>
        )}

        {ordersService.canRequestReturn(order) && (
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: theme.colors.warning }]}
          >
            <Ionicons name="return-down-back-outline" size={16} color={theme.colors.warning} />
            <GSText variant="caption" color="warning" style={{ marginLeft: 4 }}>
              {t('orders.return')}
            </GSText>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, { borderColor: theme.colors.textSecondary }]}
          onPress={() => onPress(order)}
        >
          <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
          <GSText variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
            {t('orders.details')}
          </GSText>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default function OrdersScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation('translation');

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load orders
  const loadOrders = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setLoading(true);
        setError(null);
      }

      const response: PaginatedResponse<Order> = await ordersService.getOrders(page, 10);

      if (append) {
        setOrders(prev => [...prev, ...response.data]);
      } else {
        setOrders(response.data);
      }

      setHasMorePages(response.hasNext);
      setCurrentPage(response.currentPage);
    } catch (err: any) {
      console.error('Failed to load orders:', err);
      setError(err.message || t('orders.loadError'));

      if (!append) {
        Alert.alert(t('common.error'), err.message || t('orders.loadError'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      loadOrders(1, false);
    }
  }, [isAuthenticated, loadOrders]);

  // Pull to refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMorePages(true);
    loadOrders(1, false);
  }, [loadOrders]);

  // Load more orders
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMorePages && !loading) {
      setLoadingMore(true);
      loadOrders(currentPage + 1, true);
    }
  }, [loadingMore, hasMorePages, loading, currentPage, loadOrders]);

  // Handle order press
  const handleOrderPress = useCallback((order: Order) => {
    navigation.navigate('OrderDetail' as any, { orderId: order.id });
  }, [navigation]);

  // Handle navigation to shopping
  const handleStartShopping = useCallback(() => {
    navigation.navigate('Home' as any);
  }, [navigation]);

  // Show login prompt for guests
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="person-outline" size={60} color={theme.colors.textSecondary} />
          </View>
          <GSText variant="h3" weight="bold" style={styles.emptyTitle}>
            {t('auth.loginRequired')}
          </GSText>
          <GSText variant="body" color="textSecondary" style={styles.emptySubtitle}>
            {t('orders.loginToView')}
          </GSText>
          <GSButton
            title={t('auth.signIn')}
            onPress={() => navigation.navigate('Auth' as any)}
            style={styles.signInButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Show loading state
  if (loading && orders.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <GSText variant="h3" weight="bold">
            {t('orders.myOrders')}
          </GSText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <GSText variant="body" color="textSecondary" style={{ marginTop: 16 }}>
            {t('orders.loadingOrders')}
          </GSText>
        </View>
      </SafeAreaView>
    );
  }

  // Show empty state
  if (!loading && orders.length === 0 && !error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <GSText variant="h3" weight="bold">
            {t('orders.myOrders')}
          </GSText>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="bag-outline" size={60} color={theme.colors.textSecondary} />
          </View>
          <GSText variant="h3" weight="bold" style={styles.emptyTitle}>
            {t('orders.noOrders')}
          </GSText>
          <GSText variant="body" color="textSecondary" style={styles.emptySubtitle}>
            {t('orders.noOrdersMessage')}
          </GSText>
          <GSButton
            title={t('cart.empty.action')}
            onPress={handleStartShopping}
            style={styles.startShoppingButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Render order item
  const renderOrder = ({ item }: { item: Order }) => (
    <OrderCard order={item} onPress={handleOrderPress} />
  );

  // Render footer
  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <GSText variant="caption" color="textSecondary" style={{ marginLeft: 8 }}>
          {t('orders.loadingMore')}
        </GSText>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <GSText variant="h3" weight="bold">
          {t('orders.myOrders')}
        </GSText>
        <GSText variant="caption" color="textSecondary">
          {t('orders.orderCount', { count: orders.length })}
        </GSText>
      </View>

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <GSText variant="body" color="error" style={{ textAlign: 'center' }}>
            {error}
          </GSText>
          <GSButton
            title={t('common.tryAgain')}
            variant="outlined"
            onPress={() => loadOrders(1, false)}
            style={styles.retryButton}
          />
        </View>
      )}

      {/* Orders List */}
      {!error && (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.ordersList}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginBottom: 24,
    textAlign: 'center',
  },
  signInButton: {
    minWidth: 160,
  },
  startShoppingButton: {
    minWidth: 160,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  retryButton: {
    marginTop: 12,
    minWidth: 100,
  },
  ordersList: {
    padding: 16,
  },
  orderCard: {
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderHeaderRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderItemImage: {
    marginRight: 12,
  },
  productImagePlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemMore: {
    paddingVertical: 4,
    alignItems: 'center',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  orderTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 6,
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
