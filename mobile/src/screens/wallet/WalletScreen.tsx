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

type TopupStep = 'amount' | 'processing' | 'success' | 'error';

interface TopupModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (amountCOP: number) => Promise<void>;
  isLoading: boolean;
  topupStep: TopupStep;
  topupResult: {
    amountCOP?: number;
    amountUSD?: number;
    error?: string;
  } | null;
}

const TopupModal: React.FC<TopupModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isLoading,
  topupStep,
  topupResult,
}) => {
  const { theme } = useTheme();
  const [amount, setAmount] = useState('');

  // Quick amounts in COP (Colombian Pesos)
  const quickAmounts = [50000, 100000, 200000, 500000];

  const formatCOP = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSubmit = () => {
    const numAmount = Number(amount.replace(/[.,]/g, ''));
    if (numAmount < 10000) {
      Alert.alert('Monto invalido', 'El monto minimo de recarga es $10,000 COP');
      return;
    }
    if (numAmount > 5000000) {
      Alert.alert('Monto invalido', 'El monto maximo de recarga es $5,000,000 COP');
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
        Monto a recargar (COP)
      </GSText>

      <GSInput
        label="Ingresa el monto"
        value={amount}
        onChangeText={(text) => {
          // Only allow numbers
          const cleaned = text.replace(/[^0-9]/g, '');
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
              weight="medium"
              color={amount === quickAmount.toString() ? 'white' : 'text'}
            >
              {formatCOP(quickAmount)}
            </GSText>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.paymentMethodOption, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }]}>
        <View style={styles.methodInfo}>
          <Ionicons name="card-outline" size={20} color={theme.colors.primary} />
          <GSText variant="body" weight="medium" style={{ marginLeft: 12 }}>
            Tarjeta de credito o debito
          </GSText>
        </View>
        <Ionicons name="shield-checkmark" size={20} color={theme.colors.success} />
      </View>

      <View style={styles.topupInfo}>
        <View style={styles.topupInfoRow}>
          <Ionicons name="lock-closed" size={14} color={theme.colors.textSecondary} />
          <GSText variant="caption" color="textSecondary" style={{ marginLeft: 6 }}>
            Pago seguro procesado por Stripe
          </GSText>
        </View>
        <GSText variant="caption" color="textSecondary" style={{ textAlign: 'center', marginTop: 8 }}>
          El saldo se acreditara inmediatamente a tu wallet
        </GSText>
      </View>
    </>
  );

  const renderProcessingStep = () => (
    <View style={styles.stepContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <GSText variant="h4" weight="bold" style={{ marginTop: 20 }}>
        Procesando pago...
      </GSText>
      <GSText variant="body" color="textSecondary" style={{ marginTop: 8, textAlign: 'center' }}>
        No cierres esta pantalla mientras se procesa tu pago
      </GSText>
    </View>
  );

  const renderSuccessStep = () => (
    <View style={styles.stepContainer}>
      <View style={[styles.successIcon, { backgroundColor: theme.colors.success + '20' }]}>
        <Ionicons name="checkmark-circle" size={60} color={theme.colors.success} />
      </View>
      <GSText variant="h3" weight="bold" style={{ marginTop: 20 }}>
        Recarga exitosa
      </GSText>
      {topupResult?.amountCOP && (
        <GSText variant="h4" color="primary" weight="bold" style={{ marginTop: 8 }}>
          +{formatCOP(topupResult.amountCOP)}
        </GSText>
      )}
      <GSText variant="body" color="textSecondary" style={{ marginTop: 8, textAlign: 'center' }}>
        Tu saldo ha sido actualizado
      </GSText>
    </View>
  );

  const renderErrorStep = () => (
    <View style={styles.stepContainer}>
      <View style={[styles.successIcon, { backgroundColor: theme.colors.error + '20' }]}>
        <Ionicons name="close-circle" size={60} color={theme.colors.error} />
      </View>
      <GSText variant="h3" weight="bold" style={{ marginTop: 20 }}>
        Error en el pago
      </GSText>
      <GSText variant="body" color="textSecondary" style={{ marginTop: 8, textAlign: 'center' }}>
        {topupResult?.error || 'No se pudo procesar tu pago. Intenta de nuevo.'}
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
              {topupStep === 'success' || topupStep === 'error' ? 'Cerrar' : 'Cancelar'}
            </GSText>
          </TouchableOpacity>
          <GSText variant="h4" weight="bold">
            Recargar Wallet
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
              title={amount ? `Pagar ${formatCOP(Number(amount))}` : 'Recargar'}
              onPress={handleSubmit}
              loading={isLoading}
              disabled={!amount || isLoading}
              style={styles.topupButton}
            />
          )}
          {(topupStep === 'success' || topupStep === 'error') && (
            <GSButton
              title={topupStep === 'success' ? 'Listo' : 'Intentar de nuevo'}
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

  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupStep, setTopupStep] = useState<TopupStep>('amount');
  const [topupResult, setTopupResult] = useState<{
    amountCOP?: number;
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

  // Handle topup with Stripe SDK
  const handleTopup = useCallback(async (amountCOP: number) => {
    try {
      setTopupLoading(true);
      setTopupStep('processing');

      // Step 1: Create Payment Intent on backend
      console.log('Creating Stripe topup intent for', amountCOP, 'COP');
      const intentResponse = await paymentsService.createStripeTopupIntent(amountCOP);
      console.log('Got intent response:', intentResponse);

      // Step 2: Initialize Stripe Payment Sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: intentResponse.clientSecret,
        merchantDisplayName: 'GSHOP',
        style: 'automatic',
        defaultBillingDetails: {
          address: {
            country: 'CO',
          },
        },
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
          amountCOP: intentResponse.amountCOP,
          amountUSD: intentResponse.amountUSD,
        });
        // Reload wallet data to show new balance
        loadWalletData();
      } else {
        // Payment might still be processing or failed on backend
        setTopupStep('success'); // Show success since Stripe confirmed
        setTopupResult({
          amountCOP: intentResponse.amountCOP,
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
        onClose={handleCloseTopupModal}
        onSubmit={handleTopup}
        isLoading={topupLoading}
        topupStep={topupStep}
        topupResult={topupResult}
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