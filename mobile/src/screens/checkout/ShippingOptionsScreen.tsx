import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, RouteProp } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import { ordersService } from '../../services/orders.service';

interface ShippingOption {
  carrier: string;
  service: string;
  rate: number;
  deliveryTime: string;
  easypostRateId?: string;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

type ShippingOptionsScreenParams = {
  orderId: string;
  shippingAddress: ShippingAddress;
  packageDimensions: {
    length: number;
    width: number;
    height: number;
    weight: number;
  };
};

type ShippingOptionsScreenRouteProp = RouteProp<{ params: ShippingOptionsScreenParams }, 'params'>;

interface Props {
  route: ShippingOptionsScreenRouteProp;
}

export default function ShippingOptionsScreen({ route }: Props) {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { getToken } = useAuth();
  const { orderId, shippingAddress, packageDimensions } = route.params;
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<ShippingOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetchShippingOptions();
  }, []);

  const fetchShippingOptions = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }

      const options = await ordersService.getShippingOptions(orderId, {
        shippingAddress,
        packageDimensions,
      });

      setShippingOptions(options);
      if (options.length > 0 && !selectedOption) {
        setSelectedOption(options[0]); // Select first option by default
      }
    } catch (error: any) {
      console.error('Error fetching shipping options:', error);
      Alert.alert('Error', error.message || 'No se pudieron cargar las opciones de envío');

      // Mock data for development when API fails
      const mockOptions: ShippingOption[] = [
        {
          carrier: 'Servientrega',
          service: 'Standard',
          rate: 8500,
          deliveryTime: '3-5 días',
          easypostRateId: 'mock_servientrega_1',
        },
        {
          carrier: 'Coordinadora',
          service: 'Express',
          rate: 12500,
          deliveryTime: '1-2 días',
          easypostRateId: 'mock_coordinadora_1',
        },
        {
          carrier: 'DHL',
          service: 'Express',
          rate: 25000,
          deliveryTime: '1 día',
          easypostRateId: 'mock_dhl_1',
        },
        {
          carrier: 'FedEx',
          service: 'Ground',
          rate: 18000,
          deliveryTime: '2-3 días',
          easypostRateId: 'mock_fedex_1',
        },
      ];

      setShippingOptions(mockOptions);
      if (!selectedOption) {
        setSelectedOption(mockOptions[0]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId, shippingAddress, packageDimensions, selectedOption]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchShippingOptions(true);
  }, [fetchShippingOptions]);

  const handleConfirmShipping = useCallback(async () => {
    if (!selectedOption) {
      Alert.alert('Error', 'Por favor selecciona una opción de envío');
      return;
    }

    setConfirming(true);
    try {
      await ordersService.confirmShipping(orderId, {
        selectedCarrier: selectedOption.carrier,
        selectedService: selectedOption.service,
        selectedRate: selectedOption.rate,
        easypostRateId: selectedOption.easypostRateId,
        customerDocument: {
          type: 'CC', // This would come from previous form
          number: '12345678', // This would come from previous form
        },
      });

      Alert.alert(
        'Envío Confirmado',
        `Tu pedido será enviado por ${selectedOption.carrier}. Recibirás un número de seguimiento pronto.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('OrderTracking' as never, { orderId } as never),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error confirming shipping:', error);
      Alert.alert('Error', error.message || 'No se pudo confirmar el envío. Intenta nuevamente.');
    } finally {
      setConfirming(false);
    }
  }, [selectedOption, orderId, navigation]);

  const getCarrierIcon = (carrier: string) => {
    switch (carrier.toLowerCase()) {
      case 'servientrega':
        return 'car-outline';
      case 'coordinadora':
        return 'airplane-outline';
      case 'dhl':
      case 'fedex':
        return 'rocket-outline';
      default:
        return 'cube-outline';
    }
  };

  const getCarrierColor = (carrier: string) => {
    switch (carrier.toLowerCase()) {
      case 'servientrega':
        return '#FF6B35';
      case 'coordinadora':
        return '#4A90E2';
      case 'dhl':
        return '#FFCC02';
      case 'fedex':
        return '#FF6600';
      default:
        return '#666';
    }
  };

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
            Opciones de Envío
          </GSText>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <GSText variant="body" color="textSecondary" style={{ marginTop: 16 }}>
            Calculando opciones de envío...
          </GSText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <GSText variant="h3" weight="bold">
          Opciones de Envío
        </GSText>
        <View style={{ width: 24 }} />
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
        {/* Shipping Address */}
        <View style={[styles.addressContainer, { backgroundColor: theme.colors.surface }]}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            Dirección de Envío
          </GSText>
          <GSText variant="body" weight="medium" style={styles.addressText}>
            {shippingAddress.firstName} {shippingAddress.lastName}
          </GSText>
          <GSText variant="body" color="textSecondary" style={styles.addressText}>
            {shippingAddress.address1}
          </GSText>
          {shippingAddress.address2 && (
            <GSText variant="body" color="textSecondary" style={styles.addressText}>
              {shippingAddress.address2}
            </GSText>
          )}
          <GSText variant="body" color="textSecondary" style={styles.addressText}>
            {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
          </GSText>
          <GSText variant="body" color="textSecondary" style={styles.addressText}>
            {shippingAddress.country}
          </GSText>
        </View>

        <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
          Selecciona tu Opción de Envío
        </GSText>

        {shippingOptions.map((option, index) => {
          const isSelected = selectedOption?.carrier === option.carrier &&
                            selectedOption?.service === option.service;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionCard,
                { backgroundColor: theme.colors.surface },
                isSelected && {
                  borderColor: theme.colors.primary,
                  borderWidth: 2,
                },
              ]}
              onPress={() => setSelectedOption(option)}
            >
              <View style={styles.optionHeader}>
                <View style={styles.carrierInfo}>
                  <View style={[
                    styles.carrierIconContainer,
                    { backgroundColor: getCarrierColor(option.carrier) + '20' }
                  ]}>
                    <Ionicons
                      name={getCarrierIcon(option.carrier) as any}
                      size={24}
                      color={getCarrierColor(option.carrier)}
                    />
                  </View>
                  <View style={styles.carrierDetails}>
                    <GSText variant="body" weight="bold">
                      {option.carrier}
                    </GSText>
                    <GSText variant="caption" color="textSecondary">
                      {option.service}
                    </GSText>
                  </View>
                </View>
                <View style={styles.priceContainer}>
                  <GSText variant="h4" weight="bold" color="success">
                    ${option.rate.toLocaleString('es-CO')}
                  </GSText>
                  <GSText variant="caption" color="textSecondary">
                    {option.deliveryTime}
                  </GSText>
                </View>
              </View>

              {isSelected && (
                <View style={styles.selectedIndicator}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                  <GSText variant="caption" color="success" weight="medium" style={{ marginLeft: 8 }}>
                    Seleccionado
                  </GSText>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.totalContainer}>
          <GSText variant="body" weight="medium">
            Costo de Envío:
          </GSText>
          <GSText variant="h3" weight="bold" color="success">
            ${selectedOption?.rate.toLocaleString('es-CO') || '0'}
          </GSText>
        </View>

        <GSButton
          title="Confirmar Envío"
          onPress={handleConfirmShipping}
          loading={confirming}
          disabled={!selectedOption}
          style={styles.confirmButton}
        />
      </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  addressContainer: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    marginBottom: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  addressText: {
    marginBottom: 4,
  },
  optionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carrierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  carrierIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  carrierDetails: {
    flex: 1,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmButton: {
    marginBottom: 0,
  },
});