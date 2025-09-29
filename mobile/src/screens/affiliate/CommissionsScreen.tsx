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
import { affiliatesService, AffiliateStats } from '../../services/affiliates.service';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';

const { width } = Dimensions.get('window');

interface CommissionTransaction {
  id: string;
  type: 'earned' | 'paid' | 'pending' | 'adjustment';
  amount: number;
  description: string;
  orderId?: string;
  productName?: string;
  date: Date;
  status: 'completed' | 'pending' | 'processing' | 'failed';
}

interface PayoutRequest {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: Date;
  processedAt?: Date;
  method: 'bank_transfer' | 'paypal' | 'crypto';
  fee: number;
}

export const CommissionsScreen = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [transactions, setTransactions] = useState<CommissionTransaction[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requestingPayout, setRequestingPayout] = useState(false);

  // Mock data for demonstration
  const mockTransactions: CommissionTransaction[] = [
    {
      id: '1',
      type: 'earned',
      amount: 15.50,
      description: 'Commission from product sale',
      orderId: 'ORD-12345',
      productName: 'Wireless Bluetooth Headphones',
      date: new Date('2024-01-15'),
      status: 'completed',
    },
    {
      id: '2',
      type: 'earned',
      amount: 8.25,
      description: 'Commission from live stream sale',
      orderId: 'ORD-12346',
      productName: 'Smartphone Case',
      date: new Date('2024-01-14'),
      status: 'completed',
    },
    {
      id: '3',
      type: 'pending',
      amount: 22.75,
      description: 'Pending commission (awaiting confirmation)',
      orderId: 'ORD-12347',
      productName: 'Running Shoes',
      date: new Date('2024-01-13'),
      status: 'pending',
    },
    {
      id: '4',
      type: 'paid',
      amount: -125.00,
      description: 'Payout to bank account',
      date: new Date('2024-01-10'),
      status: 'completed',
    },
  ];

  const mockPayouts: PayoutRequest[] = [
    {
      id: '1',
      amount: 125.00,
      status: 'completed',
      requestedAt: new Date('2024-01-10'),
      processedAt: new Date('2024-01-12'),
      method: 'bank_transfer',
      fee: 2.50,
    },
    {
      id: '2',
      amount: 75.00,
      status: 'processing',
      requestedAt: new Date('2024-01-08'),
      method: 'paypal',
      fee: 1.50,
    },
  ];

  const timeframes = [
    { key: 'week', label: 'This Week', icon: '📅' },
    { key: 'month', label: 'This Month', icon: '📊' },
    { key: 'year', label: 'This Year', icon: '📈' },
  ];

  const loadCommissionsData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Load stats from API
      const affiliateStats = await affiliatesService.getAffiliateStats(selectedTimeframe);
      setStats(affiliateStats);

      // For now, use mock data for transactions and payouts
      // In a real app, these would come from API
      setTransactions(mockTransactions);
      setPayouts(mockPayouts);
    } catch (error) {
      console.error('Error loading commissions data:', error);
      Alert.alert('Error', 'Failed to load commissions data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedTimeframe]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCommissionsData();
    setRefreshing(false);
  }, [loadCommissionsData]);

  const requestPayout = useCallback(async () => {
    if (!stats || stats.totalRevenue < 50) {
      Alert.alert(
        'Minimum Payout Amount',
        'You need at least $50.00 in available balance to request a payout.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Request Payout',
      `Request a payout of $${stats.totalRevenue.toFixed(2)}? Processing fee: $2.50`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: async () => {
            try {
              setRequestingPayout(true);

              // In a real app, this would call the API
              await new Promise(resolve => setTimeout(resolve, 2000));

              Alert.alert(
                'Payout Requested! 💰',
                'Your payout request has been submitted and will be processed within 3-5 business days.',
                [{ text: 'OK' }]
              );

              // Refresh data
              await loadCommissionsData();
            } catch (error) {
              console.error('Error requesting payout:', error);
              Alert.alert('Error', 'Failed to request payout. Please try again.');
            } finally {
              setRequestingPayout(false);
            }
          },
        },
      ]
    );
  }, [stats, loadCommissionsData]);

  useEffect(() => {
    loadCommissionsData();
  }, [loadCommissionsData]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Sign in Required"
          description="Please sign in to view your commissions"
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

  const renderTimeframeTabs = () => (
    <View style={styles.timeframeContainer}>
      {timeframes.map((timeframe) => (
        <TouchableOpacity
          key={timeframe.key}
          style={[
            styles.timeframeTab,
            selectedTimeframe === timeframe.key && styles.timeframeTabActive,
          ]}
          onPress={() => setSelectedTimeframe(timeframe.key as any)}
        >
          <Text style={styles.timeframeIcon}>{timeframe.icon}</Text>
          <Text
            style={[
              styles.timeframeText,
              selectedTimeframe === timeframe.key && styles.timeframeTextActive,
            ]}
          >
            {timeframe.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStatsCard = (title: string, value: string, subtitle?: string, color: string = '#007bff') => (
    <View style={styles.statsCard}>
      <Text style={styles.statsTitle}>{title}</Text>
      <Text style={[styles.statsValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statsSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderTransaction = (transaction: CommissionTransaction) => {
    const getTransactionIcon = () => {
      switch (transaction.type) {
        case 'earned': return '💰';
        case 'paid': return '💸';
        case 'pending': return '⏳';
        case 'adjustment': return '⚖️';
        default: return '💰';
      }
    };

    const getStatusColor = () => {
      switch (transaction.status) {
        case 'completed': return '#28a745';
        case 'pending': return '#ffc107';
        case 'processing': return '#007bff';
        case 'failed': return '#dc3545';
        default: return '#6c757d';
      }
    };

    return (
      <View key={transaction.id} style={styles.transactionItem}>
        <Text style={styles.transactionIcon}>{getTransactionIcon()}</Text>

        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription}>{transaction.description}</Text>
          {transaction.productName && (
            <Text style={styles.transactionProduct}>{transaction.productName}</Text>
          )}
          <Text style={styles.transactionDate}>
            {transaction.date.toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.transactionAmount}>
          <Text
            style={[
              styles.transactionAmountText,
              { color: transaction.amount >= 0 ? '#28a745' : '#dc3545' }
            ]}
          >
            {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
          </Text>
          <Text style={[styles.transactionStatus, { color: getStatusColor() }]}>
            {transaction.status}
          </Text>
        </View>
      </View>
    );
  };

  const renderPayout = (payout: PayoutRequest) => {
    const getStatusIcon = () => {
      switch (payout.status) {
        case 'completed': return '✅';
        case 'processing': return '⏳';
        case 'pending': return '📋';
        case 'failed': return '❌';
        default: return '📋';
      }
    };

    const getStatusColor = () => {
      switch (payout.status) {
        case 'completed': return '#28a745';
        case 'processing': return '#007bff';
        case 'pending': return '#ffc107';
        case 'failed': return '#dc3545';
        default: return '#6c757d';
      }
    };

    return (
      <View key={payout.id} style={styles.payoutItem}>
        <Text style={styles.payoutIcon}>{getStatusIcon()}</Text>

        <View style={styles.payoutInfo}>
          <Text style={styles.payoutAmount}>${payout.amount.toFixed(2)}</Text>
          <Text style={styles.payoutMethod}>
            via {payout.method.replace('_', ' ')} • Fee: ${payout.fee.toFixed(2)}
          </Text>
          <Text style={styles.payoutDate}>
            Requested: {payout.requestedAt.toLocaleDateString()}
          </Text>
          {payout.processedAt && (
            <Text style={styles.payoutDate}>
              Processed: {payout.processedAt.toLocaleDateString()}
            </Text>
          )}
        </View>

        <Text style={[styles.payoutStatus, { color: getStatusColor() }]}>
          {payout.status}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Commissions</Text>
        <Text style={styles.headerSubtitle}>Track your earnings and payouts</Text>
      </View>

      {renderTimeframeTabs()}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            {renderStatsCard(
              'Total Earnings',
              `$${stats?.totalRevenue.toFixed(2) || '0.00'}`,
              selectedTimeframe,
              '#28a745'
            )}
            {renderStatsCard(
              'Available Balance',
              `$${(stats?.totalRevenue || 0).toFixed(2)}`,
              'Ready to withdraw',
              '#007bff'
            )}
            {renderStatsCard(
              'Conversion Rate',
              `${(stats?.conversionRate || 0).toFixed(1)}%`,
              'Clicks to sales',
              '#ffc107'
            )}
            {renderStatsCard(
              'Total Clicks',
              (stats?.totalClicks || 0).toLocaleString(),
              'All time',
              '#dc3545'
            )}
          </View>
        </View>

        {/* Payout Section */}
        <View style={styles.payoutSection}>
          <View style={styles.payoutHeader}>
            <Text style={styles.sectionTitle}>💸 Request Payout</Text>
            <TouchableOpacity
              style={[
                styles.payoutButton,
                (!stats || stats.totalRevenue < 50 || requestingPayout) && styles.payoutButtonDisabled
              ]}
              onPress={requestPayout}
              disabled={!stats || stats.totalRevenue < 50 || requestingPayout}
            >
              {requestingPayout ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.payoutButtonText}>
                  Request ${(stats?.totalRevenue || 0).toFixed(2)}
                </Text>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.payoutNote}>
            Minimum payout amount: $50.00 • Processing fee: $2.50
          </Text>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>💰 Recent Transactions</Text>
          {transactions.length > 0 ? (
            transactions.map(renderTransaction)
          ) : (
            <EmptyState
              title="No Transactions"
              description="Start earning commissions by sharing your affiliate links"
              icon="💰"
            />
          )}
        </View>

        {/* Payout History */}
        <View style={styles.payoutsSection}>
          <Text style={styles.sectionTitle}>📋 Payout History</Text>
          {payouts.length > 0 ? (
            payouts.map(renderPayout)
          ) : (
            <EmptyState
              title="No Payouts Yet"
              description="Your payout requests will appear here"
              icon="💸"
            />
          )}
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
  timeframeContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timeframeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  timeframeTabActive: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  timeframeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  timeframeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  timeframeTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
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
  payoutSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  payoutButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  payoutButtonDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.6,
  },
  payoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  payoutNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  transactionsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  transactionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  transactionProduct: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  payoutsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  payoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  payoutIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  payoutInfo: {
    flex: 1,
  },
  payoutAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  payoutMethod: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  payoutDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  payoutStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});