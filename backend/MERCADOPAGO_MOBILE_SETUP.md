# MercadoPago Mobile Testing Setup

## Problema

MercadoPago NO acepta URLs `localhost` en `back_urls` debido a políticas de seguridad. Esto causa el error:
```
PA_UNAUTHORIZED_RESULT_FROM_POLICIES - At least one policy returned UNAUTHORIZED
```

## Solución para Testing

### Opción 1: Usar ngrok (Recomendado)

1. **Instalar ngrok**:
```bash
# macOS
brew install ngrok

# O descargar de https://ngrok.com/download
```

2. **Crear túnel público**:
```bash
# Exponer puerto 3001 (admin panel) que manejará los redirects
ngrok http 3001
```

Esto te dará una URL como: `https://abc123.ngrok-free.app`

3. **Configurar .env**:
```bash
# Cambiar APP_URL a la URL de ngrok
APP_URL=https://abc123.ngrok-free.app

# Opcional: También configura API_URL_PUBLIC para webhooks
API_URL_PUBLIC=https://abc123.ngrok-free.app
```

4. **Reiniciar backend**:
```bash
npm run start:dev
```

### Opción 2: Usar URLs de producción directamente

Si ya tienes tu app desplegada en producción:

```bash
APP_URL=https://gshop.com
API_URL_PUBLIC=https://api.gshop.com
```

## Flujo de Pago en Mobile

```
1. Usuario en Mobile App → Presiona "Pagar"
2. Backend crea preference con back_urls:
   - success: https://abc123.ngrok-free.app/payment/success?paymentId=xxx
   - failure: https://abc123.ngrok-free.app/payment/failure?paymentId=xxx

3. Mobile abre WebView con MercadoPago
4. Usuario completa pago en MercadoPago
5. MercadoPago redirige a: https://abc123.ngrok-free.app/payment/success
6. Tu servidor detecta el redirect y cierra el WebView
7. Mobile navega a OrderDetail screen
```

## Alternativa: Deep Links (Requiere configuración extra)

Para producción, puedes configurar deep links:

### 1. Crear página de redirect en admin panel

`admin-web/app/payment/success/page.tsx`:
```typescript
'use client';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('paymentId');

  useEffect(() => {
    // Redirect to mobile app via deep link
    const deepLink = `gshop://payment/success?paymentId=${paymentId}`;
    window.location.href = deepLink;

    // Fallback: Show success message if app not installed
    setTimeout(() => {
      document.body.innerHTML = '<h1>Pago Exitoso</h1><p>Vuelve a la app</p>';
    }, 1000);
  }, [paymentId]);

  return <div>Redirigiendo...</div>;
}
```

### 2. Configurar deep links en mobile

`mobile/app.json`:
```json
{
  "expo": {
    "scheme": "gshop",
    "ios": {
      "bundleIdentifier": "com.gshop.app"
    },
    "android": {
      "package": "com.gshop.app"
    }
  }
}
```

## Testing Checklist

- [ ] ngrok instalado y corriendo
- [ ] APP_URL en .env apunta a URL de ngrok
- [ ] Backend reiniciado
- [ ] Access token de MercadoPago es de TEST (empieza con TEST-)
- [ ] MERCAPAGO_ENVIRONMENT=sandbox
- [ ] Probar pago en mobile app

## Troubleshooting

### Error: "PA_UNAUTHORIZED_RESULT_FROM_POLICIES"

**Causas:**
- URLs localhost en back_urls → Usar ngrok
- Access token inválido → Verificar en MercadoPago dashboard
- Mezclando producción/sandbox → Verificar MERCAPAGO_ENVIRONMENT

### Error: "Invalid back_urls"

MercadoPago solo acepta:
- ✅ HTTPS URLs públicas
- ✅ HTTP localhost solo en desarrollo (limitado)
- ❌ Custom schemes (gshop://, exp://)
- ❌ localhost con HTTPS

### WebView no cierra después de pago

Verifica que `PaymentWebViewScreen.tsx` detecte las URLs correctamente:
```typescript
if (url.includes('/payment/success')) {
  navigation.replace('OrderDetail', { orderId });
}
```

## Producción

Para producción, debes:

1. **Configurar dominio público**:
```bash
APP_URL=https://app.gshop.com
API_URL=https://api.gshop.com
API_URL_PUBLIC=https://api.gshop.com
```

2. **Cambiar a credenciales de producción**:
```bash
MERCAPAGO_ACCESS_TOKEN=APP_USR-xxxx  # Access token de producción
MERCAPAGO_ENVIRONMENT=production
```

3. **Configurar webhook secret**:
```bash
MERCAPAGO_WEBHOOK_SECRET=tu-secret-desde-mercadopago-dashboard
```

4. **Verificar en MercadoPago dashboard** que las URLs estén whitelisted

## Referencias

- [MercadoPago Preferences API](https://www.mercadopago.com.co/developers/es/reference/preferences/_checkout_preferences/post)
- [ngrok Documentation](https://ngrok.com/docs)
- [Expo Deep Linking](https://docs.expo.dev/guides/linking/)
