import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import './src/i18n'; // Initialize i18n
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { CartProvider } from './src/contexts/CartContext';
import { ProductsProvider } from './src/contexts/ProductsContext';
import { UserRoleProvider } from './src/contexts/UserRoleContext';
import { StripeProvider } from './src/providers/StripeProvider';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  const [fontLoaded, setFontLoaded] = React.useState(false);

  useEffect(() => {
    console.log('✅ App mounted successfully');
    // Using system fonts for now - can add custom fonts later
    setFontLoaded(true);
  }, []);

  if (!fontLoaded) {
    return null; // Loading screen
  }

  return (
    <SafeAreaProvider>
      <StripeProvider>
        <ThemeProvider>
          <AuthProvider>
            <UserRoleProvider>
              <ProductsProvider>
                <CartProvider>
                  <NavigationContainer>
                    <StatusBar style="auto" />
                    <RootNavigator />
                  </NavigationContainer>
                  <Toast />
                </CartProvider>
              </ProductsProvider>
            </UserRoleProvider>
          </AuthProvider>
        </ThemeProvider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}
