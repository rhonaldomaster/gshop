import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import {
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
  const { t } = useTranslation('translation');
  const { theme } = useTheme();

  // MercadoPago payment method
  const mercadoPagoMethod: PaymentMethod = {
    id: 'mercadopago',
    type: 'mercadopago',
    provider: 'MercadoPago',
    details: {},
    isDefault: false,
    createdAt: new Date().toISOString(),
  };

  // Auto-select MercadoPago on mount
  useEffect(() => {
    if (!selectedMethod) {
      onSelectMethod(mercadoPagoMethod);
    }
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

  return (
    <View style={styles.container}>
      <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
        {t('checkout.payment.title')}
      </GSText>

      {/* MercadoPago Payment Option */}
      <TouchableOpacity
        style={[
          styles.paymentOption,
          {
            borderColor: theme.colors.primary,
            backgroundColor: theme.colors.primary + '10',
          },
        ]}
        activeOpacity={1}
      >
        <View style={styles.paymentOptionContent}>
          <View style={styles.paymentOptionHeader}>
            <GSText variant="h2" style={styles.paymentIcon}>💵</GSText>
            <View style={styles.paymentOptionInfo}>
              <GSText variant="body" weight="semiBold">
                MercadoPago
              </GSText>
              <GSText variant="caption" color="textSecondary">
                {t('checkout.payment.mercadopagoDescription') || 'Pago seguro con MercadoPago'}
              </GSText>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.radioButton,
            {
              borderColor: theme.colors.primary,
            },
          ]}
        >
          <View
            style={[
              styles.radioButtonInner,
              { backgroundColor: theme.colors.primary },
            ]}
          />
        </View>
      </TouchableOpacity>

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
