
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from '../screens/profile/ProfileScreen';
import OrdersScreen from '../screens/profile/OrdersScreen';
import OrderDetailScreen from '../screens/profile/OrderDetailScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import NotificationsScreen from '../screens/profile/NotificationsScreen';
import SupportScreen from '../screens/profile/SupportScreen';
import AddressBookScreen from '../screens/profile/AddressBookScreen';
import WishlistScreen from '../screens/social/WishlistScreen';
import PaymentMethodsScreen from '../screens/payments/PaymentMethodsScreen';

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Orders: undefined;
  OrderDetail: { orderId: string };
  Settings: undefined;
  EditProfile: undefined;
  Notifications: undefined;
  Support: undefined;
  Addresses: undefined;
  Wishlist: undefined;
  PaymentMethods: undefined;
};

const Stack = createStackNavigator<ProfileStackParamList>();

export default function ProfileNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="Addresses" component={AddressBookScreen} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
    </Stack.Navigator>
  );
}
