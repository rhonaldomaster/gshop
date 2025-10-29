
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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
    Alert.alert(t('settings.changePassword'), t('settings.changePasswordComingSoon'));
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(t('settings.privacyPolicy'), t('settings.privacyPolicyOpening'));
  };

  const handleTermsOfService = () => {
    Alert.alert(t('settings.termsOfService'), t('settings.termsOfServiceOpening'));
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('settings.deleteAccount'),
      t('settings.deleteAccountConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(t('settings.accountDeleted'), t('settings.accountDeletedMessage'));
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(t('settings.signOut'), t('settings.signOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.signOut'),
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
            {t('settings.account')}
          </GSText>

          <View style={[styles.settingsGroup, { backgroundColor: theme.colors.surface }]}>
            <SettingItem
              icon="person-outline"
              title={t('settings.editProfile')}
              subtitle={t('settings.editProfileSubtitle')}
              onPress={() => (navigation as any).navigate('EditProfile')}
            />

            <SettingItem
              icon="lock-closed-outline"
              title={t('settings.changePassword')}
              subtitle={t('settings.changePasswordSubtitle')}
              onPress={handleChangePassword}
            />

            <SettingItem
              icon="mail-outline"
              title={t('settings.emailPreferences')}
              subtitle={t('settings.emailPreferencesSubtitle')}
              onPress={() => Alert.alert(t('settings.emailPreferences'), t('settings.emailPreferencesComingSoon'))}
              isLast
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            {t('settings.notifications')}
          </GSText>

          <View style={[styles.settingsGroup, { backgroundColor: theme.colors.surface }]}>
            <SettingItem
              icon="bag-check-outline"
              title={t('settings.orderUpdates')}
              subtitle={t('settings.orderUpdatesSubtitle')}
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
              title={t('settings.promotionsOffers')}
              subtitle={t('settings.promotionsOffersSubtitle')}
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
              title={t('settings.newArrivals')}
              subtitle={t('settings.newArrivalsSubtitle')}
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
              title={t('settings.priceDrops')}
              subtitle={t('settings.priceDropsSubtitle')}
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
            {t('settings.appPreferences')}
          </GSText>

          <View style={[styles.settingsGroup, { backgroundColor: theme.colors.surface }]}>
            <SettingItem
              icon="moon-outline"
              title={t('settings.theme')}
              subtitle={t('settings.themeAuto')}
              onPress={() => Alert.alert(t('settings.theme'), t('settings.themeComingSoon'))}
            />

            <SettingItem
              icon="language-outline"
              title={t('settings.language')}
              subtitle={t('settings.languageEnglish')}
              onPress={() => Alert.alert(t('settings.language'), t('settings.languageComingSoon'))}
            />

            <SettingItem
              icon="cash-outline"
              title={t('settings.currency')}
              subtitle={t('settings.currencyUSD')}
              onPress={() => Alert.alert(t('settings.currency'), t('settings.currencyComingSoon'))}
              isLast
            />
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            {t('settings.privacy')}
          </GSText>

          <View style={[styles.settingsGroup, { backgroundColor: theme.colors.surface }]}>
            <SettingItem
              icon="analytics-outline"
              title={t('settings.analytics')}
              subtitle={t('settings.analyticsSubtitle')}
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
              title={t('settings.personalization')}
              subtitle={t('settings.personalizationSubtitle')}
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
              title={t('settings.privacyPolicy')}
              onPress={handlePrivacyPolicy}
            />

            <SettingItem
              icon="document-text-outline"
              title={t('settings.termsOfService')}
              onPress={handleTermsOfService}
            />

            <SettingItem
              icon="trash-outline"
              title={t('settings.deleteAccount')}
              subtitle={t('settings.deleteAccountSubtitle')}
              onPress={handleDeleteAccount}
              isLast
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            {t('settings.about')}
          </GSText>

          <View style={[styles.settingsGroup, { backgroundColor: theme.colors.surface }]}>
            <SettingItem
              icon="information-circle-outline"
              title={t('settings.version')}
              subtitle="1.0.0"
            />

            <SettingItem
              icon="document-outline"
              title={t('settings.licenses')}
              onPress={() => Alert.alert(t('settings.licenses'), t('settings.licensesMessage'))}
              isLast
            />
          </View>
        </View>

        {/* Sign Out Button */}
        <View style={styles.signOutSection}>
          <GSButton
            title={t('settings.signOut')}
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

