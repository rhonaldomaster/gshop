import { useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useCart as useCartContext, CartItem } from '../contexts/CartContext';
import { Product } from '../services/products.service';
import { productsService } from '../services/products.service';

// Extended cart hook interface
interface UseCartReturn {
  // Cart state
  items: CartItem[];
  savedItems: CartItem[];
  totalItems: number;
  subtotal: number;
  isLoading: boolean;
  lastUpdated: string | null;

  // Cart actions
  addToCart: (product: Product, quantity?: number, showAlert?: boolean) => Promise<boolean>;
  removeFromCart: (productId: string, showAlert?: boolean) => Promise<boolean>;
  updateQuantity: (productId: string, quantity: number) => Promise<boolean>;
  clearCart: (showAlert?: boolean) => Promise<boolean>;
  incrementQuantity: (productId: string) => Promise<boolean>;
  decrementQuantity: (productId: string) => Promise<boolean>;

  // Save for later actions
  saveForLater: (productId: string) => Promise<void>;
  moveToCart: (itemId: string) => Promise<void>;
  getSavedItems: () => Promise<void>;

  // Cart queries
  getCartItem: (productId: string) => CartItem | undefined;
  isInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
  canAddToCart: (product: Product, quantity?: number) => { canAdd: boolean; reason?: string };

  // Cart calculations
  getCartSummary: () => {
    totalItems: number;
    subtotal: number;
    itemCount: number;
    averagePrice: number;
    isEmpty: boolean;
  };
  getShippingEstimate: () => number;
  getTaxEstimate: () => number;
  getTotalEstimate: () => number;

  // Cart utilities
  formatPrice: (price: number) => string;
  getCartValidation: () => {
    isValid: boolean;
    issues: string[];
  };
  syncWithServer: () => Promise<void>;

  // Backend integration
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => Promise<boolean>;
  validateStock: () => Promise<boolean>;
  refreshCart: () => Promise<void>;

  // Extended state
  shippingCost: number;
  taxAmount: number;
  total: number;
  couponCode?: string;
  couponDiscount: number;

  // Helper utilities
  getDiscountPercentage: (product: Product) => number;
  isInStock: (product: Product) => boolean;
}

/**
 * Enhanced cart hook with additional utilities and error handling
 */
export function useCart(): UseCartReturn {
  const { t } = useTranslation();
  const cartContext = useCartContext();

  // Add to cart with validation and user feedback
  const addToCart = useCallback(
    async (product: Product, quantity: number = 1, showAlert: boolean = true): Promise<boolean> => {
      try {
        // Validate product and quantity
        const validation = canAddToCart(product, quantity);
        if (!validation.canAdd) {
          if (showAlert) {
            Alert.alert(t('cart.cannotAddToCart'), validation.reason || t('common.error'));
          }
          return false;
        }

        await cartContext.addToCart(product, quantity);

        // Track interaction for recommendations
        await productsService.trackProductInteraction(product.id, 'add_to_cart');

        if (showAlert) {
          Alert.alert(
            t('cart.addedToCart'),
            t('cart.itemAddedToCart', { name: product.name }),
            [{ text: 'OK' }],
            { cancelable: true }
          );
        }

        return true;
      } catch (error: any) {
        console.error('useCart: Add to cart failed', error);
        if (showAlert) {
          if (error.statusCode === 401) {
            Alert.alert(
              t('auth.sessionExpired'),
              t('auth.loginAgainToAddCart'),
            );
          } else {
            Alert.alert(t('common.error'), error.message || t('cart.failedToAddItem'));
          }
        }
        return false;
      }
    },
    [cartContext, t]
  );

  // Remove from cart with confirmation
  const removeFromCart = useCallback(
    async (productId: string, showAlert: boolean = true): Promise<boolean> => {
      try {
        const cartItem = cartContext.getCartItem(productId);
        if (!cartItem) {
          return false;
        }

        if (showAlert) {
          return new Promise((resolve) => {
            Alert.alert(
              t('cart.removeItemTitle'),
              t('cart.removeItemConfirm', { name: cartItem.product.name }),
              [
                { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
                {
                  text: t('cart.remove'),
                  style: 'destructive',
                  onPress: async () => {
                    await cartContext.removeFromCart(productId);
                    resolve(true);
                  },
                },
              ]
            );
          });
        } else {
          await cartContext.removeFromCart(productId);
          return true;
        }
      } catch (error: any) {
        console.error('useCart: Remove from cart failed', error);
        if (showAlert) {
          Alert.alert(t('common.error'), error.message || t('cart.failedToRemoveItem'));
        }
        return false;
      }
    },
    [cartContext, t]
  );

  // Update quantity with validation
  const updateQuantity = useCallback(
    async (productId: string, quantity: number): Promise<boolean> => {
      try {
        const cartItem = cartContext.getCartItem(productId);
        if (!cartItem) {
          return false;
        }

        // Validate new quantity
        const validation = canAddToCart(cartItem.product, quantity);
        if (!validation.canAdd) {
          Alert.alert(t('cart.cannotUpdateQuantity'), validation.reason || t('cart.invalidQuantity'));
          return false;
        }

        await cartContext.updateQuantity(productId, quantity);
        return true;
      } catch (error: any) {
        console.error('useCart: Update quantity failed', error);
        Alert.alert(t('common.error'), error.message || t('cart.failedToUpdateQuantity'));
        return false;
      }
    },
    [cartContext, t]
  );

  // Clear cart with confirmation
  const clearCart = useCallback(
    async (showAlert: boolean = true): Promise<boolean> => {
      try {
        if (cartContext.items.length === 0) {
          return true;
        }

        if (showAlert) {
          return new Promise((resolve) => {
            Alert.alert(
              t('cart.clearCartTitle'),
              t('cart.clearCartConfirm'),
              [
                { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
                {
                  text: t('common.clear'),
                  style: 'destructive',
                  onPress: async () => {
                    await cartContext.clearCart();
                    resolve(true);
                  },
                },
              ]
            );
          });
        } else {
          await cartContext.clearCart();
          return true;
        }
      } catch (error: any) {
        console.error('useCart: Clear cart failed', error);
        if (showAlert) {
          Alert.alert(t('common.error'), error.message || t('cart.failedToClearCart'));
        }
        return false;
      }
    },
    [cartContext, t]
  );

  // Increment quantity
  const incrementQuantity = useCallback(
    async (productId: string): Promise<boolean> => {
      const cartItem = cartContext.getCartItem(productId);
      if (cartItem) {
        return await updateQuantity(productId, cartItem.quantity + 1);
      }
      return false;
    },
    [cartContext, updateQuantity]
  );

  // Decrement quantity
  const decrementQuantity = useCallback(
    async (productId: string): Promise<boolean> => {
      const cartItem = cartContext.getCartItem(productId);
      if (cartItem) {
        if (cartItem.quantity <= 1) {
          return await removeFromCart(productId, false);
        } else {
          return await updateQuantity(productId, cartItem.quantity - 1);
        }
      }
      return false;
    },
    [cartContext, updateQuantity, removeFromCart]
  );

  // Get item quantity
  const getItemQuantity = useCallback(
    (productId: string): number => {
      const cartItem = cartContext.getCartItem(productId);
      return cartItem?.quantity || 0;
    },
    [cartContext]
  );

  // Check if item can be added to cart
  const canAddToCart = useCallback(
    (product: Product, quantity: number = 1): { canAdd: boolean; reason?: string } => {
      if (!product) {
        return { canAdd: false, reason: t('cart.productNotFound') };
      }

      if (product.status !== 'active') {
        return { canAdd: false, reason: t('cart.productNotAvailable') };
      }

      if (quantity <= 0) {
        return { canAdd: false, reason: t('cart.quantityGreaterThanZero') };
      }

      const stockQuantity = product.quantity ?? product.stock ?? 0;

      if (quantity > stockQuantity) {
        return { canAdd: false, reason: t('cart.onlyXItemsAvailable', { count: stockQuantity }) };
      }

      // Check current cart quantity
      const currentQuantity = getItemQuantity(product.id);
      const totalQuantity = currentQuantity + quantity;

      if (totalQuantity > stockQuantity) {
        const remaining = stockQuantity - currentQuantity;
        return {
          canAdd: false,
          reason: remaining > 0
            ? t('cart.canOnlyAddXMore', { count: remaining })
            : t('cart.maxQuantityInCart'),
        };
      }

      return { canAdd: true };
    },
    [getItemQuantity, t]
  );

  // Enhanced cart summary with additional calculations
  const getCartSummary = useCallback(() => {
    const summary = cartContext.getCartSummary();
    const averagePrice = summary.itemCount > 0 ? summary.subtotal / summary.totalItems : 0;

    return {
      ...summary,
      averagePrice,
      isEmpty: summary.itemCount === 0,
    };
  }, [cartContext]);

  // Estimate shipping cost (placeholder - would integrate with shipping API)
  const getShippingEstimate = useCallback((): number => {
    const summary = getCartSummary();

    // Free shipping over $100 USD equivalent (300,000 COP)
    if (summary.subtotal >= 300000) {
      return 0;
    }

    // Basic shipping calculation - would be replaced with real API
    return summary.isEmpty ? 0 : 15000; // 15,000 COP base shipping
  }, [getCartSummary]);

  // Estimate tax (placeholder - would integrate with tax API)
  const getTaxEstimate = useCallback((): number => {
    const summary = getCartSummary();
    // 19% IVA in Colombia
    return summary.subtotal * 0.19;
  }, [getCartSummary]);

  // Get total estimate including shipping and tax
  const getTotalEstimate = useCallback((): number => {
    const summary = getCartSummary();
    const shipping = getShippingEstimate();
    const tax = getTaxEstimate();

    return summary.subtotal + shipping + tax;
  }, [getCartSummary, getShippingEstimate, getTaxEstimate]);

  // Format price in Colombian Pesos
  const formatPrice = useCallback((price: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  }, []);

  // Validate cart contents
  const getCartValidation = useCallback(() => {
    const issues: string[] = [];

    for (const item of cartContext.items) {
      // Check if product is still available
      if (item.product.status !== 'active') {
        issues.push(t('cart.productNoLongerAvailable', { name: item.product.name }));
      }

      // Check stock availability
      const stockQuantity = item.product.quantity ?? item.product.stock ?? 0;
      if (item.quantity > stockQuantity) {
        issues.push(t('cart.onlyXItemsLeft', { name: item.product.name, count: stockQuantity }));
      }

      // Check for price changes (would require API call to get current price)
      // This is a placeholder for price validation
      if (item.price !== item.product.price) {
        issues.push(t('cart.priceHasChanged', { name: item.product.name }));
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }, [cartContext.items, t]);

  // Sync cart with server
  const syncWithServer = useCallback(async (): Promise<void> => {
    try {
      if (cartContext.syncWithBackend) {
        await cartContext.syncWithBackend();
      }
    } catch (error) {
      console.error('Cart sync failed:', error);
    }
  }, [cartContext]);

  // Apply coupon code
  const applyCoupon = useCallback(
    async (code: string): Promise<boolean> => {
      try {
        if (!cartContext.applyCoupon) {
          Alert.alert(t('common.error'), t('cart.couponNotAvailable'));
          return false;
        }
        await cartContext.applyCoupon(code);
        return true;
      } catch (error: any) {
        console.error('useCart: Apply coupon failed', error);
        Alert.alert(t('cart.invalidCouponTitle'), error.message || t('cart.failedToApplyCoupon'));
        return false;
      }
    },
    [cartContext, t]
  );

  // Remove coupon
  const removeCoupon = useCallback(
    async (): Promise<boolean> => {
      try {
        if (!cartContext.removeCoupon) {
          return false;
        }
        await cartContext.removeCoupon();
        return true;
      } catch (error: any) {
        console.error('useCart: Remove coupon failed', error);
        return false;
      }
    },
    [cartContext]
  );

  // Validate stock before checkout
  const validateStock = useCallback(
    async (): Promise<boolean> => {
      try {
        if (!cartContext.validateStock) {
          return getCartValidation().isValid;
        }
        return await cartContext.validateStock();
      } catch (error: any) {
        console.error('useCart: Validate stock failed', error);
        return false;
      }
    },
    [cartContext, getCartValidation]
  );

  // Refresh cart from backend
  const refreshCart = useCallback(
    async (): Promise<void> => {
      try {
        if (cartContext.refreshCart) {
          await cartContext.refreshCart();
        }
      } catch (error: any) {
        console.error('useCart: Refresh cart failed', error);
      }
    },
    [cartContext]
  );

  // Get discount percentage
  const getDiscountPercentage = useCallback((product: Product): number => {
    if (product.originalPrice && product.originalPrice > product.price) {
      return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    }
    return 0;
  }, []);

  // Check if product is in stock
  const isInStock = useCallback((product: Product): boolean => {
    const stockQuantity = product.quantity ?? product.stock ?? 0;
    return stockQuantity > 0 && product.status === 'active';
  }, []);

  // Memoized return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      // Cart state from context
      items: cartContext.items,
      savedItems: cartContext.savedItems || [],
      totalItems: cartContext.totalItems,
      subtotal: cartContext.subtotal,
      isLoading: cartContext.isLoading,
      lastUpdated: cartContext.lastUpdated,
      shippingCost: cartContext.shippingCost || getShippingEstimate(),
      taxAmount: cartContext.taxAmount || getTaxEstimate(),
      total: cartContext.total || getTotalEstimate(),
      couponCode: cartContext.couponCode,
      couponDiscount: cartContext.couponDiscount || 0,

      // Enhanced cart actions
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      incrementQuantity,
      decrementQuantity,

      // Save for later actions
      saveForLater: cartContext.saveForLater,
      moveToCart: cartContext.moveToCart,
      getSavedItems: cartContext.getSavedItems,

      // Cart queries
      getCartItem: cartContext.getCartItem,
      isInCart: cartContext.isInCart,
      getItemQuantity,
      canAddToCart,

      // Cart calculations
      getCartSummary,
      getShippingEstimate,
      getTaxEstimate,
      getTotalEstimate,

      // Cart utilities
      formatPrice,
      getCartValidation,
      syncWithServer,

      // Backend integration
      applyCoupon,
      removeCoupon,
      validateStock,
      refreshCart,

      // Helper utilities
      getDiscountPercentage,
      isInStock,
    }),
    [
      t,
      cartContext,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      incrementQuantity,
      decrementQuantity,
      getItemQuantity,
      canAddToCart,
      getCartSummary,
      getShippingEstimate,
      getTaxEstimate,
      getTotalEstimate,
      formatPrice,
      getCartValidation,
      syncWithServer,
      applyCoupon,
      removeCoupon,
      validateStock,
      refreshCart,
      getDiscountPercentage,
      isInStock,
    ]
  );
}

// Export type
export type { UseCartReturn };