
import React from 'react';
import { View, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import GSText from '../components/ui/GSText';

export default function LoadingScreen() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/adaptive-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
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
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    marginBottom: 32,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 16,
  },
});
