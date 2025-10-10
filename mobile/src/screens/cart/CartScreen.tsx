import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
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
  onSaveForLater?: (productId: string) => Promise<void>;
  isUpdating: boolean;
}

const CartItemComponent: React.FC<CartItemComponentProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  onSaveForLater,
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
    const stockQuantity = item.product.quantity ?? item.product.stock ?? 0;
    const newQuantity = localQuantity + 1;
    if (newQuantity <= stockQuantity) {
      handleQuantityChange(newQuantity);
    } else {
      Toast.show({
        type: 'error',
        text1: 'Stock Limit',
        text2: `Only ${stockQuantity} items available`,
      });
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
          {inStock ? `${item.product.quantity ?? item.product.stock ?? 0} available` : 'Out of stock'}
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
            disabled={isUpdating || localQuantity >= (item.product.quantity ?? item.product.stock ?? 0)}
          >
            <GSText variant="body" weight="bold">+</GSText>
          </TouchableOpacity>

          {/* Remove & Save for Later Buttons */}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(item.productId)}
            disabled={isUpdating}
          >
            <GSText variant="caption" color="error">Remove</GSText>
          </TouchableOpacity>

          {onSaveForLater && (
            <TouchableOpacity
              style={styles.saveForLaterButton}
              onPress={() => onSaveForLater(item.productId)}
              disabled={isUpdating}
            >
              <GSText variant="caption" color="primary">Save for Later</GSText>
            </TouchableOpacity>
          )}
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
    savedItems,
    totalItems,
    subtotal,
    shippingCost,
    taxAmount,
    total,
    couponCode,
    couponDiscount,
    isLoading,
    updateQuantity,
    removeFromCart,
    clearCart,
    formatPrice,
    applyCoupon,
    removeCoupon,
    validateStock,
    getCartSummary,
    saveForLater,
    moveToCart,
  } = useCart();

  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [couponInput, setCouponInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [validatingStock, setValidatingStock] = useState(false);

  // Handle quantity update
  const handleUpdateQuantity = async (productId: string, quantity: number): Promise<void> => {
    setUpdatingItems(prev => new Set(prev).add(productId));
    try {
      await updateQuantity(productId, quantity);
      Toast.show({
        type: 'success',
        text1: 'Quantity Updated',
        text2: 'Cart has been updated',
      });
    } catch (error) {
      console.error('Failed to update quantity:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Failed to update quantity',
      });
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
      Toast.show({
        type: 'success',
        text1: 'Item Removed',
        text2: 'Item has been removed from cart',
      });
    } catch (error) {
      console.error('Failed to remove item:', error);
      Toast.show({
        type: 'error',
        text1: 'Remove Failed',
        text2: 'Failed to remove item',
      });
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
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearCart();
            Toast.show({
              type: 'success',
              text1: 'Cart Cleared',
              text2: 'All items removed from cart',
            });
          },
        },
      ]
    );
  };

  // Handle apply coupon
  const handleApplyCoupon = async (): Promise<void> => {
    if (!couponInput.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Coupon',
        text2: 'Please enter a coupon code',
      });
      return;
    }

    if (!isAuthenticated) {
      Toast.show({
        type: 'error',
        text1: 'Login Required',
        text2: 'Please login to use coupons',
      });
      return;
    }

    setApplyingCoupon(true);
    try {
      const success = await applyCoupon(couponInput.trim().toUpperCase());
      if (success) {
        Toast.show({
          type: 'success',
          text1: 'Coupon Applied!',
          text2: `You saved ${formatPrice(couponDiscount)}`,
        });
        setCouponInput('');
      }
    } catch (error) {
      console.error('Failed to apply coupon:', error);
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Handle remove coupon
  const handleRemoveCoupon = async (): Promise<void> => {
    try {
      await removeCoupon();
      Toast.show({
        type: 'info',
        text1: 'Coupon Removed',
        text2: 'Coupon has been removed from cart',
      });
    } catch (error) {
      console.error('Failed to remove coupon:', error);
    }
  };

  // Handle checkout
  const handleCheckout = async (): Promise<void> => {
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

    // Validate stock before checkout
    setValidatingStock(true);
    try {
      const isValid = await validateStock();
      setValidatingStock(false);

      if (!isValid) {
        Alert.alert(
          'Stock Updated',
          'Some items in your cart have limited availability. Please review your cart.',
          [{ text: 'OK' }]
        );
        return;
      }

      navigation.navigate('Checkout' as any);
    } catch (error) {
      setValidatingStock(false);
      Toast.show({
        type: 'error',
        text1: 'Validation Failed',
        text2: 'Unable to validate cart. Please try again.',
      });
    }
  };

  // Handle continue shopping
  const handleContinueShopping = (): void => {
    navigation.navigate('Home' as any);
  };

  // Handle save for later
  const handleSaveForLater = async (productId: string): Promise<void> => {
    if (!isAuthenticated) {
      Toast.show({
        type: 'error',
        text1: 'Login Required',
        text2: 'Please login to save items for later',
      });
      return;
    }

    setUpdatingItems(prev => new Set(prev).add(productId));
    try {
      await saveForLater(productId);
      Toast.show({
        type: 'success',
        text1: 'Saved for Later',
        text2: 'Item moved to Saved Items',
      });
    } catch (error) {
      console.error('Failed to save for later:', error);
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: 'Failed to save item for later',
      });
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  // Handle move to cart
  const handleMoveToCart = async (itemId: string): Promise<void> => {
    setUpdatingItems(prev => new Set(prev).add(itemId));
    try {
      await moveToCart(itemId);
      Toast.show({
        type: 'success',
        text1: 'Moved to Cart',
        text2: 'Item added back to cart',
      });
    } catch (error) {
      console.error('Failed to move to cart:', error);
      Toast.show({
        type: 'error',
        text1: 'Move Failed',
        text2: 'Failed to move item to cart',
      });
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Render cart item
  const renderCartItem = ({ item }: { item: CartItem }) => (
    <CartItemComponent
      item={item}
      onUpdateQuantity={handleUpdateQuantity}
      onRemove={handleRemoveItem}
      onSaveForLater={isAuthenticated ? handleSaveForLater : undefined}
      isUpdating={updatingItems.has(item.productId)}
    />
  );

  // Render saved item
  const renderSavedItem = ({ item }: { item: CartItem }) => (
    <View style={[styles.savedItem, { backgroundColor: theme.colors.surface }]}>
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

      <View style={styles.savedItemInfo}>
        <GSText variant="body" weight="medium" numberOfLines={2}>
          {item.product.name}
        </GSText>
        <GSText variant="body" weight="bold" color="primary">
          {formatPrice(item.price)}
        </GSText>
      </View>

      <TouchableOpacity
        style={[styles.moveToCartButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => handleMoveToCart(item.id)}
        disabled={updatingItems.has(item.id)}
      >
        {updatingItems.has(item.id) ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <GSText variant="caption" color="white" weight="bold">
            Move to Cart
          </GSText>
        )}
      </TouchableOpacity>
    </View>
  );

  // Calculate summary
  const summary = getCartSummary();

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
          Shopping Cart ({summary.itemCount} item{summary.itemCount !== 1 ? 's' : ''})
        </GSText>
        <TouchableOpacity onPress={handleClearCart}>
          <GSText variant="body" color="error">Clear All</GSText>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderCartItem}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          contentContainerStyle={styles.cartList}
        />

        {/* Saved Items Section */}
        {isAuthenticated && savedItems.length > 0 && (
          <View style={styles.savedItemsSection}>
            <View style={styles.savedItemsHeader}>
              <GSText variant="h4" weight="bold">
                Saved for Later ({savedItems.length} item{savedItems.length !== 1 ? 's' : ''})
              </GSText>
            </View>
            <FlatList
              data={savedItems}
              keyExtractor={(item) => item.id}
              renderItem={renderSavedItem}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              contentContainerStyle={styles.savedItemsList}
            />
          </View>
        )}

        {/* Coupon Section */}
        {isAuthenticated && (
          <View style={[styles.couponSection, { backgroundColor: theme.colors.surface }]}>
            <GSText variant="body" weight="medium" style={styles.couponTitle}>
              Have a coupon code?
            </GSText>

            {couponCode ? (
              <View style={styles.appliedCouponContainer}>
                <View style={[styles.appliedCouponBadge, { backgroundColor: theme.colors.success }]}>
                  <GSText variant="body" color="white" weight="bold">
                    ✓ {couponCode}
                  </GSText>
                </View>
                <TouchableOpacity onPress={handleRemoveCoupon}>
                  <GSText variant="body" color="error">Remove</GSText>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.couponInputContainer}>
                <TextInput
                  style={[
                    styles.couponInput,
                    {
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                      backgroundColor: theme.colors.background,
                    }
                  ]}
                  placeholder="Enter coupon code"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={couponInput}
                  onChangeText={setCouponInput}
                  autoCapitalize="characters"
                  editable={!applyingCoupon}
                />
                <GSButton
                  title="Apply"
                  onPress={handleApplyCoupon}
                  loading={applyingCoupon}
                  disabled={!couponInput.trim() || applyingCoupon}
                  style={styles.applyCouponButton}
                />
              </View>
            )}

            {/* Sample coupons hint */}
            {!couponCode && (
              <GSText variant="caption" color="textSecondary" style={styles.couponHint}>
                Try: SAVE10, SAVE20, or PERCENT10
              </GSText>
            )}
          </View>
        )}

        {/* Cart Summary */}
        <View style={[styles.cartSummary, { backgroundColor: theme.colors.surface }]}>
          <GSText variant="h4" weight="bold" style={styles.summaryTitle}>
            Order Summary
          </GSText>

          <View style={styles.summaryRow}>
            <GSText variant="body">Subtotal ({summary.totalItems} items)</GSText>
            <GSText variant="body" weight="medium">{formatPrice(subtotal)}</GSText>
          </View>

          <View style={styles.summaryRow}>
            <GSText variant="body" color="textSecondary">Shipping</GSText>
            <GSText variant="body" color="textSecondary">
              {shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}
            </GSText>
          </View>

          <View style={styles.summaryRow}>
            <GSText variant="body" color="textSecondary">Tax</GSText>
            <GSText variant="body" color="textSecondary">{formatPrice(taxAmount)}</GSText>
          </View>

          {couponDiscount > 0 && (
            <View style={styles.summaryRow}>
              <GSText variant="body" color="success">Discount ({couponCode})</GSText>
              <GSText variant="body" color="success" weight="bold">
                -{formatPrice(couponDiscount)}
              </GSText>
            </View>
          )}

          <View style={[styles.summaryRow, styles.totalRow]}>
            <GSText variant="h4" weight="bold">Total</GSText>
            <GSText variant="h4" weight="bold" color="primary">
              {formatPrice(total)}
            </GSText>
          </View>

          {/* Free shipping notice */}
          {shippingCost > 0 && subtotal < 300000 && (
            <View style={styles.freeShippingNotice}>
              <GSText variant="caption" color="textSecondary">
                💰 Add {formatPrice(300000 - subtotal)} more for free shipping
              </GSText>
            </View>
          )}

          {/* Checkout Button */}
          <GSButton
            title="Proceed to Checkout"
            onPress={handleCheckout}
            style={styles.checkoutButton}
            loading={validatingStock || isLoading}
          />

          {/* Continue Shopping */}
          <TouchableOpacity
            style={styles.continueShoppingButton}
            onPress={handleContinueShopping}
          >
            <GSText variant="body" color="primary">Continue Shopping</GSText>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Toast Container */}
      <Toast />
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
  saveForLaterButton: {
    marginLeft: 8,
    paddingVertical: 4,
  },
  savedItemsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  savedItemsHeader: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 12,
  },
  savedItemsList: {
    gap: 12,
  },
  savedItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  savedItemInfo: {
    flex: 1,
    gap: 4,
  },
  moveToCartButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  subtotalContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  couponSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  couponTitle: {
    marginBottom: 12,
  },
  couponInputContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  couponInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    minWidth: 0,
  },
  applyCouponButton: {
    width: 100,
    height: 48,
  },
  appliedCouponContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appliedCouponBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  couponHint: {
    marginTop: 8,
    fontStyle: 'italic',
  },
  cartSummary: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  summaryTitle: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalRow: {
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 16,
  },
  freeShippingNotice: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
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
