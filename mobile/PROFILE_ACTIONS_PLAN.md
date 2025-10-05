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

### ⏳ Por Implementar:
- 7 pantallas de destino
- Funcionalidad de cada sección
- Servicios de backend
- Formularios de edición
- Estados de loading/error

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
**Status:** ⏳ Pendiente
**Archivos:** `OrdersScreen.tsx` (crear), `orders.service.ts` (ya existe)

#### Tareas:
- [ ] Crear `src/screens/orders/OrdersScreen.tsx`
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

- [ ] Todas las 7 opciones del menu navegan correctamente
- [ ] Edit Profile funciona con avatar upload
- [ ] Orders screen muestra órdenes reales
- [ ] Wishlist permite agregar/remover productos
- [ ] Payment methods se guardan correctamente
- [ ] Addresses funcionan con validación
- [ ] Notifications muestran updates reales
- [ ] Support tiene FAQs útiles
- [ ] Settings persisten cambios
- [ ] Todos los formularios tienen validación
- [ ] Estados de loading/error implementados
- [ ] Logout funciona en todas las pantallas

---

**Estimado total:** 10-14 horas de desarrollo
**Prioridad:** Media-Alta (features importantes de cuenta de usuario)
