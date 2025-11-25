import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import {
  paymentsService,
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
} from '../../services/payments.service';

type PaymentScreenParams = {
  orderId: string;
  amount: number;
  currency: string;
  orderDetails?: any;
};

type PaymentScreenRouteProp = RouteProp<{ params: PaymentScreenParams }, 'params'>;

export default function PaymentScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation('translation');
  const route = useRoute<PaymentScreenRouteProp>();
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();

  const { orderId, amount, currency } = route.params;

  const [processing, setProcessing] = useState(false);

  // Handle MercadoPago payment
  const handleMercadoPagoPayment = useCallback(async () => {
    try {
      setProcessing(true);

      // Create payment request
      const paymentRequest: PaymentRequest = {
        orderId,
        amount,
        currency,
        paymentMethodId: 'mercadopago',
        guestPayment: !isAuthenticated,
      };

      // Create payment
      const payment = await paymentsService.createPayment(paymentRequest);

      // Process MercadoPago payment
      const result: PaymentResponse = await paymentsService.processMercadoPagoPayment(
        payment.paymentId,
        {}
      );

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
        // Handle redirect for MercadoPago
        Alert.alert(
          t('payments.completePayment'),
          t('payments.redirectToCompletePayment'),
          [
            {
              text: t('common.continue'),
              onPress: () => {
                // Navigate to payment webview
                // @ts-ignore
                navigation.navigate('PaymentWebView', {
                  url: result.redirectUrl,
                  orderId,
                });
              },
            },
          ]
        );
      } else {
        throw new Error(t('payments.paymentFailed'));
      }
    } catch (error: any) {
      console.error('Payment processing failed:', error);
      Alert.alert(
        t('payments.paymentFailed'),
        error.message || t('payments.paymentCouldNotBeProcessed')
      );
    } finally {
      setProcessing(false);
    }
  }, [orderId, amount, currency, isAuthenticated, navigation, t]);

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

        {/* Payment Method - MercadoPago Only */}
        <View style={styles.section}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            {t('profile.paymentMethods')}
          </GSText>

          <View
            style={[
              styles.paymentMethodCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.primary,
                borderWidth: 2,
              },
            ]}
          >
            <View style={styles.paymentMethodContent}>
              <View style={styles.paymentMethodIcon}>
                <Ionicons
                  name="wallet-outline"
                  size={24}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.paymentMethodInfo}>
                <GSText variant="body" weight="semiBold">
                  {t('payments.mercadoPagoWallet')}
                </GSText>
                <GSText variant="caption" color="textSecondary">
                  MercadoPago
                </GSText>
              </View>
            </View>
          </View>
        </View>

        {/* Payment Actions */}
        <View style={styles.paymentActions}>
          <GSButton
            title={`${t('payments.pay')} ${paymentsService.formatPrice(amount, currency)}`}
            onPress={handleMercadoPagoPayment}
            loading={processing}
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
});