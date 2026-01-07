import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';
import { ordersService, CreateOrderRequest, ShippingAddress } from '../../services/orders.service';
import { addressesService, Address } from '../../services/addresses.service';
import { paymentsService, PaymentMethod } from '../../services/payments.service';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import GSInput from '../../components/ui/GSInput';
import PaymentMethodSelection from '../../components/checkout/PaymentMethodSelection';
import { CartStackParamList } from '../../navigation/CartNavigator';

type CheckoutScreenNavigationProp = NativeStackNavigationProp<CartStackParamList, 'Checkout'>;

// Step indicator component
interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <React.Fragment key={index}>
          <View
            style={[
              styles.stepCircle,
              {
                backgroundColor: index < currentStep
                  ? theme.colors.primary
                  : index === currentStep
                  ? theme.colors.primary
                  : theme.colors.gray300,
              },
            ]}
          >
            <GSText
              variant="caption"
              color={index <= currentStep ? 'white' : 'textSecondary'}
              weight="bold"
            >
              {index + 1}
            </GSText>
          </View>
          {index < totalSteps - 1 && (
            <View
              style={[
                styles.stepLine,
                {
                  backgroundColor: index < currentStep ? theme.colors.primary : theme.colors.gray300,
                },
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

// Shipping address form component
interface ShippingFormProps {
  address: ShippingAddress;
  onUpdate: (address: ShippingAddress) => void;
  onNext: () => void;
  isLoading?: boolean;
}

const ShippingForm: React.FC<ShippingFormProps> = ({ address, onUpdate, onNext, isLoading }) => {
  const { t } = useTranslation('translation');
  const { theme } = useTheme();
  const hasDefaultAddress = address.address && address.city && address.state;
  const [showDocTypeModal, setShowDocTypeModal] = useState(false);

  const documentTypes = [
    { value: 'CC', label: 'Cédula de Ciudadanía (CC)' },
    { value: 'CE', label: 'Cédula de Extranjería (CE)' },
    { value: 'PA', label: 'Pasaporte (PA)' },
    { value: 'TI', label: 'Tarjeta de Identidad (TI)' },
  ];

  const handleFieldChange = (field: keyof ShippingAddress, value: string) => {
    onUpdate({ ...address, [field]: value });
  };

  const validateForm = (): boolean => {
    const required = ['firstName', 'lastName', 'address', 'city', 'state', 'postalCode', 'phone'];

    for (const field of required) {
      if (!address[field as keyof ShippingAddress]?.trim()) {
        Alert.alert(
          t('checkout.validation.missingInfo'),
          t('checkout.validation.pleaseFill', { field: field.replace(/([A-Z])/g, ' $1').toLowerCase() })
        );
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  return (
    <View style={styles.formSection}>
      <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
        {t('checkout.shippingAddress')}
      </GSText>

      {hasDefaultAddress && (
        <View style={[styles.defaultAddressBadge, { backgroundColor: theme.colors.success + '20' }]}>
          <GSText variant="caption" color="success" weight="semiBold">
            ✓ {t('checkout.usingDefaultAddress')}
          </GSText>
        </View>
      )}

      <View style={styles.formRow}>
        <GSInput
          placeholder={t('checkout.fullName')}
          value={address.firstName}
          onChangeText={(value) => handleFieldChange('firstName', value)}
          containerStyle={styles.halfInput}
        />
        <GSInput
          placeholder={t('auth.lastName')}
          value={address.lastName}
          onChangeText={(value) => handleFieldChange('lastName', value)}
          containerStyle={styles.halfInput}
        />
      </View>

      <GSInput
        placeholder={t('checkout.address')}
        value={address.address}
        onChangeText={(value) => handleFieldChange('address', value)}
      />

      <View style={styles.formRow}>
        <GSInput
          placeholder={t('checkout.city')}
          value={address.city}
          onChangeText={(value) => handleFieldChange('city', value)}
          containerStyle={styles.halfInput}
        />
        <GSInput
          placeholder={t('checkout.state')}
          value={address.state}
          onChangeText={(value) => handleFieldChange('state', value)}
          containerStyle={styles.halfInput}
        />
      </View>

      <View style={styles.formRow}>
        <GSInput
          placeholder={t('checkout.zipCode')}
          value={address.postalCode}
          onChangeText={(value) => handleFieldChange('postalCode', value)}
          containerStyle={styles.halfInput}
          keyboardType="numeric"
        />
        <GSInput
          placeholder={t('auth.phone')}
          value={address.phone}
          onChangeText={(value) => handleFieldChange('phone', value)}
          containerStyle={styles.halfInput}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.formRow}>
        <TouchableOpacity
          style={[styles.halfInput, styles.docTypeSelector, { borderColor: theme.colors.gray300 }]}
          onPress={() => setShowDocTypeModal(true)}
        >
          <GSText variant="body" color={address.documentType ? 'text' : 'textSecondary'}>
            {address.documentType || t('checkout.documentType')}
          </GSText>
        </TouchableOpacity>
        <GSInput
          placeholder={t('checkout.documentNumber')}
          value={address.document || ''}
          onChangeText={(value) => handleFieldChange('document', value)}
          containerStyle={styles.halfInput}
          keyboardType="numeric"
        />
      </View>

      <GSButton
        title={t('checkout.selectShippingMethod')}
        onPress={handleNext}
        style={styles.nextButton}
        loading={isLoading}
      />

      {/* Document Type Modal */}
      <Modal
        visible={showDocTypeModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.gray300 }]}>
              <GSText variant="h4" weight="bold">{t('checkout.selectDocumentType')}</GSText>
              <TouchableOpacity onPress={() => setShowDocTypeModal(false)}>
                <GSText variant="body" color="primary">✕</GSText>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.docTypeList}>
              {documentTypes.map((docType) => (
                <TouchableOpacity
                  key={docType.value}
                  style={[styles.docTypeOption, { borderBottomColor: theme.colors.gray300 }]}
                  onPress={() => {
                    handleFieldChange('documentType', docType.value);
                    setShowDocTypeModal(false);
                  }}
                >
                  <GSText variant="body">{docType.label}</GSText>
                  {address.documentType === docType.value && (
                    <GSText variant="body" color="primary">✓</GSText>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Shipping summary component (new seller-managed system)
interface ShippingSummaryProps {
  shippingCost: number;
  shippingType: 'local' | 'national';
  isFree: boolean;
  message: string;
  onNext: () => void;
  onBack: () => void;
}

const ShippingSummary: React.FC<ShippingSummaryProps> = ({
  shippingCost,
  shippingType,
  isFree,
  message,
  onNext,
  onBack
}) => {
  const { t } = useTranslation('translation');
  const { theme } = useTheme();
  const { formatPrice } = useCart();

  return (
    <View style={styles.formSection}>
      <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
        {t('checkout.shipping')}
      </GSText>

      <View style={[styles.shippingCard, { backgroundColor: isFree ? theme.colors.success + '10' : theme.colors.surface, borderColor: isFree ? theme.colors.success : theme.colors.gray300 }]}>
        <View style={styles.shippingCardHeader}>
          <GSText variant="body" weight="semiBold">
            {t(`checkout.shippingType.${shippingType}`)}
          </GSText>
          <GSText variant="h5" weight="bold" color={isFree ? 'success' : 'primary'}>
            {isFree ? t('checkout.free').toUpperCase() + '!' : formatPrice(shippingCost)}
          </GSText>
        </View>

        <GSText variant="caption" color="textSecondary" style={styles.shippingMessage}>
          {message}
        </GSText>

        {isFree && (
          <View style={[styles.freeShippingBadge, { backgroundColor: theme.colors.success }]}>
            <GSText variant="caption" color="white" weight="semiBold">
              {t('checkout.freeShippingBadge')}
            </GSText>
          </View>
        )}
      </View>

      <View style={styles.navigationButtons}>
        <View style={styles.buttonWrapper}>
          <GSButton
            title={t('common.back')}
            onPress={onBack}
            variant="outline"
            style={styles.navBackButton}
          />
        </View>
        <View style={styles.buttonWrapper}>
          <GSButton
            title={t('checkout.selectPaymentMethod')}
            onPress={onNext}
            style={styles.nextButton}
          />
        </View>
      </View>
    </View>
  );
};

// Order summary component
interface OrderSummaryProps {
  onBack: () => void;
  onPlaceOrder: () => void;
  isPlacingOrder?: boolean;
  shippingCost: number;
  selectedPaymentMethod: PaymentMethod | null;
  platformFeeRate: number;
  loadingFeeRate: boolean;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ onBack, onPlaceOrder, isPlacingOrder, shippingCost, selectedPaymentMethod, platformFeeRate, loadingFeeRate }) => {
  const { t } = useTranslation('translation');
  const { theme } = useTheme();
  const {
    items,
    formatPrice,
    getCartSummary,
  } = useCart();

  const summary = getCartSummary();
  const subtotal = Number(summary.subtotal) || 0;
  const shipping = Number(shippingCost) || 0;
  const platformFee = Number(((subtotal * platformFeeRate) / 100).toFixed(2));
  // NOTE: VAT is already included in product prices (Colombian law)
  // No additional tax calculation needed
  const total = Number((subtotal + shipping + platformFee).toFixed(2));

  console.log('OrderSummary calculations:', {
    'summary.subtotal': summary.subtotal,
    'subtotal': subtotal,
    'shipping': shipping,
    'total': total,
  });

  return (
    <View style={styles.formSection}>
      <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
        {t('checkout.orderSummary')}
      </GSText>

      {/* Cart Items */}
      <View style={styles.orderItems}>
        {items.map((item) => (
          <View key={item.id} style={styles.orderItem}>
            <View style={styles.orderItemInfo}>
              <GSText variant="body" weight="semiBold" numberOfLines={1}>
                {item.product.name}
              </GSText>
              <GSText variant="caption" color="textSecondary">
                {t('checkout.quantity')}: {item.quantity} × {formatPrice(item.price)}
              </GSText>
            </View>
            <GSText variant="body" weight="semiBold">
              {formatPrice(item.subtotal)}
            </GSText>
          </View>
        ))}
      </View>

      {/* Payment Method Summary */}
      {selectedPaymentMethod && (
        <View style={[styles.paymentSummary, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray300 }]}>
          <GSText variant="body" weight="semiBold" style={styles.paymentSummaryTitle}>
            {t('checkout.paymentMethod')}
          </GSText>
          <View style={styles.paymentSummaryContent}>
            <GSText variant="body">
              {selectedPaymentMethod.type === 'card' ? '💳' :
               selectedPaymentMethod.type === 'mercadopago' ? '💵' : '₿'}
              {' '}
              {selectedPaymentMethod.provider}
            </GSText>
            {selectedPaymentMethod.details.last4 && (
              <GSText variant="caption" color="textSecondary">
                •••• {selectedPaymentMethod.details.last4}
              </GSText>
            )}
          </View>
        </View>
      )}

      {/* Order Totals */}
      <View style={styles.orderTotals}>
        <View style={styles.totalRow}>
          <GSText variant="body">{t('checkout.subtotal', { count: summary.totalItems })}</GSText>
          <GSText variant="body">{formatPrice(summary.subtotal)}</GSText>
        </View>

        <View style={styles.totalRow}>
          <GSText variant="body" color="textSecondary">{t('checkout.shipping')}</GSText>
          <GSText variant="body" color="textSecondary">
            {shipping === 0 ? t('checkout.free') : formatPrice(shipping)}
          </GSText>
        </View>

        {/* Platform Fee */}
        {!loadingFeeRate && platformFee > 0 && (
          <View style={styles.totalRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <GSText variant="body" color="textSecondary">
                {t('checkout.platformFee', { rate: platformFeeRate })}
              </GSText>
              <GSText variant="caption" color="textSecondary" style={{ fontSize: 10 }}>
                ℹ️
              </GSText>
            </View>
            <GSText variant="body" color="textSecondary">
              {formatPrice(platformFee)}
            </GSText>
          </View>
        )}

        <GSText variant="caption" color="textSecondary" style={styles.vatNote}>
          {t('checkout.vatIncludedNote')}
        </GSText>

        {/* Disclaimer about platform fee */}
        {!loadingFeeRate && platformFee > 0 && (
          <View style={[styles.infoBox, { backgroundColor: theme.colors.info + '15', borderColor: theme.colors.info }]}>
            <GSText variant="caption" color="textSecondary" style={{ textAlign: 'center' }}>
              {t('checkout.platformFeeInfo')}
            </GSText>
          </View>
        )}

        <View style={[styles.totalRow, styles.finalTotal]}>
          <GSText variant="h4" weight="bold">{t('checkout.total')}</GSText>
          <GSText variant="h4" weight="bold" color="primary">
            {formatPrice(total)}
          </GSText>
        </View>
      </View>

      <View style={styles.navigationButtons}>
        <View style={styles.buttonWrapper}>
          <GSButton
            title={t('common.back')}
            onPress={onBack}
            variant="outline"
            style={styles.navBackButton}
          />
        </View>
        <View style={styles.buttonWrapper}>
          <GSButton
            title={t('checkout.placeOrder')}
            onPress={onPlaceOrder}
            style={styles.nextButton}
            loading={isPlacingOrder}
          />
        </View>
      </View>
    </View>
  );
};

// Main checkout screen component
export default function CheckoutScreen() {
  const { t } = useTranslation('translation');
  const { theme } = useTheme();
  const navigation = useNavigation<CheckoutScreenNavigationProp>();
  const { user } = useAuth();
  const { items } = useCart();

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
    document: '',
    documentType: 'CC',
  });
  const [shippingInfo, setShippingInfo] = useState<{
    shippingType: 'local' | 'national';
    shippingCost: number;
    isFree: boolean;
    message: string;
  } | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [platformFeeRate, setPlatformFeeRate] = useState(0);
  const [loadingFeeRate, setLoadingFeeRate] = useState(true);

  // API hooks
  const createOrderApi = useApi(ordersService.createOrder);
  const createPaymentApi = useApi(paymentsService.createPayment);

  // Helper function to map Address to ShippingAddress
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

  // Load default address on mount
  useEffect(() => {
    const loadDefaultAddress = async () => {
      if (!user) {
        setLoadingAddress(false);
        return;
      }

      try {
        setLoadingAddress(true);
        const defaultAddress = await addressesService.getDefaultAddress();

        if (defaultAddress) {
          const shippingAddr = mapAddressToShipping(defaultAddress);
          setShippingAddress(shippingAddr);
        }
      } catch (error) {
        console.error('Failed to load default address:', error);
      } finally {
        setLoadingAddress(false);
      }
    };

    loadDefaultAddress();
  }, [user]);

  // Fetch platform fee rate on mount
  useEffect(() => {
    const fetchFeeRate = async () => {
      try {
        const response = await api.get<{ rate: number }>('/config/buyer-platform-fee-rate');
        setPlatformFeeRate(response.data.rate || 0);
      } catch (error) {
        console.error('Error fetching platform fee rate:', error);
        setPlatformFeeRate(0); // Default to 0 if error
      } finally {
        setLoadingFeeRate(false);
      }
    };
    fetchFeeRate();
  }, []);

  // Check if cart is empty (but not during payment process)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    if (items.length === 0 && !isProcessingPayment) {
      Alert.alert(
        t('checkout.alerts.emptyCart'),
        t('checkout.alerts.emptyCartMessage'),
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [items.length, navigation, t, isProcessingPayment]);

  // Handle shipping address next - calculate shipping cost
  const handleShippingAddressNext = async () => {
    try {
      setCalculatingShipping(true);

      // Get seller ID from first cart item (assuming single seller per order)
      const sellerId = items[0]?.product?.sellerId;
      if (!sellerId) {
        Alert.alert(t('common.error'), t('checkout.errors.sellerNotFound'));
        return;
      }

      // Calculate order total (VAT already included in prices)
      const orderTotal = items.reduce((acc, item) => acc + Number(item.subtotal || 0), 0);

      // Call new seller-managed shipping calculation API
      const response = await api.post<{
        shippingType: 'local' | 'national';
        shippingCost: number;
        isFree: boolean;
        message: string;
      }>('/orders/calculate-shipping', {
        sellerId,
        buyerCity: shippingAddress.city,
        buyerState: shippingAddress.state,
        orderTotal,
      });

      if (response.success && response.data) {
        setShippingInfo({
          shippingType: response.data.shippingType,
          shippingCost: response.data.shippingCost,
          isFree: response.data.isFree,
          message: response.data.message || '',
        });
        setCurrentStep(1);
      } else {
        Alert.alert(t('common.error'), t('checkout.errors.shippingCalculationFailed'));
      }
    } catch (error) {
      console.error('Shipping calculation error:', error);
      Alert.alert(t('common.error'), t('checkout.errors.shippingCalculationError'));
    } finally {
      setCalculatingShipping(false);
    }
  };

  // Handle shipping info next
  const handleShippingSummaryNext = () => {
    setCurrentStep(2);
  };

  // Handle payment method next
  const handlePaymentMethodNext = () => {
    if (selectedPaymentMethod) {
      setCurrentStep(3);
    }
  };

  // Handle place order
  const handlePlaceOrder = async () => {
    try {
      if (!shippingInfo) {
        Alert.alert(t('common.error'), t('checkout.errors.shippingNotCalculated'));
        return;
      }

      if (!selectedPaymentMethod) {
        Alert.alert(t('common.error'), t('checkout.alerts.pleaseSelectPayment'));
        return;
      }

      // Step 1: Create the order
      const orderRequest: CreateOrderRequest = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress,
        shippingAmount: shippingInfo.shippingCost,
        isGuestOrder: !user,
        notes: '',
      };

      const order = await createOrderApi.execute(orderRequest);

      if (!order) {
        throw new Error('Failed to create order');
      }

      // Step 2: Calculate order total (VAT already included in prices)
      const summary = items.reduce((acc, item) => acc + Number(item.subtotal || 0), 0);
      const shipping = Number(shippingInfo.shippingCost || 0);
      const platformFee = Number(((summary * platformFeeRate) / 100).toFixed(2));
      const total = Number((summary + shipping + platformFee).toFixed(2));

      // Step 3: Map payment method to backend enum
      const paymentMethodMap: Record<string, string> = {
        'mercadopago': 'mercadopago',
        'card': 'stripe_card',
        'crypto': 'usdc_polygon',
        'gshop_tokens': 'gshop_tokens',
        'wallet': 'wallet_balance',
      };

      const paymentMethod = paymentMethodMap[selectedPaymentMethod.type] || 'mercadopago';

      // Step 4: Create payment record (with 30-minute expiration)
      const paymentRequest = {
        orderId: order.id,
        userId: user?.id || order.userId,
        paymentMethod: paymentMethod,
        amount: total,
        currency: 'COP',
      };

      const payment = await createPaymentApi.execute(paymentRequest);

      if (!payment) {
        throw new Error('Failed to create payment');
      }

      // Debug: Log payment response
      console.log('🔍 Payment response:', JSON.stringify(payment, null, 2));
      console.log('🔍 paymentMetadata:', payment.paymentMetadata);
      console.log('🔍 paymentUrl:', payment.paymentUrl);

      // Mark as processing payment to prevent cart empty alert
      setIsProcessingPayment(true);

      // Route based on payment method type
      if (selectedPaymentMethod.type === 'wallet') {
        // Wallet payment - process directly without external redirect
        console.log('💰 Processing wallet payment for payment:', payment.id);

        const walletResult = await paymentsService.processWalletPayment(payment.id!);

        if (walletResult.success) {
          console.log('✅ Wallet payment successful:', walletResult);

          // Clear cart and navigate to success
          Alert.alert(
            t('checkout.alerts.orderPlaced'),
            t('checkout.alerts.walletPaymentSuccess', {
              orderNumber: order.orderNumber,
              newBalance: new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
              }).format(walletResult.newWalletBalance || 0),
            }),
            [
              {
                text: t('checkout.alerts.viewOrder'),
                onPress: () => {
                  (navigation as any).navigate('OrderDetail', { orderId: order.id });
                },
              },
            ],
            { cancelable: false }
          );
        } else {
          console.error('❌ Wallet payment failed:', walletResult.error);
          Alert.alert(
            t('checkout.alerts.orderFailed'),
            walletResult.error || t('checkout.alerts.walletPaymentFailed')
          );
        }
      } else if (selectedPaymentMethod.id === 'stripe' || selectedPaymentMethod.type === 'card') {
        // Stripe card payment - navigate to card input screen
        console.log('🚀 Navigating to StripeCardScreen');

        navigation.navigate('StripeCard', {
          orderId: order.id!,
          paymentId: payment.id!,
          amount: total,
        });

        console.log('✅ Navigation to StripeCard executed');
      } else {
        // MercadoPago payment - navigate to WebView
        const paymentUrl = payment.paymentMetadata?.mercadopago_init_point || payment.paymentUrl;

        console.log('🔍 Extracted MercadoPago paymentUrl:', paymentUrl);

        if (paymentUrl && typeof paymentUrl === 'string') {
          console.log('🚀 Navigating to PaymentWebView with URL:', paymentUrl);

          navigation.navigate('PaymentWebView', {
            paymentUrl: paymentUrl!,
            orderId: order.id!,
            paymentId: payment.id!,
          });

          console.log('✅ Navigation to PaymentWebView executed');
        } else {
          console.error('❌ paymentUrl is not valid:', paymentUrl);
          // Fallback: show alert and navigate to order detail
          Alert.alert(
            t('checkout.alerts.orderPlaced'),
            t('checkout.alerts.orderPlacedMessage', { orderNumber: order.orderNumber }),
            [
              {
                text: t('checkout.alerts.viewOrder'),
                onPress: () => {
                  (navigation as any).navigate('OrderDetail', { orderId: order.id });
                },
              },
            ],
            { cancelable: false }
          );
        }
      }
    } catch (error) {
      console.error('Order placement error:', error);
      const errorMessage = (error as any)?.message || t('errors.tryAgain');
      Alert.alert(t('checkout.alerts.orderFailed'), errorMessage);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const steps = [
    t('checkout.steps.shipping'),
    t('checkout.steps.payment'),
    t('checkout.steps.review')
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <GSText variant="body" color="primary">← {t('common.back')}</GSText>
        </TouchableOpacity>
        <GSText variant="h4" weight="bold">{t('checkout.title')}</GSText>
        <View style={styles.headerSpacer} />
      </View>

      {/* Step Indicator */}
      <View style={styles.stepContainer}>
        <StepIndicator currentStep={currentStep} totalSteps={steps.length} />
        <View style={styles.stepLabels}>
          {steps.map((step, index) => (
            <GSText
              key={step}
              variant="caption"
              color={index <= currentStep ? 'primary' : 'textSecondary'}
              weight={index === currentStep ? 'semiBold' : 'normal'}
              style={styles.stepLabel}
            >
              {step}
            </GSText>
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 0 && (
          loadingAddress ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <GSText variant="body" color="textSecondary" style={styles.loadingText}>
                {t('checkout.loadingAddress')}
              </GSText>
            </View>
          ) : (
            <ShippingForm
              address={shippingAddress}
              onUpdate={setShippingAddress}
              onNext={handleShippingAddressNext}
              isLoading={calculatingShipping}
            />
          )
        )}

        {currentStep === 1 && shippingInfo && (
          <ShippingSummary
            shippingCost={shippingInfo.shippingCost}
            shippingType={shippingInfo.shippingType}
            isFree={shippingInfo.isFree}
            message={shippingInfo.message}
            onNext={handleShippingSummaryNext}
            onBack={() => setCurrentStep(0)}
          />
        )}

        {currentStep === 2 && (
          <PaymentMethodSelection
            orderTotal={(() => {
              const summary = items.reduce((acc, item) => acc + Number(item.subtotal || 0), 0);
              const shipping = Number(shippingInfo?.shippingCost || 0);
              return Number((summary + shipping).toFixed(2));
            })()}
            selectedMethod={selectedPaymentMethod}
            onSelectMethod={setSelectedPaymentMethod}
            onNext={handlePaymentMethodNext}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <OrderSummary
            onBack={() => setCurrentStep(2)}
            onPlaceOrder={handlePlaceOrder}
            isPlacingOrder={createOrderApi.isLoading}
            shippingCost={shippingInfo?.shippingCost || 0}
            selectedPaymentMethod={selectedPaymentMethod}
            platformFeeRate={platformFeeRate}
            loadingFeeRate={loadingFeeRate}
          />
        )}
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
    minWidth: 60,
  },
  headerSpacer: {
    minWidth: 60,
  },
  stepContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stepLabel: {
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 12,
  },
  formSection: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 20,
  },
  defaultAddressBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  docTypeSelector: {
    height: 48,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  nextButton: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  docTypeList: {
    maxHeight: 300,
  },
  docTypeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  shippingCard: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 20,
  },
  shippingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shippingMessage: {
    marginTop: 4,
  },
  freeShippingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonWrapper: {
    flex: 1,
  },
  navBackButton: {
    width: '100%',
  },
  orderItems: {
    marginBottom: 20,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  orderItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  paymentSummary: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 20,
  },
  paymentSummaryTitle: {
    marginBottom: 8,
  },
  paymentSummaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotals: {
    paddingTop: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vatNote: {
    marginTop: 4,
    marginBottom: 12,
  },
  finalTotal: {
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 8,
  },
});