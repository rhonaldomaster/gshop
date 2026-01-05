import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CardField, useConfirmPayment } from '@stripe/stripe-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { paymentsService } from '../../services/payments.service';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import { CartStackParamList } from '../../navigation/CartNavigator';

type StripeCardScreenRouteProp = RouteProp<CartStackParamList, 'StripeCard'>;
type StripeCardScreenNavigationProp = NativeStackNavigationProp<CartStackParamList, 'StripeCard'>;

const StripeCardScreen: React.FC = () => {
  const { t } = useTranslation('translation');
  const { theme } = useTheme();
  const navigation = useNavigation<StripeCardScreenNavigationProp>();
  const route = useRoute<StripeCardScreenRouteProp>();

  const { orderId, paymentId, amount } = route.params;

  const [cardComplete, setCardComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { confirmPayment, loading: confirmLoading } = useConfirmPayment();

  const handlePayment = async () => {
    if (!cardComplete) {
      Alert.alert(
        t('payment.invalidCard') || 'Tarjeta Inválida',
        t('payment.completeCardDetails') || 'Por favor completa los datos de la tarjeta'
      );
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Process payment on backend (creates PaymentIntent)
      const paymentResponse = await paymentsService.processStripePayment(paymentId);

      if (!paymentResponse.clientSecret) {
        throw new Error('No client secret received from backend');
      }

      // Step 2: Confirm payment with Stripe SDK (handles 3D Secure if needed)
      const { error, paymentIntent } = await confirmPayment(
        paymentResponse.clientSecret,
        {
          paymentMethodType: 'Card',
        }
      );

      if (error) {
        console.error('Payment confirmation error:', error);
        Alert.alert(
          t('payment.failed') || 'Pago Fallido',
          error.message || t('payment.tryAgain') || 'Hubo un error. Intenta de nuevo.'
        );
        setIsProcessing(false);
        return;
      }

      if (paymentIntent) {
        // Payment successful!
        Alert.alert(
          t('payment.success') || 'Pago Exitoso',
          t('payment.orderConfirmed') || 'Tu orden ha sido confirmada',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to order confirmation
                navigation.navigate('OrderConfirmation', {
                  orderId,
                  paymentId,
                });
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      Alert.alert(
        t('payment.error') || 'Error',
        error.message || t('payment.tryAgain') || 'Hubo un error procesando el pago'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <GSText variant="h3" weight="bold">
            {t('payment.cardDetails') || 'Detalles de Tarjeta'}
          </GSText>
          <GSText variant="caption" color="textSecondary" style={styles.headerSubtitle}>
            {t('payment.securePayment') || 'Pago seguro con encriptación'}
          </GSText>
        </View>

        {/* Amount Display */}
        <View style={[styles.amountCard, { backgroundColor: theme.colors.surface }]}>
          <GSText variant="caption" color="textSecondary">
            {t('payment.totalToPay') || 'Total a Pagar'}
          </GSText>
          <GSText variant="h2" weight="bold" style={styles.amountText}>
            ${amount.toLocaleString('es-CO')} COP
          </GSText>
        </View>

        {/* Card Input Field */}
        <View style={styles.cardFieldContainer}>
          <GSText variant="body" weight="semiBold" style={styles.fieldLabel}>
            {t('payment.cardInformation') || 'Información de Tarjeta'}
          </GSText>

          <CardField
            postalCodeEnabled={false}
            placeholders={{
              number: '4242 4242 4242 4242',
              expiry: 'MM/AA',
              cvc: 'CVC',
            }}
            cardStyle={{
              backgroundColor: theme.colors.background,
              textColor: theme.colors.text,
              placeholderColor: theme.colors.textSecondary,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: 8,
            }}
            style={styles.cardField}
            onCardChange={(cardDetails) => {
              setCardComplete(cardDetails.complete);
            }}
          />

          <GSText variant="caption" color="textSecondary" style={styles.helpText}>
            💳 {t('payment.acceptedCards') || 'Aceptamos Visa, Mastercard y American Express'}
          </GSText>
        </View>

        {/* Security Info */}
        <View style={[styles.securityInfo, { backgroundColor: theme.colors.surface }]}>
          <GSText variant="caption" color="textSecondary">
            🔒 {t('payment.secureInfo') || 'Tu información es procesada de forma segura. No almacenamos los datos de tu tarjeta.'}
          </GSText>
        </View>

        {/* Test Card Info (Development Only) */}
        {__DEV__ && (
          <View style={[styles.testInfo, { backgroundColor: '#FFF3CD', borderColor: '#FFC107' }]}>
            <GSText variant="caption" weight="semiBold" style={{ color: '#856404' }}>
              🧪 Test Mode
            </GSText>
            <GSText variant="caption" style={{ color: '#856404', marginTop: 4 }}>
              Test Card: 4242 4242 4242 4242
            </GSText>
            <GSText variant="caption" style={{ color: '#856404' }}>
              Expiry: Any future date • CVC: Any 3 digits
            </GSText>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { borderTopColor: theme.colors.border }]}>
        <GSButton
          title={t('common.cancel') || 'Cancelar'}
          onPress={() => navigation.goBack()}
          variant="outline"
          style={styles.cancelButton}
          disabled={isProcessing || confirmLoading}
        />
        <GSButton
          title={isProcessing || confirmLoading
            ? (t('payment.processing') || 'Procesando...')
            : (t('payment.payNow') || 'Pagar Ahora')
          }
          onPress={handlePayment}
          style={styles.payButton}
          disabled={!cardComplete || isProcessing || confirmLoading}
          loading={isProcessing || confirmLoading}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  headerSubtitle: {
    marginTop: 4,
  },
  amountCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  amountText: {
    marginTop: 4,
  },
  cardFieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    marginBottom: 8,
  },
  cardField: {
    height: 50,
    marginVertical: 10,
  },
  helpText: {
    marginTop: 8,
    lineHeight: 18,
  },
  securityInfo: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  testInfo: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
  },
  payButton: {
    flex: 2,
  },
});

export default StripeCardScreen;
