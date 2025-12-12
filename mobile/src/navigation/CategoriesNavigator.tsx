
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CategoriesScreen from '../screens/categories/CategoriesScreen';
import CategoryProductsScreen from '../screens/categories/CategoryProductsScreen';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';

export type CategoriesStackParamList = {
  CategoriesMain: undefined;
  CategoryProducts: { categoryId: string; categoryName: string };
  ProductDetail: { productId: string };
};

const Stack = createNativeStackNavigator<CategoriesStackParamList>();

export default function CategoriesNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="CategoriesMain" component={CategoriesScreen} />
      <Stack.Screen name="CategoryProducts" component={CategoryProductsScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </Stack.Navigator>
  );
}
