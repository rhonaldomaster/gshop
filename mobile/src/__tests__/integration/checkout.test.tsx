import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import CheckoutScreen from '../../screens/checkout/CheckoutScreen';
import { CartContext } from '../../contexts/CartContext';
import { AuthContext } from '../../contexts/AuthContext';

// Mock services
jest.mock('../../services/orders.service');
jest.mock('../../services/payments.service');

const mockCartContext = {
  items: [
    {
      product: {
        id: '1',
        name: 'Test Product',
        price: 100,
        image: 'test.jpg',
      },
      quantity: 2,
    },
  ],
  totalPrice: 200,
  totalItems: 2,
  clearCart: jest.fn(),
  addItem: jest.fn(),
  removeItem: jest.fn(),
  updateQuantity: jest.fn(),
};

const mockAuthContext = {
  user: {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
  },
  token: 'mock-token',
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
};

const renderCheckoutScreen = () => {
  return render(
    <NavigationContainer>
      <AuthContext.Provider value={mockAuthContext}>
        <CartContext.Provider value={mockCartContext}>
          <CheckoutScreen />
        </CartContext.Provider>
      </AuthContext.Provider>
    </NavigationContainer>
  );
};

describe('Checkout Flow Integration', () => {
  it('should display cart items and total', () => {
    const { getByText } = renderCheckoutScreen();

    expect(getByText('Test Product')).toBeTruthy();
    expect(getByText('$200')).toBeTruthy();
    expect(getByText('Quantity: 2')).toBeTruthy();
  });

  it('should navigate through checkout steps', async () => {
    const { getByText, getByPlaceholderText } = renderCheckoutScreen();

    // Step 1: Shipping address
    const addressInput = getByPlaceholderText('Enter shipping address');
    fireEvent.changeText(addressInput, '123 Test St');

    const continueButton = getByText('Continue');
    fireEvent.press(continueButton);

    // Step 2: Payment method should appear
    await waitFor(() => {
      expect(getByText('Payment Method')).toBeTruthy();
    });
  });

  it('should validate required fields', async () => {
    const { getByText } = renderCheckoutScreen();

    const placeOrderButton = getByText('Place Order');
    fireEvent.press(placeOrderButton);

    await waitFor(() => {
      expect(getByText('Please fill in all required fields')).toBeTruthy();
    });
  });

  it('should complete checkout successfully', async () => {
    const { getByText, getByPlaceholderText } = renderCheckoutScreen();

    // Fill in shipping info
    fireEvent.changeText(
      getByPlaceholderText('Enter shipping address'),
      '123 Test St'
    );
    fireEvent.changeText(getByPlaceholderText('City'), 'Test City');
    fireEvent.changeText(getByPlaceholderText('Postal Code'), '12345');

    // Select payment method
    fireEvent.press(getByText('Credit Card'));

    // Place order
    fireEvent.press(getByText('Place Order'));

    await waitFor(() => {
      expect(mockCartContext.clearCart).toHaveBeenCalled();
      expect(getByText('Order Placed Successfully')).toBeTruthy();
    });
  });

  it('should handle payment errors gracefully', async () => {
    const { getByText } = renderCheckoutScreen();

    // Mock payment service to fail
    const { paymentsService } = require('../../services/payments.service');
    paymentsService.processPayment = jest
      .fn()
      .mockRejectedValue(new Error('Payment failed'));

    fireEvent.press(getByText('Place Order'));

    await waitFor(() => {
      expect(getByText('Payment Failed')).toBeTruthy();
      expect(mockCartContext.clearCart).not.toHaveBeenCalled();
    });
  });
});