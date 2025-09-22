
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <GSText variant="h2" weight="bold">
            Profile
          </GSText>
        </View>

        {/* User Info */}
        <View style={styles.userSection}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <GSText variant="h2" color="white" weight="bold">
              {user?.firstName?.[0] || 'U'}
            </GSText>
          </View>
          <GSText variant="h3" weight="bold" style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </GSText>
          <GSText variant="body" color="textSecondary">
            {user?.email}
          </GSText>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
          >
            <Ionicons name="bag-outline" size={24} color={theme.colors.text} />
            <GSText variant="body" style={styles.menuText}>
              My Orders
            </GSText>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
          >
            <Ionicons name="heart-outline" size={24} color={theme.colors.text} />
            <GSText variant="body" style={styles.menuText}>
              Wishlist
            </GSText>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
          >
            <Ionicons name="card-outline" size={24} color={theme.colors.text} />
            <GSText variant="body" style={styles.menuText}>
              Payment Methods
            </GSText>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
          >
            <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
            <GSText variant="body" style={styles.menuText}>
              Settings
            </GSText>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <GSButton
            title="Sign Out"
            variant="outline"
            onPress={logout}
            leftIcon={<Ionicons name="log-out-outline" size={20} color={theme.colors.primary} />}
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
    marginBottom: 32,
  },
  userSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    marginBottom: 4,
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
  menuText: {
    flex: 1,
    marginLeft: 16,
  },
  footer: {
    marginTop: 20,
  },
});
