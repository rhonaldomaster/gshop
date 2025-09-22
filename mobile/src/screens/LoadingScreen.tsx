
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import GSText from '../components/ui/GSText';

export default function LoadingScreen() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.logo, { backgroundColor: theme.colors.primary }]}>
          <GSText style={styles.logoText} variant="h2" color="white">G</GSText>
        </View>
        <GSText variant="h3" style={styles.title}>GSHOP</GSText>
        <ActivityIndicator 
          size="large" 
          color={theme.colors.primary} 
          style={styles.loader}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontWeight: 'bold',
  },
  title: {
    marginBottom: 32,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 16,
  },
});
