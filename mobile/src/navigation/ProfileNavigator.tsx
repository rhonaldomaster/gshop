
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
import CreateAffiliateLiveStreamScreen from '../screens/live/CreateAffiliateLiveStreamScreen';
import GoLiveScreen from '../screens/live/GoLiveScreen';
import NativeBroadcastScreen from '../screens/live/NativeBroadcastScreen';
import OBSSetupScreen from '../screens/live/OBSSetupScreen';
import LiveStreamingScreen from '../screens/live/LiveStreamingScreen';
import LiveStreamResultsScreen from '../screens/live/LiveStreamResultsScreen';
import TransferScreen from '../screens/wallet/TransferScreen';
import WalletScreen from '../screens/wallet/WalletScreen';
import VerificationScreen from '../screens/wallet/VerificationScreen';
import RoleSwitcherScreen from '../screens/settings/RoleSwitcherScreen';
import FollowingScreen from '../screens/social/FollowingScreen';
import { AffiliateProfileScreen, SellerProfileScreen } from '../screens/profiles';

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
  CreateAffiliateLiveStream: undefined;
  GoLive: { streamId: string; hostType: 'seller' | 'affiliate' };
  NativeBroadcast: { streamId: string; hostType: 'seller' | 'affiliate'; useOBS?: boolean };
  OBSSetup: { streamId: string; hostType: 'seller' | 'affiliate' };
  LiveStreaming: { streamId: string; rtmpUrl: string; streamKey: string };
  LiveStreamResults: { streamId: string; stats: any; duration: number };
  Transfer: undefined;
  Wallet: undefined;
  Verification: undefined;
  RoleSwitcher: undefined;
  Following: undefined;
  AffiliateProfile: { affiliateId: string; username?: string };
  SellerProfile: { sellerId: string };
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
      <Stack.Screen name="CreateAffiliateLiveStream" component={CreateAffiliateLiveStreamScreen} />
      <Stack.Screen name="GoLive" component={GoLiveScreen} />
      <Stack.Screen name="NativeBroadcast" component={NativeBroadcastScreen} />
      <Stack.Screen name="OBSSetup" component={OBSSetupScreen} />
      <Stack.Screen name="LiveStreaming" component={LiveStreamingScreen} />
      <Stack.Screen name="LiveStreamResults" component={LiveStreamResultsScreen} />
      <Stack.Screen name="Transfer" component={TransferScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="Verification" component={VerificationScreen} />
      <Stack.Screen name="RoleSwitcher" component={RoleSwitcherScreen} />
      <Stack.Screen name="Following" component={FollowingScreen} />
      <Stack.Screen name="AffiliateProfile" component={AffiliateProfileScreen} />
      <Stack.Screen name="SellerProfile" component={SellerProfileScreen} />
    </Stack.Navigator>
  );
}
