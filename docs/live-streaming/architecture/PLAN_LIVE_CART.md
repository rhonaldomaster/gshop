# Plan: Carrito Durante Transmisión en Vivo

## Objetivo

Permitir a los viewers agregar múltiples productos al carrito durante una transmisión en vivo y hacer checkout de todos juntos, sin salir del stream.

## Comportamiento Esperado (TikTok Shop Reference)

1. Usuario ve un producto durante el live → toca "Agregar al carrito"
2. Producto se agrega con animación → badge del carrito se actualiza
3. Usuario puede seguir viendo el live y agregar más productos
4. Cuando quiera, abre el carrito → ve todos los productos agregados
5. Checkout único para todos los productos del carrito
6. Si el live termina, el carrito persiste por tiempo limitado

---

## Diseño Técnico

### Nuevo Estado en LiveStreamScreen

```typescript
// Estado del carrito del live
interface LiveCartItem {
  productId: string;
  product: Product;
  variantId?: string;
  variant?: ProductVariant;
  quantity: number;
  specialPrice?: number; // Precio del live si aplica
  addedAt: Date;
}

const [liveCart, setLiveCart] = useState<LiveCartItem[]>([]);
const [isCartOpen, setIsCartOpen] = useState(false);
```

### Nuevos Componentes

| Componente | Ubicación | Propósito |
|------------|-----------|-----------|
| `LiveCartBadge` | `components/live/LiveCartBadge.tsx` | Badge flotante con contador |
| `LiveCartModal` | `components/live/LiveCartModal.tsx` | Modal del carrito |
| `LiveCartItem` | `components/live/LiveCartItem.tsx` | Item individual en el carrito |
| `AddToCartAnimation` | `components/live/AddToCartAnimation.tsx` | Animación al agregar |

---

## Implementación por Fases

### Fase 1: Estado y UI Básica

#### 1.1 Crear LiveCartBadge.tsx

```typescript
// mobile/src/components/live/LiveCartBadge.tsx
interface LiveCartBadgeProps {
  count: number;
  onPress: () => void;
}

export const LiveCartBadge: React.FC<LiveCartBadgeProps> = ({ count, onPress }) => {
  const scale = useSharedValue(1);

  // Animación bounce cuando cambia el count
  useEffect(() => {
    if (count > 0) {
      scale.value = withSequence(
        withTiming(1.3, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );
    }
  }, [count]);

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Animated.View style={[styles.badge, { transform: [{ scale }] }]}>
        <ShoppingCart size={24} color="#fff" />
        {count > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{count > 99 ? '99+' : count}</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
};
```

**Posición:** Flotante, esquina superior derecha del video (debajo del viewer count)

#### 1.2 Modificar ProductCard.tsx

Agregar botón "Agregar al carrito" además del "Quick Buy":

```typescript
// Nuevos props
interface ProductCardProps {
  // ... existing props
  onAddToCart?: (product: Product, variant?: ProductVariant) => void;
  isInCart?: boolean;
}

// En el render, agregar botón
{isLiveMode && (
  <View style={styles.liveButtons}>
    <TouchableOpacity
      style={[styles.addToCartBtn, isInCart && styles.inCartBtn]}
      onPress={() => onAddToCart?.(product)}
    >
      <ShoppingCart size={16} color="#fff" />
      <Text>{isInCart ? 'En carrito' : 'Agregar'}</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.quickBuyBtn} onPress={onQuickBuy}>
      <Zap size={16} color="#fff" />
      <Text>Comprar</Text>
    </TouchableOpacity>
  </View>
)}
```

#### 1.3 Modificar ProductOverlayTikTok.tsx

Agregar opción de "Add to Cart" en el producto pineado:

```typescript
// En el pinned product card
<View style={styles.pinnedActions}>
  <TouchableOpacity
    style={styles.addToCartBtn}
    onPress={() => onAddToCart(pinnedProduct)}
  >
    <Plus size={16} />
    <Text>Carrito</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.buyNowBtn} onPress={onQuickBuy}>
    <Text>Comprar</Text>
  </TouchableOpacity>
</View>
```

---

### Fase 2: Modal del Carrito

#### 2.1 Crear LiveCartModal.tsx

```typescript
// mobile/src/components/live/LiveCartModal.tsx
interface LiveCartModalProps {
  visible: boolean;
  onClose: () => void;
  items: LiveCartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export const LiveCartModal: React.FC<LiveCartModalProps> = ({
  visible,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => {
    const price = item.specialPrice || item.product.price;
    return sum + (price * item.quantity);
  }, 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Video sigue visible arriba */}
        <View style={styles.videoSpace} />

        {/* Carrito en bottom sheet */}
        <View style={styles.cartContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>
              Carrito del Live ({totalItems})
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={items}
            keyExtractor={(item) => item.productId}
            renderItem={({ item }) => (
              <LiveCartItem
                item={item}
                onUpdateQuantity={(qty) => onUpdateQuantity(item.productId, qty)}
                onRemove={() => onRemoveItem(item.productId)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <ShoppingCart size={48} color="#ccc" />
                <Text>Tu carrito está vacío</Text>
              </View>
            }
          />

          {items.length > 0 && (
            <View style={styles.footer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalPrice}>
                  ${totalPrice.toLocaleString()}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.checkoutBtn}
                onPress={onCheckout}
              >
                <Text style={styles.checkoutText}>
                  Pagar ({totalItems} productos)
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};
```

#### 2.2 Crear LiveCartItem.tsx

```typescript
// mobile/src/components/live/LiveCartItem.tsx
interface LiveCartItemProps {
  item: LiveCartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export const LiveCartItem: React.FC<LiveCartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
}) => {
  const price = item.specialPrice || item.product.price;
  const hasDiscount = item.specialPrice && item.specialPrice < item.product.price;

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: item.product.images[0] }}
        style={styles.image}
      />

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {item.product.name}
        </Text>

        {item.variant && (
          <Text style={styles.variant}>
            {item.variant.name}
          </Text>
        )}

        <View style={styles.priceRow}>
          <Text style={styles.price}>
            ${price.toLocaleString()}
          </Text>
          {hasDiscount && (
            <>
              <Text style={styles.originalPrice}>
                ${item.product.price.toLocaleString()}
              </Text>
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>LIVE</Text>
              </View>
            </>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <QuantitySelector
          value={item.quantity}
          min={1}
          max={item.product.stock}
          onChange={onUpdateQuantity}
        />

        <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
          <Trash2 size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
```

---

### Fase 3: Lógica en LiveStreamScreen

#### 3.1 Funciones del Carrito

```typescript
// mobile/src/screens/live/LiveStreamScreen.tsx

// Agregar producto al carrito
const addToLiveCart = useCallback((
  product: Product,
  variant?: ProductVariant,
  quantity: number = 1
) => {
  const streamProduct = stream?.products?.find(p => p.product.id === product.id);
  const specialPrice = streamProduct?.specialPrice;

  setLiveCart(prev => {
    const existingIndex = prev.findIndex(
      item => item.productId === product.id && item.variantId === variant?.id
    );

    if (existingIndex >= 0) {
      // Actualizar cantidad si ya existe
      const updated = [...prev];
      updated[existingIndex].quantity += quantity;
      return updated;
    }

    // Agregar nuevo item
    return [...prev, {
      productId: product.id,
      product,
      variantId: variant?.id,
      variant,
      quantity,
      specialPrice,
      addedAt: new Date(),
    }];
  });

  // Animación y feedback
  showAddToCartAnimation(product);
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}, [stream?.products]);

// Actualizar cantidad
const updateCartQuantity = useCallback((productId: string, quantity: number) => {
  if (quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  setLiveCart(prev =>
    prev.map(item =>
      item.productId === productId
        ? { ...item, quantity }
        : item
    )
  );
}, []);

// Remover del carrito
const removeFromCart = useCallback((productId: string) => {
  setLiveCart(prev => prev.filter(item => item.productId !== productId));
}, []);

// Verificar si producto está en carrito
const isInCart = useCallback((productId: string) => {
  return liveCart.some(item => item.productId === productId);
}, [liveCart]);

// Checkout del carrito completo
const handleCartCheckout = useCallback(() => {
  setIsCartOpen(false);
  // Navegar a checkout con items del carrito
  navigation.navigate('LiveCartCheckout', {
    items: liveCart,
    streamId,
    affiliateId: stream?.affiliate?.id,
  });
}, [liveCart, streamId, stream?.affiliate?.id]);
```

#### 3.2 Integrar en el Render

```typescript
// En LiveStreamScreen render

return (
  <View style={styles.container}>
    {/* Video Player */}
    <Video source={{ uri: stream?.hlsUrl }} ... />

    {/* Cart Badge - Siempre visible */}
    <LiveCartBadge
      count={liveCart.reduce((sum, item) => sum + item.quantity, 0)}
      onPress={() => setIsCartOpen(true)}
      style={styles.cartBadge}
    />

    {/* Product Overlay */}
    <ProductOverlayTikTok
      products={stream?.products}
      pinnedProductId={pinnedProductId}
      onAddToCart={addToLiveCart}
      onQuickBuy={handleQuickBuy}
      isInCart={isInCart}
      ...
    />

    {/* Products/Chat Panel */}
    {showProducts && (
      <ProductsPanel
        products={stream?.products}
        onAddToCart={addToLiveCart}
        onQuickBuy={handleQuickBuy}
        isInCart={isInCart}
      />
    )}

    {/* Cart Modal */}
    <LiveCartModal
      visible={isCartOpen}
      onClose={() => setIsCartOpen(false)}
      items={liveCart}
      onUpdateQuantity={updateCartQuantity}
      onRemoveItem={removeFromCart}
      onCheckout={handleCartCheckout}
    />
  </View>
);
```

---

### Fase 4: Checkout del Carrito

#### 4.1 Crear LiveCartCheckoutScreen.tsx

Nueva pantalla para checkout de múltiples productos:

```typescript
// mobile/src/screens/live/LiveCartCheckoutScreen.tsx

interface RouteParams {
  items: LiveCartItem[];
  streamId: string;
  affiliateId?: string;
}

export const LiveCartCheckoutScreen: React.FC = () => {
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { items, streamId, affiliateId } = route.params;

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('mercadopago');
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = items.reduce((sum, item) => {
    const price = item.specialPrice || item.product.price;
    return sum + (price * item.quantity);
  }, 0);

  const shipping = calculateShipping(items, selectedAddress);
  const total = subtotal + shipping;

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    try {
      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.specialPrice || item.product.price,
        })),
        shippingAddressId: selectedAddress?.id,
        paymentMethod,
        liveSessionId: streamId,
        affiliateId,
      };

      const order = await ordersApi.createOrder(orderData);

      // Notificar al live stream sobre la compra
      socketRef.current?.emit('purchaseMade', {
        streamId,
        orderId: order.id,
        itemCount: items.length,
        total,
      });

      navigation.replace('OrderSuccess', { orderId: order.id });
    } catch (error) {
      Alert.alert('Error', 'No se pudo procesar tu orden');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen del pedido</Text>
          {items.map(item => (
            <CheckoutItem key={item.productId} item={item} />
          ))}
        </View>

        {/* Shipping Address */}
        <AddressSelector
          selected={selectedAddress}
          onSelect={setSelectedAddress}
        />

        {/* Payment Method */}
        <PaymentMethodSelector
          selected={paymentMethod}
          onSelect={setPaymentMethod}
        />

        {/* Totals */}
        <View style={styles.totals}>
          <Row label="Subtotal" value={`$${subtotal.toLocaleString()}`} />
          <Row label="Envío" value={`$${shipping.toLocaleString()}`} />
          <Row label="Total" value={`$${total.toLocaleString()}`} bold />
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.placeOrderBtn}
          onPress={handlePlaceOrder}
          disabled={isProcessing || !selectedAddress}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeOrderText}>
              Pagar ${total.toLocaleString()}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
```

#### 4.2 Agregar Ruta en Navigator

```typescript
// mobile/src/navigation/HomeNavigator.tsx

<Stack.Screen
  name="LiveCartCheckout"
  component={LiveCartCheckoutScreen}
  options={{
    title: 'Checkout',
    presentation: 'modal',
  }}
/>
```

---

### Fase 5: Persistencia del Carrito

#### 5.1 Hook useLiveCart

```typescript
// mobile/src/hooks/useLiveCart.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const LIVE_CART_KEY = 'live_cart';
const CART_EXPIRY_MS = 30 * 60 * 1000; // 30 minutos

export const useLiveCart = (streamId: string) => {
  const [cart, setCart] = useState<LiveCartItem[]>([]);

  // Cargar carrito al iniciar
  useEffect(() => {
    const loadCart = async () => {
      try {
        const stored = await AsyncStorage.getItem(`${LIVE_CART_KEY}:${streamId}`);
        if (stored) {
          const { items, savedAt } = JSON.parse(stored);

          // Verificar si no ha expirado
          if (Date.now() - savedAt < CART_EXPIRY_MS) {
            setCart(items);
          } else {
            await AsyncStorage.removeItem(`${LIVE_CART_KEY}:${streamId}`);
          }
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    };
    loadCart();
  }, [streamId]);

  // Guardar carrito cuando cambie
  useEffect(() => {
    const saveCart = async () => {
      try {
        if (cart.length > 0) {
          await AsyncStorage.setItem(
            `${LIVE_CART_KEY}:${streamId}`,
            JSON.stringify({ items: cart, savedAt: Date.now() })
          );
        } else {
          await AsyncStorage.removeItem(`${LIVE_CART_KEY}:${streamId}`);
        }
      } catch (error) {
        console.error('Error saving cart:', error);
      }
    };
    saveCart();
  }, [cart, streamId]);

  // Limpiar carrito cuando el live termine
  const clearCart = useCallback(async () => {
    setCart([]);
    await AsyncStorage.removeItem(`${LIVE_CART_KEY}:${streamId}`);
  }, [streamId]);

  return { cart, setCart, clearCart };
};
```

---

## Archivos a Crear/Modificar

### Nuevos Archivos

| Archivo | Descripción |
|---------|-------------|
| `components/live/LiveCartBadge.tsx` | Badge flotante del carrito |
| `components/live/LiveCartModal.tsx` | Modal del carrito |
| `components/live/LiveCartItem.tsx` | Item en el carrito |
| `components/live/AddToCartAnimation.tsx` | Animación al agregar |
| `screens/live/LiveCartCheckoutScreen.tsx` | Pantalla de checkout |
| `hooks/useLiveCart.ts` | Hook para persistencia |

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `screens/live/LiveStreamScreen.tsx` | Agregar estado y lógica del carrito |
| `components/live/ProductCard.tsx` | Agregar botón "Agregar al carrito" |
| `components/live/ProductOverlayTikTok.tsx` | Agregar opción de carrito en pinned |
| `navigation/HomeNavigator.tsx` | Agregar ruta LiveCartCheckout |

---

## Consideraciones

### UX

- El badge del carrito siempre visible durante el live
- Animación satisfactoria al agregar productos
- El carrito no debe bloquear el video
- Feedback claro cuando un producto ya está en el carrito

### Performance

- Usar `useMemo` para cálculos de totales
- Limitar re-renders con `useCallback`
- Lazy load de imágenes en el carrito

### Edge Cases

- Producto se agota mientras está en carrito → mostrar aviso
- Precio del live cambia → usar precio al momento de agregar
- Live termina → carrito persiste 30 min
- Usuario cierra app → carrito persiste en AsyncStorage

---

## Estimación de Esfuerzo

| Fase | Componentes | Complejidad |
|------|-------------|-------------|
| Fase 1 | Badge + Botones | Baja |
| Fase 2 | Modal del carrito | Media |
| Fase 3 | Lógica en LiveStreamScreen | Media |
| Fase 4 | Checkout screen | Media |
| Fase 5 | Persistencia | Baja |

---

## Testing

### Casos de Prueba

1. Agregar producto al carrito → badge se actualiza
2. Agregar mismo producto → cantidad aumenta
3. Cambiar cantidad en carrito → total se recalcula
4. Remover producto → desaparece del carrito
5. Checkout → orden se crea con atribución correcta
6. Cerrar y abrir app → carrito persiste
7. Carrito expira después de 30 min
8. Producto sin stock → mostrar error
