import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import GSText from '../../components/ui/GSText';
import { sellerService, SellerStats } from '../../services/seller.service';

interface StatCardProps {
  icon: string;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  subtitle,
  color,
  onPress,
}) => {
  const { theme } = useTheme();
  const cardColor = color || theme.colors.primary;

  const content = (
    <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.statIconContainer, { backgroundColor: `${cardColor}15` }]}>
        <Ionicons name={icon as any} size={24} color={cardColor} />
      </View>
      <GSText variant="caption" color="textSecondary" style={{ marginTop: 8 }}>
        {title}
      </GSText>
      <GSText variant="h3" weight="bold" style={{ marginTop: 4 }}>
        {value}
      </GSText>
      {subtitle && (
        <GSText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
          {subtitle}
        </GSText>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.statCardWrapper}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.statCardWrapper}>{content}</View>;
};

interface QuickActionProps {
  icon: string;
  title: string;
  onPress: () => void;
  badge?: number;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, title, onPress, badge }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.quickAction, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.quickActionIconWrapper}>
        <View style={[styles.quickActionIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
          <Ionicons name={icon as any} size={24} color={theme.colors.primary} />
        </View>
        {badge !== undefined && badge > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
            <GSText variant="caption" style={{ color: theme.colors.white, fontWeight: 'bold' }}>
              {badge > 99 ? '99+' : badge}
            </GSText>
          </View>
        )}
      </View>
      <GSText variant="body" weight="semiBold" style={{ marginTop: 8, textAlign: 'center' }}>
        {title}
      </GSText>
    </TouchableOpacity>
  );
};

export default function SellerDashboardScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigation = useNavigation();

  const [stats, setStats] = useState<SellerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadStats = async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    }

    try {
      const data = await sellerService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load seller stats:', error);
      // Set mock data for development
      setStats({
        totalProducts: 0,
        activeProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        todayRevenue: 0,
        rating: 0,
        totalReviews: 0,
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleGoLive = () => {
    (navigation as any).navigate('Live', { screen: 'CreateLiveStream' });
  };

  const handleViewProducts = () => {
    (navigation as any).navigate('SellerProducts');
  };

  const handleViewOrders = () => {
    (navigation as any).navigate('SellerOrders');
  };

  const handleAddProduct = () => {
    (navigation as any).navigate('SellerAddProduct');
  };

  const handleViewAnalytics = () => {
    (navigation as any).navigate('SellerAnalytics');
  };

  const handleSwitchToBuyer = () => {
    (navigation as any).navigate('Profile', { screen: 'RoleSwitcher' });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <GSText variant="body" color="textSecondary" style={{ marginTop: 12 }}>
            {t('common.loading')}
          </GSText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadStats(true)}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <GSText variant="h3" weight="bold">
              {t('sellerDashboard.title')}
            </GSText>
            <GSText variant="body" color="textSecondary">
              {t('sellerDashboard.welcomeBack')}, {user?.firstName}
            </GSText>
          </View>
          <TouchableOpacity
            style={[styles.switchModeButton, { backgroundColor: theme.colors.surface }]}
            onPress={handleSwitchToBuyer}
          >
            <Ionicons name="swap-horizontal" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Go Live Banner */}
        <TouchableOpacity
          style={[styles.goLiveBanner, { backgroundColor: theme.colors.primary }]}
          onPress={handleGoLive}
          activeOpacity={0.8}
        >
          <View style={styles.goLiveBannerContent}>
            <Ionicons name="videocam" size={32} color={theme.colors.white} />
            <View style={styles.goLiveBannerText}>
              <GSText variant="h4" weight="bold" style={{ color: theme.colors.white }}>
                {t('sellerDashboard.goLive')}
              </GSText>
              <GSText variant="caption" style={{ color: theme.colors.white, opacity: 0.8 }}>
                {t('sellerDashboard.goLiveHint')}
              </GSText>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color={theme.colors.white} />
        </TouchableOpacity>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            {t('sellerDashboard.overview')}
          </GSText>

          <View style={styles.statsGrid}>
            <StatCard
              icon="cash-outline"
              title={t('sellerDashboard.todayRevenue')}
              value={formatCurrency(stats?.todayRevenue || 0)}
              color={theme.colors.success}
            />
            <StatCard
              icon="trending-up-outline"
              title={t('sellerDashboard.totalRevenue')}
              value={formatCurrency(stats?.totalRevenue || 0)}
              color={theme.colors.primary}
            />
            <StatCard
              icon="bag-outline"
              title={t('sellerDashboard.totalOrders')}
              value={stats?.totalOrders || 0}
              subtitle={`${stats?.pendingOrders || 0} ${t('sellerDashboard.pending')}`}
              color={theme.colors.warning}
              onPress={handleViewOrders}
            />
            <StatCard
              icon="cube-outline"
              title={t('sellerDashboard.products')}
              value={stats?.totalProducts || 0}
              subtitle={`${stats?.activeProducts || 0} ${t('sellerDashboard.active')}`}
              color={theme.colors.info}
              onPress={handleViewProducts}
            />
          </View>
        </View>

        {/* Rating Section */}
        {(stats?.rating || 0) > 0 && (
          <View style={[styles.ratingCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= Math.round(stats?.rating || 0) ? 'star' : 'star-outline'}
                  size={24}
                  color={theme.colors.warning}
                />
              ))}
            </View>
            <GSText variant="h3" weight="bold" style={{ marginTop: 8 }}>
              {(stats?.rating || 0).toFixed(1)}
            </GSText>
            <GSText variant="caption" color="textSecondary">
              {t('sellerDashboard.basedOnReviews', { count: stats?.totalReviews || 0 })}
            </GSText>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            {t('sellerDashboard.quickActions')}
          </GSText>

          <View style={styles.quickActionsGrid}>
            <QuickAction
              icon="add-circle-outline"
              title={t('sellerDashboard.addProduct')}
              onPress={handleAddProduct}
            />
            <QuickAction
              icon="cube-outline"
              title={t('sellerDashboard.myProducts')}
              onPress={handleViewProducts}
            />
            <QuickAction
              icon="receipt-outline"
              title={t('sellerDashboard.orders')}
              onPress={handleViewOrders}
              badge={stats?.pendingOrders}
            />
            <QuickAction
              icon="bar-chart-outline"
              title={t('sellerDashboard.analytics')}
              onPress={handleViewAnalytics}
            />
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <View style={[styles.tipCard, { backgroundColor: `${theme.colors.primary}20` }]}>
            <Ionicons name="bulb-outline" size={24} color={theme.colors.primary} />
            <View style={styles.tipContent}>
              <GSText variant="body" weight="semiBold" color="primary">
                {t('sellerDashboard.tipTitle')}
              </GSText>
              <GSText variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
                {t('sellerDashboard.tipDescription')}
              </GSText>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  switchModeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  goLiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  goLiveBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goLiveBannerText: {
    marginLeft: 12,
  },
  statsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  statCardWrapper: {
    width: '50%',
    padding: 6,
  },
  statCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 4,
  },
  quickActionsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  quickAction: {
    width: '25%',
    padding: 6,
    alignItems: 'center',
  },
  quickActionIconWrapper: {
    position: 'relative',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tipsSection: {
    paddingHorizontal: 16,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
});
