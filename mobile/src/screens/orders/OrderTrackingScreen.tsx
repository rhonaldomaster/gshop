import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import { ordersService } from '../../services/orders.service';

interface TrackingInfo {
  orderId: string;
  orderNumber: string;
  trackingNumber: string;
  carrier: string;
  service: string;
  status: string;
  estimatedDelivery: string;
  deliveredAt?: string;
  trackingInfo?: {
    status: string;
    lastUpdate: string;
    events: Array<{
      status: string;
      datetime: string;
      message: string;
      location?: string;
    }>;
  };
  totalAmount: number;
  items: Array<{
    quantity: number;
    price: number;
    product: {
      name: string;
      image?: string;
    };
  }>;
}

type OrderTrackingScreenParams = {
  orderId: string;
};

type OrderTrackingScreenRouteProp = RouteProp<{ params: OrderTrackingScreenParams }, 'params'>;

interface Props {
  route: OrderTrackingScreenRouteProp;
}

export default function OrderTrackingScreen({ route }: Props) {
  const { t } = useTranslation('translation');
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const { orderId } = route.params;

  const statusMap: Record<string, { label: string; color: string; icon: string }> = {
    pending: { label: t('orders.pending'), color: '#F59E0B', icon: 'time-outline' },
    confirmed: { label: t('orders.confirmed'), color: '#3B82F6', icon: 'checkmark-circle-outline' },
    processing: { label: t('orders.processing'), color: '#8B5CF6', icon: 'cog-outline' },
    in_transit: { label: t('orders.inTransit'), color: '#F97316', icon: 'car-outline' },
    shipped: { label: t('orders.shipped'), color: '#10B981', icon: 'airplane-outline' },
    delivered: { label: t('orders.delivered'), color: '#059669', icon: 'checkmark-circle' },
    cancelled: { label: t('orders.cancelled'), color: '#EF4444', icon: 'close-circle-outline' },
    return_requested: { label: t('orders.returnRequested'), color: '#F59E0B', icon: 'return-up-back-outline' },
    refunded: { label: t('orders.refunded'), color: '#6B7280', icon: 'card-outline' },
  };

  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Real-time tracking refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    fetchTrackingInfo();
    startRealTimeTracking();

    // Listen to app state changes
    const handleAppStateChange = (nextAppState: string) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground, refresh tracking
        fetchTrackingInfo();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      stopRealTimeTracking();
      subscription?.remove();
    };
  }, [orderId]);

  // Focus effect for automatic refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchTrackingInfo();
      startRealTimeTracking();

      return () => {
        stopRealTimeTracking();
      };
    }, [orderId])
  );

  // Real-time tracking functions
  const startRealTimeTracking = useCallback(() => {
    // Stop any existing interval
    stopRealTimeTracking();

    // Set up interval for real-time updates (every 30 seconds)
    intervalRef.current = setInterval(() => {
      fetchTrackingInfo(true);
    }, 30000); // 30 seconds
  }, []);

  const stopRealTimeTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const fetchTrackingInfo = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await ordersService.getOrderTracking(orderId);
      setTrackingInfo(data);
      setLastUpdate(new Date().toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }));

    } catch (error: any) {
      console.error('Error fetching tracking info:', error);

      // Only show error if it's not a background refresh
      if (!isRefresh) {
        Alert.alert(t('common.error'), error.message || t('orders.errorLoadingTracking'));
      }

      // Mock data for development when API fails
      if (!trackingInfo) {
        const mockData: TrackingInfo = {
          orderId: orderId,
          orderNumber: 'GS-001',
          trackingNumber: 'SERV123456789',
          carrier: 'Servientrega',
          service: 'Standard',
          status: 'in_transit',
          estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          totalAmount: 158500,
          items: [
            {
              quantity: 1,
              price: 150000,
              product: {
                name: 'Smartphone Samsung Galaxy A54',
                image: 'https://example.com/image.jpg'
              }
            }
          ],
          trackingInfo: {
            status: 'in_transit',
            lastUpdate: new Date().toISOString(),
            events: [
              {
                status: 'shipped',
                datetime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                message: 'Paquete enviado desde el centro de distribución',
                location: 'Bogotá, Cundinamarca'
              },
              {
                status: 'in_transit',
                datetime: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
                message: 'En tránsito a la ciudad de destino',
                location: 'En ruta'
              },
              {
                status: 'in_transit',
                datetime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                message: 'Llegada al centro de distribución local',
                location: 'Centro de distribución - Medellín'
              }
            ]
          }
        };
        setTrackingInfo(mockData);
        setLastUpdate(new Date().toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId, trackingInfo]);

  const openCarrierTracking = () => {
    if (!trackingInfo) return;

    let trackingUrl = '';
    const { carrier, trackingNumber } = trackingInfo;

    switch (carrier.toLowerCase()) {
      case 'servientrega':
        trackingUrl = `https://www.servientrega.com/wps/portal/servientrega/rastreo?guia=${trackingNumber}`;
        break;
      case 'coordinadora':
        trackingUrl = `https://www.coordinadora.com/portafolio-de-servicios/rastreo-y-cotizaciones/rastreo-de-guias/?guia=${trackingNumber}`;
        break;
      case 'dhl':
        trackingUrl = `https://www.dhl.com/co-es/home/tracking.html?tracking-id=${trackingNumber}`;
        break;
      case 'fedex':
        trackingUrl = `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
        break;
      default:
        Alert.alert(t('common.info'), t('orders.noTrackingAvailable'));
        return;
    }

    Linking.openURL(trackingUrl).catch(() => {
      Alert.alert(t('common.error'), t('orders.errorOpeningTracking'));
    });
  };

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    fetchTrackingInfo(true);
  }, [fetchTrackingInfo]);

  const requestReturn = useCallback(async () => {
    if (!trackingInfo) return;

    Alert.alert(
      t('orders.requestReturn'),
      t('orders.requestReturnConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('orders.requestReturn'),
          style: 'destructive',
          onPress: async () => {
            try {
              await ordersService.requestReturn(orderId, {
                reason: 'Producto defectuoso', // This could be from a form
              });

              Alert.alert(
                t('orders.returnRequested'),
                t('orders.returnRequestedMessage'),
                [{ text: 'OK', onPress: () => fetchTrackingInfo() }]
              );
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message || t('orders.errorProcessingReturn'));
            }
          }
        }
      ]
    );
  }, [orderId, trackingInfo, fetchTrackingInfo]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <GSText variant="h3" weight="bold">
            {t('orders.orderTracking')}
          </GSText>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <GSText variant="body" color="textSecondary" style={{ marginTop: 16 }}>
            {t('orders.loadingTracking')}
          </GSText>
        </View>
      </SafeAreaView>
    );
  }

  if (!trackingInfo) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <GSText variant="h3" weight="bold">
            {t('orders.orderTracking')}
          </GSText>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={theme.colors.textSecondary} />
          <GSText variant="h3" weight="bold" style={{ marginTop: 16, textAlign: 'center' }}>
            {t('orders.connectionError')}
          </GSText>
          <GSText variant="body" color="textSecondary" style={{ marginTop: 8, textAlign: 'center' }}>
            {t('orders.errorLoadingOrder')}
          </GSText>
          <GSButton
            title={t('orders.retry')}
            onPress={() => fetchTrackingInfo()}
            style={{ marginTop: 24 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = statusMap[trackingInfo.status] || statusMap.pending;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header with real-time indicator */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <GSText variant="h3" weight="bold">
            {t('orders.orderTracking')}
          </GSText>
          {lastUpdate && (
            <GSText variant="caption" color="textSecondary">
              {t('orders.updated')}: {lastUpdate}
            </GSText>
          )}
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Ionicons name="refresh" size={24} color={theme.colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Order Status Card */}
        <View style={[styles.statusCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.statusHeader}>
            <View style={[
              styles.statusIconContainer,
              { backgroundColor: statusInfo.color + '20' }
            ]}>
              <Ionicons
                name={statusInfo.icon as any}
                size={32}
                color={statusInfo.color}
              />
            </View>
            <View style={styles.statusInfo}>
              <GSText variant="h3" weight="bold">
                {trackingInfo.orderNumber}
              </GSText>
              <GSText variant="body" style={{ color: statusInfo.color }} weight="medium">
                {statusInfo.label}
              </GSText>
              {trackingInfo.status === 'in_transit' && (
                <View style={styles.liveIndicator}>
                  <View style={[styles.liveDot, { backgroundColor: theme.colors.success }]} />
                  <GSText variant="caption" color="success" weight="medium">
                    {t('orders.realTimeUpdates')}
                  </GSText>
                </View>
              )}
            </View>
          </View>

          {trackingInfo.trackingNumber && (
            <View style={styles.trackingContainer}>
              <View style={styles.trackingInfo}>
                <Text style={styles.trackingLabel}>{t('orders.trackingNumber')}:</Text>
                <Text style={styles.trackingNumber}>{trackingInfo.trackingNumber}</Text>
                <Text style={styles.carrier}>{trackingInfo.carrier} - {trackingInfo.service}</Text>
              </View>
              <TouchableOpacity
                style={styles.trackButton}
                onPress={openCarrierTracking}
              >
                <Ionicons name="open-outline" size={16} color="#007AFF" />
                <Text style={styles.trackButtonText}>{t('orders.track')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {trackingInfo.estimatedDelivery && (
            <View style={styles.deliveryInfo}>
              <Text style={styles.deliveryLabel}>{t('orders.estimatedDelivery')}:</Text>
              <Text style={styles.deliveryDate}>
                {new Date(trackingInfo.estimatedDelivery).toLocaleDateString('es-CO', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          )}
        </View>

        {/* Tracking Events */}
        {trackingInfo.trackingInfo?.events && (
          <View style={styles.eventsCard}>
            <Text style={styles.sectionTitle}>{t('orders.shippingHistory')}</Text>
            {trackingInfo.trackingInfo.events.map((event, index) => (
              <View key={index} style={styles.eventItem}>
                <View style={styles.eventIcon}>
                  <View style={styles.eventDot} />
                  {index < trackingInfo.trackingInfo!.events.length - 1 && (
                    <View style={styles.eventLine} />
                  )}
                </View>
                <View style={styles.eventContent}>
                  <Text style={styles.eventMessage}>{event.message}</Text>
                  <Text style={styles.eventDate}>
                    {new Date(event.datetime).toLocaleString('es-CO')}
                  </Text>
                  {event.location && (
                    <Text style={styles.eventLocation}>{event.location}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Order Items */}
        <View style={styles.itemsCard}>
          <Text style={styles.sectionTitle}>{t('orders.orderProducts')}</Text>
          {trackingInfo.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product.name}</Text>
                <Text style={styles.itemDetails}>
                  {t('orders.quantity')}: {item.quantity} • ${item.price.toLocaleString('es-CO')} c/u
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                ${(item.price * item.quantity).toLocaleString('es-CO')}
              </Text>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('orders.orderTotal')}:</Text>
            <Text style={styles.totalAmount}>
              ${trackingInfo.totalAmount.toLocaleString('es-CO')}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        {['delivered', 'shipped'].includes(trackingInfo.status) && (
          <View style={[styles.actionsCard, { backgroundColor: theme.colors.surface }]}>
            <GSButton
              title={t('orders.requestReturn')}
              onPress={requestReturn}
              variant="outline"
              style={styles.returnButton}
            />
          </View>
        )}

        {/* Real-time tracking info */}
        <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
            <GSText variant="body" weight="medium" style={{ marginLeft: 8 }}>
              {t('orders.trackingInfo')}
            </GSText>
          </View>
          <GSText variant="caption" color="textSecondary" style={{ marginTop: 8 }}>
            • {t('orders.autoSync')}
          </GSText>
          <GSText variant="caption" color="textSecondary">
            • {t('orders.pullToRefresh')}
          </GSText>
          <GSText variant="caption" color="textSecondary">
            • {t('orders.externalTracking')}
          </GSText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  refreshButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
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
  statusCard: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusInfo: {
    marginLeft: 12,
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  trackingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  trackingInfo: {
    flex: 1,
  },
  trackingLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  trackingNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'monospace',
  },
  carrier: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EBF4FF',
    borderRadius: 6,
  },
  trackButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  deliveryInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  deliveryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  deliveryDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textTransform: 'capitalize',
  },
  eventsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  eventItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  eventIcon: {
    alignItems: 'center',
    marginRight: 12,
  },
  eventDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  eventLine: {
    width: 2,
    height: 24,
    backgroundColor: '#D1D5DB',
    marginTop: 4,
  },
  eventContent: {
    flex: 1,
  },
  eventMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  eventLocation: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 2,
  },
  itemsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  itemDetails: {
    fontSize: 12,
    color: '#6B7280',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  actionsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  returnButton: {
    marginBottom: 0,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});