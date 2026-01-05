import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { paymentsService } from '../../services/payments.service';
import GSText from '../../components/ui/GSText';
import { CartStackParamList } from '../../navigation/CartNavigator';
import { useCart } from '../../hooks/useCart';

type StripeCardScreenRouteProp = RouteProp<CartStackParamList, 'StripeCard'>;
type StripeCardScreenNavigationProp = NativeStackNavigationProp<CartStackParamList, 'StripeCard'>;

const StripeCardScreen: React.FC = () => {
  const { t } = useTranslation('translation');
  const { theme } = useTheme();
  const navigation = useNavigation<StripeCardScreenNavigationProp>();
  const route = useRoute<StripeCardScreenRouteProp>();
  const { clearCart } = useCart();

  const { orderId, paymentId, amount } = route.params;

  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  // Load Stripe Checkout Session on mount
  React.useEffect(() => {
    console.log('🎴 StripeCardScreen mounted');
    console.log('💰 Amount to charge:', amount);
    console.log('💳 Payment ID:', paymentId);

    loadStripeCheckout();
  }, []);

  const loadStripeCheckout = async () => {
    try {
      setIsLoading(true);
      console.log('📞 Calling backend to create Stripe Checkout Session...');

      // Call backend to create Stripe Checkout Session
      const response = await paymentsService.createStripeCheckoutSession(paymentId);

      console.log('✅ Stripe Checkout Session created:', {
        sessionId: response.sessionId,
        url: response.sessionUrl,
      });

      setCheckoutUrl(response.sessionUrl);
    } catch (error) {
      console.error('❌ Error loading Stripe checkout:', error);
      Alert.alert(
        t('payment.error'),
        t('payment.failedToLoad'),
        [
          {
            text: t('common.retry'),
            onPress: loadStripeCheckout,
          },
          {
            text: t('common.cancel'),
            onPress: () => navigation.goBack(),
            style: 'cancel',
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const { url } = navState;
    console.log('🌐 WebView navigated to:', url);

    // Check if user completed payment (success callback)
    if (url.includes('/callback/success')) {
      console.log('✅ Payment successful!');

      // Clear cart on successful payment
      clearCart(false).then(() => {
        console.log('🛒 Cart cleared after successful payment');
      });

      // Show success message and navigate back to main screen
      Alert.alert(
        t('payment.success'),
        `${t('payment.orderConfirmed')}\n\nOrder ID: ${orderId}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to cart main screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'CartMain' }],
              });
            },
          },
        ]
      );
      return;
    }

    // Check if user cancelled payment (failure callback)
    if (url.includes('/callback/failure')) {
      console.log('❌ Payment failed or cancelled');

      Alert.alert(
        t('payment.cancelled'),
        t('payment.tryAgain'),
        [
          {
            text: t('common.retry'),
            onPress: () => {
              // Reload the checkout
              loadStripeCheckout();
            },
          },
          {
            text: t('common.cancel'),
            onPress: () => navigation.goBack(),
            style: 'cancel',
          },
        ]
      );
      return;
    }

    // Check for pending payment callback
    if (url.includes('/callback/pending')) {
      console.log('⏳ Payment pending');

      Alert.alert(
        t('payment.pending'),
        t('payment.pendingMessage'),
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
      return;
    }
  };

  // Show loading spinner while creating checkout session
  if (isLoading || !checkoutUrl) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <GSText variant="body" color="textSecondary" style={styles.loadingText}>
            {t('payment.preparingCheckout')}
          </GSText>
          <GSText variant="caption" color="textSecondary" style={styles.amountText}>
            ${amount.toLocaleString('es-CO')} COP
          </GSText>
        </View>
      </SafeAreaView>
    );
  }

  // Show Stripe Checkout in WebView
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <WebView
        ref={webViewRef}
        source={{ uri: checkoutUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.webViewLoading}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('❌ WebView error:', nativeEvent);

          // Ignore connection refused errors for callback URLs
          // We already handle these via onNavigationStateChange
          if (nativeEvent.description?.includes('ERR_CONNECTION_REFUSED') &&
              nativeEvent.url?.includes('/callback/')) {
            console.log('⚠️ Ignoring expected connection error for callback URL');
            return;
          }

          // Show error for other cases
          Alert.alert(
            t('payment.error'),
            t('payment.webViewError'),
            [
              {
                text: t('common.retry'),
                onPress: loadStripeCheckout,
              },
              {
                text: t('common.cancel'),
                onPress: () => navigation.goBack(),
                style: 'cancel',
              },
            ]
          );
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView HTTP error:', nativeEvent.statusCode);
        }}
        // Allow opening external links (like 3D Secure authentication)
        onShouldStartLoadWithRequest={(request) => {
          console.log('🔗 WebView wants to load:', request.url);
          return true; // Allow all navigations
        }}
        // iOS: Allow inline media playback
        allowsInlineMediaPlayback
        // Security: Only allow HTTPS
        mixedContentMode="never"
      />
    </SafeAreaView>
  );
};

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
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  amountText: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '600',
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
});

export default StripeCardScreen;
