import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import {
  paymentsService,
  PaymentMethod,
} from '../../services/payments.service';
import GSText from '../ui/GSText';
import GSButton from '../ui/GSButton';

interface PaymentMethodSelectionProps {
  orderTotal: number;
  selectedMethod: PaymentMethod | null;
  onSelectMethod: (method: PaymentMethod) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

const PaymentMethodSelection: React.FC<PaymentMethodSelectionProps> = ({
  orderTotal,
  selectedMethod,
  onSelectMethod,
  onNext,
  onBack,
  isLoading,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);

  const getMethodsApi = useApi(paymentsService.getPaymentMethods);

  // Load payment methods
  useEffect(() => {
    const loadPaymentOptions = async () => {
      try {
        setLoadingMethods(true);

        // Load saved payment methods if user is logged in
        if (user) {
          try {
            const methods = await getMethodsApi.execute();
            if (methods && Array.isArray(methods)) {
              setPaymentMethods(methods);
            }
          } catch (error: any) {
            // Ignore error if payment methods table doesn't exist or other DB issues
            console.log('Could not load saved payment methods:', error.message);
            setPaymentMethods([]);
          }
        }
      } catch (error) {
        console.error('Error loading payment options:', error);
      } finally {
        setLoadingMethods(false);
      }
    };

    loadPaymentOptions();
  }, [user]);

  // Payment method options (always available for new cards)
  const availablePaymentOptions = [
    {
      id: 'mercadopago_new',
      type: 'mercadopago' as const,
      label: 'MercadoPago',
      description: 'Pay securely with MercadoPago',
      icon: '💳',
      isNew: true,
    },
    {
      id: 'stripe_new',
      type: 'card' as const,
      label: 'Credit/Debit Card',
      description: 'Visa, Mastercard, Amex',
      icon: '💎',
      isNew: true,
    },
    {
      id: 'crypto_new',
      type: 'crypto' as const,
      label: 'USDC (Polygon)',
      description: 'Pay with cryptocurrency',
      icon: '₿',
      isNew: true,
    },
  ];

  const handleMethodSelect = (methodId: string, isNew: boolean = false) => {
    if (isNew) {
      // Create a temporary payment method object for new payments
      const option = availablePaymentOptions.find(opt => opt.id === methodId);
      if (option) {
        const tempMethod: PaymentMethod = {
          id: methodId,
          type: option.type,
          provider: option.label,
          details: {},
          isDefault: false,
          createdAt: new Date().toISOString(),
        };
        onSelectMethod(tempMethod);
      }
    } else {
      const method = paymentMethods.find(m => m.id === methodId);
      if (method) {
        onSelectMethod(method);
      }
    }
  };

  const handleNext = () => {
    if (!selectedMethod) {
      Alert.alert('Payment Method Required', 'Please select a payment method to continue');
      return;
    }
    onNext();
  };

  if (loadingMethods) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <GSText variant="body" color="textSecondary" style={styles.loadingText}>
          Loading payment options...
        </GSText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
        Select Payment Method
      </GSText>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Saved Payment Methods */}
        {paymentMethods.length > 0 && (
          <>
            <GSText variant="body" weight="semiBold" style={styles.subsectionTitle}>
              Saved Payment Methods
            </GSText>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentOption,
                  {
                    borderColor: selectedMethod?.id === method.id
                      ? theme.colors.primary
                      : theme.colors.gray300,
                    backgroundColor: selectedMethod?.id === method.id
                      ? theme.colors.primary + '10'
                      : theme.colors.surface,
                  },
                ]}
                onPress={() => handleMethodSelect(method.id)}
              >
                <View style={styles.paymentOptionContent}>
                  <View style={styles.paymentOptionHeader}>
                    <GSText variant="h2" style={styles.paymentIcon}>
                      {method.type === 'card' ? '💳' :
                       method.type === 'mercadopago' ? '💵' :
                       method.type === 'crypto' ? '₿' : '💎'}
                    </GSText>
                    <View style={styles.paymentOptionInfo}>
                      <GSText variant="body" weight="semiBold">
                        {method.provider}
                      </GSText>
                      <GSText variant="caption" color="textSecondary">
                        {method.details.last4 ? `•••• ${method.details.last4}` : 'Saved method'}
                      </GSText>
                      {method.isDefault && (
                        <View style={[styles.defaultBadge, { backgroundColor: theme.colors.success + '20' }]}>
                          <GSText variant="caption" color="success" weight="semiBold">
                            Default
                          </GSText>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <View
                  style={[
                    styles.radioButton,
                    {
                      borderColor: selectedMethod?.id === method.id
                        ? theme.colors.primary
                        : theme.colors.gray300,
                    },
                  ]}
                >
                  {selectedMethod?.id === method.id && (
                    <View
                      style={[
                        styles.radioButtonInner,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* New Payment Options */}
        <GSText variant="body" weight="semiBold" style={styles.subsectionTitle}>
          {paymentMethods.length > 0 ? 'Or Pay With' : 'Payment Options'}
        </GSText>
        {availablePaymentOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.paymentOption,
              {
                borderColor: selectedMethod?.id === option.id
                  ? theme.colors.primary
                  : theme.colors.gray300,
                backgroundColor: selectedMethod?.id === option.id
                  ? theme.colors.primary + '10'
                  : theme.colors.surface,
              },
            ]}
            onPress={() => handleMethodSelect(option.id, true)}
          >
            <View style={styles.paymentOptionContent}>
              <View style={styles.paymentOptionHeader}>
                <GSText variant="h2" style={styles.paymentIcon}>{option.icon}</GSText>
                <View style={styles.paymentOptionInfo}>
                  <GSText variant="body" weight="semiBold">
                    {option.label}
                  </GSText>
                  <GSText variant="caption" color="textSecondary">
                    {option.description}
                  </GSText>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.radioButton,
                {
                  borderColor: selectedMethod?.id === option.id
                    ? theme.colors.primary
                    : theme.colors.gray300,
                },
              ]}
            >
              {selectedMethod?.id === option.id && (
                <View
                  style={[
                    styles.radioButtonInner,
                    { backgroundColor: theme.colors.primary },
                  ]}
                />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationButtons}>
        <View style={styles.buttonWrapper}>
          <GSButton
            title="Back"
            onPress={onBack}
            variant="outline"
            style={styles.navButton}
          />
        </View>
        <View style={styles.buttonWrapper}>
          <GSButton
            title="Continue to Review"
            onPress={handleNext}
            style={styles.navButton}
            disabled={!selectedMethod}
            loading={isLoading}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
  sectionTitle: {
    marginBottom: 20,
  },
  subsectionTitle: {
    marginTop: 16,
    marginBottom: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
  },
  paymentOptionContent: {
    flex: 1,
  },
  paymentOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    marginRight: 12,
    fontSize: 32,
  },
  paymentOptionInfo: {
    flex: 1,
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  buttonWrapper: {
    flex: 1,
  },
  navButton: {
    width: '100%',
  },
});

export default PaymentMethodSelection;
