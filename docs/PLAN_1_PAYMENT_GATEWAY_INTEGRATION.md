# Plan 1: Integración de Flujo de Pago con Pasarela

## 🎯 Objetivo
Implementar el flujo completo de pago para que al seleccionar un método de pago y confirmar la orden, se ejecute automáticamente la pasarela de pago correspondiente.

## 📋 Estado Actual
- ✅ Checkout de 4 pasos funcional
- ✅ Creación de order y payment record en DB
- ✅ Payment expiration (30 minutos)
- ❌ No se ejecuta la pasarela de pago
- ❌ Usuario no es redirigido a completar el pago
- ❌ No hay procesamiento real del pago

## 🔧 Cambios Necesarios

### 1. Backend: MercadoPago Payment Processing
**Archivos a modificar:**
- `backend/src/payments/payments-v2.service.ts`
- `backend/src/payments/mercadopago.service.ts`

**Implementación:**
```typescript
// payments-v2.service.ts
async createPayment(dto: CreatePaymentV2Dto): Promise<PaymentV2> {
  const payment = this.paymentRepository.create(dto);

  // Set expiration
  const expirationTime = new Date();
  expirationTime.setMinutes(expirationTime.getMinutes() + 30);
  payment.expiresAt = expirationTime;

  const savedPayment = await this.paymentRepository.save(payment);

  // NUEVO: Iniciar flujo de pago según método
  if (dto.paymentMethod === PaymentMethod.MERCADOPAGO) {
    await this.initiateMercadoPagoPayment(savedPayment);
  }

  return savedPayment;
}

async initiateMercadoPagoPayment(payment: PaymentV2): Promise<string> {
  // Crear preferencia de pago en MercadoPago
  const preference = await this.mercadopagoService.createPreference({
    items: [{
      title: `Order ${payment.orderId}`,
      quantity: 1,
      currency_id: 'COP',
      unit_price: Number(payment.amount),
    }],
    back_urls: {
      success: `${process.env.APP_URL}/payment/success?paymentId=${payment.id}`,
      failure: `${process.env.APP_URL}/payment/failure?paymentId=${payment.id}`,
      pending: `${process.env.APP_URL}/payment/pending?paymentId=${payment.id}`,
    },
    auto_return: 'approved',
    external_reference: payment.id,
    notification_url: `${process.env.API_URL}/api/v1/payments-v2/webhooks/mercadopago`,
  });

  // Guardar referencia de MercadoPago
  payment.paymentMetadata = {
    mercadopago_preference_id: preference.id,
    mercadopago_init_point: preference.init_point,
  };

  await this.paymentRepository.save(payment);

  return preference.init_point; // URL de pago
}
```

**DTO Update:**
```typescript
// payments-v2.entity.ts
export class PaymentV2 {
  // ... existing fields

  @Column({ nullable: true })
  mercadopagoPreferenceId: string;

  @Column({ nullable: true })
  mercadopagoPaymentId: string;
}
```

### 2. Backend: Webhook Handler
**Archivo:** `backend/src/payments/payments-v2.controller.ts`

```typescript
@Post('webhooks/mercadopago')
async handleMercadoPagoWebhook(@Body() body: any, @Headers() headers: any) {
  console.log('MercadoPago Webhook:', body);

  // Verificar que sea del tipo correcto
  if (body.type === 'payment') {
    const paymentId = body.data.id;

    // Buscar info del pago en MercadoPago
    const mpPayment = await this.mercadopagoService.getPayment(paymentId);

    // Buscar nuestro payment por external_reference
    const payment = await this.paymentsV2Service.getPaymentByExternalRef(
      mpPayment.external_reference
    );

    if (!payment) {
      return { received: true, status: 'payment_not_found' };
    }

    // Actualizar estado según status de MercadoPago
    switch (mpPayment.status) {
      case 'approved':
        payment.status = PaymentStatus.COMPLETED;
        payment.processedAt = new Date();
        payment.mercadopagoPaymentId = paymentId;

        // Actualizar orden a 'confirmed'
        await this.ordersService.updateOrderStatus(
          payment.orderId,
          OrderStatus.CONFIRMED
        );
        break;

      case 'rejected':
      case 'cancelled':
        payment.status = PaymentStatus.FAILED;
        payment.failureReason = mpPayment.status_detail;
        break;

      case 'in_process':
      case 'pending':
        payment.status = PaymentStatus.PROCESSING;
        break;
    }

    await this.paymentRepository.save(payment);
  }

  return { received: true };
}
```

### 3. Mobile: Response con Payment URL
**Archivo:** `mobile/src/services/payments.service.ts`

```typescript
export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  status: PaymentStatus;
  paymentUrl?: string;  // NUEVO: URL para redirigir al pago
  redirectUrl?: string; // Alias
  transactionId?: string;
  receipt?: PaymentReceipt;
}
```

### 4. Mobile: WebView para Pago
**Archivo nuevo:** `mobile/src/screens/payment/PaymentWebViewScreen.tsx`

```typescript
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

    // Detectar URLs de callback
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
```

### 5. Mobile: Actualizar CheckoutScreen
**Archivo:** `mobile/src/screens/checkout/CheckoutScreen.tsx`

```typescript
// En handlePlaceOrder, después de crear el payment:
const payment = await createPaymentApi.execute(paymentRequest);

if (!payment) {
  throw new Error('Failed to create payment');
}

// Step 5: Redirigir a WebView si hay payment URL
await clearCart(false);

if (payment.paymentUrl || payment.paymentMetadata?.mercadopago_init_point) {
  const paymentUrl = payment.paymentUrl || payment.paymentMetadata.mercadopago_init_point;

  // Navegar a WebView de pago
  (navigation as any).navigate('PaymentWebView', {
    paymentUrl,
    orderId: order.id,
    paymentId: payment.id,
  });
} else {
  // Fallback: mostrar alert
  Alert.alert(
    'Orden Creada',
    `Orden #${order.orderNumber} creada. Complete el pago dentro de 30 minutos.`,
    [
      {
        text: 'Ver Orden',
        onPress: () => {
          (navigation as any).navigate('OrderDetail', { orderId: order.id });
        },
      },
    ]
  );
}
```

### 6. Mobile: Navigation Setup
**Archivo:** `mobile/src/navigation/CartNavigator.tsx`

```typescript
import PaymentWebViewScreen from '../screens/payment/PaymentWebViewScreen';

// Agregar a Stack.Navigator:
<Stack.Screen
  name="PaymentWebView"
  component={PaymentWebViewScreen}
  options={{
    title: 'Pago',
    headerShown: true,
  }}
/>
```

## 📦 Dependencias Necesarias

### Mobile
```bash
npm install react-native-webview
```

### Backend
Ya está instalado MercadoPago SDK:
```json
{
  "dependencies": {
    "mercadopago": "^1.5.14"
  }
}
```

## 🔐 Variables de Entorno

### Backend `.env`
```bash
# MercadoPago
MERCAPAGO_ACCESS_TOKEN=APP_USR-your-access-token
MERCAPAGO_PUBLIC_KEY=APP_USR-your-public-key

# Callback URLs
APP_URL=http://localhost:19006  # Para mobile dev
API_URL=http://localhost:3000
```

## 🧪 Testing

1. **Dev Mode**: Usar credenciales de prueba de MercadoPago
2. **Test Cards**:
   - Aprobado: 5031 7557 3453 0604
   - Rechazado: 5031 4332 1540 6351

## ⚠️ Consideraciones

1. **Seguridad**: Nunca exponer Access Token en frontend
2. **Webhooks**: Configurar URL pública para webhooks en producción
3. **Timeout**: Payment expiration ya está implementado (30 min)
4. **Error Handling**: Manejar todos los estados de pago
5. **Deep Links**: Para callback desde WebView a app nativa

## 📝 Orden de Implementación

1. ✅ Backend: Agregar campos a PaymentV2 entity
2. ✅ Backend: Implementar `initiateMercadoPagoPayment()`
3. ✅ Backend: Actualizar webhook handler
4. ✅ Mobile: Instalar react-native-webview
5. ✅ Mobile: Crear PaymentWebViewScreen
6. ✅ Mobile: Actualizar CheckoutScreen con redirección
7. ✅ Mobile: Agregar rutas de navegación
8. ✅ Testing: Probar flujo completo con tarjetas de prueba

## ✨ Resultado Esperado

```
Usuario completa checkout
  → Payment record creado con URL de pago
  → Redirigido a WebView con MercadoPago
  → Usuario completa pago en MercadoPago
  → Webhook recibido → Payment status updated
  → Usuario redirigido a OrderDetail
  → ✅ Orden confirmada y pagada
```

---

**Tiempo estimado**: 4-6 horas
**Prioridad**: Alta 🔴
**Complejidad**: Media
