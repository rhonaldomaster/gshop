import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useUserRole, UserRole } from '../../contexts/UserRoleContext';
import { useAuth } from '../../contexts/AuthContext';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';

interface RoleOptionProps {
  role: UserRole;
  title: string;
  description: string;
  icon: string;
  isSelected: boolean;
  isAvailable: boolean;
  onSelect: () => void;
  features: string[];
}

const RoleOption: React.FC<RoleOptionProps> = ({
  title,
  description,
  icon,
  isSelected,
  isAvailable,
  onSelect,
  features,
}) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.roleOption,
        {
          backgroundColor: isSelected ? `${theme.colors.primary}20` : theme.colors.surface,
          borderColor: isSelected ? theme.colors.primary : theme.colors.gray200,
          opacity: isAvailable ? 1 : 0.5,
        },
      ]}
      onPress={onSelect}
      disabled={!isAvailable}
      activeOpacity={0.7}
    >
      <View style={styles.roleHeader}>
        <View
          style={[
            styles.roleIconContainer,
            {
              backgroundColor: isSelected ? theme.colors.primary : theme.colors.gray100,
            },
          ]}
        >
          <Ionicons
            name={icon as any}
            size={28}
            color={isSelected ? theme.colors.white : theme.colors.textSecondary}
          />
        </View>

        <View style={styles.roleInfo}>
          <GSText variant="body" weight="bold">
            {title}
          </GSText>
          <GSText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
            {description}
          </GSText>
        </View>

        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
        )}

        {!isAvailable && (
          <View style={[styles.lockedBadge, { backgroundColor: theme.colors.gray200 }]}>
            <Ionicons name="lock-closed" size={14} color={theme.colors.textSecondary} />
          </View>
        )}
      </View>

      <View style={styles.featuresList}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Ionicons
              name="checkmark"
              size={16}
              color={isAvailable ? theme.colors.success : theme.colors.textSecondary}
            />
            <GSText
              variant="caption"
              color={isAvailable ? 'text' : 'textSecondary'}
              style={{ marginLeft: 8 }}
            >
              {feature}
            </GSText>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

export default function RoleSwitcherScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user } = useAuth();
  const {
    currentRole,
    availableRoles,
    switchRole,
    isSellerVerified,
    isAffiliateActive,
  } = useUserRole();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);

  const handleSelectRole = (role: UserRole) => {
    if (availableRoles.includes(role)) {
      setSelectedRole(role);
    }
  };

  const handleApplyRole = async () => {
    if (selectedRole === currentRole) {
      navigation.goBack();
      return;
    }

    setIsLoading(true);
    try {
      await switchRole(selectedRole);
      Alert.alert(
        t('roleSwitch.success'),
        t('roleSwitch.successMessage', { role: t(`roleSwitch.roles.${selectedRole}`) }),
        [
          {
            text: t('common.ok'),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('roleSwitch.errorMessage'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBecomeSellerPress = () => {
    Alert.alert(
      t('roleSwitch.becomeSeller'),
      t('roleSwitch.becomeSellerMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('roleSwitch.learnMore'),
          onPress: () => {
            // Navigate to seller registration or info
          },
        },
      ]
    );
  };

  const handleBecomeAffiliatePress = () => {
    (navigation as any).navigate('AffiliateRegistration');
  };

  const roleConfigs: {
    role: UserRole;
    title: string;
    description: string;
    icon: string;
    features: string[];
    isAvailable: boolean;
  }[] = [
    {
      role: 'buyer',
      title: t('roleSwitch.roles.buyer'),
      description: t('roleSwitch.buyerDescription'),
      icon: 'bag-handle-outline',
      features: [
        t('roleSwitch.buyerFeatures.browse'),
        t('roleSwitch.buyerFeatures.purchase'),
        t('roleSwitch.buyerFeatures.watchLive'),
        t('roleSwitch.buyerFeatures.reviews'),
      ],
      isAvailable: true,
    },
    {
      role: 'affiliate',
      title: t('roleSwitch.roles.affiliate'),
      description: t('roleSwitch.affiliateDescription'),
      icon: 'share-social-outline',
      features: [
        t('roleSwitch.affiliateFeatures.promote'),
        t('roleSwitch.affiliateFeatures.goLive'),
        t('roleSwitch.affiliateFeatures.earnCommission'),
        t('roleSwitch.affiliateFeatures.analytics'),
      ],
      isAvailable: availableRoles.includes('affiliate'),
    },
    {
      role: 'seller',
      title: t('roleSwitch.roles.seller'),
      description: t('roleSwitch.sellerDescription'),
      icon: 'storefront-outline',
      features: [
        t('roleSwitch.sellerFeatures.manageProducts'),
        t('roleSwitch.sellerFeatures.goLive'),
        t('roleSwitch.sellerFeatures.viewOrders'),
        t('roleSwitch.sellerFeatures.analytics'),
      ],
      isAvailable: availableRoles.includes('seller'),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <GSText variant="h3" weight="bold">
          {t('roleSwitch.title')}
        </GSText>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Current User Info */}
        <View style={[styles.userInfoCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.userAvatar}>
            {user?.avatar ? (
              <View style={[styles.avatarImage, { backgroundColor: theme.colors.gray200 }]}>
                <GSText variant="h3" weight="bold" color="primary">
                  {user.firstName?.charAt(0) || 'U'}
                </GSText>
              </View>
            ) : (
              <View style={[styles.avatarImage, { backgroundColor: `${theme.colors.primary}20` }]}>
                <GSText variant="h3" weight="bold" color="primary">
                  {user?.firstName?.charAt(0) || 'U'}
                </GSText>
              </View>
            )}
          </View>
          <View style={styles.userDetails}>
            <GSText variant="body" weight="semiBold">
              {user?.firstName} {user?.lastName}
            </GSText>
            <GSText variant="caption" color="textSecondary">
              {user?.email}
            </GSText>
            <View style={styles.currentRoleBadge}>
              <Ionicons
                name="person-circle-outline"
                size={14}
                color={theme.colors.primary}
              />
              <GSText variant="caption" color="primary" style={{ marginLeft: 4 }}>
                {t('roleSwitch.currentRole')}: {t(`roleSwitch.roles.${currentRole}`)}
              </GSText>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <GSText variant="body" color="textSecondary" style={{ textAlign: 'center' }}>
            {t('roleSwitch.selectRoleDescription')}
          </GSText>
        </View>

        {/* Role Options */}
        <View style={styles.rolesSection}>
          {roleConfigs.map((config) => (
            <RoleOption
              key={config.role}
              role={config.role}
              title={config.title}
              description={config.description}
              icon={config.icon}
              isSelected={selectedRole === config.role}
              isAvailable={config.isAvailable}
              onSelect={() => handleSelectRole(config.role)}
              features={config.features}
            />
          ))}
        </View>

        {/* Upgrade Options */}
        {(!isSellerVerified || !isAffiliateActive) && (
          <View style={styles.upgradeSection}>
            <GSText variant="h4" weight="bold" style={styles.upgradeSectionTitle}>
              {t('roleSwitch.upgradeAccount')}
            </GSText>

            {!isAffiliateActive && (
              <TouchableOpacity
                style={[styles.upgradeOption, { backgroundColor: theme.colors.surface }]}
                onPress={handleBecomeAffiliatePress}
              >
                <Ionicons name="share-social" size={24} color={theme.colors.primary} />
                <View style={styles.upgradeInfo}>
                  <GSText variant="body" weight="semiBold">
                    {t('roleSwitch.becomeAffiliate')}
                  </GSText>
                  <GSText variant="caption" color="textSecondary">
                    {t('roleSwitch.becomeAffiliateHint')}
                  </GSText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}

            {!isSellerVerified && (
              <TouchableOpacity
                style={[styles.upgradeOption, { backgroundColor: theme.colors.surface }]}
                onPress={handleBecomeSellerPress}
              >
                <Ionicons name="storefront" size={24} color={theme.colors.primary} />
                <View style={styles.upgradeInfo}>
                  <GSText variant="body" weight="semiBold">
                    {t('roleSwitch.becomeSeller')}
                  </GSText>
                  <GSText variant="caption" color="textSecondary">
                    {t('roleSwitch.becomeSellerHint')}
                  </GSText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Apply Button */}
      <View style={[styles.footer, { backgroundColor: theme.colors.background }]}>
        <GSButton
          title={isLoading ? '' : t('roleSwitch.applyChanges')}
          onPress={handleApplyRole}
          disabled={isLoading || selectedRole === currentRole}
          style={styles.applyButton}
        >
          {isLoading && <ActivityIndicator color={theme.colors.white} />}
        </GSButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  userInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  userAvatar: {
    marginRight: 12,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  currentRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  descriptionSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  rolesSection: {
    marginBottom: 24,
  },
  roleOption: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  roleInfo: {
    flex: 1,
  },
  lockedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuresList: {
    marginTop: 8,
    paddingLeft: 60,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  upgradeSection: {
    marginTop: 8,
  },
  upgradeSectionTitle: {
    marginBottom: 12,
  },
  upgradeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  upgradeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  applyButton: {
    width: '100%',
  },
});
