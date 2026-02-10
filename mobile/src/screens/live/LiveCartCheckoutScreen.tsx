import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { normalizeImageUrl, API_CONFIG } from '../../config/api.config';
import { useAuth } from '../../contexts/AuthContext';
import { LiveCartItemData } from '../../components/live/LiveCartItem';
import { apiClient } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SavedAddress {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

interface SavedPaymentMethod {
  id: string;
  type: 'card' | 'mercadopago';
  last4?: string;
  brand?: string;
  isDefault: boolean;
}

type LiveCartCheckoutParams = {
  LiveCartCheckout: {
    items: LiveCartItemData[];
    streamId: string;
    affiliateId?: string;
  };
};

export default function LiveCartCheckoutScreen() {
  const { t } = useTranslation('translation');
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<LiveCartCheckoutParams, 'LiveCartCheckout'>>();
  const { items, streamId, affiliateId } = route.params;
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<SavedPaymentMethod | null>(null);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => {
    const price = item.specialPrice ?? item.product.price;
    return sum + (price * item.quantity);
  }, 0);
  const originalTotal = items.reduce((sum, item) => {
    return sum + (item.product.price * item.quantity);
  }, 0);
  const discount = originalTotal - subtotal;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Shipping calculation (simplified)
  const shippingCost = subtotal >= 100000 ? 0 : 8000;
  const total = subtotal + shippingCost;

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API calls
      setAddresses([
        {
          id: '1',
          name: 'Casa',
          street: 'Calle 123 #45-67',
          city: 'Bogota',
          state: 'Cundinamarca',
          postalCode: '110111',
          isDefault: true,
        },
      ]);
      setSelectedAddress({
        id: '1',
        name: 'Casa',
        street: 'Calle 123 #45-67',
        city: 'Bogota',
        state: 'Cundinamarca',
        postalCode: '110111',
        isDefault: true,
      });

      setPaymentMethods([
        {
          id: '1',
          type: 'card',
          last4: '4242',
          brand: 'Visa',
          isDefault: true,
        },
        {
          id: '2',
          type: 'mercadopago',
          isDefault: false,
        },
      ]);
      setSelectedPaymentMethod({
        id: '1',
        type: 'card',
        last4: '4242',
        brand: 'Visa',
        isDefault: true,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (value: number) => {
    return `$${value.toLocaleString('es-CO')}`;
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert(t('common.error'), t('live.liveCheckout.selectAddress'));
      return;
    }
    if (!selectedPaymentMethod) {
      Alert.alert(t('common.error'), t('live.liveCheckout.selectPayment'));
      return;
    }

    setSubmitting(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.specialPrice ?? item.product.price,
        })),
        shippingAddressId: selectedAddress.id,
        paymentMethodId: selectedPaymentMethod.id,
        liveSessionId: streamId,
        affiliateId,
      };

      const result = await apiClient.post<{ id: string }>('/orders', orderData);
      const orderId = result.data?.id || `ORD-${Date.now()}`;

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Toast.show({
        type: 'success',
        text1: t('live.liveCheckout.orderSuccess'),
        text2: t('live.liveCheckout.orderSuccessMessage', { orderNumber: orderId }),
        visibilityTime: 3000,
      });

      // Navigate to success screen or back to stream
      navigation.reset({
        index: 0,
        routes: [
          { name: 'LiveMain' },
        ],
      });
    } catch (error: any) {
      console.error('Order creation failed:', error);
      if (error.statusCode === 401) {
        Alert.alert(t('auth.sessionExpired'), t('auth.loginAgainToAddCart'));
      } else {
        Alert.alert(t('common.error'), t('live.liveCheckout.orderFailed'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderCartItem = (item: LiveCartItemData) => {
    const price = item.specialPrice ?? item.product.price;
    const hasDiscount = item.specialPrice != null && item.specialPrice < item.product.price;

    return (
      <View key={item.productId} style={styles.cartItem}>
        <Image
          source={{
            uri: normalizeImageUrl(item.product.images?.[0]) || 'https://via.placeholder.com/60x60',
          }}
          style={styles.cartItemImage}
        />
        <View style={styles.cartItemInfo}>
          <Text style={styles.cartItemName} numberOfLines={2}>
            {item.product.name}
          </Text>
          {item.variant && (
            <Text style={styles.cartItemVariant}>{item.variant.name}</Text>
          )}
          <View style={styles.cartItemPriceRow}>
            <Text style={styles.cartItemPrice}>{formatPrice(price)}</Text>
            {hasDiscount && (
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>LIVE</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.cartItemQuantity}>
          <Text style={styles.quantityText}>x{item.quantity}</Text>
          <Text style={styles.itemSubtotal}>{formatPrice(price * item.quantity)}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('live.liveCheckout.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('live.liveCheckout.orderSummary')} ({t('live.liveCheckout.itemCount', { count: totalItems })})
          </Text>
          <View style={styles.itemsContainer}>
            {items.map(renderCartItem)}
          </View>
          {affiliateId && (
            <View style={styles.affiliateNote}>
              <MaterialIcons name="person" size={16} color="#8b5cf6" />
              <Text style={styles.affiliateText}>
                {t('live.liveCheckout.fromLiveStream')}
              </Text>
            </View>
          )}
        </View>

        {/* Shipping Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('live.liveCheckout.shippingAddress')}</Text>
          {addresses.map((address) => (
            <TouchableOpacity
              key={address.id}
              style={[
                styles.addressCard,
                selectedAddress?.id === address.id && styles.selectedCard,
              ]}
              onPress={() => setSelectedAddress(address)}
            >
              <View style={styles.radioOuter}>
                {selectedAddress?.id === address.id && (
                  <View style={styles.radioInner} />
                )}
              </View>
              <View style={styles.addressInfo}>
                <Text style={styles.addressName}>{address.name}</Text>
                <Text style={styles.addressStreet}>{address.street}</Text>
                <Text style={styles.addressCity}>
                  {address.city}, {address.state} {address.postalCode}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addButton}>
            <MaterialIcons name="add" size={20} color="#8b5cf6" />
            <Text style={styles.addButtonText}>{t('live.liveCheckout.addAddress')}</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('live.liveCheckout.paymentMethod')}</Text>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentCard,
                selectedPaymentMethod?.id === method.id && styles.selectedCard,
              ]}
              onPress={() => setSelectedPaymentMethod(method)}
            >
              <View style={styles.radioOuter}>
                {selectedPaymentMethod?.id === method.id && (
                  <View style={styles.radioInner} />
                )}
              </View>
              <View style={styles.paymentInfo}>
                {method.type === 'card' ? (
                  <>
                    <MaterialIcons name="credit-card" size={20} color="#374151" />
                    <Text style={styles.paymentText}>
                      {method.brand} •••• {method.last4}
                    </Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons name="account-balance-wallet" size={20} color="#00bcff" />
                    <Text style={styles.paymentText}>MercadoPago</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Order Totals */}
        <View style={styles.section}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('live.liveCheckout.subtotal')}</Text>
            <Text style={styles.totalValue}>{formatPrice(subtotal)}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.discountLabel}>{t('live.liveCheckout.liveDiscount')}</Text>
              <Text style={styles.discountValue}>-{formatPrice(discount)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('live.liveCheckout.shipping')}</Text>
            <Text style={shippingCost === 0 ? styles.freeShipping : styles.totalValue}>
              {shippingCost === 0 ? t('checkout.free') : formatPrice(shippingCost)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>{t('live.liveCheckout.total')}</Text>
            <Text style={styles.grandTotalValue}>{formatPrice(total)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderButton, submitting && styles.disabledButton]}
          onPress={handlePlaceOrder}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="lock" size={20} color="#fff" />
              <Text style={styles.placeOrderText}>
                {t('live.liveCheckout.placeOrder')} - {formatPrice(total)}
              </Text>
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
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  itemsContainer: {
    gap: 12,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  cartItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  cartItemVariant: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  cartItemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  liveBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#b45309',
  },
  cartItemQuantity: {
    alignItems: 'flex-end',
  },
  quantityText: {
    fontSize: 14,
    color: '#6b7280',
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 4,
  },
  affiliateNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  affiliateText: {
    fontSize: 12,
    color: '#8b5cf6',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedCard: {
    borderColor: '#8b5cf6',
    backgroundColor: '#faf5ff',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8b5cf6',
  },
  addressInfo: {
    flex: 1,
  },
  addressName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  addressStreet: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  addressCity: {
    fontSize: 13,
    color: '#6b7280',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#8b5cf6',
    borderStyle: 'dashed',
    borderRadius: 12,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 8,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentText: {
    fontSize: 14,
    color: '#374151',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 14,
    color: '#374151',
  },
  discountLabel: {
    fontSize: 14,
    color: '#16a34a',
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#16a34a',
  },
  freeShipping: {
    fontSize: 14,
    fontWeight: '500',
    color: '#16a34a',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  placeOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
