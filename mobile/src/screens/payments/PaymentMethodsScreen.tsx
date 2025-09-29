import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import GSInput from '../../components/ui/GSInput';
import {
  paymentsService,
  PaymentMethod,
  StripePaymentRequest,
} from '../../services/payments.service';

interface PaymentMethodItemProps {
  method: PaymentMethod;
  onSetDefault: (methodId: string) => void;
  onRemove: (methodId: string) => void;
  isUpdating: boolean;
}

const PaymentMethodItem: React.FC<PaymentMethodItemProps> = ({
  method,
  onSetDefault,
  onRemove,
  isUpdating,
}) => {
  const { theme } = useTheme();

  const getMethodDetails = () => {
    switch (method.type) {
      case 'card':
        return {
          title: `•••• ${method.details.last4}`,
          subtitle: `${method.details.brand?.toUpperCase()} • Expires ${method.details.expiryMonth}/${method.details.expiryYear}`,
          icon: 'card-outline' as const,
        };
      case 'mercadopago':
        return {
          title: 'MercadoPago',
          subtitle: 'Digital wallet',
          icon: 'wallet-outline' as const,
        };
      case 'crypto':
        return {
          title: 'Crypto Wallet',
          subtitle: `${method.details.walletAddress?.slice(0, 6)}...${method.details.walletAddress?.slice(-4)}`,
          icon: 'logo-bitcoin' as const,
        };
      case 'gshop_tokens':
        return {
          title: 'GSHOP Tokens',
          subtitle: `${method.details.tokenBalance || 0} tokens available`,
          icon: 'diamond-outline' as const,
        };
      default:
        return {
          title: method.provider,
          subtitle: 'Payment method',
          icon: 'payment-outline' as const,
        };
    }
  };

  const details = getMethodDetails();

  const handleRemove = () => {
    if (method.isDefault) {
      Alert.alert(
        'Cannot Remove',
        'You cannot remove your default payment method. Please set another method as default first.'
      );
      return;
    }

    Alert.alert(
      'Remove Payment Method',
      `Are you sure you want to remove this ${method.type === 'card' ? 'card' : 'payment method'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemove(method.id),
        },
      ]
    );
  };

  return (
    <View style={[styles.methodItem, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.methodContent}>
        <View style={styles.methodIcon}>
          <Ionicons
            name={details.icon}
            size={24}
            color={method.isDefault ? theme.colors.primary : theme.colors.textSecondary}
          />
        </View>

        <View style={styles.methodInfo}>
          <View style={styles.methodHeader}>
            <GSText variant="body" weight="medium">
              {details.title}
            </GSText>
            {method.isDefault && (
              <View style={[styles.defaultBadge, { backgroundColor: theme.colors.primary }]}>
                <GSText variant="caption" color="white" weight="bold">
                  Default
                </GSText>
              </View>
            )}
          </View>
          <GSText variant="caption" color="textSecondary">
            {details.subtitle}
          </GSText>
          {method.details.holderName && (
            <GSText variant="caption" color="textSecondary">
              {method.details.holderName}
            </GSText>
          )}
        </View>
      </View>

      <View style={styles.methodActions}>
        {!method.isDefault && (
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: theme.colors.primary }]}
            onPress={() => onSetDefault(method.id)}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={16} color={theme.colors.primary} />
                <GSText variant="caption" color="primary" style={{ marginLeft: 4 }}>
                  Set Default
                </GSText>
              </>
            )}
          </TouchableOpacity>
        )}

        {method.type !== 'gshop_tokens' && (
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: theme.colors.error }]}
            onPress={handleRemove}
            disabled={isUpdating}
          >
            <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
            <GSText variant="caption" color="error" style={{ marginLeft: 4 }}>
              Remove
            </GSText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

interface AddCardModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (cardData: StripePaymentRequest) => void;
  isLoading: boolean;
}

const AddCardModal: React.FC<AddCardModalProps> = ({ visible, onClose, onSubmit, isLoading }) => {
  const { theme } = useTheme();
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [holderName, setHolderName] = useState('');
  const [saveCard, setSaveCard] = useState(true);

  const resetForm = () => {
    setCardNumber('');
    setExpiryDate('');
    setCvc('');
    setHolderName('');
    setSaveCard(true);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={handleClose}>
            <GSText variant="body" color="textSecondary">
              Cancel
            </GSText>
          </TouchableOpacity>
          <GSText variant="h4" weight="bold">
            Add New Card
          </GSText>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.cardPreview}>
            <View style={[styles.cardMockup, { backgroundColor: theme.colors.primary }]}>
              <GSText variant="body" color="white" weight="bold">
                {cardNumber || '•••• •••• •••• ••••'}
              </GSText>
              <View style={styles.cardInfo}>
                <GSText variant="caption" color="white">
                  {holderName || 'CARDHOLDER NAME'}
                </GSText>
                <GSText variant="caption" color="white">
                  {expiryDate || 'MM/YY'}
                </GSText>
              </View>
            </View>
          </View>

          <View style={styles.form}>
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
              autoCapitalize="words"
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
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <GSButton
            title="Add Card"
            onPress={handleSubmit}
            loading={isLoading}
            style={styles.addButton}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default function PaymentMethodsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingMethodId, setUpdatingMethodId] = useState<string | null>(null);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [addingCard, setAddingCard] = useState(false);

  // Load payment methods
  const loadPaymentMethods = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }

      const methods = await paymentsService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (error: any) {
      console.error('Failed to load payment methods:', error);
      Alert.alert('Error', error.message || 'Failed to load payment methods');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadPaymentMethods();
    }
  }, [isAuthenticated, loadPaymentMethods]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadPaymentMethods(true);
  }, [loadPaymentMethods]);

  // Set default payment method
  const handleSetDefault = useCallback(async (methodId: string) => {
    try {
      setUpdatingMethodId(methodId);
      await paymentsService.setDefaultPaymentMethod(methodId);

      // Update local state
      setPaymentMethods(prev =>
        prev.map(method => ({
          ...method,
          isDefault: method.id === methodId,
        }))
      );

      Alert.alert('Success', 'Default payment method updated');
    } catch (error: any) {
      console.error('Failed to set default payment method:', error);
      Alert.alert('Error', error.message || 'Failed to update default payment method');
    } finally {
      setUpdatingMethodId(null);
    }
  }, []);

  // Remove payment method
  const handleRemove = useCallback(async (methodId: string) => {
    try {
      setUpdatingMethodId(methodId);
      await paymentsService.removePaymentMethod(methodId);

      // Update local state
      setPaymentMethods(prev => prev.filter(method => method.id !== methodId));

      Alert.alert('Success', 'Payment method removed');
    } catch (error: any) {
      console.error('Failed to remove payment method:', error);
      Alert.alert('Error', error.message || 'Failed to remove payment method');
    } finally {
      setUpdatingMethodId(null);
    }
  }, []);

  // Add new card
  const handleAddCard = useCallback(async (cardData: StripePaymentRequest) => {
    try {
      setAddingCard(true);

      const newMethod = await paymentsService.addPaymentMethod({
        type: 'card',
        details: {
          last4: cardData.cardNumber.slice(-4),
          brand: paymentsService.getCardBrand(cardData.cardNumber),
          expiryMonth: cardData.expiryMonth,
          expiryYear: cardData.expiryYear,
          holderName: cardData.holderName,
        },
        setAsDefault: paymentMethods.length === 0, // Set as default if first method
      });

      setPaymentMethods(prev => [newMethod, ...prev]);
      setShowAddCardModal(false);

      Alert.alert('Success', 'Card added successfully');
    } catch (error: any) {
      console.error('Failed to add card:', error);
      Alert.alert('Error', error.message || 'Failed to add card');
    } finally {
      setAddingCard(false);
    }
  }, [paymentMethods.length]);

  // Show login prompt for guests
  if (!isAuthenticated) {
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
            Payment Methods
          </GSText>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={60} color={theme.colors.textSecondary} />
          <GSText variant="h3" weight="bold" style={styles.emptyTitle}>
            Sign in Required
          </GSText>
          <GSText variant="body" color="textSecondary" style={styles.emptySubtitle}>
            Sign in to manage your payment methods
          </GSText>
          <GSButton
            title="Sign In"
            onPress={() => navigation.navigate('Auth' as any)}
            style={styles.signInButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Show loading state
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
            Payment Methods
          </GSText>
          <View style={{ width: 24 }} />
        </View>

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <GSText variant="h3" weight="bold">
          Payment Methods
        </GSText>
        <TouchableOpacity
          onPress={() => setShowAddCardModal(true)}
        >
          <Ionicons name="add" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Payment Methods List */}
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
        {paymentMethods.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="card-outline" size={60} color={theme.colors.textSecondary} />
            <GSText variant="h3" weight="bold" style={styles.emptyTitle}>
              No Payment Methods
            </GSText>
            <GSText variant="body" color="textSecondary" style={styles.emptySubtitle}>
              Add a payment method to make purchases easier
            </GSText>
            <GSButton
              title="Add Payment Method"
              onPress={() => setShowAddCardModal(true)}
              style={styles.addMethodButton}
            />
          </View>
        ) : (
          <View style={styles.methodsList}>
            {paymentMethods.map((method) => (
              <PaymentMethodItem
                key={method.id}
                method={method}
                onSetDefault={handleSetDefault}
                onRemove={handleRemove}
                isUpdating={updatingMethodId === method.id}
              />
            ))}

            {/* Add Method Button */}
            <TouchableOpacity
              style={[styles.addMethodCard, { borderColor: theme.colors.primary }]}
              onPress={() => setShowAddCardModal(true)}
            >
              <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
              <GSText variant="body" color="primary" style={{ marginLeft: 12 }}>
                Add New Payment Method
              </GSText>
            </TouchableOpacity>
          </View>
        )}

        {/* Security Notice */}
        <View style={[styles.securityNotice, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.success} />
          <GSText variant="caption" color="textSecondary" style={{ marginLeft: 8, flex: 1 }}>
            Your payment information is encrypted and stored securely. We never store your full card details.
          </GSText>
        </View>
      </ScrollView>

      {/* Add Card Modal */}
      <AddCardModal
        visible={showAddCardModal}
        onClose={() => setShowAddCardModal(false)}
        onSubmit={handleAddCard}
        isLoading={addingCard}
      />
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
  content: {
    flex: 1,
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
    marginTop: 100,
  },
  emptyTitle: {
    marginTop: 16,
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
  addMethodButton: {
    minWidth: 200,
  },
  methodsList: {
    padding: 16,
  },
  methodItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodIcon: {
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  methodActions: {
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
  addMethodCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  cardPreview: {
    alignItems: 'center',
    marginBottom: 32,
  },
  cardMockup: {
    width: 300,
    height: 180,
    borderRadius: 12,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  form: {
    flex: 1,
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
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  addButton: {
    marginBottom: 0,
  },
});