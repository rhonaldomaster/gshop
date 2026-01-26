/**
 * Seller Profile Screen
 *
 * Displays a seller's public profile with follow functionality,
 * and tabs for products, live streams, and past streams.
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
import { useSellerProfile, useSellerProducts, useSellerStreams } from '../../hooks/useSellerProfile';
import { useFollowSeller } from '../../hooks/useFollowSeller';
import { ProfileHeader, ProfileTabs, ProfileTab, StreamGrid, ProductGrid } from '../../components/profiles';
import { ProfileHeaderSkeleton } from '../../components/ui/Skeleton';

type SellerProfileRouteParams = {
  SellerProfile: {
    sellerId: string;
  };
};

type SellerProfileScreenRouteProp = RouteProp<SellerProfileRouteParams, 'SellerProfile'>;

const TABS: ProfileTab[] = [
  { key: 'products', label: 'Products', icon: 'cube' },
  { key: 'live', label: 'Live', icon: 'radio' },
  { key: 'past', label: 'Past Streams', icon: 'videocam' },
];

export default function SellerProfileScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<SellerProfileScreenRouteProp>();
  const { sellerId } = route.params;

  const [activeTab, setActiveTab] = useState('products');
  const [refreshing, setRefreshing] = useState(false);

  // Hooks for data fetching
  const {
    profile,
    isLoading: isProfileLoading,
    error: profileError,
    refresh: refreshProfile,
  } = useSellerProfile(sellerId);

  const {
    products,
    isLoading: isProductsLoading,
    hasMore: hasMoreProducts,
    loadMore: loadMoreProducts,
    refresh: refreshProducts,
  } = useSellerProducts(sellerId);

  const {
    streams: liveStreams,
    isLoading: isLiveStreamsLoading,
    hasMore: hasMoreLiveStreams,
    loadMore: loadMoreLiveStreams,
    refresh: refreshLiveStreams,
  } = useSellerStreams(sellerId, 'live');

  const {
    streams: pastStreams,
    isLoading: isPastStreamsLoading,
    hasMore: hasMorePastStreams,
    loadMore: loadMorePastStreams,
    refresh: refreshPastStreams,
  } = useSellerStreams(sellerId, 'ended');

  const {
    isFollowing,
    notificationsEnabled,
    isLoading: isFollowLoading,
    follow,
    unfollow,
    toggleNotifications,
  } = useFollowSeller(sellerId);

  // Use profile's follow status if available
  const actualIsFollowing = profile?.isFollowing ?? isFollowing;
  const actualNotificationsEnabled = profile?.notificationsEnabled ?? notificationsEnabled;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    const refreshFns = [refreshProfile()];

    if (activeTab === 'products') {
      refreshFns.push(refreshProducts());
    } else if (activeTab === 'live') {
      refreshFns.push(refreshLiveStreams());
    } else {
      refreshFns.push(refreshPastStreams());
    }

    await Promise.all(refreshFns);
    setRefreshing(false);
  }, [activeTab, refreshProfile, refreshProducts, refreshLiveStreams, refreshPastStreams]);

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
      t('profile.unfollowMessage', { name: profile?.businessName || 'this seller' }),
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

  const handleToggleNotifications = useCallback(async () => {
    try {
      await toggleNotifications();
    } catch (error) {
      Alert.alert(t('common.error'), t('profile.failedToToggleNotifications'));
    }
  }, [toggleNotifications, t]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Check out ${profile?.businessName || 'this store'} on GSHOP!`,
        url: `https://gshop.app/sellers/${sellerId}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [profile, sellerId]);

  const handleProductPress = useCallback((product: any) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  }, [navigation]);

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
    { label: 'Followers', value: profile.followersCount || 0 },
    { label: 'Products', value: profile.productsCount || 0 },
    { label: 'Reviews', value: profile.totalReviews || 0 },
  ] : [];

  // Get badge count for live tab
  const liveBadgeCount = liveStreams.filter(s => s.status === 'live').length;
  const tabsWithBadge = TABS.map(tab => ({
    ...tab,
    badge: tab.key === 'live' ? liveBadgeCount : undefined,
  }));

  // Build location string
  const locationParts = [];
  if (profile?.city) locationParts.push(profile.city);
  if (profile?.state) locationParts.push(profile.state);
  const location = locationParts.length > 0 ? locationParts.join(', ') : undefined;

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
            name={profile.businessName}
            avatar={profile.logoUrl}
            isVerified={profile.isVerified}
            description={profile.profileDescription}
            location={location}
            rating={profile.rating}
            totalReviews={profile.totalReviews}
            stats={stats}
            isFollowing={actualIsFollowing}
            isFollowLoading={isFollowLoading}
            notificationsEnabled={actualNotificationsEnabled}
            onFollow={handleFollow}
            onUnfollow={handleUnfollow}
            onToggleNotifications={handleToggleNotifications}
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
          {activeTab === 'products' && (
            <ProductGrid
              products={products}
              isLoading={isProductsLoading}
              hasMore={hasMoreProducts}
              onLoadMore={loadMoreProducts}
              onProductPress={handleProductPress}
              emptyTitle={t('profile.noProducts')}
              emptyMessage={t('profile.noProductsMessage')}
            />
          )}

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
