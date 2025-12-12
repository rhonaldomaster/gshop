import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

/**
 * Generic loading state component
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'large',
  fullScreen = false,
}) => {
  return (
    <View style={[styles.container, fullScreen ? styles.fullScreen : null]}>
      <ActivityIndicator size={size} color="#007AFF" />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
});

/**
 * Inline loading indicator
 */
export const InlineLoader: React.FC<{ text?: string }> = ({ text }) => {
  return (
    <View style={styles.inline}>
      <ActivityIndicator size="small" color="#007AFF" />
      {text ? <Text style={styles.inlineText}>{text}</Text> : null}
    </View>
  );
};

const inlineStyles = StyleSheet.create({
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  inlineText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});

Object.assign(styles, inlineStyles);

/**
 * Button loading state
 */
interface ButtonLoadingProps {
  loading: boolean;
  children: React.ReactNode;
}

export const ButtonLoading: React.FC<ButtonLoadingProps> = ({
  loading,
  children,
}) => {
  if (loading) {
    return (
      <View style={styles.buttonLoading}>
        <ActivityIndicator size="small" color="#fff" />
      </View>
    );
  }

  return <>{children}</>;
};

const buttonStyles = StyleSheet.create({
  buttonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

Object.assign(styles, buttonStyles);

/**
 * Refresh control state
 */
export const RefreshingState: React.FC = () => {
  return (
    <View style={styles.refreshing}>
      <ActivityIndicator size="small" color="#007AFF" />
    </View>
  );
};

const refreshStyles = StyleSheet.create({
  refreshing: {
    padding: 10,
    alignItems: 'center',
  },
});

Object.assign(styles, refreshStyles);