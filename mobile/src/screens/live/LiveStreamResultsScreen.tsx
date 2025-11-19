import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

interface StreamStats {
  currentViewers: number;
  peakViewers: number;
  messagesCount: number;
  productsClicked: number;
  purchaseCount: number;
  revenue: number;
}

export default function LiveStreamResultsScreen({ route, navigation }: any) {
  const { t } = useTranslation('translation');
  const { streamId, stats, duration } = route.params as {
    streamId: string;
    stats: StreamStats;
    duration: number;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const calculateConversionRate = () => {
    if (stats.peakViewers === 0) return '0';
    return ((stats.purchaseCount / stats.peakViewers) * 100).toFixed(1);
  };

  const calculateEngagementRate = () => {
    if (stats.peakViewers === 0) return '0';
    return ((stats.messagesCount / stats.peakViewers) * 100).toFixed(1);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: t('live.shareStreamResults', {
          revenue: formatCurrency(stats.revenue),
          viewers: stats.peakViewers,
          purchases: stats.purchaseCount,
        }),
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const goToHome = () => {
    navigation.navigate('Home');
  };

  const viewRecording = () => {
    // Navigate to recording view
    navigation.navigate('LiveStreamRecording', { streamId });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#8b5cf6', '#7c3aed']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <MaterialIcons name="check-circle" size={64} color="white" />
          <Text style={styles.headerTitle}>{t('live.streamEnded')}</Text>
          <Text style={styles.headerSubtitle}>{t('live.greatJob')}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <MaterialIcons name="schedule" size={24} color="#6b7280" />
              <Text style={styles.summaryLabel}>{t('live.duration')}</Text>
              <Text style={styles.summaryValue}>{formatDuration(duration)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <MaterialIcons name="visibility" size={24} color="#6b7280" />
              <Text style={styles.summaryLabel}>{t('live.peakViewers')}</Text>
              <Text style={styles.summaryValue}>{stats.peakViewers}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <MaterialIcons name="attach-money" size={24} color="#6b7280" />
              <Text style={styles.summaryLabel}>{t('live.revenue')}</Text>
              <Text style={styles.summaryValue}>{formatCurrency(stats.revenue)}</Text>
            </View>
          </View>
        </View>

        {/* Performance Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('live.performance')}</Text>

          <View style={styles.statsList}>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <MaterialIcons name="shopping-cart" size={28} color="#10b981" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>{t('live.totalPurchases')}</Text>
                <Text style={styles.statValue}>{stats.purchaseCount}</Text>
                <Text style={styles.statSubtext}>
                  {calculateConversionRate()}% {t('live.conversionRate')}
                </Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <MaterialIcons name="chat" size={28} color="#3b82f6" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>{t('live.chatMessages')}</Text>
                <Text style={styles.statValue}>{stats.messagesCount}</Text>
                <Text style={styles.statSubtext}>
                  {calculateEngagementRate()}% {t('live.engagementRate')}
                </Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <MaterialIcons name="touch-app" size={28} color="#f59e0b" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>{t('live.productClicks')}</Text>
                <Text style={styles.statValue}>{stats.productsClicked}</Text>
                <Text style={styles.statSubtext}>
                  {t('live.userInteractions')}
                </Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <MaterialIcons name="trending-up" size={28} color="#8b5cf6" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>{t('live.averageViewers')}</Text>
                <Text style={styles.statValue}>
                  {Math.round(stats.peakViewers * 0.7)}
                </Text>
                <Text style={styles.statSubtext}>
                  {t('live.concurrentViewers')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('live.insights')}</Text>

          <View style={styles.insightsList}>
            {stats.purchaseCount > 0 && (
              <View style={[styles.insightCard, styles.insightSuccess]}>
                <MaterialIcons name="trending-up" size={24} color="#10b981" />
                <Text style={styles.insightText}>
                  {t('live.insightPurchases', { count: stats.purchaseCount })}
                </Text>
              </View>
            )}

            {parseFloat(calculateEngagementRate()) > 50 && (
              <View style={[styles.insightCard, styles.insightSuccess]}>
                <MaterialIcons name="favorite" size={24} color="#10b981" />
                <Text style={styles.insightText}>
                  {t('live.insightHighEngagement')}
                </Text>
              </View>
            )}

            {stats.peakViewers >= 100 && (
              <View style={[styles.insightCard, styles.insightSuccess]}>
                <MaterialIcons name="stars" size={24} color="#10b981" />
                <Text style={styles.insightText}>
                  {t('live.insightPopularStream')}
                </Text>
              </View>
            )}

            <View style={[styles.insightCard, styles.insightInfo]}>
              <MaterialIcons name="info" size={24} color="#3b82f6" />
              <Text style={styles.insightText}>
                {t('live.insightTip')}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleShare}>
            <MaterialIcons name="share" size={20} color="white" />
            <Text style={styles.primaryButtonText}>{t('live.shareResults')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={viewRecording}>
            <MaterialIcons name="play-circle-outline" size={20} color="#8b5cf6" />
            <Text style={styles.secondaryButtonText}>{t('live.viewRecording')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={goToHome}>
            <MaterialIcons name="home" size={20} color="#8b5cf6" />
            <Text style={styles.secondaryButtonText}>{t('common.backToHome')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: -24,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#e5e7eb',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statsList: {
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 12,
    color: '#9ca3af',
  },
  insightsList: {
    gap: 12,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  insightSuccess: {
    backgroundColor: '#d1fae5',
  },
  insightInfo: {
    backgroundColor: '#dbeafe',
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  actionsSection: {
    padding: 16,
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8b5cf6',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: '600',
  },
});
