
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { CartProvider } from './src/contexts/CartContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  const [fontLoaded, setFontLoaded] = React.useState(false);

  useEffect(() => {
    // Using system fonts for now - can add custom fonts later
    setFontLoaded(true);
  }, []);

  if (!fontLoaded) {
    return null; // Loading screen
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <NavigationContainer>
              <StatusBar style="auto" />
              <RootNavigator />
            </NavigationContainer>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
