
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import GSText from '../../components/ui/GSText';

export default function CartScreen() {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <GSText variant="h2" weight="bold">
          Shopping Cart
        </GSText>
        <GSText variant="body" color="textSecondary" style={styles.subtitle}>
          Your cart is empty
        </GSText>
        <GSText variant="body" color="textSecondary" style={styles.comingSoon}>
          Cart functionality coming soon...
        </GSText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  comingSoon: {
    marginTop: 20,
    textAlign: 'center',
  },
});
