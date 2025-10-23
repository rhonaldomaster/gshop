import React, { useState } from 'react';
import { WebView } from 'react-native-webview';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import GSText from '../../components/ui/GSText';

export default function PaymentWebViewScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { paymentUrl, orderId, paymentId } = route.params as any;

  const [loading, setLoading] = useState(true);

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;

    // Detect callback URLs
    if (url.includes('/payment/success')) {
      navigation.replace('OrderDetail', { orderId });
    } else if (url.includes('/payment/failure')) {
      navigation.replace('PaymentFailed', { orderId, paymentId });
    } else if (url.includes('/payment/pending')) {
      navigation.replace('PaymentPending', { orderId, paymentId });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: paymentUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        style={styles.webview}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6366F1" />
          <GSText variant="body" style={styles.loadingText}>
            Cargando pasarela de pago...
          </GSText>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
});
