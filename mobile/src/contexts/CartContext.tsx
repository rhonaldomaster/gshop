import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api.config';
import { Product } from '../services/products.service';
import { cartService, CartResponse, CartItem as BackendCartItem } from '../services/cart.service';
import { useAuth } from './AuthContext';

// Cart item interface
export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  subtotal: number;
  addedAt: string;
  savedForLater?: boolean;
}

// Cart state interface
interface CartState {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
  couponCode?: string;
  couponDiscount: number;
  isLoading: boolean;
  lastUpdated: string | null;
}

// Cart context interface
interface CartContextType extends CartState {
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartItem: (productId: string) => CartItem | undefined;
  isInCart: (productId: string) => boolean;
  incrementQuantity: (productId: string) => Promise<void>;
  decrementQuantity: (productId: string) => Promise<void>;
  getCartSummary: () => {
    totalItems: number;
    subtotal: number;
    itemCount: number;
  };
  syncWithBackend: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  validateStock: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
}

// Cart actions
type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CART'; payload: CartResponse }
  | { type: 'SET_LOCAL_CART'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'UPDATE_TOTALS' };

// Cart reducer
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_CART': {
      const backendCart = action.payload;
      const items: CartItem[] = backendCart.items
        .filter((item) => !item.savedForLater)
        .map((item) => ({
          id: item.id,
          productId: item.productId,
          product: item.product,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
          addedAt: item.createdAt,
          savedForLater: item.savedForLater,
        }));

      return {
        ...state,
        items,
        totalItems: backendCart.itemCount,
        subtotal: backendCart.subtotal,
        shippingCost: backendCart.shippingCost,
        taxAmount: backendCart.taxAmount,
        total: backendCart.total,
        couponCode: backendCart.couponCode,
        couponDiscount: backendCart.couponDiscount,
        isLoading: false,
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'SET_LOCAL_CART': {
      const items = action.payload;
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const shippingCost = subtotal > 100 ? 0 : subtotal > 0 ? 10 : 0;
      const taxAmount = subtotal * 0.1;
      const total = subtotal + shippingCost + taxAmount;

      return {
        ...state,
        items,
        totalItems,
        subtotal,
        shippingCost,
        taxAmount,
        total,
        isLoading: false,
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'ADD_ITEM': {
      const newItem = action.payload;
      const existingItemIndex = state.items.findIndex(
        (item) => item.productId === newItem.productId
      );

      let updatedItems: CartItem[];

      if (existingItemIndex >= 0) {
        updatedItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? {
                ...item,
                quantity: item.quantity + newItem.quantity,
                subtotal: (item.quantity + newItem.quantity) * item.price,
              }
            : item
        );
      } else {
        updatedItems = [...state.items, newItem];
      }

      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const subtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
      const shippingCost = subtotal > 100 ? 0 : subtotal > 0 ? 10 : 0;
      const taxAmount = subtotal * 0.1;
      const total = subtotal + shippingCost + taxAmount - state.couponDiscount;

      return {
        ...state,
        items: updatedItems,
        totalItems,
        subtotal,
        shippingCost,
        taxAmount,
        total,
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter((item) => item.productId !== action.payload);
      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const subtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
      const shippingCost = subtotal > 100 ? 0 : subtotal > 0 ? 10 : 0;
      const taxAmount = subtotal * 0.1;
      const total = subtotal + shippingCost + taxAmount - state.couponDiscount;

      return {
        ...state,
        items: updatedItems,
        totalItems,
        subtotal,
        shippingCost,
        taxAmount,
        total,
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;

      if (quantity <= 0) {
        const updatedItems = state.items.filter((item) => item.productId !== productId);
        const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
        const shippingCost = subtotal > 100 ? 0 : subtotal > 0 ? 10 : 0;
        const taxAmount = subtotal * 0.1;
        const total = subtotal + shippingCost + taxAmount - state.couponDiscount;

        return {
          ...state,
          items: updatedItems,
          totalItems,
          subtotal,
          shippingCost,
          taxAmount,
          total,
          lastUpdated: new Date().toISOString(),
        };
      }

      const updatedItems = state.items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.price,
            }
          : item
      );

      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const subtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
      const shippingCost = subtotal > 100 ? 0 : subtotal > 0 ? 10 : 0;
      const taxAmount = subtotal * 0.1;
      const total = subtotal + shippingCost + taxAmount - state.couponDiscount;

      return {
        ...state,
        items: updatedItems,
        totalItems,
        subtotal,
        shippingCost,
        taxAmount,
        total,
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        totalItems: 0,
        subtotal: 0,
        shippingCost: 0,
        taxAmount: 0,
        total: 0,
        couponCode: undefined,
        couponDiscount: 0,
        lastUpdated: new Date().toISOString(),
      };

    case 'UPDATE_TOTALS': {
      const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
      const subtotal = state.items.reduce((sum, item) => sum + item.subtotal, 0);
      const shippingCost = subtotal > 100 ? 0 : subtotal > 0 ? 10 : 0;
      const taxAmount = subtotal * 0.1;
      const total = subtotal + shippingCost + taxAmount - state.couponDiscount;

      return {
        ...state,
        totalItems,
        subtotal,
        shippingCost,
        taxAmount,
        total,
        lastUpdated: new Date().toISOString(),
      };
    }

    default:
      return state;
  }
};

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Cart provider props
interface CartProviderProps {
  children: ReactNode;
}

// Cart provider component
export function CartProvider({ children }: CartProviderProps) {
  const { isAuthenticated } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    totalItems: 0,
    subtotal: 0,
    shippingCost: 0,
    taxAmount: 0,
    total: 0,
    couponDiscount: 0,
    isLoading: true,
    lastUpdated: null,
  });

  // Load cart on mount
  useEffect(() => {
    // Only load from backend if explicitly authenticated (true)
    // Otherwise load from storage (includes false and undefined states)
    if (isAuthenticated === true) {
      refreshCart();
    } else {
      loadCartFromStorage();
    }
  }, [isAuthenticated]);

  // Save cart to storage whenever it changes (for offline support)
  useEffect(() => {
    if (!state.isLoading && state.lastUpdated && !isAuthenticated) {
      saveCartToStorage();
    }
  }, [state.items, state.isLoading, state.lastUpdated, isAuthenticated]);

  // Sync with backend when user logs in
  useEffect(() => {
    if (isAuthenticated === true && state.items.length > 0 && !state.isLoading) {
      syncWithBackend();
    }
  }, [isAuthenticated]);

  // Load cart from AsyncStorage (offline mode)
  const loadCartFromStorage = async (): Promise<void> => {
    try {
      const cartData = await AsyncStorage.getItem(API_CONFIG.STORAGE_KEYS.CART_DATA);

      if (cartData) {
        const parsedCart: CartItem[] = JSON.parse(cartData);

        const validItems = parsedCart.filter(
          (item) =>
            item.productId && item.product && item.quantity > 0 && item.price > 0
        );

        dispatch({ type: 'SET_LOCAL_CART', payload: validItems });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('CartContext: Failed to load cart from storage', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Save cart to AsyncStorage
  const saveCartToStorage = async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(
        API_CONFIG.STORAGE_KEYS.CART_DATA,
        JSON.stringify(state.items)
      );
    } catch (error) {
      console.error('CartContext: Failed to save cart to storage', error);
    }
  };

  // Refresh cart from backend
  const refreshCart = async (): Promise<void> => {
    // Only refresh from backend if explicitly authenticated
    if (isAuthenticated !== true) {
      await loadCartFromStorage();
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const cart = await cartService.getCart();
      dispatch({ type: 'SET_CART', payload: cart });
    } catch (error) {
      console.error('CartContext: Failed to refresh cart', error);
      // Fallback to local storage if backend fails
      await loadCartFromStorage();
    }
  };

  // Sync local cart with backend
  const syncWithBackend = async (): Promise<void> => {
    if (isAuthenticated !== true) return;

    try {
      const localItems = state.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        variantId: undefined,
      }));

      const cart = await cartService.syncCart({ items: localItems });
      dispatch({ type: 'SET_CART', payload: cart });

      // Clear local storage after successful sync
      await AsyncStorage.removeItem(API_CONFIG.STORAGE_KEYS.CART_DATA);
    } catch (error) {
      console.error('CartContext: Failed to sync with backend', error);
    }
  };

  // Add product to cart
  const addToCart = async (product: Product, quantity: number = 1): Promise<void> => {
    try {
      if (product.status !== 'active' || product.stock < quantity) {
        throw new Error('Product is not available or insufficient stock');
      }

      if (isAuthenticated === true) {
        // Add to backend
        const cart = await cartService.addItem({
          productId: product.id,
          quantity,
        });
        dispatch({ type: 'SET_CART', payload: cart });
      } else {
        // Add to local storage
        const cartItem: CartItem = {
          id: `${product.id}_${Date.now()}`,
          productId: product.id,
          product,
          quantity,
          price: product.price,
          subtotal: product.price * quantity,
          addedAt: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_ITEM', payload: cartItem });
      }
    } catch (error) {
      console.error('CartContext: Add to cart failed', error);
      throw error;
    }
  };

  // Remove product from cart
  const removeFromCart = async (productId: string): Promise<void> => {
    try {
      if (isAuthenticated === true) {
        const item = state.items.find((i) => i.productId === productId);
        if (item) {
          const cart = await cartService.removeItem(item.id);
          dispatch({ type: 'SET_CART', payload: cart });
        }
      } else {
        dispatch({ type: 'REMOVE_ITEM', payload: productId });
      }
    } catch (error) {
      console.error('CartContext: Remove from cart failed', error);
      throw error;
    }
  };

  // Update item quantity
  const updateQuantity = async (productId: string, quantity: number): Promise<void> => {
    try {
      if (quantity < 0) {
        throw new Error('Quantity cannot be negative');
      }

      const cartItem = state.items.find((item) => item.productId === productId);
      if (cartItem && cartItem.product.stock < quantity) {
        throw new Error('Insufficient stock available');
      }

      if (isAuthenticated === true && cartItem) {
        const cart = await cartService.updateQuantity(cartItem.id, { quantity });
        dispatch({ type: 'SET_CART', payload: cart });
      } else {
        dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
      }
    } catch (error) {
      console.error('CartContext: Update quantity failed', error);
      throw error;
    }
  };

  // Clear entire cart
  const clearCart = async (): Promise<void> => {
    try {
      if (isAuthenticated === true) {
        const cart = await cartService.clearCart();
        dispatch({ type: 'SET_CART', payload: cart });
      } else {
        dispatch({ type: 'CLEAR_CART' });
      }
    } catch (error) {
      console.error('CartContext: Clear cart failed', error);
      throw error;
    }
  };

  // Apply coupon code
  const applyCoupon = async (code: string): Promise<void> => {
    if (isAuthenticated !== true) {
      throw new Error('Must be logged in to apply coupons');
    }

    try {
      const cart = await cartService.applyCoupon({ code });
      dispatch({ type: 'SET_CART', payload: cart });
    } catch (error) {
      console.error('CartContext: Apply coupon failed', error);
      throw error;
    }
  };

  // Remove coupon
  const removeCoupon = async (): Promise<void> => {
    if (isAuthenticated !== true) {
      return;
    }

    try {
      const cart = await cartService.removeCoupon();
      dispatch({ type: 'SET_CART', payload: cart });
    } catch (error) {
      console.error('CartContext: Remove coupon failed', error);
      throw error;
    }
  };

  // Validate stock before checkout
  const validateStock = async (): Promise<boolean> => {
    if (isAuthenticated !== true) {
      return true;
    }

    try {
      const validation = await cartService.validateStock();
      return validation.valid;
    } catch (error) {
      console.error('CartContext: Validate stock failed', error);
      return false;
    }
  };

  // Get specific cart item
  const getCartItem = (productId: string): CartItem | undefined => {
    return state.items.find((item) => item.productId === productId);
  };

  // Check if product is in cart
  const isInCart = (productId: string): boolean => {
    return state.items.some((item) => item.productId === productId);
  };

  // Increment quantity by 1
  const incrementQuantity = async (productId: string): Promise<void> => {
    const cartItem = getCartItem(productId);
    if (cartItem) {
      await updateQuantity(productId, cartItem.quantity + 1);
    }
  };

  // Decrement quantity by 1
  const decrementQuantity = async (productId: string): Promise<void> => {
    const cartItem = getCartItem(productId);
    if (cartItem) {
      await updateQuantity(productId, cartItem.quantity - 1);
    }
  };

  // Get cart summary
  const getCartSummary = () => {
    return {
      totalItems: state.totalItems,
      subtotal: state.subtotal,
      itemCount: state.items.length,
    };
  };

  return (
    <CartContext.Provider
      value={{
        ...state,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartItem,
        isInCart,
        incrementQuantity,
        decrementQuantity,
        getCartSummary,
        syncWithBackend,
        applyCoupon,
        removeCoupon,
        validateStock,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Custom hook to use cart context
export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

// Export cart item type for other components
export type { CartItem };
