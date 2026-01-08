
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
import ProductDetailScreen from '../screens/products/ProductDetailScreen';
import { AffiliateScreen } from '../screens/affiliate/AffiliateScreen';
import { AffiliateRegistrationScreen } from '../screens/affiliate/AffiliateRegistrationScreen';
import TransferScreen from '../screens/wallet/TransferScreen';
import WalletScreen from '../screens/wallet/WalletScreen';

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
  ProductDetail: { productId: string };
  Affiliate: undefined;
  AffiliateRegistration: undefined;
  Transfer: undefined;
  Wallet: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
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
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Affiliate" component={AffiliateScreen} />
      <Stack.Screen name="AffiliateRegistration" component={AffiliateRegistrationScreen} />
      <Stack.Screen name="Transfer" component={TransferScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
    </Stack.Navigator>
  );
}
