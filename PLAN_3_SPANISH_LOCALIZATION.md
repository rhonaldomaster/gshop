# Plan 3: Localización a Español (i18n)

## 🎯 Objetivo
Cambiar todos los textos de la aplicación móvil de inglés a español, e implementar un sistema de internacionalización para facilitar traducciones futuras.

## 📋 Estado Actual
- ❌ Todos los textos hardcodeados en inglés
- ❌ No hay sistema de i18n
- ❌ Difícil mantener traducciones consistentes

## 🔧 Estrategia Recomendada

### Opción A: Reemplazo Directo (Rápido)
Cambiar todos los strings hardcodeados de inglés a español directamente en los componentes.

**Pros:**
- Rápido de implementar
- Sin dependencias adicionales
- Menos complejidad

**Contras:**
- Difícil de mantener
- No escalable a múltiples idiomas
- Textos dispersos en el código

### Opción B: Sistema i18n (Recomendado)
Implementar react-i18next para gestionar traducciones de forma centralizada.

**Pros:**
- Escalable a múltiples idiomas
- Fácil mantenimiento
- Traducciones centralizadas
- Cambio de idioma en runtime

**Contras:**
- Más tiempo inicial
- Nueva dependencia
- Refactor de componentes

## 📦 Implementación: Opción B (react-i18next)

### 1. Instalación de Dependencias

```bash
cd mobile
npm install i18next react-i18next
npm install @react-native-async-storage/async-storage  # Para persistencia
```

### 2. Estructura de Archivos

```
mobile/src/
├── i18n/
│   ├── index.ts                 # Configuración principal
│   ├── locales/
│   │   ├── es/                  # Español (default)
│   │   │   ├── common.json
│   │   │   ├── auth.json
│   │   │   ├── checkout.json
│   │   │   ├── products.json
│   │   │   ├── cart.json
│   │   │   └── profile.json
│   │   └── en/                  # Inglés (futuro)
│   │       └── ...
│   └── resources.ts             # Export de traducciones
```

### 3. Archivos de Traducción

**`mobile/src/i18n/locales/es/common.json`**
```json
{
  "app": {
    "name": "GSHOP"
  },
  "actions": {
    "continue": "Continuar",
    "back": "Atrás",
    "cancel": "Cancelar",
    "confirm": "Confirmar",
    "save": "Guardar",
    "delete": "Eliminar",
    "edit": "Editar",
    "search": "Buscar",
    "filter": "Filtrar",
    "sort": "Ordenar",
    "add": "Agregar",
    "remove": "Quitar",
    "view": "Ver",
    "close": "Cerrar",
    "done": "Hecho",
    "next": "Siguiente",
    "previous": "Anterior",
    "skip": "Saltar",
    "submit": "Enviar"
  },
  "status": {
    "loading": "Cargando...",
    "success": "Éxito",
    "error": "Error",
    "pending": "Pendiente",
    "completed": "Completado",
    "cancelled": "Cancelado"
  },
  "errors": {
    "generic": "Algo salió mal. Por favor intenta de nuevo.",
    "network": "Error de conexión. Verifica tu internet.",
    "notFound": "No encontrado",
    "unauthorized": "No autorizado",
    "required": "Este campo es requerido",
    "invalid": "Valor inválido"
  },
  "empty": {
    "noResults": "No se encontraron resultados",
    "noData": "No hay datos disponibles"
  }
}
```

**`mobile/src/i18n/locales/es/checkout.json`**
```json
{
  "title": "Checkout",
  "steps": {
    "shipping": "Envío",
    "delivery": "Entrega",
    "payment": "Pago",
    "review": "Revisar"
  },
  "shippingAddress": {
    "title": "Dirección de Envío",
    "usingDefault": "Usando tu dirección predeterminada",
    "firstName": "Nombre",
    "lastName": "Apellido",
    "address": "Dirección",
    "city": "Ciudad",
    "state": "Departamento",
    "postalCode": "Código Postal",
    "phone": "Teléfono",
    "documentType": "Tipo de Documento",
    "documentNumber": "Número de Documento",
    "continueToShipping": "Continuar a Envío"
  },
  "shippingOptions": {
    "title": "Opciones de Envío",
    "selectCarrier": "Selecciona una transportadora",
    "free": "Gratis",
    "deliveryIn": "Entrega en {{days}} día(s) hábil(es)",
    "continueToPayment": "Continuar a Pago",
    "errorLoading": "Error al cargar opciones de envío"
  },
  "payment": {
    "title": "Método de Pago",
    "selectMethod": "Selecciona un método de pago",
    "savedMethods": "Métodos Guardados",
    "newPayment": "Nuevo Método de Pago",
    "mercadopago": "MercadoPago",
    "mercadopagoDescription": "Paga con tarjeta de crédito/débito, PSE o efectivo",
    "continueToReview": "Continuar a Revisión"
  },
  "orderSummary": {
    "title": "Resumen del Pedido",
    "items": "artículos",
    "subtotal": "Subtotal",
    "shipping": "Envío",
    "tax": "Impuesto",
    "total": "Total",
    "placeOrder": "Realizar Pedido",
    "paymentMethod": "Método de Pago"
  },
  "alerts": {
    "emptyCart": "Carrito Vacío",
    "emptyCartMessage": "Tu carrito está vacío. Por favor agrega productos antes del checkout.",
    "orderPlaced": "¡Pedido Realizado!",
    "orderPlacedMessage": "Tu pedido #{{orderNumber}} ha sido creado exitosamente. Por favor completa el pago dentro de 30 minutos.",
    "viewOrder": "Ver Pedido",
    "orderFailed": "Pedido Fallido",
    "pleaseSelectShipping": "Por favor selecciona una opción de envío",
    "pleaseSelectPayment": "Por favor selecciona un método de pago"
  },
  "validation": {
    "missingInfo": "Información Faltante",
    "pleaseFill": "Por favor completa {{field}}"
  }
}
```

**`mobile/src/i18n/locales/es/cart.json`**
```json
{
  "title": "Carrito",
  "empty": {
    "title": "Tu carrito está vacío",
    "message": "Agrega algunos productos para comenzar",
    "action": "Explorar Productos"
  },
  "item": {
    "quantity": "Cantidad",
    "remove": "Quitar",
    "outOfStock": "Sin Stock"
  },
  "summary": {
    "subtotal": "Subtotal",
    "items": "artículos",
    "checkout": "Ir al Checkout"
  },
  "actions": {
    "addedToCart": "Agregado al Carrito",
    "removedFromCart": "Removido del Carrito",
    "clearCart": "Vaciar Carrito",
    "confirmClear": "¿Estás seguro de vaciar el carrito?"
  }
}
```

**`mobile/src/i18n/locales/es/auth.json`**
```json
{
  "login": {
    "title": "Iniciar Sesión",
    "email": "Correo Electrónico",
    "password": "Contraseña",
    "forgotPassword": "¿Olvidaste tu contraseña?",
    "submit": "Iniciar Sesión",
    "noAccount": "¿No tienes cuenta?",
    "signUp": "Regístrate",
    "errors": {
      "invalidCredentials": "Correo o contraseña incorrectos",
      "emailRequired": "El correo es requerido",
      "passwordRequired": "La contraseña es requerida"
    }
  },
  "register": {
    "title": "Crear Cuenta",
    "firstName": "Nombre",
    "lastName": "Apellido",
    "email": "Correo Electrónico",
    "password": "Contraseña",
    "confirmPassword": "Confirmar Contraseña",
    "submit": "Registrarse",
    "hasAccount": "¿Ya tienes cuenta?",
    "signIn": "Inicia Sesión",
    "errors": {
      "passwordMismatch": "Las contraseñas no coinciden",
      "emailInUse": "Este correo ya está en uso"
    }
  }
}
```

**`mobile/src/i18n/locales/es/products.json`**
```json
{
  "title": "Productos",
  "search": "Buscar productos...",
  "filters": "Filtros",
  "sort": {
    "label": "Ordenar por",
    "newest": "Más Nuevos",
    "popular": "Más Populares",
    "priceLowHigh": "Precio: Menor a Mayor",
    "priceHighLow": "Precio: Mayor a Menor"
  },
  "detail": {
    "description": "Descripción",
    "reviews": "Reseñas",
    "shipping": "Envío",
    "addToCart": "Agregar al Carrito",
    "buyNow": "Comprar Ahora",
    "outOfStock": "Sin Stock",
    "inStock": "En Stock"
  },
  "categories": "Categorías",
  "noProducts": "No se encontraron productos"
}
```

### 4. Configuración de i18next

**`mobile/src/i18n/resources.ts`**
```typescript
import commonES from './locales/es/common.json';
import authES from './locales/es/auth.json';
import checkoutES from './locales/es/checkout.json';
import productsES from './locales/es/products.json';
import cartES from './locales/es/cart.json';
import profileES from './locales/es/profile.json';

export const resources = {
  es: {
    common: commonES,
    auth: authES,
    checkout: checkoutES,
    products: productsES,
    cart: cartES,
    profile: profileES,
  },
  // Futuro: inglés
  // en: { ... }
};
```

**`mobile/src/i18n/index.ts`**
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resources } from './resources';

const LANGUAGE_DETECTOR = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const language = await AsyncStorage.getItem('@app_language');
      callback(language || 'es');
    } catch {
      callback('es');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem('@app_language', language);
    } catch {
      // Handle error
    }
  },
};

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources,
    fallbackLng: 'es',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
```

### 5. Integrar en App

**`mobile/App.tsx`**
```typescript
import './src/i18n'; // Importar ANTES de todo

function App() {
  // ... rest of app
}
```

### 6. Uso en Componentes

**Ejemplo: CheckoutScreen**
```typescript
import { useTranslation } from 'react-i18next';

export default function CheckoutScreen() {
  const { t } = useTranslation('checkout');

  return (
    <View>
      <GSText variant="h4" weight="bold">
        {t('title')}
      </GSText>

      <GSButton
        title={t('shippingAddress.continueToShipping')}
        onPress={handleNext}
      />

      <GSText variant="body">
        {t('orderSummary.items', { count: items.length })}
      </GSText>

      <Alert.alert(
        t('alerts.orderPlaced'),
        t('alerts.orderPlacedMessage', { orderNumber: order.orderNumber })
      );
    </View>
  );
}
```

**Ejemplo con interpolación:**
```typescript
// JSON: "deliveryIn": "Entrega en {{days}} día(s) hábil(es)"
{t('shippingOptions.deliveryIn', { days: option.estimatedDays })}
```

**Ejemplo con plurales:**
```typescript
// JSON
{
  "items_one": "{{count}} artículo",
  "items_other": "{{count}} artículos"
}

// Uso
{t('items', { count: itemCount })}
```

### 7. Helper Component para Traducciones Rápidas

**`mobile/src/components/ui/GSText.tsx`** (actualizado)
```typescript
interface GSTextProps extends TextProps {
  // ... existing props
  i18nKey?: string;
  i18nNS?: string;
  i18nParams?: Record<string, any>;
}

export default function GSText({
  children,
  i18nKey,
  i18nNS = 'common',
  i18nParams,
  ...props
}: GSTextProps) {
  const { t } = useTranslation(i18nNS);

  const text = i18nKey ? t(i18nKey, i18nParams) : children;

  return <Text {...textStyle}>{text}</Text>;
}

// Uso:
<GSText i18nKey="actions.continue" i18nNS="common" />
```

## 📝 Archivos a Traducir (Prioridad)

### Alta Prioridad 🔴
1. ✅ Checkout flow (4 pasos)
2. ✅ Cart
3. ✅ Auth (Login/Register)
4. ✅ Product detail
5. ✅ Navigation tabs

### Media Prioridad 🟡
6. Profile/Settings
7. Orders history
8. Search & Filters
9. Categories
10. Wishlist

### Baja Prioridad 🟢
11. Live streams
12. Affiliate dashboard
13. Analytics
14. Admin features

## 🔧 Script de Migración

Para ayudar con la traducción masiva:

**`mobile/scripts/extract-strings.js`**
```javascript
const fs = require('fs');
const path = require('path');

// Buscar todos los strings hardcodeados en componentes
// Generar lista de strings a traducir
// Output: strings-to-translate.json

// TODO: Implementar extractor automático
```

## 🧪 Testing

```typescript
// Cambiar idioma en runtime
import i18n from '../i18n';

i18n.changeLanguage('en'); // Cambiar a inglés
i18n.changeLanguage('es'); // Cambiar a español
```

## ⚙️ Variables de Entorno

```bash
# mobile/.env.development
DEFAULT_LANGUAGE=es
AVAILABLE_LANGUAGES=es,en
```

## 📊 Progreso de Traducción

**Crear archivo:** `mobile/src/i18n/TRANSLATION_STATUS.md`

```markdown
# Translation Progress

## Spanish (es) - 100%
- [x] common.json
- [x] auth.json
- [x] checkout.json
- [x] products.json
- [x] cart.json
- [ ] profile.json (pending)
- [ ] orders.json (pending)

## English (en) - 0%
- [ ] All files pending
```

## 🎯 Orden de Implementación

### Fase 1: Setup (2 horas)
1. ✅ Instalar dependencias
2. ✅ Crear estructura de carpetas
3. ✅ Configurar i18next
4. ✅ Crear archivos base de traducción

### Fase 2: Traducción Checkout (3 horas)
1. ✅ Traducir checkout.json
2. ✅ Actualizar CheckoutScreen
3. ✅ Actualizar PaymentMethodSelection
4. ✅ Testing completo del flujo

### Fase 3: Traducción Core (4 horas)
1. ✅ Traducir cart.json
2. ✅ Traducir auth.json
3. ✅ Traducir products.json
4. ✅ Actualizar componentes principales

### Fase 4: Traducción Completa (8 horas)
1. ✅ Traducir resto de pantallas
2. ✅ Revisar consistencia
3. ✅ Testing de toda la app

## ✨ Resultado Esperado

**Antes:**
```typescript
<GSText>Checkout</GSText>
<GSButton title="Continue to Payment" />
```

**Después:**
```typescript
<GSText>{t('checkout:title')}</GSText>
<GSButton title={t('checkout:shippingOptions.continueToPayment')} />
```

---

**Tiempo estimado total**: 15-20 horas
**Prioridad**: Alta 🔴
**Complejidad**: Media-Alta

## 📚 Recursos

- [react-i18next docs](https://react.i18next.com/)
- [i18next docs](https://www.i18next.com/)
- [Best practices](https://www.i18next.com/principles/best-practices)
