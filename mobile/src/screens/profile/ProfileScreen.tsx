
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../hooks/useCart';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { user, logout, isAuthenticated } = useAuth();
  const { totalItems, getCartSummary } = useCart();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const cartSummary = getCartSummary();

  // Handle logout with confirmation
  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  // Handle navigation to different screens
  const handleNavigation = (screen: string, params?: any) => {
    navigation.navigate(screen as any, params);
  };

  // Menu items configuration
  const menuItems = [
    {
      icon: 'bag-outline',
      title: 'My Orders',
      subtitle: 'View your order history',
      onPress: () => handleNavigation('Orders'),
      showChevron: true,
    },
    {
      icon: 'heart-outline',
      title: 'Wishlist',
      subtitle: 'Your saved items',
      onPress: () => handleNavigation('Wishlist'),
      showChevron: true,
    },
    {
      icon: 'card-outline',
      title: 'Payment Methods',
      subtitle: 'Manage payment options',
      onPress: () => handleNavigation('PaymentMethods'),
      showChevron: true,
    },
    {
      icon: 'location-outline',
      title: 'Addresses',
      subtitle: 'Manage shipping addresses',
      onPress: () => handleNavigation('Addresses'),
      showChevron: true,
    },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      subtitle: 'Manage your preferences',
      onPress: () => handleNavigation('Notifications'),
      showChevron: true,
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'Get help with your orders',
      onPress: () => handleNavigation('Support'),
      showChevron: true,
    },
    {
      icon: 'settings-outline',
      title: 'Settings',
      subtitle: 'App preferences',
      onPress: () => handleNavigation('Settings'),
      showChevron: true,
    },
  ];

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.guestContainer}>
          <View style={styles.guestIcon}>
            <Ionicons name="person-outline" size={60} color={theme.colors.textSecondary} />
          </View>
          <GSText variant="h3" weight="bold" style={styles.guestTitle}>
            Welcome to GSHOP
          </GSText>
          <GSText variant="body" color={theme.colors.textSecondary} style={styles.guestSubtitle}>
            Sign in to access your profile, orders, and more
          </GSText>
          <GSButton
            title="Sign In"
            onPress={() => navigation.navigate('Auth' as any)}
            style={styles.signInButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <GSText variant="h2" weight="bold">
            Profile
          </GSText>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleNavigation('EditProfile')}
          >
            <Ionicons name="create-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={[styles.userSection, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity style={styles.avatarContainer}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                <GSText variant="h2" color="white" weight="bold">
                  {user.firstName?.[0]?.toUpperCase() || 'U'}
                </GSText>
              </View>
            )}
            <View style={[styles.avatarEditIcon, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="camera" size={16} color="white" />
            </View>
          </TouchableOpacity>

          <GSText variant="h3" weight="bold" style={styles.userName}>
            {user.firstName} {user.lastName}
          </GSText>
          <GSText variant="body" color={theme.colors.textSecondary} style={styles.userEmail}>
            {user.email}
          </GSText>
          {user.phone && (
            <GSText variant="body" color={theme.colors.textSecondary}>
              {user.phone}
            </GSText>
          )}

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <GSText variant="h4" weight="bold" color={theme.colors.primary}>
                {cartSummary.itemCount}
              </GSText>
              <GSText variant="caption" color={theme.colors.textSecondary}>
                Cart Items
              </GSText>
            </View>
            <View style={styles.statItem}>
              <GSText variant="h4" weight="bold" color={theme.colors.primary}>
                0
              </GSText>
              <GSText variant="caption" color={theme.colors.textSecondary}>
                Orders
              </GSText>
            </View>
            <View style={styles.statItem}>
              <GSText variant="h4" weight="bold" color={theme.colors.primary}>
                0
              </GSText>
              <GSText variant="caption" color={theme.colors.textSecondary}>
                Wishlist
              </GSText>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
              onPress={item.onPress}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                <Ionicons name={item.icon as any} size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.menuTextContainer}>
                <GSText variant="body" weight="semiBold">
                  {item.title}
                </GSText>
                <GSText variant="caption" color={theme.colors.textSecondary}>
                  {item.subtitle}
                </GSText>
              </View>
              {item.showChevron && (
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.footer}>
          <GSButton
            title="Sign Out"
            variant="outline"
            onPress={handleLogout}
            loading={isLoggingOut}
            style={styles.logoutButton}
          />
        </View>
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  editButton: {
    padding: 8,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  guestIcon: {
    marginBottom: 24,
  },
  guestTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  guestSubtitle: {
    marginBottom: 32,
    textAlign: 'center',
  },
  signInButton: {
    minWidth: 200,
  },
  userSection: {
    alignItems: 'center',
    marginBottom: 32,
    padding: 20,
    borderRadius: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarEditIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    marginBottom: 4,
  },
  userEmail: {
    marginBottom: 16,
  },
  quickStats: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  menuSection: {
    flex: 1,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  menuText: {
    flex: 1,
    marginLeft: 16,
  },
  footer: {
    marginTop: 20,
  },
  logoutButton: {
    marginTop: 10,
  },
});
