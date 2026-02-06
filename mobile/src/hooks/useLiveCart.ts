import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LiveCartItemData } from '../components/live/LiveCartItem';

const LIVE_CART_KEY_PREFIX = 'live_cart:';
const CART_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

interface StoredCart {
  items: LiveCartItemData[];
  savedAt: number;
}

export function useLiveCart(streamId: string) {
  const [cart, setCart] = useState<LiveCartItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const storageKey = `${LIVE_CART_KEY_PREFIX}${streamId}`;

  // Load cart on mount
  useEffect(() => {
    const loadCart = async () => {
      console.log('[useLiveCart] Loading cart for stream:', streamId);
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        console.log('[useLiveCart] Stored data:', stored ? 'found' : 'empty');
        if (stored) {
          const { items, savedAt }: StoredCart = JSON.parse(stored);
          console.log('[useLiveCart] Parsed items:', items.length, 'savedAt:', new Date(savedAt).toISOString());

          // Check if cart has expired
          if (Date.now() - savedAt < CART_EXPIRY_MS) {
            // Restore dates as Date objects
            const restoredItems = items.map(item => ({
              ...item,
              addedAt: new Date(item.addedAt),
            }));
            console.log('[useLiveCart] Restored', restoredItems.length, 'items from storage');
            setCart(restoredItems);
          } else {
            // Cart expired, remove it
            console.log('[useLiveCart] Cart expired, removing');
            await AsyncStorage.removeItem(storageKey);
          }
        }
      } catch (error) {
        console.error('[useLiveCart] Error loading cart:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, [storageKey, streamId]);

  // Remove item from cart - saves immediately to prevent loss on navigation
  const removeItem = useCallback((productId: string, variantId?: string) => {
    setCart(prev => {
      const newCart = prev.filter(item =>
        !(item.productId === productId && item.variantId === variantId)
      );

      // Save immediately to AsyncStorage
      if (newCart.length > 0) {
        const dataToStore: StoredCart = {
          items: newCart,
          savedAt: Date.now(),
        };
        AsyncStorage.setItem(storageKey, JSON.stringify(dataToStore))
          .then(() => console.log('[useLiveCart] Cart saved after remove, items:', newCart.length))
          .catch(err => console.error('[useLiveCart] Error saving cart:', err));
      } else {
        AsyncStorage.removeItem(storageKey)
          .then(() => console.log('[useLiveCart] Cart cleared from storage'))
          .catch(err => console.error('[useLiveCart] Error clearing cart:', err));
      }

      return newCart;
    });
  }, [storageKey]);

  // Add item to cart - saves immediately to prevent loss on navigation
  const addItem = useCallback((item: Omit<LiveCartItemData, 'addedAt'>) => {
    console.log('[useLiveCart] Adding item:', item.productId);
    setCart(prev => {
      const existingIndex = prev.findIndex(
        existing => existing.productId === item.productId && existing.variantId === item.variantId
      );

      let newCart: LiveCartItemData[];
      if (existingIndex >= 0) {
        // Update quantity if already exists
        newCart = [...prev];
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: newCart[existingIndex].quantity + (item.quantity || 1),
        };
        console.log('[useLiveCart] Updated existing item quantity');
      } else {
        // Add new item
        newCart = [...prev, {
          ...item,
          addedAt: new Date(),
        }];
        console.log('[useLiveCart] Added new item to cart');
      }

      // Save immediately to AsyncStorage (fire and forget but ensures persistence)
      const dataToStore: StoredCart = {
        items: newCart,
        savedAt: Date.now(),
      };
      AsyncStorage.setItem(storageKey, JSON.stringify(dataToStore))
        .then(() => console.log('[useLiveCart] Cart saved immediately, total items:', newCart.length))
        .catch(err => console.error('[useLiveCart] Error saving cart:', err));

      return newCart;
    });
  }, [storageKey]);

  // Update item quantity - saves immediately to prevent loss on navigation
  const updateQuantity = useCallback((productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }

    setCart(prev => {
      const newCart = prev.map(item =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity }
          : item
      );

      // Save immediately to AsyncStorage
      const dataToStore: StoredCart = {
        items: newCart,
        savedAt: Date.now(),
      };
      AsyncStorage.setItem(storageKey, JSON.stringify(dataToStore))
        .then(() => console.log('[useLiveCart] Cart saved after quantity update'))
        .catch(err => console.error('[useLiveCart] Error saving cart:', err));

      return newCart;
    });
  }, [storageKey, removeItem]);

  // Check if product is in cart
  const isInCart = useCallback((productId: string, variantId?: string) => {
    return cart.some(item =>
      item.productId === productId && (variantId ? item.variantId === variantId : true)
    );
  }, [cart]);

  // Get item from cart
  const getItem = useCallback((productId: string, variantId?: string) => {
    return cart.find(item =>
      item.productId === productId && (variantId ? item.variantId === variantId : true)
    );
  }, [cart]);

  // Clear entire cart
  const clearCart = useCallback(async () => {
    console.log('[useLiveCart] Clearing cart');
    setCart([]);
    try {
      await AsyncStorage.removeItem(storageKey);
      console.log('[useLiveCart] Cart cleared from storage');
    } catch (error) {
      console.error('[useLiveCart] Error clearing cart:', error);
    }
  }, [storageKey]);

  // Get cart summary
  const getSummary = useCallback(() => {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => {
      const price = item.specialPrice ?? item.product.price;
      return sum + (price * item.quantity);
    }, 0);
    const originalTotal = cart.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);
    const discount = originalTotal - subtotal;

    return {
      totalItems,
      subtotal,
      originalTotal,
      discount,
      itemCount: cart.length,
    };
  }, [cart]);

  // Get time until cart expires
  const getExpiryInfo = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const { savedAt }: StoredCart = JSON.parse(stored);
        const elapsed = Date.now() - savedAt;
        const remaining = CART_EXPIRY_MS - elapsed;

        if (remaining > 0) {
          return {
            isExpired: false,
            remainingMs: remaining,
            remainingMinutes: Math.ceil(remaining / 60000),
          };
        }
      }
    } catch (error) {
      console.error('[useLiveCart] Error getting expiry info:', error);
    }

    return {
      isExpired: true,
      remainingMs: 0,
      remainingMinutes: 0,
    };
  }, [storageKey]);

  return {
    cart,
    setCart,
    isLoading,
    addItem,
    updateQuantity,
    removeItem,
    isInCart,
    getItem,
    clearCart,
    getSummary,
    getExpiryInfo,
  };
}

// Utility to clean up expired carts
export async function cleanupExpiredCarts() {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cartKeys = allKeys.filter(key => key.startsWith(LIVE_CART_KEY_PREFIX));

    for (const key of cartKeys) {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const { savedAt }: StoredCart = JSON.parse(stored);
        if (Date.now() - savedAt >= CART_EXPIRY_MS) {
          await AsyncStorage.removeItem(key);
          console.log(`[useLiveCart] Cleaned up expired cart: ${key}`);
        }
      }
    }
  } catch (error) {
    console.error('[useLiveCart] Error cleaning up expired carts:', error);
  }
}
