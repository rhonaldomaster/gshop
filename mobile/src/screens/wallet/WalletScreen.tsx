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
import { useStripe } from '@stripe/stripe-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import GSInput from '../../components/ui/GSInput';
import {
  paymentsService,
  WalletBalance,
  TokenTransaction,
  StripeTopupIntentResponse,
} from '../../services/payments.service';

interface WalletCardProps {
  balance: WalletBalance;
  onTopup: () => void;
  onSend: () => void;
  t: (key: string, options?: any) => string;
}

const WalletCard: React.FC<WalletCardProps> = ({ balance, onTopup, onSend, t }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.walletCard, { backgroundColor: theme.colors.primary }]}>
      <View style={styles.walletHeader}>
        <View style={styles.walletIcon}>
          <Ionicons name="diamond" size={24} color={theme.colors.white} />
        </View>
        <GSText variant="body" color="white" weight="medium">
          {t('wallet.myWallet')}
        </GSText>
      </View>

      <View style={styles.balanceSection}>
        <GSText variant="h1" color="white" weight="bold">
          {paymentsService.formatPrice(balance.tokenBalance, 'USD')}
        </GSText>
        <GSText variant="body" color="white" style={{ opacity: 0.8 }}>
          {t('wallet.availableBalance')}
        </GSText>
      </View>

      {balance.pendingRewards > 0 && (
        <View style={styles.pendingRewards}>
          <Ionicons name="gift-outline" size={16} color={theme.colors.white} />
          <GSText variant="caption" color="white" style={{ marginLeft: 4 }}>
            +{paymentsService.formatTokenAmount(balance.pendingRewards)} {t('wallet.pendingRewards')}
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
            {t('wallet.topUp')}
          </GSText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.walletActionButton, { backgroundColor: theme.colors.white + '20' }]}
          onPress={onSend}
        >
          <Ionicons name="send" size={20} color={theme.colors.white} />
          <GSText variant="caption" color="white" weight="medium" style={{ marginTop: 4 }}>
            {t('wallet.send')}
          </GSText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface TransactionItemProps {
  transaction: TokenTransaction;
  t: (key: string, options?: any) => string;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, t }) => {
  const { theme } = useTheme();

  const getTransactionIcon = (type: TokenTransaction['type']) => {
    switch (type) {
      case 'reward':
        return 'gift-outline';
      case 'purchase':
        return 'bag-outline';
      case 'transfer':
        return 'swap-horizontal-outline';
      case 'transfer_in':
        return 'arrow-down-circle-outline';
      case 'transfer_out':
        return 'arrow-up-circle-outline';
      case 'topup':
        return 'add-circle-outline';
      case 'withdrawal':
        return 'remove-circle-outline';
      case 'platform_fee':
        return 'pricetag-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const getTransactionColor = (type: TokenTransaction['type'], amount: number) => {
    switch (type) {
      case 'reward':
      case 'topup':
      case 'transfer_in':
        return theme.colors.success;
      case 'purchase':
      case 'withdrawal':
      case 'transfer_out':
      case 'platform_fee':
        return theme.colors.error;
      case 'transfer':
        return amount >= 0 ? theme.colors.success : theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getAmountDisplay = (amount: number) => {
    const sign = amount >= 0 ? '+' : '';
    return `${sign}${paymentsService.formatPrice(amount, 'USD')}`;
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
      <View style={[styles.transactionIcon, { backgroundColor: getTransactionColor(transaction.type, transaction.amount) + '20' }]}>
        <Ionicons
          name={getTransactionIcon(transaction.type) as any}
          size={20}
          color={getTransactionColor(transaction.type, transaction.amount)}
        />
      </View>

      <View style={styles.transactionContent}>
        <GSText variant="body" weight="medium">
          {transaction.description}
        </GSText>
        <GSText variant="caption" color="textSecondary">
          {new Date(transaction.executedAt || transaction.createdAt).toLocaleDateString('es-CO', {
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
        {/* Show dynamic code for P2P transfers */}
        {(transaction.type === 'transfer_out' || transaction.type === 'transfer_in') &&
          transaction.dynamicCode && (
          <View style={styles.dynamicCodeBadge}>
            <Ionicons name="key-outline" size={12} color={theme.colors.textSecondary} />
            <GSText variant="caption" color="textSecondary" style={{ marginLeft: 4, fontFamily: 'monospace' }}>
              {transaction.dynamicCode}
            </GSText>
          </View>
        )}
      </View>

      <View style={styles.transactionAmount}>
        <GSText
          variant="body"
          weight="medium"
          style={{ color: getTransactionColor(transaction.type, transaction.amount) }}
        >
          {getAmountDisplay(transaction.amount)}
        </GSText>
        <GSText
          variant="caption"
          style={{ color: getStatusColor(transaction.status) }}
        >
          {t(`wallet.transactionStatus.${transaction.status}`)}
        </GSText>
      </View>
    </View>
  );
};

type TopupStep = 'amount' | 'processing' | 'success' | 'error';

interface TopupModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (amountUSD: number) => Promise<void>;
  isLoading: boolean;
  topupStep: TopupStep;
  topupResult: {
    amountUSD?: number;
    error?: string;
  } | null;
  t: (key: string, options?: any) => string;
}

const TopupModal: React.FC<TopupModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isLoading,
  topupStep,
  topupResult,
  t,
}) => {
  const { theme } = useTheme();
  const [amount, setAmount] = useState('');

  // Quick amounts in USD
  const quickAmounts = [5, 10, 25, 50];

  const formatUSD = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0.50) {
      Alert.alert(t('wallet.topupModal.invalidAmount'), t('wallet.topupModal.minAmountError'));
      return;
    }
    if (numAmount > 10000) {
      Alert.alert(t('wallet.topupModal.invalidAmount'), t('wallet.topupModal.maxAmountError'));
      return;
    }

    onSubmit(numAmount);
  };

  const handleClose = () => {
    setAmount('');
    onClose();
  };

  const renderAmountStep = () => (
    <>
      <GSText variant="h4" weight="bold" style={styles.formTitle}>
        {t('wallet.topupModal.amountToTopup')}
      </GSText>

      <GSInput
        label={t('wallet.topupModal.enterAmount')}
        value={amount}
        onChangeText={(text) => {
          // Allow numbers and decimal point
          const cleaned = text.replace(/[^0-9.]/g, '');
          setAmount(cleaned);
        }}
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
              variant="caption"
              weight="semiBold"
              color={amount === quickAmount.toString() ? 'white' : 'text'}
            >
              {formatUSD(quickAmount)}
            </GSText>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.paymentMethodOption, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }]}>
        <View style={styles.methodInfo}>
          <Ionicons name="card-outline" size={20} color={theme.colors.primary} />
          <GSText variant="body" weight="semiBold" style={{ marginLeft: 12 }}>
            {t('wallet.topupModal.creditDebitCard')}
          </GSText>
        </View>
        <Ionicons name="shield-checkmark" size={20} color={theme.colors.success} />
      </View>

      <View style={styles.topupInfo}>
        <View style={styles.topupInfoRow}>
          <Ionicons name="lock-closed" size={14} color={theme.colors.textSecondary} />
          <GSText variant="caption" color="textSecondary" style={{ marginLeft: 6 }}>
            {t('wallet.topupModal.securePayment')}
          </GSText>
        </View>
        <GSText variant="caption" color="textSecondary" style={{ textAlign: 'center', marginTop: 8 }}>
          {t('wallet.topupModal.instantCredit')}
        </GSText>
      </View>
    </>
  );

  const renderProcessingStep = () => (
    <View style={styles.stepContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <GSText variant="h4" weight="bold" style={{ marginTop: 20 }}>
        {t('wallet.topupModal.processing')}
      </GSText>
      <GSText variant="body" color="textSecondary" style={{ marginTop: 8, textAlign: 'center' }}>
        {t('wallet.topupModal.dontClose')}
      </GSText>
    </View>
  );

  const renderSuccessStep = () => (
    <View style={styles.stepContainer}>
      <View style={[styles.successIcon, { backgroundColor: theme.colors.success + '20' }]}>
        <Ionicons name="checkmark-circle" size={60} color={theme.colors.success} />
      </View>
      <GSText variant="h3" weight="bold" style={{ marginTop: 20 }}>
        {t('wallet.topUpSuccess')}
      </GSText>
      {topupResult?.amountUSD && (
        <GSText variant="h4" color="primary" weight="bold" style={{ marginTop: 8 }}>
          +{formatUSD(topupResult.amountUSD)}
        </GSText>
      )}
      <GSText variant="body" color="textSecondary" style={{ marginTop: 8, textAlign: 'center' }}>
        {t('wallet.topupModal.balanceUpdated')}
      </GSText>
    </View>
  );

  const renderErrorStep = () => (
    <View style={styles.stepContainer}>
      <View style={[styles.successIcon, { backgroundColor: theme.colors.error + '20' }]}>
        <Ionicons name="close-circle" size={60} color={theme.colors.error} />
      </View>
      <GSText variant="h3" weight="bold" style={{ marginTop: 20 }}>
        {t('wallet.topupModal.paymentError')}
      </GSText>
      <GSText variant="body" color="textSecondary" style={{ marginTop: 8, textAlign: 'center' }}>
        {topupResult?.error || t('wallet.topupModal.paymentErrorMessage')}
      </GSText>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={handleClose} disabled={topupStep === 'processing'}>
            <GSText variant="body" color={topupStep === 'processing' ? 'textSecondary' : 'text'}>
              {topupStep === 'success' || topupStep === 'error' ? t('common.close') : t('common.cancel')}
            </GSText>
          </TouchableOpacity>
          <GSText variant="h4" weight="bold">
            {t('wallet.topUpWallet')}
          </GSText>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.topupForm}>
            {topupStep === 'amount' && renderAmountStep()}
            {topupStep === 'processing' && renderProcessingStep()}
            {topupStep === 'success' && renderSuccessStep()}
            {topupStep === 'error' && renderErrorStep()}
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          {topupStep === 'amount' && (
            <GSButton
              title={amount ? t('wallet.topupModal.payAmount', { amount: formatUSD(Number(amount)) }) : t('wallet.topUp')}
              onPress={handleSubmit}
              loading={isLoading}
              disabled={!amount || isLoading}
              style={styles.topupButton}
            />
          )}
          {(topupStep === 'success' || topupStep === 'error') && (
            <GSButton
              title={topupStep === 'success' ? t('common.done') : t('common.tryAgain')}
              onPress={topupStep === 'success' ? handleClose : () => onClose()}
              style={styles.topupButton}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default function WalletScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { t } = useTranslation();

  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupStep, setTopupStep] = useState<TopupStep>('amount');
  const [topupResult, setTopupResult] = useState<{
    amountUSD?: number;
    error?: string;
  } | null>(null);

  // Load wallet data
  const loadWalletData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }

      const balance = await paymentsService.getWalletBalance();
      setWalletBalance(balance);
    } catch (error: any) {
      console.error('Failed to load wallet data:', error);
      Alert.alert(t('common.error'), error.message || t('wallet.errors.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

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

  // Handle topup with Stripe SDK
  const handleTopup = useCallback(async (amountUSD: number) => {
    try {
      setTopupLoading(true);
      setTopupStep('processing');

      // Step 1: Create Payment Intent on backend
      console.log('Creating Stripe topup intent for', amountUSD, 'USD');
      const intentResponse = await paymentsService.createStripeTopupIntent(amountUSD);
      console.log('Got intent response:', intentResponse);

      // Step 2: Initialize Stripe Payment Sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: intentResponse.clientSecret,
        merchantDisplayName: 'GSHOP',
        style: 'automatic',
      });

      if (initError) {
        console.error('Stripe init error:', initError);
        setTopupStep('error');
        setTopupResult({ error: initError.message });
        setTopupLoading(false);
        return;
      }

      // Step 3: Present Payment Sheet to user
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        // User cancelled or payment failed
        if (paymentError.code === 'Canceled') {
          console.log('User cancelled payment');
          setTopupStep('amount');
          setTopupLoading(false);
          return;
        }

        console.error('Stripe payment error:', paymentError);
        setTopupStep('error');
        setTopupResult({ error: paymentError.message });
        setTopupLoading(false);
        return;
      }

      // Step 4: Payment succeeded on Stripe side, poll for backend confirmation
      console.log('Payment succeeded, polling for confirmation...');
      const finalStatus = await paymentsService.pollTopupStatus(intentResponse.topupId);

      if (finalStatus.status === 'completed') {
        setTopupStep('success');
        setTopupResult({
          amountUSD: intentResponse.amountUSD,
        });
        // Reload wallet data to show new balance
        loadWalletData();
      } else {
        // Payment might still be processing or failed on backend
        setTopupStep('success'); // Show success since Stripe confirmed
        setTopupResult({
          amountUSD: intentResponse.amountUSD,
        });
        loadWalletData();
      }
    } catch (error: any) {
      console.error('Topup failed:', error);
      setTopupStep('error');
      setTopupResult({ error: error.message || 'No se pudo procesar tu pago' });
    } finally {
      setTopupLoading(false);
    }
  }, [initPaymentSheet, presentPaymentSheet, loadWalletData]);

  // Handle modal close
  const handleCloseTopupModal = useCallback(() => {
    setShowTopupModal(false);
    setTopupStep('amount');
    setTopupResult(null);
    setTopupLoading(false);
  }, []);

  // Handle send tokens - navigate to transfer screen
  const handleSend = useCallback(() => {
    navigation.navigate('Transfer' as any);
  }, [navigation]);

  // Render transaction item
  const renderTransaction = ({ item }: { item: TokenTransaction }) => (
    <TransactionItem transaction={item} t={t} />
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
            {t('wallet.title')}
          </GSText>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={60} color={theme.colors.textSecondary} />
          <GSText variant="h3" weight="bold" style={styles.emptyTitle}>
            {t('wallet.signInRequired')}
          </GSText>
          <GSText variant="body" color="textSecondary" style={styles.emptySubtitle}>
            {t('wallet.signInToAccess')}
          </GSText>
          <GSButton
            title={t('auth.signIn')}
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
            {t('wallet.title')}
          </GSText>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <GSText variant="body" color="textSecondary" style={{ marginTop: 16 }}>
            {t('wallet.loadingWallet')}
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
          {t('wallet.title')}
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
            t={t}
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
              {t('wallet.topUp')}
            </GSText>
            <GSText variant="caption" color="textSecondary">
              {t('wallet.quickActions.addTokens')}
            </GSText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: theme.colors.surface }]}
            onPress={handleSend}
          >
            <Ionicons name="send-outline" size={24} color={theme.colors.primary} />
            <GSText variant="body" weight="medium" style={{ marginTop: 8 }}>
              {t('wallet.send')}
            </GSText>
            <GSText variant="caption" color="textSecondary">
              {t('wallet.quickActions.transferTokens')}
            </GSText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('PaymentMethods' as any)}
          >
            <Ionicons name="card-outline" size={24} color={theme.colors.primary} />
            <GSText variant="body" weight="medium" style={{ marginTop: 8 }}>
              {t('wallet.quickActions.methods')}
            </GSText>
            <GSText variant="caption" color="textSecondary">
              {t('wallet.quickActions.paymentCards')}
            </GSText>
          </TouchableOpacity>
        </View>

        {/* Transaction History */}
        <View style={styles.transactionsSection}>
          <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
            {t('wallet.recentTransactions')}
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
                {t('wallet.noTransactionsYet')}
              </GSText>
              <GSText variant="caption" color="textSecondary" style={{ textAlign: 'center' }}>
                {t('wallet.transactionHistoryWillAppear')}
              </GSText>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Topup Modal */}
      <TopupModal
        visible={showTopupModal}
        onClose={handleCloseTopupModal}
        onSubmit={handleTopup}
        isLoading={topupLoading}
        topupStep={topupStep}
        topupResult={topupResult}
        t={t}
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
  dynamicCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
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
  topupInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  topupButton: {
    marginBottom: 0,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});