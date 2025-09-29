import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { affiliatesService, DashboardStats } from '../../services/affiliates.service';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';

const { width } = Dimensions.get('window');

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  description: string;
  onPress: () => void;
}

export const AffiliateScreen = () => {
  const { user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAffiliate, setIsAffiliate] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Check if user is an affiliate and load dashboard
      const stats = await affiliatesService.getDashboardStats();
      setDashboardStats(stats);
      setIsAffiliate(true);
    } catch (error) {
      console.error('Error loading affiliate dashboard:', error);
      // User might not be an affiliate yet
      setIsAffiliate(false);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }, [loadDashboard]);

  const handleBecomeAffiliate = useCallback(() => {
    Alert.alert(
      'Become an Affiliate',
      'Join our affiliate program and start earning commissions by promoting products!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply Now',
          onPress: () => {
            // Navigate to affiliate registration or application process
            Alert.alert('Success', 'Application submitted! We\'ll review and get back to you soon.');
          },
        },
      ]
    );
  }, []);

  const quickActions: QuickAction[] = [
    {
      id: 'generate_links',
      title: 'Generate Links',
      icon: '🔗',
      description: 'Create affiliate links for products',
      onPress: () => {
        // Navigate to LinkGeneratorScreen
        console.log('Navigate to LinkGenerator');
      },
    },
    {
      id: 'view_commissions',
      title: 'View Commissions',
      icon: '💰',
      description: 'Track your earnings and payouts',
      onPress: () => {
        // Navigate to CommissionsScreen
        console.log('Navigate to Commissions');
      },
    },
    {
      id: 'share_tools',
      title: 'Share Tools',
      icon: '📱',
      description: 'Access sharing and promotion tools',
      onPress: () => {
        // Navigate to ShareToolsScreen
        console.log('Navigate to ShareTools');
      },
    },
    {
      id: 'live_stream',
      title: 'Go Live',
      icon: '📹',
      description: 'Start a live shopping session',
      onPress: () => {
        // Navigate to live stream creation
        console.log('Navigate to Live Stream');
      },
    },
  ];

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Sign in Required"
          description="Please sign in to access the affiliate panel"
          icon="🔐"
        />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (!isAffiliate) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.centerContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.joinContainer}>
            <Text style={styles.joinIcon}>🚀</Text>
            <Text style={styles.joinTitle}>Join the Affiliate Program</Text>
            <Text style={styles.joinDescription}>
              Earn money by promoting products you love! Get up to 15% commission on every sale.
            </Text>

            <View style={styles.benefitsContainer}>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>💰</Text>
                <Text style={styles.benefitText}>Earn up to 15% commission</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>📈</Text>
                <Text style={styles.benefitText}>Real-time analytics and tracking</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>🔗</Text>
                <Text style={styles.benefitText}>Easy link generation tools</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>📱</Text>
                <Text style={styles.benefitText}>Live streaming capabilities</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>💸</Text>
                <Text style={styles.benefitText}>Weekly payouts</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.joinButton} onPress={handleBecomeAffiliate}>
              <Text style={styles.joinButtonText}>Apply to Become an Affiliate</Text>
            </TouchableOpacity>

            <Text style={styles.joinFooter}>
              Already an affiliate? Pull down to refresh and access your dashboard.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const renderStatsCard = (title: string, value: string, subtitle?: string, color: string = '#007bff') => (
    <View style={styles.statsCard}>
      <Text style={styles.statsTitle}>{title}</Text>
      <Text style={[styles.statsValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statsSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderQuickAction = (action: QuickAction) => (
    <TouchableOpacity
      key={action.id}
      style={styles.actionCard}
      onPress={action.onPress}
    >
      <Text style={styles.actionIcon}>{action.icon}</Text>
      <Text style={styles.actionTitle}>{action.title}</Text>
      <Text style={styles.actionDescription}>{action.description}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Affiliate Dashboard</Text>
        <Text style={styles.headerSubtitle}>Track your performance and earnings</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Overview Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            {renderStatsCard(
              'Total Earnings',
              `$${dashboardStats?.earnings.totalEarnings.toFixed(2) || '0.00'}`,
              'All time',
              '#28a745'
            )}
            {renderStatsCard(
              'Available Balance',
              `$${dashboardStats?.earnings.availableBalance.toFixed(2) || '0.00'}`,
              'Ready to withdraw',
              '#007bff'
            )}
            {renderStatsCard(
              'This Month',
              `$${dashboardStats?.earnings.monthlyEarnings.toFixed(2) || '0.00'}`,
              'Current month earnings',
              '#ffc107'
            )}
            {renderStatsCard(
              'Followers',
              dashboardStats?.profile.followersCount.toLocaleString() || '0',
              `${(dashboardStats?.profile.engagementRate || 0).toFixed(1)}% engagement`,
              '#dc3545'
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map(renderQuickAction)}
          </View>
        </View>

        {/* Performance Summary */}
        <View style={styles.performanceContainer}>
          <Text style={styles.sectionTitle}>Performance Summary</Text>

          <View style={styles.performanceCard}>
            <Text style={styles.performanceTitle}>Content Performance</Text>
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Total Videos:</Text>
              <Text style={styles.performanceValue}>
                {dashboardStats?.content.totalVideos || 0}
              </Text>
            </View>
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Total Views:</Text>
              <Text style={styles.performanceValue}>
                {dashboardStats?.content.totalViews.toLocaleString() || '0'}
              </Text>
            </View>
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Avg. Engagement:</Text>
              <Text style={styles.performanceValue}>
                {(dashboardStats?.content.averageEngagement || 0).toFixed(1)}%
              </Text>
            </View>
          </View>

          <View style={styles.performanceCard}>
            <Text style={styles.performanceTitle}>Live Streaming</Text>
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Total Streams:</Text>
              <Text style={styles.performanceValue}>
                {dashboardStats?.liveStreams.totalStreams || 0}
              </Text>
            </View>
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Total Viewers:</Text>
              <Text style={styles.performanceValue}>
                {dashboardStats?.liveStreams.totalViewers.toLocaleString() || '0'}
              </Text>
            </View>
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Avg. Viewers:</Text>
              <Text style={styles.performanceValue}>
                {Math.round(dashboardStats?.liveStreams.averageViewers || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsContainer}>
          <Text style={styles.sectionTitle}>💡 Tips to Boost Earnings</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>📱</Text>
            <Text style={styles.tipText}>
              Share your affiliate links on social media to reach more customers
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>📹</Text>
            <Text style={styles.tipText}>
              Host live shopping sessions to showcase products in real-time
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>🎯</Text>
            <Text style={styles.tipText}>
              Create content around products that match your audience's interests
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>📊</Text>
            <Text style={styles.tipText}>
              Check your analytics regularly to understand what performs best
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  joinContainer: {
    alignItems: 'center',
    padding: 40,
  },
  joinIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  joinTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  joinDescription: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 26,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  benefitText: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
  },
  joinButton: {
    backgroundColor: '#007bff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 20,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  joinFooter: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  statsContainer: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    width: (width - 56) / 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 8,
    width: (width - 56) / 2,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  performanceContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  performanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  performanceLabel: {
    fontSize: 14,
    color: '#666',
  },
  performanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  tipsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    fontSize: 14,
    color: '#495057',
    flex: 1,
    lineHeight: 20,
  },
});