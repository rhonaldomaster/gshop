
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  isLast?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  isLast,
}) => {
  const { theme } = useTheme();

  const content = (
    <>
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={24} color={theme.colors.primary} />
      </View>

      <View style={styles.settingContent}>
        <GSText variant="body" weight="semiBold">
          {title}
        </GSText>
        {subtitle && (
          <GSText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
            {subtitle}
          </GSText>
        )}
      </View>

      {rightElement || (
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.settingItem, isLast && styles.settingItemLast]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.settingItem, isLast && styles.settingItemLast]}>
      {content}
    </View>
  );
};

export default function SettingsScreen() {
  const { theme } = useTheme();
  const { logout } = useAuth();
  const navigation = useNavigation();

  // Notification Settings
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [promotionNotifications, setPromotionNotifications] = useState(true);
  const [newArrivalsNotifications, setNewArrivalsNotifications] = useState(false);
  const [priceDropNotifications, setPriceDropNotifications] = useState(false);

  // Privacy Settings
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [personalizationEnabled, setPersonalizationEnabled] = useState(true);

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'This feature is coming soon!');
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'Opening privacy policy...');
  };

  const handleTermsOfService = () => {
    Alert.alert('Terms of Service', 'Opening terms of service...');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deleted', 'Your account has been deleted.');
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Account Section */}
        <View style={styles.section}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            Account
          </GSText>

          <View style={[styles.settingsGroup, { backgroundColor: theme.colors.surface }]}>
            <SettingItem
              icon="person-outline"
              title="Edit Profile"
              subtitle="Update your personal information"
              onPress={() => (navigation as any).navigate('EditProfile')}
            />

            <SettingItem
              icon="lock-closed-outline"
              title="Change Password"
              subtitle="Update your password"
              onPress={handleChangePassword}
            />

            <SettingItem
              icon="mail-outline"
              title="Email Preferences"
              subtitle="Manage email notifications"
              onPress={() => Alert.alert('Email Preferences', 'Coming soon!')}
              isLast
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            Notifications
          </GSText>

          <View style={[styles.settingsGroup, { backgroundColor: theme.colors.surface }]}>
            <SettingItem
              icon="bag-check-outline"
              title="Order Updates"
              subtitle="Get notified about your orders"
              rightElement={
                <Switch
                  value={orderNotifications}
                  onValueChange={setOrderNotifications}
                  trackColor={{ false: '#E5E7EB', true: theme.colors.primary }}
                />
              }
            />

            <SettingItem
              icon="pricetag-outline"
              title="Promotions & Offers"
              subtitle="Receive special deals and discounts"
              rightElement={
                <Switch
                  value={promotionNotifications}
                  onValueChange={setPromotionNotifications}
                  trackColor={{ false: '#E5E7EB', true: theme.colors.primary }}
                />
              }
            />

            <SettingItem
              icon="sparkles-outline"
              title="New Arrivals"
              subtitle="Be the first to know about new products"
              rightElement={
                <Switch
                  value={newArrivalsNotifications}
                  onValueChange={setNewArrivalsNotifications}
                  trackColor={{ false: '#E5E7EB', true: theme.colors.primary }}
                />
              }
            />

            <SettingItem
              icon="trending-down-outline"
              title="Price Drops"
              subtitle="Get alerts on wishlist price drops"
              rightElement={
                <Switch
                  value={priceDropNotifications}
                  onValueChange={setPriceDropNotifications}
                  trackColor={{ false: '#E5E7EB', true: theme.colors.primary }}
                />
              }
              isLast
            />
          </View>
        </View>

        {/* App Preferences Section */}
        <View style={styles.section}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            App Preferences
          </GSText>

          <View style={[styles.settingsGroup, { backgroundColor: theme.colors.surface }]}>
            <SettingItem
              icon="moon-outline"
              title="Theme"
              subtitle="Auto"
              onPress={() => Alert.alert('Theme', 'Theme selection coming soon!')}
            />

            <SettingItem
              icon="language-outline"
              title="Language"
              subtitle="English"
              onPress={() => Alert.alert('Language', 'Language selection coming soon!')}
            />

            <SettingItem
              icon="cash-outline"
              title="Currency"
              subtitle="USD"
              onPress={() => Alert.alert('Currency', 'Currency selection coming soon!')}
              isLast
            />
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            Privacy
          </GSText>

          <View style={[styles.settingsGroup, { backgroundColor: theme.colors.surface }]}>
            <SettingItem
              icon="analytics-outline"
              title="Analytics"
              subtitle="Help us improve the app"
              rightElement={
                <Switch
                  value={analyticsEnabled}
                  onValueChange={setAnalyticsEnabled}
                  trackColor={{ false: '#E5E7EB', true: theme.colors.primary }}
                />
              }
            />

            <SettingItem
              icon="star-outline"
              title="Personalization"
              subtitle="Get personalized recommendations"
              rightElement={
                <Switch
                  value={personalizationEnabled}
                  onValueChange={setPersonalizationEnabled}
                  trackColor={{ false: '#E5E7EB', true: theme.colors.primary }}
                />
              }
            />

            <SettingItem
              icon="shield-checkmark-outline"
              title="Privacy Policy"
              onPress={handlePrivacyPolicy}
            />

            <SettingItem
              icon="document-text-outline"
              title="Terms of Service"
              onPress={handleTermsOfService}
            />

            <SettingItem
              icon="trash-outline"
              title="Delete Account"
              subtitle="Permanently delete your account"
              onPress={handleDeleteAccount}
              isLast
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            About
          </GSText>

          <View style={[styles.settingsGroup, { backgroundColor: theme.colors.surface }]}>
            <SettingItem
              icon="information-circle-outline"
              title="Version"
              subtitle="1.0.0"
            />

            <SettingItem
              icon="document-outline"
              title="Licenses"
              onPress={() => Alert.alert('Licenses', 'Open source licenses')}
              isLast
            />
          </View>
        </View>

        {/* Sign Out Button */}
        <View style={styles.signOutSection}>
          <GSButton
            title="Sign Out"
            onPress={handleLogout}
            variant="outline"
            style={styles.signOutButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  settingsGroup: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  signOutSection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  signOutButton: {
    width: '100%',
  },
});

