import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api.config';
import { Product } from '../services/products.service';

// Cart item interface
export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  subtotal: number;
  addedAt: string;
}

// Cart state interface
interface CartState {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
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
}

// Cart actions
type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CART'; payload: CartItem[] }
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
      const items = action.payload;
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

      return {
        ...state,
        items,
        totalItems,
        subtotal,
        isLoading: false,
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'ADD_ITEM': {
      const newItem = action.payload;
      const existingItemIndex = state.items.findIndex(
        item => item.productId === newItem.productId
      );

      let updatedItems: CartItem[];

      if (existingItemIndex >= 0) {
        // Update existing item quantity
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
        // Add new item
        updatedItems = [...state.items, newItem];
      }

      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const subtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);

      return {
        ...state,
        items: updatedItems,
        totalItems,
        subtotal,
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.productId !== action.payload);
      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const subtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);

      return {
        ...state,
        items: updatedItems,
        totalItems,
        subtotal,
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;

      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        const updatedItems = state.items.filter(item => item.productId !== productId);
        const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);

        return {
          ...state,
          items: updatedItems,
          totalItems,
          subtotal,
          lastUpdated: new Date().toISOString(),
        };
      }

      const updatedItems = state.items.map(item =>
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

      return {
        ...state,
        items: updatedItems,
        totalItems,
        subtotal,
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        totalItems: 0,
        subtotal: 0,
        lastUpdated: new Date().toISOString(),
      };

    case 'UPDATE_TOTALS': {
      const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
      const subtotal = state.items.reduce((sum, item) => sum + item.subtotal, 0);

      return {
        ...state,
        totalItems,
        subtotal,
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
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    totalItems: 0,
    subtotal: 0,
    isLoading: true,
    lastUpdated: null,
  });

  // Load cart from storage on mount
  useEffect(() => {
    loadCartFromStorage();
  }, []);

  // Save cart to storage whenever it changes
  useEffect(() => {
    if (!state.isLoading && state.lastUpdated) {
      saveCartToStorage();
    }
  }, [state.items, state.isLoading, state.lastUpdated]);

  // Load cart from AsyncStorage
  const loadCartFromStorage = async (): Promise<void> => {
    try {
      const cartData = await AsyncStorage.getItem(API_CONFIG.STORAGE_KEYS.CART_DATA);

      if (cartData) {
        const parsedCart: CartItem[] = JSON.parse(cartData);

        // Validate cart items and remove invalid ones
        const validItems = parsedCart.filter(item =>
          item.productId &&
          item.product &&
          item.quantity > 0 &&
          item.price > 0
        );

        dispatch({ type: 'SET_CART', payload: validItems });
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

  // Add product to cart
  const addToCart = async (product: Product, quantity: number = 1): Promise<void> => {
    try {
      // Check if product is available
      if (product.status !== 'active' || product.stock < quantity) {
        throw new Error('Product is not available or insufficient stock');
      }

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
    } catch (error) {
      console.error('CartContext: Add to cart failed', error);
      throw error;
    }
  };

  // Remove product from cart
  const removeFromCart = async (productId: string): Promise<void> => {
    try {
      dispatch({ type: 'REMOVE_ITEM', payload: productId });
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

      // Check stock availability
      const cartItem = state.items.find(item => item.productId === productId);
      if (cartItem && cartItem.product.stock < quantity) {
        throw new Error('Insufficient stock available');
      }

      dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
    } catch (error) {
      console.error('CartContext: Update quantity failed', error);
      throw error;
    }
  };

  // Clear entire cart
  const clearCart = async (): Promise<void> => {
    try {
      dispatch({ type: 'CLEAR_CART' });
    } catch (error) {
      console.error('CartContext: Clear cart failed', error);
      throw error;
    }
  };

  // Get specific cart item
  const getCartItem = (productId: string): CartItem | undefined => {
    return state.items.find(item => item.productId === productId);
  };

  // Check if product is in cart
  const isInCart = (productId: string): boolean => {
    return state.items.some(item => item.productId === productId);
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