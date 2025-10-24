import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface Following {
  id: string;
  type: 'seller' | 'affiliate';
  seller?: {
    id: string;
    businessName: string;
    profileImage?: string;
    productCount: number;
    rating: number;
    isLiveNow?: boolean;
  };
  affiliate?: {
    id: string;
    name: string;
    profileImage?: string;
    followerCount: number;
    commissionRate: number;
    isLiveNow?: boolean;
  };
  followedAt: string;
  notifications: boolean;
}

export default function FollowingScreen({ navigation }: any) {
  const { t } = useTranslation('translation');
  const [following, setFollowing] = useState<Following[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'sellers' | 'affiliates'>('all');

  useEffect(() => {
    fetchFollowing();
  }, []);

  const fetchFollowing = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/users/following`);
      if (response.ok) {
        const data = await response.json();
        setFollowing(data);
      }
    } catch (error) {
      console.error('Failed to fetch following:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFollowing();
  };

  const unfollowUser = async (followingId: string, name: string) => {
    Alert.alert(
      t('social.unfollow'),
      t('social.unfollowConfirm', { name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('social.unfollow'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Optimistically update UI
              setFollowing(prev => prev.filter(item => item.id !== followingId));

              const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/users/following/${followingId}`,
                { method: 'DELETE' }
              );

              if (!response.ok) {
                // If API fails, revert the change
                fetchFollowing();
                Alert.alert(t('common.error'), t('social.unfollowError'));
              }
            } catch (error) {
              console.error('Failed to unfollow:', error);
              fetchFollowing();
              Alert.alert(t('common.error'), t('social.unfollowError'));
            }
          }
        }
      ]
    );
  };

  const toggleNotifications = async (followingId: string, currentState: boolean) => {
    try {
      setFollowing(prev => prev.map(item =>
        item.id === followingId
          ? { ...item, notifications: !currentState }
          : item
      ));

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/users/following/${followingId}/notifications`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notifications: !currentState }),
        }
      );

      if (!response.ok) {
        // Revert on failure
        setFollowing(prev => prev.map(item =>
          item.id === followingId
            ? { ...item, notifications: currentState }
            : item
        ));
        Alert.alert(t('common.error'), t('social.notificationError'));
      }
    } catch (error) {
      console.error('Failed to toggle notifications:', error);
    }
  };

  const navigateToProfile = (item: Following) => {
    if (item.type === 'seller') {
      navigation.navigate('SellerProfile', { sellerId: item.seller?.id });
    } else {
      navigation.navigate('AffiliateProfile', { affiliateId: item.affiliate?.id });
    }
  };

  const getFilteredData = () => {
    let filtered = following;

    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(item => item.type === activeTab.slice(0, -1));
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        const name = item.type === 'seller'
          ? item.seller?.businessName.toLowerCase()
          : item.affiliate?.name.toLowerCase();
        return name?.includes(query);
      });
    }

    return filtered;
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <MaterialIcons
            key={star}
            name={star <= rating ? "star" : "star-border"}
            size={12}
            color={star <= rating ? "#fbbf24" : "#d1d5db"}
          />
        ))}
      </View>
    );
  };

  const renderFollowingItem = ({ item }: { item: Following }) => {
    const isSeller = item.type === 'seller';
    const profile = isSeller ? item.seller! : item.affiliate!;
    const name = isSeller ? profile.businessName || profile.name : (profile as any).name;
    const isLive = isSeller ? item.seller?.isLiveNow : item.affiliate?.isLiveNow;

    return (
      <TouchableOpacity
        style={styles.followingCard}
        onPress={() => navigateToProfile(item)}
        activeOpacity={0.7}
      >
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {profile.profileImage ? (
              <Image source={{ uri: profile.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Text style={styles.profileInitial}>
                  {name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            {isLive && (
              <View style={styles.liveIndicator}>
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName} numberOfLines={1}>
                {name}
              </Text>
              <View style={[styles.typeBadge, {
                backgroundColor: isSeller ? '#3b82f6' : '#f59e0b'
              }]}>
                <Text style={styles.typeText}>
                  {isSeller ? t('live.seller').toUpperCase() : t('live.affiliate').toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              {isSeller ? (
                <>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{item.seller?.productCount}</Text>
                    <Text style={styles.statLabel}>{t('social.products')}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.stat}>
                    {renderStars(item.seller?.rating || 0)}
                    <Text style={styles.statLabel}>{t('social.rating')}</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{item.affiliate?.followerCount}</Text>
                    <Text style={styles.statLabel}>{t('social.followers')}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{item.affiliate?.commissionRate}%</Text>
                    <Text style={styles.statLabel}>{t('social.commission')}</Text>
                  </View>
                </>
              )}
            </View>

            <Text style={styles.followedDate}>
              {t('social.followingSince', { date: new Date(item.followedAt).toLocaleDateString() })}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.notificationButton, item.notifications && styles.notificationActive]}
            onPress={() => toggleNotifications(item.id, item.notifications)}
          >
            <MaterialIcons
              name={item.notifications ? "notifications" : "notifications-off"}
              size={20}
              color={item.notifications ? "#8b5cf6" : "#9ca3af"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.unfollowButton}
            onPress={() => unfollowUser(item.id, name)}
          >
            <MaterialIcons name="person-remove" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="people-outline" size={80} color="#d1d5db" />
      <Text style={styles.emptyTitle}>{t('social.notFollowingAnyone')}</Text>
      <Text style={styles.emptySubtitle}>
        {t('social.discoverAndFollow')}
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => navigation.navigate('Discover')}
      >
        <Text style={styles.exploreButtonText}>{t('social.exploreUsers')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {[
        { key: 'all', label: t('social.all'), count: following.length },
        { key: 'sellers', label: t('social.sellers'), count: following.filter(f => f.type === 'seller').length },
        { key: 'affiliates', label: t('social.affiliates'), count: following.filter(f => f.type === 'affiliate').length },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={() => setActiveTab(tab.key as any)}
        >
          <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
            {tab.label} ({tab.count})
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>{t('social.loadingFollowing')}</Text>
      </View>
    );
  }

  const filteredData = getFilteredData();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('social.following')}</Text>
        <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
          <MaterialIcons
            name="refresh"
            size={24}
            color={refreshing ? "#d1d5db" : "#374151"}
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('social.searchFollowing')}
          placeholderTextColor="#9ca3af"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="close" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      {renderTabs()}

      <FlatList
        data={filteredData}
        renderItem={renderFollowingItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#374151',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  activeTab: {
    backgroundColor: '#8b5cf6',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexGrow: 1,
  },
  followingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profilePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  liveIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#ef4444',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  liveText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 9,
    color: 'white',
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  statLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#d1d5db',
    marginHorizontal: 12,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  followedDate: {
    fontSize: 11,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  notificationButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  notificationActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  unfollowButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});