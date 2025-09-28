
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useCart } from '../hooks/useCart';
import HomeNavigator from './HomeNavigator';
import CategoriesNavigator from './CategoriesNavigator';
import CartScreen from '../screens/cart/CartScreen';
import ProfileNavigator from './ProfileNavigator';

export type AppTabParamList = {
  Home: undefined;
  Categories: undefined;
  Cart: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

// Cart icon with badge component
const CartIconWithBadge = ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
  const { theme } = useTheme();
  const { totalItems } = useCart();

  return (
    <View style={styles.cartIconContainer}>
      <Ionicons
        name={focused ? 'bag' : 'bag-outline'}
        size={size}
        color={color}
      />
      {totalItems > 0 && (
        <View style={[styles.cartBadge, { backgroundColor: theme.colors.error }]}>
          <Text style={[styles.cartBadgeText, { color: theme.colors.white }]}>
            {totalItems > 99 ? '99+' : totalItems.toString()}
          </Text>
        </View>
      )}
    </View>
  );
};

export default function AppNavigator() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          // Use custom cart icon with badge for Cart tab
          if (route.name === 'Cart') {
            return <CartIconWithBadge focused={focused} color={color} size={size} />;
          }

          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Categories':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.white,
          borderTopColor: theme.colors.gray200,
          borderTopWidth: 1,
          paddingBottom: Math.max(insets.bottom, 5),
          paddingTop: 5,
          height: 60 + Math.max(insets.bottom - 5, 0),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeNavigator} 
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="Categories" 
        component={CategoriesNavigator} 
        options={{ tabBarLabel: 'Categories' }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarLabel: 'Cart',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileNavigator} 
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  cartIconContainer: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
