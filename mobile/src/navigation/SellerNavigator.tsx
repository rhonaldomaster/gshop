import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SellerDashboardScreen from '../screens/seller/SellerDashboardScreen';

export type SellerStackParamList = {
  SellerDashboardMain: undefined;
  SellerProducts: undefined;
  SellerAddProduct: undefined;
  SellerEditProduct: { productId: string };
  SellerOrders: undefined;
  SellerOrderDetail: { orderId: string };
  SellerAnalytics: undefined;
};

const Stack = createNativeStackNavigator<SellerStackParamList>();

export default function SellerNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="SellerDashboardMain" component={SellerDashboardScreen} />
      {/* Additional screens will be added as they are implemented */}
    </Stack.Navigator>
  );
}
