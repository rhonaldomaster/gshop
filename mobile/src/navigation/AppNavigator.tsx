
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useCart } from '../contexts/CartContext';
import HomeNavigator from './HomeNavigator';
import CategoriesNavigator from './CategoriesNavigator';
import CartNavigator from './CartNavigator';
import ProfileNavigator from './ProfileNavigator';

export type AppTabParamList = {
  Home: undefined;
  Categories: undefined;
  Cart: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export default function AppNavigator() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { totalItems } = useCart();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Categories':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'Cart':
              iconName = focused ? 'bag' : 'bag-outline';
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
        options={{ tabBarLabel: t('home.title') }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesNavigator}
        options={{ tabBarLabel: t('categories.title') }}
      />
      <Tab.Screen
        name="Cart"
        component={CartNavigator}
        options={{
          tabBarLabel: t('cart.title'),
          tabBarBadge: totalItems > 0 ? totalItems : undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.colors.error,
            color: theme.colors.white,
            fontSize: 10,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            alignItems: 'center',
            justifyContent: 'center',
          },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{ tabBarLabel: t('profile.title') }}
      />
    </Tab.Navigator>
  );
}
