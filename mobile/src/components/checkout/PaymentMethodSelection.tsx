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
import { useAuth } from '../../contexts/AuthContext';
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

interface WalletInfo {
  balance: number;
  canPay: boolean;
  shortfall: number;
  isLoading: boolean;
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
  const { user } = useAuth();

  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [walletInfo, setWalletInfo] = useState<WalletInfo>({
    balance: 0,
    canPay: false,
    shortfall: 0,
    isLoading: true,
  });

  // Format price for display
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Get localized provider name
  const getProviderName = (providerId: string): string => {
    return t(`checkout.payment.providers.${providerId}.name`) || providerId;
  };

  // Get localized provider description
  const getProviderDescription = (providerId: string): string => {
    return t(`checkout.payment.providers.${providerId}.description`) || '';
  };

  // Fetch wallet balance
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (!user) {
        setWalletInfo({
          balance: 0,
          canPay: false,
          shortfall: orderTotal,
          isLoading: false,
        });
        return;
      }

      try {
        const walletData = await paymentsService.getWalletBalance();
        const balance = walletData.tokenBalance || 0;
        const canPay = balance >= orderTotal;
        const shortfall = canPay ? 0 : orderTotal - balance;

        setWalletInfo({
          balance,
          canPay,
          shortfall,
          isLoading: false,
        });
      } catch (error) {
        console.error('Failed to fetch wallet balance:', error);
        setWalletInfo({
          balance: 0,
          canPay: false,
          shortfall: orderTotal,
          isLoading: false,
        });
      }
    };

    fetchWalletBalance();
  }, [user, orderTotal]);

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
              provider: getProviderName(firstProvider.id),
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
      provider: getProviderName(provider.id),
      details: {},
      isDefault: false,
      createdAt: new Date().toISOString(),
    };
    onSelectMethod(method);
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
      details: {
        tokenBalance: walletInfo.balance,
      },
      isDefault: false,
      createdAt: new Date().toISOString(),
    };
    onSelectMethod(method);
  };

  const isWalletSelected = selectedMethod?.type === 'wallet';

  return (
    <View style={styles.container}>
      <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
        {t('checkout.payment.title')}
      </GSText>

      {loadingProviders || walletInfo.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <GSText variant="caption" color="textSecondary" style={styles.loadingText}>
            {t('checkout.payment.loadingMethods')}
          </GSText>
        </View>
      ) : (
        <>
          {/* GSHOP Wallet Option - Show first if user is logged in */}
          {user && (
            <TouchableOpacity
              style={[
                styles.paymentOption,
                {
                  borderColor: isWalletSelected
                    ? theme.colors.primary
                    : walletInfo.canPay
                    ? theme.colors.border
                    : theme.colors.error + '50',
                  backgroundColor: isWalletSelected
                    ? theme.colors.primary + '10'
                    : walletInfo.canPay
                    ? theme.colors.surface
                    : theme.colors.error + '05',
                },
              ]}
              onPress={handleWalletSelect}
              activeOpacity={0.7}
              disabled={!walletInfo.canPay}
            >
              <View style={styles.paymentOptionContent}>
                <View style={styles.paymentOptionHeader}>
                  <GSText variant="h2" style={styles.paymentIcon}>💰</GSText>
                  <View style={styles.paymentOptionInfo}>
                    <View style={styles.walletHeader}>
                      <GSText variant="body" weight="semiBold">
                        {t('checkout.payment.providers.wallet.name')}
                      </GSText>
                      {walletInfo.canPay && (
                        <View style={[styles.recommendedBadge, { backgroundColor: theme.colors.success + '20' }]}>
                          <GSText variant="caption" color="success" weight="semiBold">
                            {t('checkout.payment.providers.wallet.recommended')}
                          </GSText>
                        </View>
                      )}
                    </View>
                    <GSText variant="caption" color="textSecondary">
                      {t('checkout.payment.providers.wallet.description')}
                    </GSText>
                    <View style={styles.walletBalanceRow}>
                      <GSText
                        variant="body"
                        weight="bold"
                        color={walletInfo.canPay ? 'success' : 'error'}
                      >
                        {formatPrice(walletInfo.balance)}
                      </GSText>
                      {!walletInfo.canPay && (
                        <GSText variant="caption" color="error" style={styles.insufficientText}>
                          {t('checkout.payment.providers.wallet.insufficient')}
                        </GSText>
                      )}
                    </View>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.radioButton,
                  {
                    borderColor: isWalletSelected
                      ? theme.colors.primary
                      : walletInfo.canPay
                      ? theme.colors.border
                      : theme.colors.error + '50',
                  },
                ]}
              >
                {isWalletSelected && (
                  <View
                    style={[
                      styles.radioButtonInner,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  />
                )}
              </View>
            </TouchableOpacity>
          )}

          {/* Divider */}
          {user && providers.length > 0 && (
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
              <GSText variant="caption" color="textSecondary" style={styles.dividerText}>
                {t('checkout.payment.orPayWith')}
              </GSText>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            </View>
          )}

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
                        {getProviderName(provider.id)}
                      </GSText>
                      <GSText variant="caption" color="textSecondary">
                        {getProviderDescription(provider.id)}
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
          🔒 {t('checkout.payment.securePayment')}
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
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  recommendedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  walletBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  insufficientText: {
    marginLeft: 4,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 12,
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
