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
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) {
          const { items, savedAt }: StoredCart = JSON.parse(stored);

          // Check if cart has expired
          if (Date.now() - savedAt < CART_EXPIRY_MS) {
            // Restore dates as Date objects
            const restoredItems = items.map(item => ({
              ...item,
              addedAt: new Date(item.addedAt),
            }));
            setCart(restoredItems);
          } else {
            // Cart expired, remove it
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
  }, [storageKey]);

  // Save cart when it changes
  useEffect(() => {
    const saveCart = async () => {
      try {
        if (cart.length > 0) {
          const dataToStore: StoredCart = {
            items: cart,
            savedAt: Date.now(),
          };
          await AsyncStorage.setItem(storageKey, JSON.stringify(dataToStore));
        } else {
          await AsyncStorage.removeItem(storageKey);
        }
      } catch (error) {
        console.error('[useLiveCart] Error saving cart:', error);
      }
    };

    // Don't save during initial load
    if (!isLoading) {
      saveCart();
    }
  }, [cart, storageKey, isLoading]);

  // Add item to cart
  const addItem = useCallback((item: Omit<LiveCartItemData, 'addedAt'>) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(
        existing => existing.productId === item.productId && existing.variantId === item.variantId
      );

      if (existingIndex >= 0) {
        // Update quantity if already exists
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + (item.quantity || 1),
        };
        return updated;
      }

      // Add new item
      return [...prev, {
        ...item,
        addedAt: new Date(),
      }];
    });
  }, []);

  // Update item quantity
  const updateQuantity = useCallback((productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }

    setCart(prev =>
      prev.map(item =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity }
          : item
      )
    );
  }, []);

  // Remove item from cart
  const removeItem = useCallback((productId: string, variantId?: string) => {
    setCart(prev =>
      prev.filter(item =>
        !(item.productId === productId && item.variantId === variantId)
      )
    );
  }, []);

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
    setCart([]);
    try {
      await AsyncStorage.removeItem(storageKey);
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
