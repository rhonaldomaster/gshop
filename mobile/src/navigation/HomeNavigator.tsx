
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/home/HomeScreen';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';
import SearchScreen from '../screens/search/SearchScreen';
import WishlistScreen from '../screens/social/WishlistScreen';
import PaymentMethodsScreen from '../screens/payments/PaymentMethodsScreen';
import { TrendingScreen } from '../screens/recommendations/TrendingScreen';
import CategoryProductsScreen from '../screens/categories/CategoryProductsScreen';

export type HomeStackParamList = {
  HomeMain: undefined;
  ProductDetail: { productId: string };
  Search: { query?: string };
  Wishlist: undefined;
  PaymentMethods: undefined;
  Trending: undefined;
  CategoryProducts: { categoryId: string; categoryName: string };
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
    </Stack.Navigator>
  );
}
