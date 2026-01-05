import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import {
  PaymentMethod,
  paymentsService,
} from '../../services/payments.service';
import GSText from '../ui/GSText';
import GSButton from '../ui/GSButton';

interface PaymentProvider {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
}

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
  const { t } = useTranslation('translation');
  const { theme } = useTheme();

  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);

  // Fetch available payment providers from backend
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoadingProviders(true);
        const response = await paymentsService.getAvailableProviders();

        if (response.providers && Array.isArray(response.providers)) {
          setProviders(response.providers);

          // Auto-select first provider if none selected
          if (!selectedMethod && response.providers.length > 0) {
            const firstProvider = response.providers[0];
            const method: PaymentMethod = {
              id: firstProvider.id,
              type: firstProvider.id === 'stripe' ? 'card' : 'mercadopago',
              provider: firstProvider.name,
              details: {},
              isDefault: false,
              createdAt: new Date().toISOString(),
            };
            onSelectMethod(method);
          }
        }
      } catch (error) {
        console.error('Failed to fetch payment providers:', error);
        // Fallback to default providers
        setProviders([
          { id: 'mercadopago', name: 'MercadoPago', description: 'PSE, cash payments, and cards', icon: '💵', enabled: true },
        ]);
      } finally {
        setLoadingProviders(false);
      }
    };

    fetchProviders();
  }, []);

  const handleNext = () => {
    if (!selectedMethod) {
      Alert.alert(
        t('checkout.paymentMethod'),
        t('checkout.alerts.pleaseSelectPayment')
      );
      return;
    }
    onNext();
  };

  const handleProviderSelect = (provider: PaymentProvider) => {
    const method: PaymentMethod = {
      id: provider.id,
      type: provider.id === 'stripe' ? 'card' : 'mercadopago',
      provider: provider.name,
      details: {},
      isDefault: false,
      createdAt: new Date().toISOString(),
    };
    onSelectMethod(method);
  };

  return (
    <View style={styles.container}>
      <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
        {t('checkout.payment.title')}
      </GSText>

      {loadingProviders ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <GSText variant="caption" color="textSecondary" style={styles.loadingText}>
            {t('checkout.payment.loadingMethods') || 'Cargando métodos de pago...'}
          </GSText>
        </View>
      ) : (
        <>
          {/* Payment Provider Options */}
          {providers.map((provider) => {
            const isSelected = selectedMethod?.id === provider.id;

            return (
              <TouchableOpacity
                key={provider.id}
                style={[
                  styles.paymentOption,
                  {
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    backgroundColor: isSelected ? theme.colors.primary + '10' : theme.colors.surface,
                  },
                ]}
                onPress={() => handleProviderSelect(provider)}
                activeOpacity={0.7}
              >
                <View style={styles.paymentOptionContent}>
                  <View style={styles.paymentOptionHeader}>
                    <GSText variant="h2" style={styles.paymentIcon}>{provider.icon}</GSText>
                    <View style={styles.paymentOptionInfo}>
                      <GSText variant="body" weight="semiBold">
                        {provider.name}
                      </GSText>
                      <GSText variant="caption" color="textSecondary">
                        {provider.description}
                      </GSText>
                    </View>
                  </View>
                </View>

                <View
                  style={[
                    styles.radioButton,
                    {
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[
                        styles.radioButtonInner,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {/* Info Note */}
      <View style={[styles.infoNote, { backgroundColor: theme.colors.surface }]}>
        <GSText variant="caption" color="textSecondary" style={styles.infoNoteText}>
          🔒 {t('checkout.payment.securePayment') || 'Pago 100% seguro. Serás redirigido a MercadoPago para completar la transacción.'}
        </GSText>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationButtons}>
        <View style={styles.buttonWrapper}>
          <GSButton
            title={t('common.back')}
            onPress={onBack}
            variant="outline"
            style={styles.navButton}
          />
        </View>
        <View style={styles.buttonWrapper}>
          <GSButton
            title={t('checkout.payment.continueToReview')}
            onPress={handleNext}
            style={styles.navButton}
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
  sectionTitle: {
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderRadius: 12,
    marginBottom: 16,
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
  infoNote: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoNoteText: {
    lineHeight: 20,
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
