import React, { useEffect, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { useCart } from '../../hooks/useCart';
import { CartStackParamList } from '../../navigation/CartNavigator';

type PaymentWebViewScreenRouteProp = RouteProp<CartStackParamList, 'PaymentWebView'>;
type PaymentWebViewScreenNavigationProp = NativeStackNavigationProp<CartStackParamList, 'PaymentWebView'>;

function PaymentWebViewScreen() {
  const route = useRoute<PaymentWebViewScreenRouteProp>();
  const navigation = useNavigation<PaymentWebViewScreenNavigationProp>();
  const { clearCart } = useCart();
  const { paymentUrl, orderId, paymentId } = route.params;

  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      console.log('💳 PaymentWebView mounted (ONCE)');
      console.log('📍 paymentUrl:', paymentUrl);
      console.log('📍 orderId:', orderId);
      console.log('📍 paymentId:', paymentId);
      mountedRef.current = true;
    }

    return () => {
      console.log('💳 PaymentWebView unmounting');
    };
  }, []);

  const handleNavigationStateChange = (navState: any) => {
    const { url, canGoBack, loading: isLoading, title } = navState;

    console.log('🌐 WebView navigation state changed:');
    console.log('  - URL:', url);
    console.log('  - Title:', title);
    console.log('  - canGoBack:', canGoBack);
    console.log('  - loading:', isLoading);

    // Log if URL contains important keywords
    if (url.includes('payment') || url.includes('pago') || url.includes('checkout')) {
      console.log('🔔 Payment-related URL detected:', url);
    }

    // Detect callback URLs (both old and new formats)
    if (url.includes('/callback/success') || url.includes('/payment/success')) {
      console.log('✅ Payment SUCCESS detected!');

      // Clear cart on successful payment
      clearCart(false).then(() => {
        console.log('🛒 Cart cleared after successful payment');
      });

      // TODO: Navigate to OrderDetail (not in CartNavigator yet)
      // For now, show success message and go back
      alert('¡Pago exitoso!\n\nTu orden ha sido creada.\nOrderId: ' + orderId);

      // Navigate back to main screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'CartMain' }],
      });
    } else if (url.includes('/callback/failure') || url.includes('/payment/failure')) {
      console.log('❌ Payment FAILURE detected');
      alert('Pago fallido\n\nPor favor intenta de nuevo');
      navigation.goBack();
    } else if (url.includes('/callback/pending') || url.includes('/payment/pending')) {
      console.log('⏳ Payment PENDING detected');
      alert('Pago pendiente\n\nTe notificaremos cuando se confirme');
      navigation.goBack();
    }
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('❌ WebView error:', nativeEvent);
    alert('Error al cargar el pago: ' + nativeEvent.description);
  };

  const handleHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('❌ WebView HTTP error:', nativeEvent.statusCode, nativeEvent.description);
    alert(`Error HTTP: ${nativeEvent.statusCode}`);
  };

  const handleMessage = (event: any) => {
    console.log('📨 Message from WebView:', event.nativeEvent.data);
  };

  const handleConsoleMessage = (event: any) => {
    const message = event.nativeEvent.message;
    console.log('🖥️ WebView Console:', message);
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: paymentUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={() => console.log('🔄 WebView started loading')}
        onLoadEnd={() => console.log('✅ WebView finished loading')}
        onError={handleError}
        onHttpError={handleHttpError}
        onMessage={handleMessage}
        onContentProcessDidTerminate={() => console.log('⚠️ WebView process terminated')}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        cacheEnabled={true}
        incognito={false}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        setSupportMultipleWindows={false}
        mixedContentMode="always"
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        originWhitelist={['*']}
        userAgent="Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
      />

      {/* Loading overlay removed - MercadoPago page loads fine without it */}
    </SafeAreaView>
  );
}

// Prevent unnecessary re-renders
export default React.memo(PaymentWebViewScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webview: {
    flex: 1,
  },
});
