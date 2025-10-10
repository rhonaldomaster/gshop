
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CartScreen from '../screens/cart/CartScreen';
import CheckoutScreen from '../screens/checkout/CheckoutScreen';
import GuestCheckoutScreen from '../screens/checkout/GuestCheckoutScreen';

export type CartStackParamList = {
  CartMain: undefined;
  Checkout: undefined;
  GuestCheckout: undefined;
};

const Stack = createStackNavigator<CartStackParamList>();

export default function CartNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="CartMain" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="GuestCheckout" component={GuestCheckoutScreen} />
    </Stack.Navigator>
  );
}
