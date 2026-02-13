import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { normalizeImageUrl } from '../../config/api.config';
import { useAuth } from '../../contexts/AuthContext';
import { LiveCartItemData } from '../../components/live/LiveCartItem';
import { addressesService, Address } from '../../services/addresses.service';
import { ordersService, CreateOrderRequest, ShippingAddress } from '../../services/orders.service';
import { paymentsService, PaymentMethod } from '../../services/payments.service';
import { api } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { LiveStackParamList } from '../../navigation/LiveNavigator';
import AddressFormModal from '../../components/address/AddressFormModal';

interface PaymentProvider {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
}

interface WalletInfo {
  balance: number;
  canPay: boolean;
  shortfall: number;
  isLoading: boolean;
}

type LiveCartCheckoutNavigationProp = NativeStackNavigationProp<LiveStackParamList, 'LiveCartCheckout'>;

export default function LiveCartCheckoutScreen() {
  const { t } = useTranslation('translation');
  const navigation = useNavigation<LiveCartCheckoutNavigationProp>();
  const route = useRoute<RouteProp<LiveStackParamList, 'LiveCartCheckout'>>();
  const { items, streamId, affiliateId, sellerId } = route.params;
  const { user, isAuthenticated } = useAuth();

  // Address state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(true);

  // Payment state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [walletInfo, setWalletInfo] = useState<WalletInfo>({
    balance: 0, canPay: false, shortfall: 0, isLoading: true,
  });

  // Shipping state
  const [shippingInfo, setShippingInfo] = useState<{
    shippingType: 'local' | 'national';
    shippingCost: number;
    isFree: boolean;
    message: string;
  } | null>(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);

  // Platform fee
  const [platformFeeRate, setPlatformFeeRate] = useState(0);
  const [loadingFeeRate, setLoadingFeeRate] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  // API hooks
  const createOrderApi = useApi(ordersService.createOrder);
  const createPaymentApi = useApi(paymentsService.createPayment);

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

  const shippingCost = shippingInfo?.shippingCost ?? 0;
  const platformFee = Number(((subtotal * platformFeeRate) / 100).toFixed(2));
  const total = Number((subtotal + shippingCost + platformFee).toFixed(2));

  const loading = loadingAddress;

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getProviderName = (providerId: string): string => {
    return t(`checkout.payment.providers.${providerId}.name`) || providerId;
  };

  // Map Address to ShippingAddress (same as CheckoutScreen)
  const mapAddressToShipping = (address: Address): ShippingAddress => {
    const [firstName, ...lastNameParts] = address.fullName.split(' ');
    return {
      firstName: firstName || '',
      lastName: lastNameParts.join(' ') || '',
      address: address.address,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      phone: address.phoneNumber,
      document: address.documentNumber || '',
      documentType: address.documentType || 'CC',
    };
  };

  // Effect 1: Load addresses
  useEffect(() => {
    const loadAddresses = async () => {
      if (!isAuthenticated) {
        setLoadingAddress(false);
        return;
      }
      try {
        setLoadingAddress(true);
        const userAddresses = await addressesService.getAddresses();
        setAddresses(userAddresses);

        const defaultAddr = userAddresses.find(a => a.isDefault) || userAddresses[0] || null;
        setSelectedAddress(defaultAddr);
      } catch (error) {
        console.error('Failed to load addresses:', error);
      } finally {
        setLoadingAddress(false);
      }
    };
    loadAddresses();
  }, [isAuthenticated]);

  // Effect 2: Load payment providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoadingProviders(true);
        const response = await paymentsService.getAvailableProviders();

        if (response.providers && Array.isArray(response.providers)) {
          setProviders(response.providers);

          // Auto-select first provider if none selected
          if (!selectedPaymentMethod && response.providers.length > 0) {
            const firstProvider = response.providers[0];
            const method: PaymentMethod = {
              id: firstProvider.id,
              type: firstProvider.id === 'stripe' ? 'card' : 'mercadopago',
              provider: getProviderName(firstProvider.id),
              details: {},
              isDefault: false,
              createdAt: new Date().toISOString(),
            };
            setSelectedPaymentMethod(method);
          }
        }
      } catch (error) {
        console.error('Failed to fetch payment providers:', error);
        setProviders([
          { id: 'mercadopago', name: 'MercadoPago', description: 'PSE, cash payments, and cards', icon: '💵', enabled: true },
        ]);
      } finally {
        setLoadingProviders(false);
      }
    };
    fetchProviders();
  }, []);

  // Effect 3: Load wallet balance
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!user) {
        setWalletInfo({ balance: 0, canPay: false, shortfall: subtotal, isLoading: false });
        return;
      }
      try {
        const walletData = await paymentsService.getWalletBalance();
        const balance = walletData.tokenBalance || 0;
        const canPay = balance >= subtotal;
        const shortfall = canPay ? 0 : subtotal - balance;
        setWalletInfo({ balance, canPay, shortfall, isLoading: false });
      } catch (error) {
        console.error('Failed to fetch wallet balance:', error);
        setWalletInfo({ balance: 0, canPay: false, shortfall: subtotal, isLoading: false });
      }
    };
    fetchWalletBalance();
  }, [user, subtotal]);

  // Effect 4: Load platform fee rate
  useEffect(() => {
    const fetchFeeRate = async () => {
      try {
        const response = await api.get<{ rate: number }>('/config/buyer-platform-fee-rate');
        setPlatformFeeRate(response.data?.rate || 0);
      } catch (error) {
        console.error('Error fetching platform fee rate:', error);
        setPlatformFeeRate(0);
      } finally {
        setLoadingFeeRate(false);
      }
    };
    fetchFeeRate();
  }, []);

  // Effect 5: Calculate shipping when address changes
  useEffect(() => {
    if (!selectedAddress || !sellerId) return;

    const calculateShipping = async () => {
      try {
        setCalculatingShipping(true);
        const response = await api.post<{
          shippingType: 'local' | 'national';
          shippingCost: number;
          isFree: boolean;
          message: string;
        }>('/orders/calculate-shipping', {
          sellerId,
          buyerCity: selectedAddress.city,
          buyerState: selectedAddress.state,
          orderTotal: subtotal,
        });

        if (response.success && response.data) {
          setShippingInfo(response.data);
        }
      } catch (error) {
        console.error('Shipping calculation error:', error);
        setShippingInfo(null);
      } finally {
        setCalculatingShipping(false);
      }
    };
    calculateShipping();
  }, [selectedAddress, sellerId, subtotal]);

  const handleProviderSelect = (provider: PaymentProvider) => {
    const method: PaymentMethod = {
      id: provider.id,
      type: provider.id === 'stripe' ? 'card' : 'mercadopago',
      provider: getProviderName(provider.id),
      details: {},
      isDefault: false,
      createdAt: new Date().toISOString(),
    };
    setSelectedPaymentMethod(method);
  };

  const handleWalletSelect = () => {
    if (!walletInfo.canPay) {
      Alert.alert(
        t('wallet.insufficientBalance'),
        t('checkout.payment.providers.wallet.insufficientDescription', {
          shortfall: formatPrice(walletInfo.shortfall),
        })
      );
      return;
    }
    const method: PaymentMethod = {
      id: 'wallet',
      type: 'wallet',
      provider: t('checkout.payment.providers.wallet.name'),
      details: { tokenBalance: walletInfo.balance },
      isDefault: false,
      createdAt: new Date().toISOString(),
    };
    setSelectedPaymentMethod(method);
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
    if (!shippingInfo) {
      Alert.alert(t('common.error'), t('checkout.errors.shippingNotCalculated'));
      return;
    }

    setSubmitting(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      // Step 1: Map address to ShippingAddress
      const shippingAddress = mapAddressToShipping(selectedAddress);

      // Step 2: Create order
      const orderRequest: CreateOrderRequest = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress,
        shippingAmount: shippingInfo.shippingCost,
        liveSessionId: streamId,
        affiliateId,
        notes: '',
      };

      const order = await createOrderApi.execute(orderRequest);
      if (!order) throw new Error('Failed to create order');

      // Step 3: Map payment method to backend enum
      const paymentMethodMap: Record<string, string> = {
        'mercadopago': 'mercadopago',
        'card': 'stripe_card',
        'crypto': 'usdc_polygon',
        'gshop_tokens': 'gshop_tokens',
        'wallet': 'wallet_balance',
      };
      const backendPaymentMethod = paymentMethodMap[selectedPaymentMethod.type] || 'mercadopago';

      // Step 4: Create payment record
      const payment = await createPaymentApi.execute({
        orderId: order.id,
        userId: user?.id || order.userId,
        paymentMethod: backendPaymentMethod,
        amount: total,
        currency: 'COP',
      });
      if (!payment) throw new Error('Failed to create payment');

      // Step 5: Route based on payment method
      if (selectedPaymentMethod.type === 'wallet') {
        const walletResult = await paymentsService.processWalletPayment(payment.id!);
        if (walletResult.success) {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          Toast.show({
            type: 'success',
            text1: t('live.liveCheckout.orderSuccess'),
            text2: t('live.liveCheckout.orderSuccessMessage', { orderNumber: order.orderNumber }),
            visibilityTime: 3000,
          });
          navigation.reset({ index: 0, routes: [{ name: 'LiveMain' }] });
        } else {
          Alert.alert(t('common.error'), walletResult.error || t('live.liveCheckout.orderFailed'));
        }
      } else if (selectedPaymentMethod.type === 'card') {
        navigation.navigate('LiveStripeCard', {
          orderId: order.id!,
          paymentId: payment.id!,
          amount: total,
        });
      } else {
        // MercadoPago
        const paymentUrl = payment.paymentMetadata?.mercadopago_init_point || payment.paymentUrl;
        if (paymentUrl && typeof paymentUrl === 'string') {
          navigation.navigate('LivePaymentWebView', {
            paymentUrl,
            orderId: order.id!,
            paymentId: payment.id!,
          });
        } else {
          // Fallback
          Toast.show({
            type: 'success',
            text1: t('live.liveCheckout.orderSuccess'),
            text2: t('live.liveCheckout.orderSuccessMessage', { orderNumber: order.orderNumber }),
            visibilityTime: 3000,
          });
          navigation.reset({ index: 0, routes: [{ name: 'LiveMain' }] });
        }
      }
    } catch (error: any) {
      console.error('Order creation failed:', error);
      if (error.statusCode === 401) {
        Alert.alert(t('auth.sessionExpired'), t('auth.loginAgainToAddCart'));
      } else {
        Alert.alert(t('common.error'), error.message || t('live.liveCheckout.orderFailed'));
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

  const isWalletSelected = selectedPaymentMethod?.type === 'wallet';

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
          {addresses.length === 0 ? (
            <View style={styles.noAddressState}>
              <MaterialIcons name="location-off" size={32} color="#9ca3af" />
              <Text style={styles.emptyText}>{t('live.liveCheckout.noAddresses')}</Text>
              <TouchableOpacity
                style={styles.addAddressButton}
                onPress={() => setShowAddressModal(true)}
              >
                <MaterialIcons name="add-location-alt" size={20} color="#8b5cf6" />
                <Text style={styles.addAddressText}>{t('checkout.createAddress')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            addresses.map((address) => (
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
                  <Text style={styles.addressName}>{address.fullName}</Text>
                  <Text style={styles.addressStreet}>{address.address}</Text>
                  <Text style={styles.addressCity}>
                    {address.city}, {address.state} {address.postalCode}
                  </Text>
                  {address.phoneNumber && (
                    <Text style={styles.addressPhone}>{address.phoneNumber}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Shipping Info */}
        {selectedAddress && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('live.liveCheckout.shipping')}</Text>
            {calculatingShipping ? (
              <View style={styles.shippingLoading}>
                <ActivityIndicator size="small" color="#8b5cf6" />
                <Text style={styles.shippingLoadingText}>{t('checkout.calculatingShipping')}</Text>
              </View>
            ) : shippingInfo ? (
              <View style={[styles.shippingCard, shippingInfo.isFree && styles.freeShippingCard]}>
                <View style={styles.shippingCardHeader}>
                  <Text style={styles.shippingType}>
                    {t(`checkout.shippingType.${shippingInfo.shippingType}`)}
                  </Text>
                  <Text style={[styles.shippingPrice, shippingInfo.isFree && styles.freeShippingText]}>
                    {shippingInfo.isFree ? t('checkout.free').toUpperCase() : formatPrice(shippingInfo.shippingCost)}
                  </Text>
                </View>
                {shippingInfo.message && (
                  <Text style={styles.shippingMessage}>{shippingInfo.message}</Text>
                )}
              </View>
            ) : null}
          </View>
        )}

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('live.liveCheckout.paymentMethod')}</Text>
          {loadingProviders || walletInfo.isLoading ? (
            <View style={styles.shippingLoading}>
              <ActivityIndicator size="small" color="#8b5cf6" />
              <Text style={styles.shippingLoadingText}>{t('checkout.payment.loadingMethods')}</Text>
            </View>
          ) : (
            <>
              {/* Wallet Option */}
              {user && (
                <TouchableOpacity
                  style={[
                    styles.paymentCard,
                    isWalletSelected && styles.selectedCard,
                    !walletInfo.canPay && styles.disabledCard,
                  ]}
                  onPress={handleWalletSelect}
                  disabled={!walletInfo.canPay}
                >
                  <View style={styles.radioOuter}>
                    {isWalletSelected && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.paymentInfo}>
                    <MaterialIcons name="account-balance-wallet" size={20} color={walletInfo.canPay ? '#8b5cf6' : '#9ca3af'} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.paymentText}>
                        {t('checkout.payment.providers.wallet.name')}
                      </Text>
                      <Text style={[styles.walletBalance, { color: walletInfo.canPay ? '#16a34a' : '#ef4444' }]}>
                        {formatPrice(walletInfo.balance)}
                        {!walletInfo.canPay && ` - ${t('checkout.payment.providers.wallet.insufficient')}`}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}

              {/* Payment Providers */}
              {providers.map((provider) => {
                const isSelected = selectedPaymentMethod?.id === provider.id;
                return (
                  <TouchableOpacity
                    key={provider.id}
                    style={[
                      styles.paymentCard,
                      isSelected && styles.selectedCard,
                    ]}
                    onPress={() => handleProviderSelect(provider)}
                  >
                    <View style={styles.radioOuter}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.providerIcon}>{provider.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.paymentText}>{getProviderName(provider.id)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
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
            {calculatingShipping ? (
              <ActivityIndicator size="small" color="#8b5cf6" />
            ) : (
              <Text style={shippingCost === 0 ? styles.freeShippingText : styles.totalValue}>
                {shippingCost === 0 ? t('checkout.free') : formatPrice(shippingCost)}
              </Text>
            )}
          </View>
          {!loadingFeeRate && platformFee > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                {t('checkout.platformFee', { rate: platformFeeRate })}
              </Text>
              <Text style={styles.totalValue}>{formatPrice(platformFee)}</Text>
            </View>
          )}
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
          style={[styles.placeOrderButton, (submitting || calculatingShipping) && styles.disabledButton]}
          onPress={handlePlaceOrder}
          disabled={submitting || calculatingShipping}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="lock" size={20} color="#fff" />
              <Text style={styles.placeOrderText}>
                {t('live.liveCheckout.placeOrder')} {formatPrice(total)}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <AddressFormModal
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onAddressCreated={(newAddress) => {
          setAddresses(prev => [...prev, newAddress]);
          setSelectedAddress(newAddress);
          setShowAddressModal(false);
        }}
        setAsDefault={true}
      />
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
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  noAddressState: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: '#8b5cf6',
    borderStyle: 'dashed',
    borderRadius: 10,
  },
  addAddressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
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
  disabledCard: {
    opacity: 0.5,
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
  addressPhone: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  shippingLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  shippingLoadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  shippingCard: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
  },
  freeShippingCard: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  shippingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shippingType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  shippingPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  shippingMessage: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
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
    flex: 1,
  },
  paymentText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  providerIcon: {
    fontSize: 20,
  },
  walletBalance: {
    fontSize: 12,
    marginTop: 2,
  },
  freeShippingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#16a34a',
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
