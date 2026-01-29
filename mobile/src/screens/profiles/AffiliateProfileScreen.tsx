/**
 * Affiliate Profile Screen
 *
 * Displays an affiliate's public profile with follow functionality,
 * and tabs for live streams and past streams.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../contexts/ThemeContext';
import { useAffiliateProfile, useAffiliateStreams, useFollowAffiliate } from '../../hooks/useAffiliateProfile';
import { ProfileHeader, ProfileTabs, ProfileTab, StreamGrid } from '../../components/profiles';
import { ProfileHeaderSkeleton } from '../../components/ui/Skeleton';

type AffiliateProfileRouteParams = {
  AffiliateProfile: {
    affiliateId: string;
    username?: string;
  };
};

type AffiliateProfileScreenRouteProp = RouteProp<AffiliateProfileRouteParams, 'AffiliateProfile'>;

const getTranslatedTabs = (t: (key: string) => string): ProfileTab[] => [
  { key: 'live', label: t('profile.tabs.live'), icon: 'radio' },
  { key: 'past', label: t('profile.tabs.pastStreams'), icon: 'videocam' },
];

export default function AffiliateProfileScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<AffiliateProfileScreenRouteProp>();
  const { affiliateId } = route.params;

  const [activeTab, setActiveTab] = useState('live');
  const [refreshing, setRefreshing] = useState(false);

  // Hooks for data fetching
  const {
    profile,
    isLoading: isProfileLoading,
    error: profileError,
    refresh: refreshProfile,
  } = useAffiliateProfile(affiliateId);

  const {
    streams: liveStreams,
    isLoading: isLiveStreamsLoading,
    hasMore: hasMoreLiveStreams,
    loadMore: loadMoreLiveStreams,
    refresh: refreshLiveStreams,
  } = useAffiliateStreams(affiliateId, 'live');

  const {
    streams: pastStreams,
    isLoading: isPastStreamsLoading,
    hasMore: hasMorePastStreams,
    loadMore: loadMorePastStreams,
    refresh: refreshPastStreams,
  } = useAffiliateStreams(affiliateId, 'ended');

  const {
    isFollowing,
    isLoading: isFollowLoading,
    follow,
    unfollow,
  } = useFollowAffiliate(affiliateId);

  // Use profile's follow status if available
  const actualIsFollowing = profile?.followStats?.isFollowing ?? isFollowing;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refreshProfile(),
      activeTab === 'live' ? refreshLiveStreams() : refreshPastStreams(),
    ]);
    setRefreshing(false);
  }, [activeTab, refreshProfile, refreshLiveStreams, refreshPastStreams]);

  const handleFollow = useCallback(async () => {
    try {
      await follow();
    } catch (error) {
      Alert.alert(t('common.error'), t('profile.failedToFollow'));
    }
  }, [follow, t]);

  const handleUnfollow = useCallback(async () => {
    Alert.alert(
      t('profile.unfollowTitle'),
      t('profile.unfollowMessage', { name: profile?.name || 'this creator' }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.unfollow'),
          style: 'destructive',
          onPress: async () => {
            try {
              await unfollow();
            } catch (error) {
              Alert.alert(t('common.error'), t('profile.failedToUnfollow'));
            }
          },
        },
      ]
    );
  }, [unfollow, profile, t]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: t('profile.shareCreatorMessage', { name: profile?.name || t('profile.thisCreator') }),
        url: `https://gshop.app/creators/${profile?.username || affiliateId}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [profile, affiliateId, t]);

  const handleStreamPress = useCallback((stream: any) => {
    if (stream.status === 'live') {
      navigation.navigate('LiveStream', { streamId: stream.id });
    } else {
      // Navigate to VOD player for past streams
      navigation.navigate('VodPlayer', { streamId: stream.id });
    }
  }, [navigation]);

  const handleTabChange = useCallback((tabKey: string) => {
    setActiveTab(tabKey);
  }, []);

  // Build stats array
  const stats = profile ? [
    { label: t('profile.stats.followers'), value: profile.stats?.followersCount || profile.followStats?.followersCount || 0 },
    { label: t('profile.stats.views'), value: profile.stats?.totalViews || 0 },
    { label: t('profile.stats.videos'), value: profile.stats?.videosCount || 0 },
  ] : [];

  // Get translated tabs
  const TABS = getTranslatedTabs(t);

  // Get badge count for live tab
  const liveBadgeCount = liveStreams.filter(s => s.status === 'live').length;
  const tabsWithBadge = TABS.map(tab => ({
    ...tab,
    badge: tab.key === 'live' ? liveBadgeCount : undefined,
  }));

  if (profileError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <View style={styles.errorText}>
            {/* Error message would go here */}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        stickyHeaderIndices={[1]}
      >
        {/* Profile Header */}
        {isProfileLoading ? (
          <ProfileHeaderSkeleton />
        ) : profile ? (
          <ProfileHeader
            name={profile.name}
            avatar={profile.avatarUrl}
            username={profile.username}
            isVerified={profile.isVerified}
            description={profile.bio}
            location={profile.location}
            stats={stats}
            isFollowing={actualIsFollowing}
            isFollowLoading={isFollowLoading}
            onFollow={handleFollow}
            onUnfollow={handleUnfollow}
            onShare={handleShare}
          />
        ) : null}

        {/* Tabs */}
        <ProfileTabs
          tabs={tabsWithBadge}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'live' && (
            <StreamGrid
              streams={liveStreams}
              isLoading={isLiveStreamsLoading}
              hasMore={hasMoreLiveStreams}
              onLoadMore={loadMoreLiveStreams}
              onStreamPress={handleStreamPress}
              emptyTitle={t('profile.noLiveStreams')}
              emptyMessage={t('profile.noLiveStreamsMessage')}
              showLiveBadge={true}
              nestedScrollEnabled
            />
          )}

          {activeTab === 'past' && (
            <StreamGrid
              streams={pastStreams}
              isLoading={isPastStreamsLoading}
              hasMore={hasMorePastStreams}
              onLoadMore={loadMorePastStreams}
              onStreamPress={handleStreamPress}
              emptyTitle={t('profile.noPastStreams')}
              emptyMessage={t('profile.noPastStreamsMessage')}
              showLiveBadge={false}
              nestedScrollEnabled
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    minHeight: 400,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    alignItems: 'center',
  },
});
