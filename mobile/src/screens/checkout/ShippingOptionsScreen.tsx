import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

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

interface Props {
  route: {
    params: {
      orderId: string;
      shippingAddress: ShippingAddress;
      packageDimensions: {
        length: number;
        width: number;
        height: number;
        weight: number;
      };
    };
  };
}

export default function ShippingOptionsScreen({ route }: Props) {
  const navigation = useNavigation();
  const { orderId, shippingAddress, packageDimensions } = route.params;
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<ShippingOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetchShippingOptions();
  }, []);

  const fetchShippingOptions = async () => {
    try {
      const response = await fetch(`/api/v1/orders/${orderId}/shipping-options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${/* token */}`, // Get from storage
        },
        body: JSON.stringify({
          shippingAddress,
          packageDimensions,
        }),
      });

      if (response.ok) {
        const options = await response.json();
        setShippingOptions(options);
        if (options.length > 0) {
          setSelectedOption(options[0]); // Select first option by default
        }
      } else {
        Alert.alert('Error', 'No se pudieron cargar las opciones de envío');
      }
    } catch (error) {
      console.error('Error fetching shipping options:', error);
      Alert.alert('Error', 'Error de conexión. Intenta nuevamente.');

      // Mock data for development
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
      setSelectedOption(mockOptions[0]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmShipping = async () => {
    if (!selectedOption) {
      Alert.alert('Error', 'Por favor selecciona una opción de envío');
      return;
    }

    setConfirming(true);
    try {
      const response = await fetch(`/api/v1/orders/${orderId}/confirm-shipping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${/* token */}`,
        },
        body: JSON.stringify({
          selectedCarrier: selectedOption.carrier,
          selectedService: selectedOption.service,
          selectedRate: selectedOption.rate,
          easypostRateId: selectedOption.easypostRateId,
          customerDocument: {
            type: 'CC', // This would come from previous form
            number: '12345678', // This would come from previous form
          },
        }),
      });

      if (response.ok) {
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
      } else {
        Alert.alert('Error', 'No se pudo confirmar el envío. Intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error confirming shipping:', error);
      Alert.alert('Error', 'Error de conexión. Intenta nuevamente.');
    } finally {
      setConfirming(false);
    }
  };

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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Calculando opciones de envío...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Opciones de Envío</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.addressContainer}>
          <Text style={styles.sectionTitle}>Dirección de Envío</Text>
          <Text style={styles.addressText}>
            {shippingAddress.firstName} {shippingAddress.lastName}
          </Text>
          <Text style={styles.addressText}>{shippingAddress.address1}</Text>
          {shippingAddress.address2 && (
            <Text style={styles.addressText}>{shippingAddress.address2}</Text>
          )}
          <Text style={styles.addressText}>
            {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
          </Text>
          <Text style={styles.addressText}>{shippingAddress.country}</Text>
        </View>

        <Text style={styles.sectionTitle}>Selecciona tu Opción de Envío</Text>

        {shippingOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionCard,
              selectedOption?.carrier === option.carrier &&
              selectedOption?.service === option.service &&
                styles.selectedOption,
            ]}
            onPress={() => setSelectedOption(option)}
          >
            <View style={styles.optionHeader}>
              <View style={styles.carrierInfo}>
                <Ionicons
                  name={getCarrierIcon(option.carrier) as any}
                  size={24}
                  color={getCarrierColor(option.carrier)}
                />
                <View style={styles.carrierDetails}>
                  <Text style={styles.carrierName}>{option.carrier}</Text>
                  <Text style={styles.serviceName}>{option.service}</Text>
                </View>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>
                  ${option.rate.toLocaleString('es-CO')}
                </Text>
                <Text style={styles.deliveryTime}>{option.deliveryTime}</Text>
              </View>
            </View>

            {selectedOption?.carrier === option.carrier &&
            selectedOption?.service === option.service && (
              <View style={styles.selectedIndicator}>
                <Ionicons name="checkmark-circle" size={20} color="#34D399" />
                <Text style={styles.selectedText}>Seleccionado</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Costo de Envío:</Text>
          <Text style={styles.totalAmount}>
            ${selectedOption?.rate.toLocaleString('es-CO') || '0'}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            !selectedOption && styles.disabledButton,
          ]}
          onPress={handleConfirmShipping}
          disabled={!selectedOption || confirming}
        >
          {confirming ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#FFF" />
              <Text style={styles.confirmButtonText}>Confirmar Envío</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  addressContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  optionCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedOption: {
    borderColor: '#34D399',
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
  carrierDetails: {
    marginLeft: 12,
  },
  carrierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  serviceName: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  deliveryTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  selectedText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#34D399',
    fontWeight: '500',
  },
  footer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});