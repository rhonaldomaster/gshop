
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import GSText from '../../components/ui/GSText';

export default function OrdersScreen() {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={[{ backgroundColor: theme.colors.background }, { flex: 1 }]}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <GSText variant="h2" weight="bold">My Orders</GSText>
        <GSText variant="body" color="textSecondary" style={{ marginTop: 20, textAlign: 'center' }}>
          Orders screen coming soon...
        </GSText>
      </View>
    </SafeAreaView>
  );
}
