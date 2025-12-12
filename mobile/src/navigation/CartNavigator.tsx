
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CartScreen from '../screens/cart/CartScreen';
import CheckoutScreen from '../screens/checkout/CheckoutScreen';
import GuestCheckoutScreen from '../screens/checkout/GuestCheckoutScreen';
import PaymentWebViewScreen from '../screens/payments/PaymentWebViewScreen';

export type CartStackParamList = {
  CartMain: undefined;
  Checkout: undefined;
  GuestCheckout: undefined;
  PaymentWebView: {
    paymentUrl: string;
    orderId: string;
    paymentId: string;
  };
};

const Stack = createNativeStackNavigator<CartStackParamList>();

export default function CartNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="CartMain" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="GuestCheckout" component={GuestCheckoutScreen} />
      <Stack.Screen
        name="PaymentWebView"
        component={PaymentWebViewScreen}
        options={{
          headerShown: true,
          title: 'Pago',
        }}
      />
    </Stack.Navigator>
  );
}
