# Plan 2: Configurar Solo MercadoPago para Colombia

## 🎯 Objetivo
Deshabilitar todos los métodos de pago excepto MercadoPago, ya que es el único que se usará inicialmente en Colombia.

## 📋 Estado Actual
- ✅ Tres opciones de pago: MercadoPago, Stripe (Card), USDC (Crypto)
- ❌ Solo MercadoPago está configurado y funcionará en Colombia
- ❌ Stripe y USDC confunden al usuario

## 🔧 Cambios Necesarios

### 1. Mobile: PaymentMethodSelection Component
**Archivo:** `mobile/src/components/checkout/PaymentMethodSelection.tsx`

**Opción A: Eliminar opciones por completo** (Recomendado)
```typescript
// Líneas 74-108 - Reemplazar availablePaymentOptions

const availablePaymentOptions = [
  {
    id: 'mercadopago_new',
    type: 'mercadopago' as const,
    provider: 'MercadoPago',
    icon: '💵',
    description: 'Paga con tarjeta de crédito/débito, PSE o efectivo',
    isNew: true,
  },
];
```

**Opción B: Ocultar basado en región** (Más flexible)
```typescript
const availablePaymentOptions = [
  {
    id: 'mercadopago_new',
    type: 'mercadopago' as const,
    provider: 'MercadoPago',
    icon: '💵',
    description: 'Paga con tarjeta de crédito/débito, PSE o efectivo',
    isNew: true,
    regions: ['CO'], // Solo Colombia
  },
  {
    id: 'stripe_new',
    type: 'card' as const,
    provider: 'Tarjeta de Crédito/Débito',
    icon: '💳',
    description: 'Visa, Mastercard, American Express',
    isNew: true,
    regions: ['US', 'EU'], // Otros países
  },
  {
    id: 'crypto_new',
    type: 'crypto' as const,
    provider: 'USDC (Polygon)',
    icon: '₿',
    description: 'Paga con criptomonedas estables',
    isNew: true,
    regions: ['GLOBAL'], // Todos
  },
].filter(option => {
  // Filtrar por región del usuario o país de envío
  const userRegion = 'CO'; // TODO: Obtener de shippingAddress o user profile
  return option.regions.includes(userRegion) || option.regions.includes('GLOBAL');
});
```

### 2. Mobile: Agregar Region Context (Opción B)
**Archivo nuevo:** `mobile/src/contexts/RegionContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface RegionContextType {
  region: string;
  setRegion: (region: string) => void;
}

const RegionContext = createContext<RegionContextType>({
  region: 'CO',
  setRegion: () => {},
});

export const RegionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [region, setRegion] = useState<string>('CO'); // Default Colombia
  const { user } = useAuth();

  useEffect(() => {
    // Detectar región del usuario
    // Opción 1: De perfil de usuario
    // Opción 2: De IP geolocation
    // Opción 3: De dirección de envío

    if (user?.addresses && user.addresses.length > 0) {
      const defaultAddress = user.addresses.find(a => a.isDefault) || user.addresses[0];
      // Mapear país a código de región
      const countryToRegion: Record<string, string> = {
        'CO': 'CO',
        'Colombia': 'CO',
        'US': 'US',
        'United States': 'US',
        // ... más países
      };

      setRegion(countryToRegion[defaultAddress.country] || 'CO');
    }
  }, [user]);

  return (
    <RegionContext.Provider value={{ region, setRegion }}>
      {children}
    </RegionContext.Provider>
  );
};

export const useRegion = () => useContext(RegionContext);
```

**Integrar en App:**
```typescript
// App.tsx o navigation root
import { RegionProvider } from './contexts/RegionContext';

<AuthProvider>
  <RegionProvider>
    <CartProvider>
      {/* ... rest of app */}
    </CartProvider>
  </RegionProvider>
</AuthProvider>
```

### 3. Backend: Validación de Payment Method
**Archivo:** `backend/src/payments/payments-v2.service.ts`

```typescript
async createPayment(createPaymentDto: CreatePaymentV2Dto): Promise<PaymentV2> {
  // Validar que el método de pago esté permitido para la región
  const allowedMethods = this.getAllowedPaymentMethods(createPaymentDto.region || 'CO');

  if (!allowedMethods.includes(createPaymentDto.paymentMethod)) {
    throw new BadRequestException(
      `Payment method ${createPaymentDto.paymentMethod} is not available in this region`
    );
  }

  // ... rest of method
}

private getAllowedPaymentMethods(region: string): PaymentMethod[] {
  const methodsByRegion: Record<string, PaymentMethod[]> = {
    'CO': [PaymentMethod.MERCADOPAGO],
    'US': [PaymentMethod.STRIPE_CARD, PaymentMethod.USDC_POLYGON],
    'EU': [PaymentMethod.STRIPE_CARD],
    'GLOBAL': [PaymentMethod.USDC_POLYGON],
  };

  return methodsByRegion[region] || [PaymentMethod.MERCADOPAGO];
}
```

### 4. Backend: Configuration Service (Más escalable)
**Archivo nuevo:** `backend/src/config/payment-methods.config.ts`

```typescript
export interface PaymentMethodConfig {
  method: string;
  enabled: boolean;
  regions: string[];
  displayName: string;
  description: string;
  icon: string;
  testMode: boolean;
}

export const PAYMENT_METHODS_CONFIG: PaymentMethodConfig[] = [
  {
    method: 'mercadopago',
    enabled: true,
    regions: ['CO', 'AR', 'BR', 'CL', 'MX', 'UY'], // Países de LATAM
    displayName: 'MercadoPago',
    description: 'Tarjeta de crédito/débito, PSE, efectivo',
    icon: '💵',
    testMode: process.env.MERCAPAGO_TEST_MODE === 'true',
  },
  {
    method: 'stripe_card',
    enabled: false, // Deshabilitado por ahora
    regions: ['US', 'CA', 'EU'],
    displayName: 'Tarjeta de Crédito/Débito',
    description: 'Visa, Mastercard, American Express',
    icon: '💳',
    testMode: process.env.STRIPE_TEST_MODE === 'true',
  },
  {
    method: 'usdc_polygon',
    enabled: false, // Deshabilitado por ahora
    regions: ['GLOBAL'],
    displayName: 'USDC (Criptomoneda)',
    description: 'Paga con stablecoins en Polygon',
    icon: '₿',
    testMode: false,
  },
];

export function getAvailablePaymentMethods(region: string): PaymentMethodConfig[] {
  return PAYMENT_METHODS_CONFIG.filter(
    config => config.enabled &&
    (config.regions.includes(region) || config.regions.includes('GLOBAL'))
  );
}
```

**Endpoint para obtener métodos permitidos:**
```typescript
// payments-v2.controller.ts
@Get('available-methods')
async getAvailablePaymentMethods(@Query('region') region: string = 'CO') {
  return getAvailablePaymentMethods(region);
}
```

### 5. Mobile: Cargar Métodos Dinámicamente
**Archivo:** `mobile/src/components/checkout/PaymentMethodSelection.tsx`

```typescript
const [availableOptions, setAvailableOptions] = useState<PaymentOption[]>([]);
const getAvailableMethodsApi = useApi(paymentsService.getAvailablePaymentMethods);

useEffect(() => {
  const loadAvailableMethods = async () => {
    try {
      const region = 'CO'; // O usar useRegion()
      const methods = await getAvailableMethodsApi.execute(region);

      // Mapear backend response a opciones de UI
      const options = methods.map(m => ({
        id: `${m.method}_new`,
        type: m.method,
        provider: m.displayName,
        icon: m.icon,
        description: m.description,
        isNew: true,
      }));

      setAvailableOptions(options);
    } catch (error) {
      console.error('Failed to load payment methods:', error);
      // Fallback a solo MercadoPago
      setAvailableOptions([{
        id: 'mercadopago_new',
        type: 'mercadopago',
        provider: 'MercadoPago',
        icon: '💵',
        description: 'Paga con tarjeta de crédito/débito, PSE o efectivo',
        isNew: true,
      }]);
    }
  };

  loadAvailableMethods();
}, []);
```

## 📝 Recomendación: Enfoque Simple (Inicio)

Para el MVP inicial, **Opción A** es la mejor:

1. Hardcodear solo MercadoPago en mobile
2. Backend valida que solo se use MercadoPago
3. Más adelante, migrar a configuración dinámica

**Cambios mínimos:**

### Mobile (1 archivo)
```typescript
// PaymentMethodSelection.tsx - Línea 74
const availablePaymentOptions = [
  {
    id: 'mercadopago_new',
    type: 'mercadopago' as const,
    provider: 'MercadoPago',
    icon: '💵',
    description: 'Paga con tarjeta de crédito/débito, PSE o efectivo',
    isNew: true,
  },
];
```

### Backend (1 archivo)
```typescript
// payments-v2.service.ts - Agregar validación
async createPayment(dto: CreatePaymentV2Dto): Promise<PaymentV2> {
  // Validar solo MercadoPago por ahora
  if (dto.paymentMethod !== PaymentMethod.MERCADOPAGO) {
    throw new BadRequestException(
      'Solo MercadoPago está disponible en este momento'
    );
  }

  // ... rest of method
}
```

## 🎯 Orden de Implementación (Opción A - Simple)

1. ✅ Mobile: Actualizar `availablePaymentOptions` array (1 línea)
2. ✅ Backend: Agregar validación en `createPayment()` (3 líneas)
3. ✅ Testing: Verificar que solo aparece MercadoPago

## 🎯 Orden de Implementación (Opción B - Escalable)

1. ✅ Backend: Crear `payment-methods.config.ts`
2. ✅ Backend: Agregar endpoint `GET /available-methods`
3. ✅ Backend: Actualizar validación en `createPayment()`
4. ✅ Mobile: Crear `RegionContext`
5. ✅ Mobile: Actualizar `PaymentMethodSelection` para cargar dinámicamente
6. ✅ Testing: Verificar con diferentes regiones

## ⚙️ Variables de Entorno

```bash
# .env
MERCAPAGO_TEST_MODE=true  # Para desarrollo
PAYMENT_METHODS_REGION_LOCK=CO  # Forzar solo Colombia

# mobile/.env.development
REGION=CO
```

## ✨ Resultado Esperado

**Antes:**
- 💵 MercadoPago
- 💳 Tarjeta (Stripe)
- ₿ USDC (Crypto)

**Después:**
- 💵 MercadoPago

---

**Tiempo estimado**:
- Opción A: 30 minutos ⚡
- Opción B: 2-3 horas

**Prioridad**: Media 🟡
**Complejidad**: Baja (A) / Media (B)
