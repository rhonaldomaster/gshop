
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../contexts/AuthContext';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import { CartItem } from '../../contexts/CartContext';

// Cart Item Component
interface CartItemComponentProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => Promise<void>;
  onRemove: (productId: string) => Promise<void>;
  isUpdating: boolean;
}

const CartItemComponent: React.FC<CartItemComponentProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  isUpdating,
}) => {
  const { theme } = useTheme();
  const { formatPrice, getDiscountPercentage, isInStock } = useCart();
  const [localQuantity, setLocalQuantity] = useState(item.quantity);

  const discountPercentage = getDiscountPercentage(item.product);
  const inStock = isInStock(item.product);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity <= 0) {
      onRemove(item.productId);
      return;
    }

    setLocalQuantity(newQuantity);
    await onUpdateQuantity(item.productId, newQuantity);
  };

  const increaseQuantity = () => {
    const newQuantity = localQuantity + 1;
    if (newQuantity <= item.product.stock) {
      handleQuantityChange(newQuantity);
    } else {
      Alert.alert('Stock Limit', `Only ${item.product.stock} items available`);
    }
  };

  const decreaseQuantity = () => {
    handleQuantityChange(localQuantity - 1);
  };

  return (
    <View style={[styles.cartItem, { backgroundColor: theme.colors.surface }]}>
      {/* Product Image */}
      <View style={styles.productImageContainer}>
        {item.product.images && item.product.images.length > 0 ? (
          <Image
            source={{ uri: item.product.images[0] }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <GSText variant="caption" color="textSecondary">No Image</GSText>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <GSText variant="body" weight="medium" numberOfLines={2} style={styles.productName}>
          {item.product.name}
        </GSText>

        {/* Price */}
        <View style={styles.priceContainer}>
          <GSText variant="body" weight="bold" color="primary">
            {formatPrice(item.price)}
          </GSText>
          {item.product.originalPrice && item.product.originalPrice > item.price && (
            <GSText variant="caption" color="textSecondary" style={styles.originalPrice}>
              {formatPrice(item.product.originalPrice)}
            </GSText>
          )}
          {discountPercentage > 0 && (
            <View style={[styles.discountTag, { backgroundColor: theme.colors.error }]}>
              <GSText variant="caption" color="white" weight="bold">
                -{discountPercentage}%
              </GSText>
            </View>
          )}
        </View>

        {/* Stock Status */}
        <GSText
          variant="caption"
          color={inStock ? 'success' : 'error'}
          style={styles.stockStatus}
        >
          {inStock ? `${item.product.stock} available` : 'Out of stock'}
        </GSText>

        {/* Quantity Controls */}
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={[
              styles.quantityButton,
              {
                borderColor: theme.colors.border,
                opacity: isUpdating ? 0.5 : 1,
              }
            ]}
            onPress={decreaseQuantity}
            disabled={isUpdating || localQuantity <= 0}
          >
            <GSText variant="body" weight="bold">-</GSText>
          </TouchableOpacity>

          <View style={styles.quantityDisplay}>
            {isUpdating ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <GSText variant="body" weight="medium">{localQuantity}</GSText>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.quantityButton,
              {
                borderColor: theme.colors.border,
                opacity: isUpdating ? 0.5 : 1,
              }
            ]}
            onPress={increaseQuantity}
            disabled={isUpdating || localQuantity >= item.product.stock}
          >
            <GSText variant="body" weight="bold">+</GSText>
          </TouchableOpacity>

          {/* Remove Button */}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(item.productId)}
            disabled={isUpdating}
          >
            <GSText variant="caption" color="error">Remove</GSText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Subtotal */}
      <View style={styles.subtotalContainer}>
        <GSText variant="body" weight="bold" color="primary">
          {formatPrice(item.subtotal)}
        </GSText>
      </View>
    </View>
  );
};

// Main Cart Screen Component
export default function CartScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const {
    items,
    totalItems,
    subtotal,
    isLoading,
    updateQuantity,
    removeFromCart,
    clearCart,
    formatPrice,
    getCartSummary,
    getShippingEstimate,
    getTaxEstimate,
    getTotalEstimate,
  } = useCart();

  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  // Handle quantity update
  const handleUpdateQuantity = async (productId: string, quantity: number): Promise<void> => {
    setUpdatingItems(prev => new Set(prev).add(productId));
    try {
      await updateQuantity(productId, quantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  // Handle item removal
  const handleRemoveItem = async (productId: string): Promise<void> => {
    setUpdatingItems(prev => new Set(prev).add(productId));
    try {
      await removeFromCart(productId);
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  // Handle clear cart
  const handleClearCart = async (): Promise<void> => {
    await clearCart();
  };

  // Handle checkout
  const handleCheckout = (): void => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please login to proceed with checkout',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Auth' as any) },
        ]
      );
      return;
    }

    navigation.navigate('Checkout' as any);
  };

  // Handle continue shopping
  const handleContinueShopping = (): void => {
    navigation.navigate('Home' as any);
  };

  // Render cart item
  const renderCartItem = ({ item }: { item: CartItem }) => (
    <CartItemComponent
      item={item}
      onUpdateQuantity={handleUpdateQuantity}
      onRemove={handleRemoveItem}
      isUpdating={updatingItems.has(item.productId)}
    />
  );

  // Calculate totals
  const summary = getCartSummary();
  const shipping = getShippingEstimate();
  const tax = getTaxEstimate();
  const total = getTotalEstimate();

  // Render empty cart
  if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.emptyCartContainer}>
          <View style={styles.emptyCartIcon}>
            <GSText variant="h1">🛒</GSText>
          </View>
          <GSText variant="h3" weight="bold" style={styles.emptyCartTitle}>
            Your cart is empty
          </GSText>
          <GSText variant="body" color="textSecondary" style={styles.emptyCartSubtitle}>
            Start shopping to add items to your cart
          </GSText>
          <GSButton
            title="Start Shopping"
            onPress={handleContinueShopping}
            style={styles.startShoppingButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <GSText variant="h3" weight="bold">
          Shopping Cart ({totalItems} item{totalItems !== 1 ? 's' : ''})
        </GSText>
        <TouchableOpacity onPress={handleClearCart}>
          <GSText variant="body" color="error">Clear All</GSText>
        </TouchableOpacity>
      </View>

      {/* Cart Items */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderCartItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.cartList}
      />

      {/* Cart Summary */}
      <View style={[styles.cartSummary, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.summaryRow}>
          <GSText variant="body">Subtotal ({summary.totalItems} items)</GSText>
          <GSText variant="body" weight="medium">{formatPrice(summary.subtotal)}</GSText>
        </View>

        <View style={styles.summaryRow}>
          <GSText variant="body" color="textSecondary">Shipping</GSText>
          <GSText variant="body" color="textSecondary">
            {shipping === 0 ? 'Free' : formatPrice(shipping)}
          </GSText>
        </View>

        <View style={styles.summaryRow}>
          <GSText variant="body" color="textSecondary">Tax (estimated)</GSText>
          <GSText variant="body" color="textSecondary">{formatPrice(tax)}</GSText>
        </View>

        <View style={[styles.summaryRow, styles.totalRow]}>
          <GSText variant="h4" weight="bold">Total</GSText>
          <GSText variant="h4" weight="bold" color="primary">
            {formatPrice(total)}
          </GSText>
        </View>

        {/* Free shipping notice */}
        {shipping > 0 && subtotal < 300000 && (
          <View style={styles.freeShippingNotice}>
            <GSText variant="caption" color="textSecondary">
              Add {formatPrice(300000 - subtotal)} more for free shipping
            </GSText>
          </View>
        )}

        {/* Checkout Button */}
        <GSButton
          title="Proceed to Checkout"
          onPress={handleCheckout}
          style={styles.checkoutButton}
          loading={isLoading}
        />

        {/* Continue Shopping */}
        <TouchableOpacity
          style={styles.continueShoppingButton}
          onPress={handleContinueShopping}
        >
          <GSText variant="body" color="primary">Continue Shopping</GSText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  cartList: {
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productImageContainer: {
    marginRight: 12,
  },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    gap: 4,
  },
  productName: {
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  originalPrice: {
    textDecorationLine: 'line-through',
  },
  discountTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockStatus: {
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityDisplay: {
    minWidth: 40,
    alignItems: 'center',
  },
  removeButton: {
    marginLeft: 8,
    paddingVertical: 4,
  },
  subtotalContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  cartSummary: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalRow: {
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 16,
  },
  freeShippingNotice: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 16,
    alignItems: 'center',
  },
  checkoutButton: {
    marginBottom: 12,
  },
  continueShoppingButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCartIcon: {
    marginBottom: 20,
  },
  emptyCartTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyCartSubtitle: {
    marginBottom: 24,
    textAlign: 'center',
  },
  startShoppingButton: {
    minWidth: 160,
  },
});
