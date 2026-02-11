import React, { useEffect, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { LiveStackParamList } from '../../navigation/LiveNavigator';

type LivePaymentWebViewRouteProp = RouteProp<LiveStackParamList, 'LivePaymentWebView'>;
type LivePaymentWebViewNavigationProp = NativeStackNavigationProp<LiveStackParamList, 'LivePaymentWebView'>;

function LivePaymentWebViewScreen() {
  const route = useRoute<LivePaymentWebViewRouteProp>();
  const navigation = useNavigation<LivePaymentWebViewNavigationProp>();
  const { paymentUrl, orderId, paymentId } = route.params;

  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      console.log('LivePaymentWebView mounted');
      console.log('paymentUrl:', paymentUrl);
      console.log('orderId:', orderId);
      console.log('paymentId:', paymentId);
      mountedRef.current = true;
    }

    return () => {
      console.log('LivePaymentWebView unmounting');
    };
  }, []);

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;

    if (url.includes('/callback/success') || url.includes('/payment/success')) {
      console.log('Payment SUCCESS detected (live checkout)');

      alert('Pago exitoso!\n\nTu orden ha sido creada.\nOrderId: ' + orderId);

      navigation.reset({
        index: 0,
        routes: [{ name: 'LiveMain' }],
      });
    } else if (url.includes('/callback/failure') || url.includes('/payment/failure')) {
      console.log('Payment FAILURE detected (live checkout)');
      alert('Pago fallido\n\nPor favor intenta de nuevo');
      navigation.goBack();
    } else if (url.includes('/callback/pending') || url.includes('/payment/pending')) {
      console.log('Payment PENDING detected (live checkout)');
      alert('Pago pendiente\n\nTe notificaremos cuando se confirme');
      navigation.goBack();
    }
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    alert('Error al cargar el pago: ' + nativeEvent.description);
  };

  const handleHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView HTTP error:', nativeEvent.statusCode, nativeEvent.description);
    alert(`Error HTTP: ${nativeEvent.statusCode}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: paymentUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        onError={handleError}
        onHttpError={handleHttpError}
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
    </SafeAreaView>
  );
}

export default React.memo(LivePaymentWebViewScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webview: {
    flex: 1,
  },
});
