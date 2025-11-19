
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/home/HomeScreen';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';
import SearchScreen from '../screens/search/SearchScreen';
import WishlistScreen from '../screens/social/WishlistScreen';
import PaymentMethodsScreen from '../screens/payments/PaymentMethodsScreen';
import { TrendingScreen } from '../screens/recommendations/TrendingScreen';
import CategoryProductsScreen from '../screens/categories/CategoryProductsScreen';
import LiveStreamsScreen from '../screens/live/LiveStreamsScreen';
import LiveStreamScreen from '../screens/live/LiveStreamScreen';
import CreateLiveStreamScreen from '../screens/live/CreateLiveStreamScreen';
import LiveStreamingScreen from '../screens/live/LiveStreamingScreen';
import LiveStreamResultsScreen from '../screens/live/LiveStreamResultsScreen';

export type HomeStackParamList = {
  HomeMain: undefined;
  ProductDetail: { productId: string; liveSessionId?: string; affiliateId?: string };
  Search: { query?: string };
  Wishlist: undefined;
  PaymentMethods: undefined;
  Trending: undefined;
  CategoryProducts: { categoryId: string; categoryName: string };
  LiveStreams: undefined;
  LiveStream: { streamId: string };
  CreateLiveStream: undefined;
  LiveStreaming: { streamId: string; rtmpUrl: string; streamKey: string };
  LiveStreamResults: { streamId: string; stats: any; duration: number };
};

const Stack = createStackNavigator<HomeStackParamList>();

export default function HomeNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="Trending" component={TrendingScreen} />
      <Stack.Screen name="CategoryProducts" component={CategoryProductsScreen} />

      {/* Live Streaming Screens */}
      <Stack.Screen name="LiveStreams" component={LiveStreamsScreen} />
      <Stack.Screen name="LiveStream" component={LiveStreamScreen} />
      <Stack.Screen
        name="CreateLiveStream"
        component={CreateLiveStreamScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="LiveStreaming"
        component={LiveStreamingScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="LiveStreamResults"
        component={LiveStreamResultsScreen}
        options={{ gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
