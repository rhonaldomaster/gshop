/**
 * Profile Header Component
 *
 * Shared header component for seller and affiliate profile screens.
 * Displays avatar, name, stats, and follow button.
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

interface ProfileStat {
  label: string;
  value: number | string;
}

interface ProfileHeaderProps {
  // Common fields
  name: string;
  avatar?: string;
  isVerified?: boolean;
  description?: string;
  stats: ProfileStat[];

  // Follow state
  isFollowing: boolean;
  isFollowLoading?: boolean;
  notificationsEnabled?: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
  onToggleNotifications?: () => void;

  // Optional fields
  subtitle?: string;
  location?: string;
  rating?: number;
  totalReviews?: number;

  // Affiliate specific
  username?: string;

  // Actions
  onShare?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  avatar,
  isVerified = false,
  description,
  stats,
  isFollowing,
  isFollowLoading = false,
  notificationsEnabled = true,
  onFollow,
  onUnfollow,
  onToggleNotifications,
  subtitle,
  location,
  rating,
  totalReviews,
  username,
  onShare,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const formatNumber = (num: number | string): string => {
    if (typeof num === 'string') return num;
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const handleFollowPress = () => {
    if (isFollowing) {
      onUnfollow();
    } else {
      onFollow();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Avatar and Basic Info */}
      <View style={styles.topSection}>
        <View style={styles.avatarContainer}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.gray200 }]}>
              <Ionicons name="person" size={40} color={theme.colors.gray400} />
            </View>
          )}
          {isVerified && (
            <View style={[styles.verifiedBadge, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="checkmark" size={12} color={theme.colors.white} />
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
              {name}
            </Text>
            {onShare && (
              <TouchableOpacity onPress={onShare} style={styles.shareButton}>
                <Ionicons name="share-outline" size={20} color={theme.colors.text} />
              </TouchableOpacity>
            )}
          </View>

          {username && (
            <Text style={[styles.username, { color: theme.colors.textSecondary }]}>
              @{username}
            </Text>
          )}

          {subtitle && (
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}

          {location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.location, { color: theme.colors.textSecondary }]}>
                {location}
              </Text>
            </View>
          )}

          {rating !== undefined && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={theme.colors.warning} />
              <Text style={[styles.rating, { color: theme.colors.text }]}>
                {rating.toFixed(1)}
              </Text>
              {totalReviews !== undefined && (
                <Text style={[styles.reviews, { color: theme.colors.textSecondary }]}>
                  ({t('profile.reviewCount', { count: totalReviews })})
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Description */}
      {description && (
        <Text style={[styles.description, { color: theme.colors.text }]} numberOfLines={3}>
          {description}
        </Text>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {formatNumber(stat.value)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[
            styles.followButton,
            isFollowing
              ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.primary }
              : { backgroundColor: theme.colors.primary },
          ]}
          onPress={handleFollowPress}
          disabled={isFollowLoading}
        >
          {isFollowLoading ? (
            <ActivityIndicator
              size="small"
              color={isFollowing ? theme.colors.primary : theme.colors.white}
            />
          ) : (
            <>
              <Ionicons
                name={isFollowing ? 'checkmark' : 'add'}
                size={18}
                color={isFollowing ? theme.colors.primary : theme.colors.white}
              />
              <Text
                style={[
                  styles.followButtonText,
                  { color: isFollowing ? theme.colors.primary : theme.colors.white },
                ]}
              >
                {isFollowing ? t('profile.following') : t('profile.follow')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {isFollowing && onToggleNotifications && (
          <TouchableOpacity
            style={[
              styles.notificationButton,
              { borderColor: theme.colors.gray300 },
            ]}
            onPress={onToggleNotifications}
          >
            <Ionicons
              name={notificationsEnabled ? 'notifications' : 'notifications-off'}
              size={20}
              color={notificationsEnabled ? theme.colors.primary : theme.colors.gray400}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  shareButton: {
    padding: 4,
  },
  username: {
    fontSize: 14,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  location: {
    fontSize: 13,
    marginLeft: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  reviews: {
    fontSize: 13,
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  followButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 22,
    gap: 6,
  },
  followButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileHeader;
