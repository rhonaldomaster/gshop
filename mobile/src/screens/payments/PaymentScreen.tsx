import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import GSInput from '../../components/ui/GSInput';
import {
  paymentsService,
  PaymentMethod,
  PaymentRequest,
  PaymentResponse,
  StripePaymentRequest,
  CryptoPaymentRequest,
  TokenPaymentRequest,
  WalletBalance,
  PaymentStatus,
} from '../../services/payments.service';

type PaymentScreenParams = {
  orderId: string;
  amount: number;
  currency: string;
  orderDetails?: any;
};

type PaymentScreenRouteProp = RouteProp<{ params: PaymentScreenParams }, 'params'>;

interface PaymentMethodCardProps {
  method: PaymentMethod;
  isSelected: boolean;
  onSelect: () => void;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({ method, isSelected, onSelect }) => {
  const { theme } = useTheme();

  const getMethodDisplay = () => {
    switch (method.type) {
      case 'card':
        return `•••• ${method.details.last4} (${method.details.brand?.toUpperCase()})`;
      case 'mercadopago':
        return 'MercadoPago Wallet';
      case 'crypto':
        return `Crypto Wallet (${method.details.walletAddress?.slice(0, 6)}...${method.details.walletAddress?.slice(-4)})`;
      case 'gshop_tokens':
        return `GSHOP Tokens (${method.details.tokenBalance || 0} available)`;
      default:
        return method.provider;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.paymentMethodCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          borderWidth: isSelected ? 2 : 1,
        },
      ]}
      onPress={onSelect}
    >
      <View style={styles.paymentMethodContent}>
        <View style={styles.paymentMethodIcon}>
          <Ionicons
            name={paymentsService.getPaymentMethodIcon(method.type) as any}
            size={24}
            color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
          />
        </View>
        <View style={styles.paymentMethodInfo}>
          <GSText variant="body" weight="medium">
            {getMethodDisplay()}
          </GSText>
          <GSText variant="caption" color="textSecondary">
            {method.provider}
          </GSText>
          {method.isDefault && (
            <GSText variant="caption" color="primary">
              Default
            </GSText>
          )}
        </View>
      </View>
      <View style={styles.paymentMethodSelector}>
        <View
          style={[
            styles.radioButton,
            {
              borderColor: isSelected ? theme.colors.primary : theme.colors.border,
              backgroundColor: isSelected ? theme.colors.primary : 'transparent',
            },
          ]}
        >
          {isSelected && (
            <Ionicons name="checkmark" size={16} color={theme.colors.white} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface NewCardFormProps {
  onSubmit: (cardData: StripePaymentRequest) => void;
  isLoading: boolean;
}

const NewCardForm: React.FC<NewCardFormProps> = ({ onSubmit, isLoading }) => {
  const { theme } = useTheme();
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [holderName, setHolderName] = useState('');
  const [saveCard, setSaveCard] = useState(false);

  const handleCardNumberChange = (text: string) => {
    const formatted = paymentsService.formatCardNumber(text);
    if (formatted.replace(/\s/g, '').length <= 19) {
      setCardNumber(formatted);
    }
  };

  const handleExpiryChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 4) {
      const formatted = cleaned.length >= 2 ? `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}` : cleaned;
      setExpiryDate(formatted);
    }
  };

  const handleSubmit = () => {
    const [month, year] = expiryDate.split('/').map(Number);
    const fullYear = year ? 2000 + year : 0;

    if (!paymentsService.validateCardNumber(cardNumber)) {
      Alert.alert('Invalid Card', 'Please enter a valid card number');
      return;
    }

    if (!paymentsService.validateExpiryDate(month, fullYear)) {
      Alert.alert('Invalid Expiry', 'Please enter a valid expiry date');
      return;
    }

    const cardBrand = paymentsService.getCardBrand(cardNumber);
    if (!paymentsService.validateCVC(cvc, cardBrand)) {
      Alert.alert('Invalid CVC', 'Please enter a valid security code');
      return;
    }

    if (!holderName.trim()) {
      Alert.alert('Missing Name', 'Please enter the cardholder name');
      return;
    }

    onSubmit({
      cardNumber: cardNumber.replace(/\s/g, ''),
      expiryMonth: month,
      expiryYear: fullYear,
      cvc,
      holderName: holderName.trim(),
      saveCard,
    });
  };

  return (
    <View style={styles.newCardForm}>
      <GSText variant="h4" weight="bold" style={styles.formTitle}>
        Add New Card
      </GSText>

      <GSInput
        label="Card Number"
        value={cardNumber}
        onChangeText={handleCardNumberChange}
        placeholder="1234 5678 9012 3456"
        keyboardType="numeric"
        style={styles.formInput}
      />

      <View style={styles.formRow}>
        <GSInput
          label="Expiry Date"
          value={expiryDate}
          onChangeText={handleExpiryChange}
          placeholder="MM/YY"
          keyboardType="numeric"
          style={[styles.formInput, { flex: 1, marginRight: 8 }]}
        />
        <GSInput
          label="CVC"
          value={cvc}
          onChangeText={setCvc}
          placeholder="123"
          keyboardType="numeric"
          maxLength={4}
          style={[styles.formInput, { flex: 1, marginLeft: 8 }]}
        />
      </View>

      <GSInput
        label="Cardholder Name"
        value={holderName}
        onChangeText={setHolderName}
        placeholder="John Doe"
        style={styles.formInput}
      />

      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setSaveCard(!saveCard)}
      >
        <View
          style={[
            styles.checkbox,
            {
              borderColor: theme.colors.border,
              backgroundColor: saveCard ? theme.colors.primary : 'transparent',
            },
          ]}
        >
          {saveCard && (
            <Ionicons name="checkmark" size={16} color={theme.colors.white} />
          )}
        </View>
        <GSText variant="body" style={{ marginLeft: 12 }}>
          Save this card for future purchases
        </GSText>
      </TouchableOpacity>

      <GSButton
        title="Pay with Card"
        onPress={handleSubmit}
        loading={isLoading}
        style={styles.payButton}
      />
    </View>
  );
};

export default function PaymentScreen() {
  const { theme } = useTheme();
  const route = useRoute<PaymentScreenRouteProp>();
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();

  const { orderId, amount, currency, orderDetails } = route.params;

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [showTokensModal, setShowTokensModal] = useState(false);
  const [useTokens, setUseTokens] = useState(false);
  const [tokenAmount, setTokenAmount] = useState(0);
  const [cryptoWalletAddress, setCryptoWalletAddress] = useState('');

  // Load payment methods and wallet balance
  const loadPaymentData = useCallback(async () => {
    try {
      setLoading(true);

      const [methods, wallet] = await Promise.all([
        paymentsService.getPaymentMethods(),
        paymentsService.getWalletBalance().catch(() => null),
      ]);

      setPaymentMethods(methods);
      setWalletBalance(wallet);

      // Select default payment method
      const defaultMethod = methods.find(m => m.isDefault);
      if (defaultMethod) {
        setSelectedMethodId(defaultMethod.id);
      }
    } catch (error: any) {
      console.error('Failed to load payment data:', error);
      Alert.alert('Error', error.message || 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadPaymentData();
    }
  }, [isAuthenticated, loadPaymentData]);

  // Handle payment processing
  const processPayment = useCallback(async (paymentMethod: PaymentMethod, additionalData?: any) => {
    try {
      setProcessing(true);

      // Create payment request
      const paymentRequest: PaymentRequest = {
        orderId,
        amount,
        currency,
        paymentMethodId: paymentMethod.id,
        guestPayment: !isAuthenticated,
      };

      // Create payment
      const payment = await paymentsService.createPayment(paymentRequest);

      let result: PaymentResponse;

      // Process based on payment method type
      switch (paymentMethod.type) {
        case 'card':
          if (additionalData) {
            result = await paymentsService.processStripePayment(payment.paymentId, additionalData);
          } else {
            // Use saved card
            result = await paymentsService.processStripePayment(payment.paymentId, {
              cardNumber: '',
              expiryMonth: 0,
              expiryYear: 0,
              cvc: '',
              holderName: '',
            });
          }
          break;

        case 'crypto':
          result = await paymentsService.processCryptoPayment(payment.paymentId, {
            walletAddress: cryptoWalletAddress || paymentMethod.details.walletAddress || '',
            amount,
            currency: 'USDC',
          });
          break;

        case 'gshop_tokens':
          result = await paymentsService.processTokenPayment(payment.paymentId, {
            tokenAmount: tokenAmount || amount,
            usePartialTokens: tokenAmount < amount,
            supplementaryPaymentMethodId: tokenAmount < amount ? selectedMethodId || undefined : undefined,
          });
          break;

        case 'mercadopago':
          result = await paymentsService.processMercadoPagoPayment(payment.paymentId, additionalData || {});
          break;

        default:
          throw new Error('Unsupported payment method');
      }

      // Handle payment result
      if (result.success && result.status === PaymentStatus.COMPLETED) {
        Alert.alert(
          'Payment Successful',
          'Your payment has been processed successfully!',
          [
            {
              text: 'View Order',
              onPress: () => navigation.navigate('OrderDetail' as any, { orderId }),
            },
          ]
        );
      } else if (result.redirectUrl) {
        // Handle redirect for external payment processors
        Alert.alert(
          'Complete Payment',
          'You will be redirected to complete your payment',
          [
            {
              text: 'Continue',
              onPress: () => {
                // Handle redirect - could open web browser or in-app browser
              },
            },
          ]
        );
      } else {
        throw new Error('Payment failed');
      }
    } catch (error: any) {
      console.error('Payment processing failed:', error);
      Alert.alert('Payment Failed', error.message || 'Payment could not be processed');
    } finally {
      setProcessing(false);
    }
  }, [orderId, amount, currency, isAuthenticated, navigation, selectedMethodId, tokenAmount, cryptoWalletAddress]);

  // Handle payment method selection
  const handlePaymentMethodSelect = useCallback((method: PaymentMethod) => {
    setSelectedMethodId(method.id);
    setShowNewCardForm(false);

    if (method.type === 'gshop_tokens') {
      setShowTokensModal(true);
    }
  }, []);

  // Handle new card payment
  const handleNewCardPayment = useCallback((cardData: StripePaymentRequest) => {
    const cardMethod: PaymentMethod = {
      id: 'new_card',
      type: 'card',
      provider: 'Stripe',
      details: {
        holderName: cardData.holderName,
      },
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    processPayment(cardMethod, cardData);
  }, [processPayment]);

  // Handle proceed with payment
  const handleProceedPayment = useCallback(() => {
    const selectedMethod = paymentMethods.find(m => m.id === selectedMethodId);
    if (!selectedMethod) {
      Alert.alert('No Payment Method', 'Please select a payment method');
      return;
    }

    processPayment(selectedMethod);
  }, [selectedMethodId, paymentMethods, processPayment]);

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <GSText variant="body" color="textSecondary" style={{ marginTop: 16 }}>
            Loading payment methods...
          </GSText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <GSText variant="h3" weight="bold">
            Payment
          </GSText>
          <View style={{ width: 24 }} />
        </View>

        {/* Order Summary */}
        <View style={[styles.orderSummary, { backgroundColor: theme.colors.surface }]}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            Order Summary
          </GSText>
          <View style={styles.summaryRow}>
            <GSText variant="body">Order #{orderId.slice(0, 8)}</GSText>
            <GSText variant="h4" weight="bold" color="primary">
              {paymentsService.formatPrice(amount, currency)}
            </GSText>
          </View>
        </View>

        {/* GSHOP Tokens Balance */}
        {walletBalance && (
          <View style={[styles.walletSection, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.walletHeader}>
              <Ionicons name="diamond-outline" size={24} color={theme.colors.primary} />
              <View style={styles.walletInfo}>
                <GSText variant="body" weight="medium">
                  GSHOP Tokens
                </GSText>
                <GSText variant="caption" color="textSecondary">
                  {paymentsService.formatTokenAmount(walletBalance.tokenBalance)} available
                </GSText>
              </View>
              <GSText variant="body" weight="bold" color="primary">
                {paymentsService.formatPrice(walletBalance.usdValue)}
              </GSText>
            </View>

            {walletBalance.tokenBalance >= amount && (
              <TouchableOpacity
                style={[styles.useTokensButton, { borderColor: theme.colors.primary }]}
                onPress={() => setShowTokensModal(true)}
              >
                <GSText variant="body" color="primary" weight="medium">
                  Use GSHOP Tokens
                </GSText>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Payment Methods */}
        <View style={styles.section}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            Payment Methods
          </GSText>

          {paymentMethods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              isSelected={selectedMethodId === method.id}
              onSelect={() => handlePaymentMethodSelect(method)}
            />
          ))}

          {/* Add New Card Option */}
          <TouchableOpacity
            style={[
              styles.addMethodCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: showNewCardForm ? theme.colors.primary : theme.colors.border,
              },
            ]}
            onPress={() => setShowNewCardForm(!showNewCardForm)}
          >
            <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
            <GSText variant="body" color="primary" style={{ marginLeft: 12 }}>
              Add New Card
            </GSText>
          </TouchableOpacity>

          {/* New Card Form */}
          {showNewCardForm && (
            <NewCardForm
              onSubmit={handleNewCardPayment}
              isLoading={processing}
            />
          )}
        </View>

        {/* Payment Actions */}
        {!showNewCardForm && (
          <View style={styles.paymentActions}>
            <GSButton
              title={`Pay ${paymentsService.formatPrice(amount, currency)}`}
              onPress={handleProceedPayment}
              loading={processing}
              disabled={!selectedMethodId}
              style={styles.payButton}
            />

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
            >
              <GSText variant="body" color="textSecondary">
                Cancel Payment
              </GSText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Tokens Modal */}
      <Modal
        visible={showTokensModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTokensModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <GSText variant="h4" weight="bold" style={styles.modalTitle}>
              Use GSHOP Tokens
            </GSText>

            <GSText variant="body" style={styles.modalText}>
              Available: {paymentsService.formatTokenAmount(walletBalance?.tokenBalance || 0)}
            </GSText>
            <GSText variant="body" style={styles.modalText}>
              Order Total: {paymentsService.formatPrice(amount, currency)}
            </GSText>

            <GSInput
              label="Token Amount"
              value={tokenAmount.toString()}
              onChangeText={(text) => setTokenAmount(Number(text))}
              keyboardType="numeric"
              placeholder="0"
              style={styles.modalInput}
            />

            <View style={styles.modalActions}>
              <GSButton
                title="Cancel"
                variant="outlined"
                onPress={() => setShowTokensModal(false)}
                style={styles.modalButton}
              />
              <GSButton
                title="Use Tokens"
                onPress={() => {
                  setShowTokensModal(false);
                  const tokenMethod = paymentMethods.find(m => m.type === 'gshop_tokens');
                  if (tokenMethod) {
                    processPayment(tokenMethod);
                  }
                }}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  orderSummary: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletSection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletInfo: {
    flex: 1,
    marginLeft: 12,
  },
  useTokensButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  paymentMethodCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodIcon: {
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodSelector: {
    marginLeft: 12,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMethodCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  newCardForm: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  formTitle: {
    marginBottom: 16,
  },
  formInput: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentActions: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  payButton: {
    marginBottom: 12,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    margin: 20,
    borderRadius: 12,
    padding: 20,
    minWidth: 300,
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 8,
    textAlign: 'center',
  },
  modalInput: {
    marginVertical: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});