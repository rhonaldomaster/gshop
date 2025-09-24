import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

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

interface Props {
  route: {
    params: {
      orderId: string;
    };
  };
}

const statusMap: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'Pendiente', color: '#F59E0B', icon: 'time-outline' },
  confirmed: { label: 'Confirmado', color: '#3B82F6', icon: 'checkmark-circle-outline' },
  processing: { label: 'Procesando', color: '#8B5CF6', icon: 'cog-outline' },
  in_transit: { label: 'En Tránsito', color: '#F97316', icon: 'car-outline' },
  shipped: { label: 'Enviado', color: '#10B981', icon: 'airplane-outline' },
  delivered: { label: 'Entregado', color: '#059669', icon: 'checkmark-circle' },
  cancelled: { label: 'Cancelado', color: '#EF4444', icon: 'close-circle-outline' },
  return_requested: { label: 'Devolución Solicitada', color: '#F59E0B', icon: 'return-up-back-outline' },
  refunded: { label: 'Reembolsado', color: '#6B7280', icon: 'card-outline' },
};

export default function OrderTrackingScreen({ route }: Props) {
  const navigation = useNavigation();
  const { orderId } = route.params;
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTrackingInfo();
  }, [orderId]);

  const fetchTrackingInfo = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch(`/api/v1/orders/${orderId}/tracking`, {
        headers: {
          'Authorization': `Bearer ${/* token */}`, // Get from storage
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTrackingInfo(data);
      } else {
        Alert.alert('Error', 'No se pudo cargar la información de seguimiento');

        // Mock data for development
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
      }
    } catch (error) {
      console.error('Error fetching tracking info:', error);
      Alert.alert('Error', 'Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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
        Alert.alert('Información', 'No hay enlace de seguimiento disponible para esta transportadora');
        return;
    }

    Linking.openURL(trackingUrl).catch(() => {
      Alert.alert('Error', 'No se pudo abrir el enlace de seguimiento');
    });
  };

  const requestReturn = async () => {
    Alert.alert(
      'Solicitar Devolución',
      '¿Estás seguro de que quieres solicitar una devolución para este pedido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Solicitar',
          style: 'destructive',
          onPress: () => {
            navigation.navigate('ReturnRequest' as never, { orderId } as never);
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Cargando información...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!trackingInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text>No se pudo cargar la información del pedido</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = statusMap[trackingInfo.status] || statusMap.pending;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seguimiento de Pedido</Text>
        <TouchableOpacity onPress={() => fetchTrackingInfo(true)}>
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchTrackingInfo(true)}
          />
        }
      >
        {/* Order Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={statusInfo.icon as any}
              size={32}
              color={statusInfo.color}
            />
            <View style={styles.statusInfo}>
              <Text style={styles.orderNumber}>{trackingInfo.orderNumber}</Text>
              <Text style={[styles.status, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>

          {trackingInfo.trackingNumber && (
            <View style={styles.trackingContainer}>
              <View style={styles.trackingInfo}>
                <Text style={styles.trackingLabel}>Número de Seguimiento:</Text>
                <Text style={styles.trackingNumber}>{trackingInfo.trackingNumber}</Text>
                <Text style={styles.carrier}>{trackingInfo.carrier} - {trackingInfo.service}</Text>
              </View>
              <TouchableOpacity
                style={styles.trackButton}
                onPress={openCarrierTracking}
              >
                <Ionicons name="open-outline" size={16} color="#007AFF" />
                <Text style={styles.trackButtonText}>Rastrear</Text>
              </TouchableOpacity>
            </View>
          )}

          {trackingInfo.estimatedDelivery && (
            <View style={styles.deliveryInfo}>
              <Text style={styles.deliveryLabel}>Entrega Estimada:</Text>
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
            <Text style={styles.sectionTitle}>Historial de Envío</Text>
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
          <Text style={styles.sectionTitle}>Productos del Pedido</Text>
          {trackingInfo.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product.name}</Text>
                <Text style={styles.itemDetails}>
                  Cantidad: {item.quantity} • ${item.price.toLocaleString('es-CO')} c/u
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                ${(item.price * item.quantity).toLocaleString('es-CO')}
              </Text>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total del Pedido:</Text>
            <Text style={styles.totalAmount}>
              ${trackingInfo.totalAmount.toLocaleString('es-CO')}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        {['delivered', 'shipped'].includes(trackingInfo.status) && (
          <View style={styles.actionsCard}>
            <TouchableOpacity
              style={styles.returnButton}
              onPress={requestReturn}
            >
              <Ionicons name="return-up-back-outline" size={20} color="#EF4444" />
              <Text style={styles.returnButtonText}>Solicitar Devolución</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCard: {
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  returnButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});