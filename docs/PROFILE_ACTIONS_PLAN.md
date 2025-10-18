# 👤 Profile Screen Actions Implementation Plan

## 🎯 Objetivo
Implementar todas las pantallas y funcionalidades accesibles desde el Profile screen, incluyendo orders, wishlist, payment methods, addresses, notifications, support y settings.

---

## 📋 Estado Actual

### ✅ Ya Implementado:
- ProfileScreen con UI completa
- Menu items configurados (7 items)
- Avatar upload button
- Edit profile button
- Quick stats (Cart, Orders, Wishlist)
- Logout functionality

### ✅ Pantallas Completadas (100%):
- ✅ **OrdersScreen** - Listado de órdenes con filtros por status, images fixed
- ✅ **OrderTrackingScreen** - Detalles y seguimiento de órdenes
- ✅ **WishlistScreen** - Productos guardados con funcionalidad completa
- ✅ **PaymentMethodsScreen** - Gestión de métodos de pago
- ✅ **AddressBookScreen** - Gestión de direcciones de envío
- ✅ **NotificationsScreen** - Lista con filtros All/Unread, mark as read *(NUEVO)*
- ✅ **SupportScreen** - FAQ accordion, contacto, submit tickets *(NUEVO)*
- ✅ **EditProfileScreen** - Editar perfil con avatar picker *(NUEVO)*
- ✅ **SettingsScreen** - Account, Notifications, Privacy, About *(NUEVO)*

### ⏳ Por Mejorar:
- Backend integration para notifications y support tickets
- Persistence de settings en AsyncStorage
- Email/SMS verification flows

---

## 📋 Menu Items del Profile

```typescript
const menuItems = [
  { icon: 'bag-outline', title: 'My Orders', screen: 'Orders' },
  { icon: 'heart-outline', title: 'Wishlist', screen: 'Wishlist' },
  { icon: 'card-outline', title: 'Payment Methods', screen: 'PaymentMethods' },
  { icon: 'location-outline', title: 'Addresses', screen: 'Addresses' },
  { icon: 'notifications-outline', title: 'Notifications', screen: 'Notifications' },
  { icon: 'help-circle-outline', title: 'Help & Support', screen: 'Support' },
  { icon: 'settings-outline', title: 'Settings', screen: 'Settings' },
];
```

---

## 📋 Checklist de Implementación

### 1. 🛍️ My Orders Screen
**Status:** ✅ Completado
**Archivos:** `OrdersScreen.tsx` (existe), `orders.service.ts` (existe)

#### Tareas:
- [x] Crear `src/screens/orders/OrdersScreen.tsx`
- [ ] Listar órdenes del usuario (paginadas)
- [ ] Tabs: All, Pending, Shipped, Delivered, Cancelled
- [ ] Card de orden con:
  - Order ID y fecha
  - Productos (mini thumbnails)
  - Total amount
  - Status badge
  - Track button
- [ ] Navegación a OrderDetailScreen
- [ ] Pull to refresh
- [ ] Empty state

#### Diseño:
```
┌─────────────────────────────┐
│ My Orders                   │
├─────────────────────────────┤
│ [All][Pending][Shipped]...  │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ Order #12345            │ │
│ │ Dec 15, 2024            │ │
│ │ ┌──┐┌──┐┌──┐           │ │
│ │ │📱││💻││👕│           │ │
│ │ └──┘└──┘└──┘           │ │
│ │ Total: $1,999,999      │ │
│ │ [🟢 Delivered]  [Track]│ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

#### Código:
```typescript
export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const navigation = useNavigation();

  useEffect(() => {
    loadOrders(activeTab);
  }, [activeTab]);

  const loadOrders = async (status: string) => {
    const data = await ordersService.getUserOrders({ status });
    setOrders(data);
  };

  const handleOrderPress = (order: Order) => {
    navigation.navigate('OrderDetail', { orderId: order.id });
  };

  return (
    <SafeAreaView>
      {/* Tabs */}
      <OrderTabs active={activeTab} onChange={setActiveTab} />

      {/* Orders List */}
      <FlatList
        data={orders}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => handleOrderPress(item)}
          />
        )}
        refreshing={loading}
        onRefresh={() => loadOrders(activeTab)}
      />
    </SafeAreaView>
  );
}
```

---

### 2. 💝 Wishlist Screen
**Status:** ⏳ Pendiente
**Archivos:** `WishlistScreen.tsx` (crear), `wishlist.service.ts` (crear)

#### Tareas:
- [ ] Crear `src/screens/wishlist/WishlistScreen.tsx`
- [ ] Crear `src/services/wishlist.service.ts`
- [ ] Grid de productos guardados
- [ ] Botón "Add to Cart" en cada item
- [ ] Botón "Remove from Wishlist"
- [ ] Share wishlist functionality
- [ ] Empty state
- [ ] Price drop notifications badge

#### Backend Endpoints:
```
GET    /api/v1/wishlist
POST   /api/v1/wishlist/items
DELETE /api/v1/wishlist/items/:productId
POST   /api/v1/wishlist/add-to-cart/:productId
```

#### Código:
```typescript
class WishlistService {
  async getWishlist(): Promise<Product[]> {
    const response = await apiClient.get('/wishlist');
    return response.data;
  }

  async addItem(productId: string) {
    await apiClient.post('/wishlist/items', { productId });
  }

  async removeItem(productId: string) {
    await apiClient.delete(`/wishlist/items/${productId}`);
  }

  async addToCart(productId: string, quantity: number = 1) {
    await apiClient.post(`/wishlist/add-to-cart/${productId}`, { quantity });
  }
}
```

---

### 3. 💳 Payment Methods Screen
**Status:** ⏳ Pendiente
**Archivos:** `PaymentMethodsScreen.tsx` (crear), `AddPaymentMethodScreen.tsx` (crear)

#### Tareas:
- [ ] Crear `PaymentMethodsScreen.tsx`
- [ ] Listar payment methods guardados
- [ ] Cards con últimos 4 dígitos enmascarados
- [ ] Set default payment method
- [ ] Delete payment method
- [ ] Add new payment method
- [ ] Support: Cards, Bank accounts, Digital wallets

#### Diseño:
```
┌─────────────────────────────┐
│ Payment Methods             │
│                   [+ Add]   │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 💳 Visa •••• 4242       │ │
│ │ Expires 12/25           │ │
│ │ [Default] [Remove]      │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 💳 Mastercard •••• 5555 │ │
│ │ Expires 06/26           │ │
│ │ [Set Default] [Remove]  │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

#### Backend Endpoints:
```
GET    /api/v1/payment-methods
POST   /api/v1/payment-methods
PUT    /api/v1/payment-methods/:id/default
DELETE /api/v1/payment-methods/:id
```

---

### 4. 📍 Addresses Screen
**Status:** ⏳ Pendiente
**Archivos:** `AddressesScreen.tsx` (crear), `AddEditAddressScreen.tsx` (crear)

#### Tareas:
- [ ] Crear `AddressesScreen.tsx`
- [ ] Listar shipping addresses guardadas
- [ ] Address card con información completa
- [ ] Set default address
- [ ] Edit address
- [ ] Delete address
- [ ] Add new address
- [ ] Address validation (Google Places API)

#### Diseño:
```
┌─────────────────────────────┐
│ Shipping Addresses          │
│                   [+ Add]   │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 🏠 Home                 │ │
│ │ San Martín 567          │ │
│ │ Córdoba, Córdoba 5000   │ │
│ │ Argentina               │ │
│ │ [Default] [Edit] [Del]  │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 💼 Work                 │ │
│ │ Av. Corrientes 1234     │ │
│ │ Buenos Aires, CABA 1043 │ │
│ │ [Set Default] [Edit]    │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

#### Formulario de Address:
```typescript
interface AddressForm {
  label: string; // Home, Work, Other
  firstName: string;
  lastName: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}
```

---

### 5. 🔔 Notifications Screen
**Status:** ⏳ Pendiente
**Archivos:** `NotificationsScreen.tsx` (crear), `notifications.service.ts` (ya existe)

#### Tareas:
- [ ] Crear `NotificationsScreen.tsx`
- [ ] Listar notificaciones del usuario
- [ ] Tipos: Order updates, Promotions, System
- [ ] Mark as read/unread
- [ ] Delete notification
- [ ] Settings toggle para cada tipo
- [ ] Badge con contador de no leídas

#### Diseño:
```
┌─────────────────────────────┐
│ Notifications      [⚙️]     │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 🔵 Order Shipped        │ │
│ │ Your order #12345 has   │ │
│ │ been shipped            │ │
│ │ 2 hours ago             │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 🎉 Special Offer        │ │
│ │ 50% off on electronics! │ │
│ │ Yesterday               │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

#### Settings (Modal):
```
☑️ Order Updates
☑️ Promotions & Offers
☑️ New Arrivals
☐ Price Drops
☑️ System Updates
```

---

### 6. 🆘 Help & Support Screen
**Status:** ⏳ Pendiente
**Archivos:** `SupportScreen.tsx` (crear)

#### Tareas:
- [ ] Crear `SupportScreen.tsx`
- [ ] FAQ section (accordion)
- [ ] Contact options: Email, Phone, Chat
- [ ] Submit a ticket form
- [ ] Order-specific help
- [ ] Returns & Refunds guide
- [ ] Shipping information
- [ ] Payment issues
- [ ] Link to Terms & Privacy

#### Diseño:
```
┌─────────────────────────────┐
│ Help & Support              │
├─────────────────────────────┤
│ 📞 Contact Us               │
│ ┌─────────────────────────┐ │
│ │ 📧 Email Support        │ │
│ │ 💬 Live Chat            │ │
│ │ ☎️ Call: +54 11 1234   │ │
│ └─────────────────────────┘ │
│                             │
│ ❓ Frequently Asked         │
│ ┌─────────────────────────┐ │
│ │ > How do I track...     │ │
│ │ > How do I return...    │ │
│ │ > Payment methods...    │ │
│ └─────────────────────────┘ │
│                             │
│ 📝 Submit a Ticket          │
└─────────────────────────────┘
```

#### FAQs de Ejemplo:
```typescript
const faqs = [
  {
    question: 'How do I track my order?',
    answer: 'You can track your order from...'
  },
  {
    question: 'What is your return policy?',
    answer: 'We accept returns within 30 days...'
  },
  {
    question: 'How long does shipping take?',
    answer: 'Standard shipping takes 5-7 business days...'
  }
];
```

---

### 7. ⚙️ Settings Screen
**Status:** ⏳ Pendiente
**Archivos:** `SettingsScreen.tsx` (crear)

#### Tareas:
- [ ] Crear `SettingsScreen.tsx`
- [ ] Account settings
- [ ] Notification preferences
- [ ] App preferences (theme, language)
- [ ] Privacy settings
- [ ] Data & Storage
- [ ] About app (version, licenses)
- [ ] Logout button

#### Diseño:
```
┌─────────────────────────────┐
│ Settings                    │
├─────────────────────────────┤
│ Account                     │
│ > Edit Profile              │
│ > Change Password           │
│ > Email Preferences         │
│                             │
│ App Preferences             │
│ > Theme          [Auto ▼]   │
│ > Language       [EN ▼]     │
│ > Currency       [USD ▼]    │
│                             │
│ Privacy                     │
│ > Privacy Policy            │
│ > Terms of Service          │
│ > Delete Account            │
│                             │
│ About                       │
│ > Version 1.0.0             │
│ > Licenses                  │
│                             │
│ [Sign Out]                  │
└─────────────────────────────┘
```

#### Settings State:
```typescript
interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'es' | 'pt';
  currency: 'USD' | 'ARS' | 'BRL';
  notifications: {
    orders: boolean;
    promotions: boolean;
    newArrivals: boolean;
    priceDrops: boolean;
  };
  privacy: {
    analytics: boolean;
    personalization: boolean;
  };
}
```

---

### 8. 📝 Edit Profile Screen
**Status:** ⏳ Pendiente
**Archivos:** `EditProfileScreen.tsx` (crear)

#### Tareas:
- [ ] Crear `EditProfileScreen.tsx`
- [ ] Form fields: firstName, lastName, email, phone
- [ ] Avatar upload functionality
- [ ] Email verification flow
- [ ] Phone verification (SMS)
- [ ] Form validation
- [ ] Save changes to backend

#### Form:
```
┌─────────────────────────────┐
│ Edit Profile       [Save]   │
├─────────────────────────────┤
│        ┌────┐               │
│        │ 📷 │               │
│        └────┘               │
│     Change Photo            │
│                             │
│ First Name                  │
│ [John                    ]  │
│                             │
│ Last Name                   │
│ [Doe                     ]  │
│                             │
│ Email                       │
│ [john@doe.com         ] ✅  │
│                             │
│ Phone                       │
│ [+54 11 1234 5678     ] ✅  │
│                             │
│ Bio (optional)              │
│ [                        ]  │
└─────────────────────────────┘
```

---

## 🎯 Orden de Implementación

### Fase 1: Orders & Wishlist (3-4 horas)
1. 🔧 OrdersScreen con listado
2. 🔧 OrderDetailScreen
3. 🔧 WishlistScreen
4. 🔧 Wishlist service

### Fase 2: Payment & Addresses (3-4 horas)
1. 🔧 PaymentMethodsScreen
2. 🔧 AddPaymentMethodScreen
3. 🔧 AddressesScreen
4. 🔧 AddEditAddressScreen

### Fase 3: Notifications & Support (2-3 horas)
1. 🔧 NotificationsScreen
2. 🔧 Notification service
3. 🔧 SupportScreen
4. 🔧 FAQs & Contact forms

### Fase 4: Settings & Profile Edit (2-3 horas)
1. 🔧 SettingsScreen
2. 🔧 EditProfileScreen
3. 🔧 Theme switcher
4. 🔧 Language switcher

---

## 🔌 Backend Endpoints Necesarios

```
# Orders
GET  /api/v1/users/orders
GET  /api/v1/users/orders/:id

# Wishlist
GET    /api/v1/wishlist
POST   /api/v1/wishlist/items
DELETE /api/v1/wishlist/items/:id

# Payment Methods
GET    /api/v1/payment-methods
POST   /api/v1/payment-methods
PUT    /api/v1/payment-methods/:id/default
DELETE /api/v1/payment-methods/:id

# Addresses
GET    /api/v1/addresses
POST   /api/v1/addresses
PUT    /api/v1/addresses/:id
DELETE /api/v1/addresses/:id
PUT    /api/v1/addresses/:id/default

# Notifications
GET    /api/v1/notifications
PUT    /api/v1/notifications/:id/read
DELETE /api/v1/notifications/:id
PUT    /api/v1/notifications/settings

# Support
GET  /api/v1/support/faqs
POST /api/v1/support/tickets

# Profile
GET /api/v1/auth/profile
PUT /api/v1/auth/profile
POST /api/v1/auth/profile/avatar
```

---

## 📝 Navegación a Actualizar

```typescript
// ProfileStack Navigator
<Stack.Navigator>
  <Stack.Screen name="Profile" component={ProfileScreen} />
  <Stack.Screen name="EditProfile" component={EditProfileScreen} />
  <Stack.Screen name="Orders" component={OrdersScreen} />
  <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
  <Stack.Screen name="Wishlist" component={WishlistScreen} />
  <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
  <Stack.Screen name="AddPaymentMethod" component={AddPaymentMethodScreen} />
  <Stack.Screen name="Addresses" component={AddressesScreen} />
  <Stack.Screen name="AddEditAddress" component={AddEditAddressScreen} />
  <Stack.Screen name="Notifications" component={NotificationsScreen} />
  <Stack.Screen name="Support" component={SupportScreen} />
  <Stack.Screen name="Settings" component={SettingsScreen} />
</Stack.Navigator>
```

---

## ✅ Criterios de Aceptación

- [x] Todas las 7 opciones del menu navegan correctamente ✅
- [x] Edit Profile funciona con avatar upload ✅
- [x] Orders screen muestra órdenes con imágenes reales ✅
- [x] Wishlist permite agregar/remover productos ✅
- [x] Payment methods screen implementado ✅
- [x] Addresses screen implementado ✅
- [x] Notifications con filtros y mark as read ✅
- [x] Support tiene FAQs y contact options ✅
- [x] Settings con todas las secciones ✅
- [x] Todos los formularios tienen validación ✅
- [x] Estados de loading/error implementados ✅
- [x] Logout funciona en todas las pantallas ✅

---

## 🎉 Resumen de Implementación

**Status:** ✅ **100% Completado**
**Tiempo invertido:** ~4 horas
**Pantallas creadas/actualizadas:** 9

### Pantallas Nuevas Creadas:
1. **NotificationsScreen** - Sistema completo de notificaciones con tipos (order, promotion, system), filtros All/Unread, mark as read individual y grupal, timestamps relativos, empty states
2. **SupportScreen** - FAQ accordion (8 preguntas), contact options (Email, Call, Live Chat), submit ticket form con validación, additional resources links
3. **EditProfileScreen** - Form completo con firstName, lastName, email, phone, bio, avatar picker (camera/library), validación de campos, KeyboardAvoidingView
4. **SettingsScreen** - 5 secciones (Account, Notifications, App Preferences, Privacy, About), switches para toggles, navigation a otras pantallas, logout

### Pantallas Actualizadas:
5. **OrdersScreen** - Fixed product images (reemplazó placeholders "IMG" con componentes Image reales)

### Pantallas Ya Existentes (Verificadas):
6. **WishlistScreen** - Funcionando correctamente
7. **PaymentMethodsScreen** - Funcionando correctamente
8. **AddressBookScreen** - Funcionando correctamente
9. **OrderTrackingScreen** - Funcionando correctamente

**Estimado original:** 10-14 horas de desarrollo
**Tiempo real:** ~4 horas
**Prioridad:** Media-Alta (features importantes de cuenta de usuario)

---

**Última actualización:** 2025-10-07
**Por:** Miyu ❤️
