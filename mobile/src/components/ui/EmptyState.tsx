import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon?: keyof typeof MaterialIcons.glyphMap | string;
  title: string;
  message?: string;
  description?: string; // Alias for message
  actionText?: string;
  onAction?: () => void;
  fullScreen?: boolean;
}

/**
 * Empty state component with optional CTA
 * Supports both MaterialIcons and emoji strings
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox',
  title,
  message,
  description,
  actionText,
  onAction,
  fullScreen = false,
}) => {
  // Check if icon is an emoji (more than 1 char or contains non-ASCII)
  const isEmoji = icon.length > 1 || /[\u{1F300}-\u{1F9FF}]/u.test(icon);
  const displayMessage = message || description;

  return (
    <View style={[styles.container, fullScreen ? styles.fullScreen : null]}>
      {isEmoji ? (
        <Text style={styles.emoji}>{icon}</Text>
      ) : (
        <MaterialIcons name={icon as keyof typeof MaterialIcons.glyphMap} size={64} color="#ccc" />
      )}
      <Text style={styles.title}>{title}</Text>
      {displayMessage ? <Text style={styles.message}>{displayMessage}</Text> : null}
      {actionText && onAction ? (
        <TouchableOpacity style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionText}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  emoji: {
    fontSize: 64,
    textAlign: 'center',
  },
  title: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  button: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

/**
 * Preset empty states
 */
export const EmptyCart: React.FC<{ onShop: () => void }> = ({ onShop }) => (
  <EmptyState
    icon="shopping-cart"
    title="Your cart is empty"
    message="Add some products to get started"
    actionText="Start Shopping"
    onAction={onShop}
    fullScreen
  />
);

export const EmptyOrders: React.FC = () => (
  <EmptyState
    icon="receipt-long"
    title="No orders yet"
    message="Your order history will appear here"
    fullScreen
  />
);

export const EmptyWishlist: React.FC<{ onBrowse: () => void }> = ({ onBrowse }) => (
  <EmptyState
    icon="favorite-border"
    title="No saved items"
    message="Start adding products to your wishlist"
    actionText="Browse Products"
    onAction={onBrowse}
    fullScreen
  />
);

export const EmptySearch: React.FC = () => (
  <EmptyState
    icon="search-off"
    title="No results found"
    message="Try adjusting your search or filters"
  />
);

export const EmptyNotifications: React.FC = () => (
  <EmptyState
    icon="notifications-none"
    title="No notifications"
    message="You're all caught up!"
    fullScreen
  />
);