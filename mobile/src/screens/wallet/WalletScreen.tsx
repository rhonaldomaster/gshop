import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import GSInput from '../../components/ui/GSInput';
import {
  paymentsService,
  WalletBalance,
  TokenTransaction,
  TopupRequest,
  PaymentMethod,
} from '../../services/payments.service';

interface WalletCardProps {
  balance: WalletBalance;
  onTopup: () => void;
  onSend: () => void;
}

const WalletCard: React.FC<WalletCardProps> = ({ balance, onTopup, onSend }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.walletCard, { backgroundColor: theme.colors.primary }]}>
      <View style={styles.walletHeader}>
        <View style={styles.walletIcon}>
          <Ionicons name="diamond" size={24} color={theme.colors.white} />
        </View>
        <GSText variant="body" color="white" weight="medium">
          GSHOP Wallet
        </GSText>
      </View>

      <View style={styles.balanceSection}>
        <GSText variant="h1" color="white" weight="bold">
          {paymentsService.formatTokenAmount(balance.tokenBalance)}
        </GSText>
        <GSText variant="body" color="white" style={{ opacity: 0.8 }}>
          ≈ {paymentsService.formatPrice(balance.usdValue, 'USD')}
        </GSText>
      </View>

      {balance.pendingRewards > 0 && (
        <View style={styles.pendingRewards}>
          <Ionicons name="gift-outline" size={16} color={theme.colors.white} />
          <GSText variant="caption" color="white" style={{ marginLeft: 4 }}>
            +{paymentsService.formatTokenAmount(balance.pendingRewards)} pending rewards
          </GSText>
        </View>
      )}

      <View style={styles.walletActions}>
        <TouchableOpacity
          style={[styles.walletActionButton, { backgroundColor: theme.colors.white + '20' }]}
          onPress={onTopup}
        >
          <Ionicons name="add" size={20} color={theme.colors.white} />
          <GSText variant="caption" color="white" weight="medium" style={{ marginTop: 4 }}>
            Top Up
          </GSText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.walletActionButton, { backgroundColor: theme.colors.white + '20' }]}
          onPress={onSend}
        >
          <Ionicons name="send" size={20} color={theme.colors.white} />
          <GSText variant="caption" color="white" weight="medium" style={{ marginTop: 4 }}>
            Send
          </GSText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface TransactionItemProps {
  transaction: TokenTransaction;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  const { theme } = useTheme();

  const getTransactionIcon = (type: TokenTransaction['type']) => {
    switch (type) {
      case 'reward':
        return 'gift-outline';
      case 'purchase':
        return 'bag-outline';
      case 'transfer':
        return 'swap-horizontal-outline';
      case 'topup':
        return 'add-circle-outline';
      case 'withdrawal':
        return 'remove-circle-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const getTransactionColor = (type: TokenTransaction['type']) => {
    switch (type) {
      case 'reward':
      case 'topup':
        return theme.colors.success;
      case 'purchase':
      case 'withdrawal':
        return theme.colors.error;
      case 'transfer':
        return theme.colors.warning;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getAmountDisplay = (amount: number, type: TokenTransaction['type']) => {
    const sign = ['reward', 'topup'].includes(type) ? '+' : '-';
    return `${sign}${paymentsService.formatTokenAmount(Math.abs(amount))}`;
  };

  const getStatusColor = (status: TokenTransaction['status']) => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'pending':
        return theme.colors.warning;
      case 'failed':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  return (
    <View style={styles.transactionItem}>
      <View style={[styles.transactionIcon, { backgroundColor: getTransactionColor(transaction.type) + '20' }]}>
        <Ionicons
          name={getTransactionIcon(transaction.type) as any}
          size={20}
          color={getTransactionColor(transaction.type)}
        />
      </View>

      <View style={styles.transactionContent}>
        <GSText variant="body" weight="medium">
          {transaction.description}
        </GSText>
        <GSText variant="caption" color="textSecondary">
          {new Date(transaction.createdAt).toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </GSText>
        {transaction.orderId && (
          <GSText variant="caption" color="textSecondary">
            Order #{transaction.orderId.slice(0, 8)}
          </GSText>
        )}
      </View>

      <View style={styles.transactionAmount}>
        <GSText
          variant="body"
          weight="medium"
          style={{ color: getTransactionColor(transaction.type) }}
        >
          {getAmountDisplay(transaction.amount, transaction.type)}
        </GSText>
        <GSText
          variant="caption"
          style={{ color: getStatusColor(transaction.status) }}
        >
          {transaction.status}
        </GSText>
      </View>
    </View>
  );
};

interface TopupModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (amount: number, paymentMethodId: string) => void;
  paymentMethods: PaymentMethod[];
  isLoading: boolean;
}

const TopupModal: React.FC<TopupModalProps> = ({
  visible,
  onClose,
  onSubmit,
  paymentMethods,
  isLoading,
}) => {
  const { theme } = useTheme();
  const [amount, setAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');

  const quickAmounts = [10, 25, 50, 100];

  useEffect(() => {
    if (paymentMethods.length > 0) {
      const defaultMethod = paymentMethods.find(m => m.isDefault) || paymentMethods[0];
      setSelectedMethodId(defaultMethod.id);
    }
  }, [paymentMethods]);

  const handleSubmit = () => {
    const numAmount = Number(amount);
    if (numAmount < 5) {
      Alert.alert('Invalid Amount', 'Minimum topup amount is $5');
      return;
    }
    if (numAmount > 1000) {
      Alert.alert('Invalid Amount', 'Maximum topup amount is $1000');
      return;
    }
    if (!selectedMethodId) {
      Alert.alert('Payment Method Required', 'Please select a payment method');
      return;
    }

    onSubmit(numAmount, selectedMethodId);
  };

  const getMethodDisplay = (method: PaymentMethod) => {
    switch (method.type) {
      case 'card':
        return `•••• ${method.details.last4} (${method.details.brand?.toUpperCase()})`;
      case 'mercadopago':
        return 'MercadoPago Wallet';
      default:
        return method.provider;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <GSText variant="body" color="textSecondary">
              Cancel
            </GSText>
          </TouchableOpacity>
          <GSText variant="h4" weight="bold">
            Top Up Wallet
          </GSText>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.topupForm}>
            <GSText variant="h4" weight="bold" style={styles.formTitle}>
              Amount (USD)
            </GSText>

            <GSInput
              label="Enter amount"
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              keyboardType="numeric"
              style={styles.amountInput}
            />

            <View style={styles.quickAmounts}>
              {quickAmounts.map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  style={[
                    styles.quickAmountButton,
                    {
                      backgroundColor: amount === quickAmount.toString()
                        ? theme.colors.primary
                        : theme.colors.surface,
                    },
                  ]}
                  onPress={() => setAmount(quickAmount.toString())}
                >
                  <GSText
                    variant="body"
                    weight="medium"
                    color={amount === quickAmount.toString() ? 'white' : 'text'}
                  >
                    ${quickAmount}
                  </GSText>
                </TouchableOpacity>
              ))}
            </View>

            <GSText variant="h4" weight="bold" style={styles.formTitle}>
              Payment Method
            </GSText>

            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethodOption,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: selectedMethodId === method.id ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setSelectedMethodId(method.id)}
              >
                <View style={styles.methodInfo}>
                  <Ionicons
                    name={paymentsService.getPaymentMethodIcon(method.type) as any}
                    size={20}
                    color={selectedMethodId === method.id ? theme.colors.primary : theme.colors.textSecondary}
                  />
                  <GSText variant="body" weight="medium" style={{ marginLeft: 12 }}>
                    {getMethodDisplay(method)}
                  </GSText>
                </View>
                <View
                  style={[
                    styles.radioButton,
                    {
                      borderColor: selectedMethodId === method.id ? theme.colors.primary : theme.colors.border,
                      backgroundColor: selectedMethodId === method.id ? theme.colors.primary : 'transparent',
                    },
                  ]}
                >
                  {selectedMethodId === method.id && (
                    <Ionicons name="checkmark" size={12} color={theme.colors.white} />
                  )}
                </View>
              </TouchableOpacity>
            ))}

            <View style={styles.topupInfo}>
              <GSText variant="caption" color="textSecondary" style={{ textAlign: 'center' }}>
                You will receive {amount ? (Number(amount) * 100).toFixed(0) : '0'} GSHOP tokens
              </GSText>
              <GSText variant="caption" color="textSecondary" style={{ textAlign: 'center', marginTop: 4 }}>
                Exchange rate: 1 USD = 100 GSHOP tokens
              </GSText>
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <GSButton
            title={`Top Up ${amount ? `$${amount}` : ''}`}
            onPress={handleSubmit}
            loading={isLoading}
            disabled={!amount || !selectedMethodId}
            style={styles.topupButton}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default function WalletScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();

  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupLoading, setTopupLoading] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  // Load wallet data
  const loadWalletData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }

      const [balance, methods] = await Promise.all([
        paymentsService.getWalletBalance(),
        paymentsService.getPaymentMethods().catch(() => []),
      ]);

      setWalletBalance(balance);
      setPaymentMethods(methods.filter(m => m.type !== 'gshop_tokens')); // Exclude tokens for topup
    } catch (error: any) {
      console.error('Failed to load wallet data:', error);
      Alert.alert('Error', error.message || 'Failed to load wallet data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadWalletData();
    }
  }, [isAuthenticated, loadWalletData]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadWalletData(true);
  }, [loadWalletData]);

  // Handle topup
  const handleTopup = useCallback(async (amount: number, paymentMethodId: string) => {
    try {
      setTopupLoading(true);

      const topupRequest: TopupRequest = {
        amount,
        paymentMethodId,
        currency: 'USD',
      };

      await paymentsService.topupWallet(topupRequest);

      Alert.alert(
        'Topup Successful',
        `Your wallet has been topped up with ${paymentsService.formatTokenAmount(amount * 100)}`,
        [{ text: 'OK', onPress: () => setShowTopupModal(false) }]
      );

      loadWalletData();
    } catch (error: any) {
      console.error('Topup failed:', error);
      Alert.alert('Topup Failed', error.message || 'Failed to top up wallet');
    } finally {
      setTopupLoading(false);
    }
  }, [loadWalletData]);

  // Handle send tokens (placeholder)
  const handleSend = useCallback(() => {
    Alert.alert(
      'Send Tokens',
      'Token transfer feature will be available soon!',
      [{ text: 'OK' }]
    );
  }, []);

  // Render transaction item
  const renderTransaction = ({ item }: { item: TokenTransaction }) => (
    <TransactionItem transaction={item} />
  );

  // Show login prompt for guests
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <GSText variant="h3" weight="bold">
            GSHOP Wallet
          </GSText>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={60} color={theme.colors.textSecondary} />
          <GSText variant="h3" weight="bold" style={styles.emptyTitle}>
            Sign in Required
          </GSText>
          <GSText variant="body" color="textSecondary" style={styles.emptySubtitle}>
            Sign in to access your GSHOP wallet and manage your tokens
          </GSText>
          <GSButton
            title="Sign In"
            onPress={() => navigation.navigate('Auth' as any)}
            style={styles.signInButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <GSText variant="h3" weight="bold">
            GSHOP Wallet
          </GSText>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <GSText variant="body" color="textSecondary" style={{ marginTop: 16 }}>
            Loading wallet...
          </GSText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <GSText variant="h3" weight="bold">
          GSHOP Wallet
        </GSText>
        <TouchableOpacity onPress={() => navigation.navigate('PaymentMethods' as any)}>
          <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Wallet Card */}
        {walletBalance && (
          <WalletCard
            balance={walletBalance}
            onTopup={() => setShowTopupModal(true)}
            onSend={handleSend}
          />
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => setShowTopupModal(true)}
          >
            <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
            <GSText variant="body" weight="medium" style={{ marginTop: 8 }}>
              Top Up
            </GSText>
            <GSText variant="caption" color="textSecondary">
              Add tokens
            </GSText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: theme.colors.surface }]}
            onPress={handleSend}
          >
            <Ionicons name="send-outline" size={24} color={theme.colors.primary} />
            <GSText variant="body" weight="medium" style={{ marginTop: 8 }}>
              Send
            </GSText>
            <GSText variant="caption" color="textSecondary">
              Transfer tokens
            </GSText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('PaymentMethods' as any)}
          >
            <Ionicons name="card-outline" size={24} color={theme.colors.primary} />
            <GSText variant="body" weight="medium" style={{ marginTop: 8 }}>
              Methods
            </GSText>
            <GSText variant="caption" color="textSecondary">
              Payment cards
            </GSText>
          </TouchableOpacity>
        </View>

        {/* Rewards Info */}
        <View style={[styles.rewardsSection, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.rewardsHeader}>
            <Ionicons name="gift" size={20} color={theme.colors.success} />
            <GSText variant="h4" weight="bold" style={{ marginLeft: 8 }}>
              Cashback Rewards
            </GSText>
          </View>
          <GSText variant="body" color="textSecondary" style={{ marginBottom: 8 }}>
            Earn 5% cashback on every purchase in GSHOP tokens
          </GSText>
          <GSText variant="caption" color="textSecondary">
            Rewards are automatically added to your wallet after order delivery
          </GSText>
        </View>

        {/* Transaction History */}
        <View style={styles.transactionsSection}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            Recent Transactions
          </GSText>

          {walletBalance?.transactions && walletBalance.transactions.length > 0 ? (
            <FlatList
              data={walletBalance.transactions}
              keyExtractor={(item) => item.id}
              renderItem={renderTransaction}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyTransactions}>
              <Ionicons name="receipt-outline" size={40} color={theme.colors.textSecondary} />
              <GSText variant="body" color="textSecondary" style={{ marginTop: 12, textAlign: 'center' }}>
                No transactions yet
              </GSText>
              <GSText variant="caption" color="textSecondary" style={{ textAlign: 'center' }}>
                Your transaction history will appear here
              </GSText>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Topup Modal */}
      <TopupModal
        visible={showTopupModal}
        onClose={() => setShowTopupModal(false)}
        onSubmit={handleTopup}
        paymentMethods={paymentMethods}
        isLoading={topupLoading}
      />
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginBottom: 24,
    textAlign: 'center',
  },
  signInButton: {
    minWidth: 160,
  },
  walletCard: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  walletIcon: {
    marginRight: 8,
  },
  balanceSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  pendingRewards: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  walletActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  walletActionButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  rewardsSection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  rewardsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionsSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  topupForm: {
    flex: 1,
  },
  formTitle: {
    marginBottom: 12,
    marginTop: 24,
  },
  amountInput: {
    marginBottom: 16,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  quickAmountButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topupInfo: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  topupButton: {
    marginBottom: 0,
  },
});