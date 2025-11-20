import React, { useState, useEffect, useCallback } from 'react';
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
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('translation');

  const getMethodDisplay = () => {
    switch (method.type) {
      case 'card':
        return `•••• ${method.details.last4} (${method.details.brand?.toUpperCase()})`;
      case 'mercadopago':
        return t('payments.mercadoPagoWallet');
      case 'crypto':
        return `${t('payments.cryptoWallet')} (${method.details.walletAddress?.slice(0, 6)}...${method.details.walletAddress?.slice(-4)})`;
      case 'gshop_tokens':
        return `${t('wallet.tokens')} (${method.details.tokenBalance || 0} ${t('payments.available')})`;
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
          borderColor: isSelected ? theme.colors.primary : theme.colors.gray300,
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
          <GSText variant="body" weight="semiBold">
            {getMethodDisplay()}
          </GSText>
          <GSText variant="caption" color="textSecondary">
            {method.provider}
          </GSText>
          {method.isDefault && (
            <GSText variant="caption" color="primary">
              {t('payments.default')}
            </GSText>
          )}
        </View>
      </View>
      <View style={styles.paymentMethodSelector}>
        <View
          style={[
            styles.radioButton,
            {
              borderColor: isSelected ? theme.colors.primary : theme.colors.gray300,
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
  const { t } = useTranslation('translation');
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
      Alert.alert(t('payments.invalidCard'), t('payments.enterValidCardNumber'));
      return;
    }

    if (!paymentsService.validateExpiryDate(month, fullYear)) {
      Alert.alert(t('payments.invalidExpiry'), t('payments.enterValidExpiryDate'));
      return;
    }

    const cardBrand = paymentsService.getCardBrand(cardNumber);
    if (!paymentsService.validateCVC(cvc, cardBrand)) {
      Alert.alert(t('payments.invalidCVC'), t('payments.enterValidSecurityCode'));
      return;
    }

    if (!holderName.trim()) {
      Alert.alert(t('payments.missingName'), t('payments.enterCardholderName'));
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
        {t('payments.addNewCard')}
      </GSText>

      <GSInput
        label={t('payments.cardNumber')}
        value={cardNumber}
        onChangeText={handleCardNumberChange}
        placeholder="1234 5678 9012 3456"
        keyboardType="numeric"
        style={styles.formInput}
      />

      <View style={styles.formRow}>
        <GSInput
          label={t('payments.expiryDate')}
          value={expiryDate}
          onChangeText={handleExpiryChange}
          placeholder="MM/YY"
          keyboardType="numeric"
          style={[styles.formInput, { flex: 1, marginRight: 8 }]}
        />
        <GSInput
          label={t('payments.cvv')}
          value={cvc}
          onChangeText={setCvc}
          placeholder="123"
          keyboardType="numeric"
          maxLength={4}
          style={[styles.formInput, { flex: 1, marginLeft: 8 }]}
        />
      </View>

      <GSInput
        label={t('payments.cardholderName')}
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
              borderColor: theme.colors.gray300,
              backgroundColor: saveCard ? theme.colors.primary : 'transparent',
            },
          ]}
        >
          {saveCard && (
            <Ionicons name="checkmark" size={16} color={theme.colors.white} />
          )}
        </View>
        <GSText variant="body" style={{ marginLeft: 12 }}>
          {t('payments.saveCard')}
        </GSText>
      </TouchableOpacity>

      <GSButton
        title={t('payments.payWithCard')}
        onPress={handleSubmit}
        loading={isLoading}
        style={styles.payButton}
      />
    </View>
  );
};

export default function PaymentScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation('translation');
  const route = useRoute<PaymentScreenRouteProp>();
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();

  const { orderId, amount, currency } = route.params;

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [showTokensModal, setShowTokensModal] = useState(false);
  const [tokenAmount, setTokenAmount] = useState(0);
  const [cryptoWalletAddress] = useState('');

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
      Alert.alert(t('common.error'), error.message || t('payments.failedToLoadPaymentMethods'));
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
          t('payments.paymentSuccessful'),
          t('payments.paymentProcessedSuccessfully'),
          [
            {
              text: t('payments.viewOrder'),
              onPress: () => {
                // @ts-ignore - Navigate to OrderDetail screen
                navigation.navigate('OrderDetail', { orderId });
              },
            },
          ]
        );
      } else if (result.redirectUrl) {
        // Handle redirect for external payment processors
        Alert.alert(
          t('payments.completePayment'),
          t('payments.redirectToCompletePayment'),
          [
            {
              text: t('common.continue'),
              onPress: () => {
                // Handle redirect - could open web browser or in-app browser
              },
            },
          ]
        );
      } else {
        throw new Error(t('payments.paymentFailed'));
      }
    } catch (error: any) {
      console.error('Payment processing failed:', error);
      Alert.alert(t('payments.paymentFailed'), error.message || t('payments.paymentCouldNotBeProcessed'));
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
      Alert.alert(t('payments.noPaymentMethod'), t('payments.pleaseSelectPaymentMethod'));
      return;
    }

    processPayment(selectedMethod);
  }, [selectedMethodId, paymentMethods, processPayment, t]);

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <GSText variant="body" color="textSecondary" style={{ marginTop: 16 }}>
            {t('payments.loadingPaymentMethods')}
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
            {t('payments.title')}
          </GSText>
          <View style={{ width: 24 }} />
        </View>

        {/* Order Summary */}
        <View style={[styles.orderSummary, { backgroundColor: theme.colors.surface }]}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            {t('checkout.orderSummary')}
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
                <GSText variant="body" weight="semiBold">
                  {t('wallet.tokens')}
                </GSText>
                <GSText variant="caption" color="textSecondary">
                  {paymentsService.formatTokenAmount(walletBalance.tokenBalance)} {t('payments.available')}
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
                <GSText variant="body" color="primary" weight="semiBold">
                  {t('payments.useTokens')}
                </GSText>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Payment Methods */}
        <View style={styles.section}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            {t('profile.paymentMethods')}
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
                borderColor: showNewCardForm ? theme.colors.primary : theme.colors.gray300,
              },
            ]}
            onPress={() => setShowNewCardForm(!showNewCardForm)}
          >
            <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
            <GSText variant="body" color="primary" style={{ marginLeft: 12 }}>
              {t('payments.addNewCard')}
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
              title={`${t('payments.pay')} ${paymentsService.formatPrice(amount, currency)}`}
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
                {t('payments.cancelPayment')}
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
              {t('payments.useTokens')}
            </GSText>

            <GSText variant="body" style={styles.modalText}>
              {t('payments.available')}: {paymentsService.formatTokenAmount(walletBalance?.tokenBalance || 0)}
            </GSText>
            <GSText variant="body" style={styles.modalText}>
              {t('payments.orderTotal')}: {paymentsService.formatPrice(amount, currency)}
            </GSText>

            <GSInput
              label={t('payments.tokenAmount')}
              value={tokenAmount.toString()}
              onChangeText={(text) => setTokenAmount(Number(text))}
              keyboardType="numeric"
              placeholder="0"
              style={styles.modalInput}
            />

            <View style={styles.modalActions}>
              <GSButton
                title={t('common.cancel')}
                variant="outline"
                onPress={() => setShowTokensModal(false)}
                style={styles.modalButton}
              />
              <GSButton
                title={t('payments.useTokens')}
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