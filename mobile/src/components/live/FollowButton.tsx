/**
 * Follow Button Component
 *
 * Button to follow/unfollow a streamer with notification toggle.
 * Shows different states: following, not following, and loading.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFollowStreamer } from '../../hooks/useFollowStreamer';
import { useTheme } from '../../contexts/ThemeContext';

interface FollowButtonProps {
  streamerId: string;
  streamerName?: string;
  size?: 'small' | 'medium' | 'large';
  showNotificationToggle?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  streamerId,
  streamerName,
  size = 'medium',
  showNotificationToggle = true,
  onFollowChange,
}) => {
  const { theme } = useTheme();
  const {
    isFollowing,
    notificationsEnabled,
    isLoading,
    follow,
    unfollow,
    toggleNotifications,
  } = useFollowStreamer(streamerId);

  const [showOptions, setShowOptions] = useState(false);

  const handlePress = async () => {
    if (isFollowing) {
      setShowOptions(!showOptions);
    } else {
      await follow();
      onFollowChange?.(true);
    }
  };

  const handleUnfollow = () => {
    Alert.alert(
      'Unfollow',
      `Are you sure you want to unfollow ${streamerName || 'this streamer'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unfollow',
          style: 'destructive',
          onPress: async () => {
            await unfollow();
            onFollowChange?.(false);
            setShowOptions(false);
          },
        },
      ]
    );
  };

  const handleToggleNotifications = async () => {
    await toggleNotifications();
  };

  const sizeConfig = {
    small: { height: 28, paddingH: 12, fontSize: 12, iconSize: 14 },
    medium: { height: 36, paddingH: 16, fontSize: 14, iconSize: 16 },
    large: { height: 44, paddingH: 20, fontSize: 16, iconSize: 20 },
  };

  const config = sizeConfig[size];

  const buttonStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 20,
    height: config.height,
    paddingHorizontal: config.paddingH,
    backgroundColor: isFollowing ? 'transparent' : theme.colors.primary,
    borderWidth: isFollowing ? 1 : 0,
    borderColor: isFollowing ? theme.colors.primary : 'transparent',
  };

  const textColor = isFollowing ? theme.colors.primary : theme.colors.white;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={buttonStyle}
        onPress={handlePress}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <>
            <Ionicons
              name={isFollowing ? 'checkmark' : 'add'}
              size={config.iconSize}
              color={textColor}
              style={styles.icon}
            />
            <Text
              style={{
                fontWeight: '600',
                fontSize: config.fontSize,
                color: textColor,
              }}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {showOptions && isFollowing && (
        <View
          style={[
            styles.optionsMenu,
            { backgroundColor: theme.colors.background },
          ]}
        >
          {showNotificationToggle && (
            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleToggleNotifications}
            >
              <Ionicons
                name={notificationsEnabled ? 'notifications' : 'notifications-off'}
                size={20}
                color={notificationsEnabled ? theme.colors.primary : theme.colors.gray400}
              />
              <Text style={[styles.optionText, { color: theme.colors.text }]}>
                {notificationsEnabled ? 'Notifications On' : 'Notifications Off'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.optionItem,
              styles.optionItemDanger,
              { borderTopColor: theme.colors.gray200 },
            ]}
            onPress={handleUnfollow}
          >
            <Ionicons name="close-circle" size={20} color={theme.colors.error} />
            <Text style={[styles.optionText, { color: theme.colors.error }]}>
              Unfollow
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  icon: {
    marginRight: 4,
  },
  optionsMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 100,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionItemDanger: {
    borderTopWidth: 1,
  },
  optionText: {
    fontSize: 14,
    marginLeft: 12,
  },
});

export default FollowButton;
