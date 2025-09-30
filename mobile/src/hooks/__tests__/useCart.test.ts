import { renderHook, act } from '@testing-library/react-hooks';
import { useCart } from '../useCart';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');

describe('useCart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty cart', () => {
    const { result } = renderHook(() => useCart());

    expect(result.current.items).toEqual([]);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalPrice).toBe(0);
  });

  it('should add item to cart', () => {
    const { result } = renderHook(() => useCart());

    const product = {
      id: '1',
      name: 'Test Product',
      price: 100,
      image: 'test.jpg',
    };

    act(() => {
      result.current.addItem(product);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toMatchObject({
      product,
      quantity: 1,
    });
    expect(result.current.totalItems).toBe(1);
    expect(result.current.totalPrice).toBe(100);
  });

  it('should increase quantity when adding same item', () => {
    const { result } = renderHook(() => useCart());

    const product = {
      id: '1',
      name: 'Test Product',
      price: 100,
      image: 'test.jpg',
    };

    act(() => {
      result.current.addItem(product);
      result.current.addItem(product);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.totalItems).toBe(2);
    expect(result.current.totalPrice).toBe(200);
  });

  it('should remove item from cart', () => {
    const { result } = renderHook(() => useCart());

    const product = {
      id: '1',
      name: 'Test Product',
      price: 100,
      image: 'test.jpg',
    };

    act(() => {
      result.current.addItem(product);
      result.current.removeItem('1');
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalPrice).toBe(0);
  });

  it('should update item quantity', () => {
    const { result } = renderHook(() => useCart());

    const product = {
      id: '1',
      name: 'Test Product',
      price: 100,
      image: 'test.jpg',
    };

    act(() => {
      result.current.addItem(product);
      result.current.updateQuantity('1', 5);
    });

    expect(result.current.items[0].quantity).toBe(5);
    expect(result.current.totalItems).toBe(5);
    expect(result.current.totalPrice).toBe(500);
  });

  it('should clear cart', () => {
    const { result } = renderHook(() => useCart());

    const product = {
      id: '1',
      name: 'Test Product',
      price: 100,
      image: 'test.jpg',
    };

    act(() => {
      result.current.addItem(product);
      result.current.clearCart();
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.totalItems).toBe(0);
  });

  it('should calculate total price with multiple items', () => {
    const { result } = renderHook(() => useCart());

    const product1 = {
      id: '1',
      name: 'Product 1',
      price: 100,
      image: 'test1.jpg',
    };

    const product2 = {
      id: '2',
      name: 'Product 2',
      price: 50,
      image: 'test2.jpg',
    };

    act(() => {
      result.current.addItem(product1);
      result.current.addItem(product2);
      result.current.updateQuantity('1', 2);
    });

    // 2 * 100 + 1 * 50 = 250
    expect(result.current.totalPrice).toBe(250);
    expect(result.current.totalItems).toBe(3);
  });
});