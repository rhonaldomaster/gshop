import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import {
  issuingService,
  VirtualCard,
  CardSensitiveDetails,
  CardTransaction,
} from '../../services/issuing.service';

// Visual card display component
interface CardVisualProps {
  card: VirtualCard;
  sensitive: CardSensitiveDetails | null;
  showSensitive: boolean;
}

const CardVisual: React.FC<CardVisualProps> = ({ card, sensitive, showSensitive }) => {
  const { t } = useTranslation();

  const cardBg = card.status === 'canceled'
    ? '#6b7280'
    : '#4f46e5';

  // Format card number for display
  const displayNumber = showSensitive && sensitive
    ? sensitive.number.replace(/(.{4})/g, '$1 ').trim()
    : `**** **** **** ${card.last4}`;

  const displayCvc = showSensitive && sensitive ? sensitive.cvc : '***';

  return (
    <View style={[styles.visualCard, { backgroundColor: cardBg }]}>
      {/* Card brand */}
      <View style={styles.visualCardTop}>
        <GSText variant="body" color="white" weight="bold" style={{ textTransform: 'uppercase' }}>
          {card.brand}
        </GSText>
        <GSText variant="caption" color="white" style={{ opacity: 0.7 }}>
          {card.type === 'virtual' ? t('issuing.virtual') : t('issuing.physical')}
        </GSText>
      </View>

      {/* Card number */}
      <GSText variant="h3" color="white" weight="bold" style={styles.visualCardNumber}>
        {displayNumber}
      </GSText>

      {/* Expiry and CVC */}
      <View style={styles.visualCardBottom}>
        <View>
          <GSText variant="caption" color="white" style={{ opacity: 0.6 }}>
            {t('issuing.expires')}
          </GSText>
          <GSText variant="body" color="white" weight="medium">
            {card.expMonth}/{card.expYear}
          </GSText>
        </View>
        <View>
          <GSText variant="caption" color="white" style={{ opacity: 0.6 }}>
            CVC
          </GSText>
          <GSText variant="body" color="white" weight="medium">
            {displayCvc}
          </GSText>
        </View>
      </View>
    </View>
  );
};

// Transaction item for card transactions
interface TransactionRowProps {
  transaction: CardTransaction;
}

const TransactionRow: React.FC<TransactionRowProps> = ({ transaction }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const getIcon = () => {
    switch (transaction.type) {
      case 'authorization':
      case 'capture':
        return 'bag-outline';
      case 'refund':
        return 'return-down-back-outline';
      case 'funding':
        return 'arrow-down-circle-outline';
      case 'withdrawal':
        return 'arrow-up-circle-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const getColor = () => {
    switch (transaction.type) {
      case 'funding':
        return theme.colors.success;
      case 'refund':
        return theme.colors.success;
      case 'authorization':
      case 'capture':
      case 'withdrawal':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusLabel = () => {
    switch (transaction.status) {
      case 'pending':
        return t('issuing.txStatusPending');
      case 'approved':
        return t('issuing.txStatusApproved');
      case 'declined':
        return t('issuing.txStatusDeclined');
      case 'reversed':
        return t('issuing.txStatusReversed');
      case 'settled':
        return t('issuing.txStatusSettled');
      default:
        return transaction.status;
    }
  };

  const amountUSD = transaction.amountCents / 100;
  const isCreditType = transaction.type === 'funding' || transaction.type === 'refund';
  const sign = isCreditType ? '+' : '-';
  const color = getColor();

  return (
    <View style={styles.txItem}>
      <View style={[styles.txIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={getIcon() as any} size={20} color={color} />
      </View>
      <View style={styles.txContent}>
        <GSText variant="body" weight="medium">
          {transaction.merchantName || issuingService.getTransactionTypeLabel(transaction.type)}
        </GSText>
        <GSText variant="caption" color="textSecondary">
          {new Date(transaction.createdAt).toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </GSText>
        <GSText variant="caption" color="textSecondary">
          {getStatusLabel()}
        </GSText>
      </View>
      <GSText variant="body" weight="medium" style={{ color }}>
        {sign}{issuingService.formatUSD(amountUSD)}
      </GSText>
    </View>
  );
};

export default function CardDetailScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { cardId } = route.params as { cardId: string };

  const [card, setCard] = useState<VirtualCard | null>(null);
  const [sensitive, setSensitive] = useState<CardSensitiveDetails | null>(null);
  const [showSensitive, setShowSensitive] = useState(false);
  const [transactions, setTransactions] = useState<CardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sensitiveLoading, setSensitiveLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Load card data
  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }

      const [cardData, txData] = await Promise.all([
        issuingService.getCard(cardId),
        issuingService.getCardTransactions(cardId, { limit: 20 }),
      ]);

      setCard(cardData);
      setTransactions(txData.data || []);
    } catch (error: any) {
      console.error('Failed to load card detail:', error);
      Alert.alert(t('common.error'), error.message || t('issuing.errors.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cardId, t]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      // Reset sensitive data when re-entering screen
      setSensitive(null);
      setShowSensitive(false);
    }, [loadData])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, [loadData]);

  // Reveal full card number
  const handleRevealSensitive = useCallback(async () => {
    if (showSensitive) {
      // Toggle off
      setShowSensitive(false);
      return;
    }

    try {
      setSensitiveLoading(true);
      const data = await issuingService.getCardSensitive(cardId);
      setSensitive(data);
      setShowSensitive(true);

      // Auto-hide after 30 seconds
      setTimeout(() => {
        setShowSensitive(false);
      }, 30000);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('issuing.errors.sensitiveLoadFailed'));
    } finally {
      setSensitiveLoading(false);
    }
  }, [cardId, showSensitive, t]);

  // Cancel card
  const handleCancelCard = useCallback(() => {
    Alert.alert(
      t('issuing.cancelCardTitle'),
      t('issuing.cancelCardMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('issuing.cancelCardConfirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelLoading(true);
              const updated = await issuingService.cancelCard(cardId);
              setCard(updated);
              Alert.alert(t('common.success'), t('issuing.cardCanceled'));
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message || t('issuing.errors.cancelFailed'));
            } finally {
              setCancelLoading(false);
            }
          },
        },
      ],
    );
  }, [cardId, t]);

  // Toggle card active/inactive
  const handleToggleStatus = useCallback(async () => {
    if (!card) return;

    const newStatus = card.status === 'active' ? 'inactive' : 'active';
    try {
      const updated = await issuingService.updateCard(cardId, { status: newStatus as any });
      setCard(updated);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('issuing.errors.updateFailed'));
    }
  }, [card, cardId, t]);

  // Navigate to fund/withdraw screen
  const handleFund = useCallback(() => {
    navigation.navigate('FundCard' as any, { cardId, mode: 'fund' });
  }, [cardId, navigation]);

  const handleWithdraw = useCallback(() => {
    navigation.navigate('FundCard' as any, { cardId, mode: 'withdraw' });
  }, [cardId, navigation]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <GSText variant="h3" weight="bold">
            {t('issuing.cardDetails')}
          </GSText>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!card) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <GSText variant="h3" weight="bold">
            {t('issuing.cardDetails')}
          </GSText>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <GSText variant="body" color="textSecondary">
            {t('issuing.cardNotFound')}
          </GSText>
        </View>
      </SafeAreaView>
    );
  }

  const isActive = card.status === 'active';
  const isCanceled = card.status === 'canceled';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <GSText variant="h3" weight="bold">
          {t('issuing.cardDetails')}
        </GSText>
        <View style={{ width: 24 }} />
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
        {/* Visual card */}
        <View style={styles.cardSection}>
          <CardVisual
            card={card}
            sensitive={sensitive}
            showSensitive={showSensitive}
          />

          {/* Reveal button */}
          {!isCanceled && (
            <TouchableOpacity
              style={[styles.revealButton, { backgroundColor: theme.colors.surface }]}
              onPress={handleRevealSensitive}
              disabled={sensitiveLoading}
            >
              {sensitiveLoading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <>
                  <Ionicons
                    name={showSensitive ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={theme.colors.primary}
                  />
                  <GSText variant="caption" color="primary" weight="medium" style={{ marginLeft: 6 }}>
                    {showSensitive ? t('issuing.hideDetails') : t('issuing.showFullNumber')}
                  </GSText>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Spending limit info */}
        {card.spendingControls?.spendingLimits?.[0] && (
          <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.infoRow}>
              <Ionicons name="speedometer-outline" size={20} color={theme.colors.primary} />
              <GSText variant="body" weight="medium" style={{ marginLeft: 8 }}>
                {t('issuing.spendingLimit')}
              </GSText>
            </View>
            <GSText variant="h4" weight="bold" style={{ marginTop: 4 }}>
              {issuingService.formatUSD(card.spendingControls.spendingLimits[0].amount / 100)}
              <GSText variant="caption" color="textSecondary">
                {' '}/{card.spendingControls.spendingLimits[0].interval}
              </GSText>
            </GSText>
          </View>
        )}

        {/* Action buttons */}
        {!isCanceled && (
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
              onPress={handleFund}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: theme.colors.success + '15' }]}>
                <Ionicons name="arrow-down-circle-outline" size={24} color={theme.colors.success} />
              </View>
              <GSText variant="body" weight="medium" style={{ marginTop: 8 }}>
                {t('issuing.fund')}
              </GSText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
              onPress={handleWithdraw}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: theme.colors.warning + '15' }]}>
                <Ionicons name="arrow-up-circle-outline" size={24} color={theme.colors.warning} />
              </View>
              <GSText variant="body" weight="medium" style={{ marginTop: 8 }}>
                {t('issuing.withdraw')}
              </GSText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
              onPress={handleToggleStatus}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: (isActive ? theme.colors.warning : theme.colors.success) + '15' }]}>
                <Ionicons
                  name={isActive ? 'pause-circle-outline' : 'play-circle-outline'}
                  size={24}
                  color={isActive ? theme.colors.warning : theme.colors.success}
                />
              </View>
              <GSText variant="body" weight="medium" style={{ marginTop: 8 }}>
                {isActive ? t('issuing.freeze') : t('issuing.unfreeze')}
              </GSText>
            </TouchableOpacity>
          </View>
        )}

        {/* Transactions */}
        <View style={styles.txSection}>
          <GSText variant="h4" weight="bold" style={styles.txSectionTitle}>
            {t('issuing.transactions')}
          </GSText>

          {transactions.length > 0 ? (
            transactions.map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} />
            ))
          ) : (
            <View style={styles.emptyTx}>
              <Ionicons name="receipt-outline" size={40} color={theme.colors.textSecondary} />
              <GSText variant="body" color="textSecondary" style={{ marginTop: 12, textAlign: 'center' }}>
                {t('issuing.noTransactions')}
              </GSText>
            </View>
          )}
        </View>

        {/* Cancel card button */}
        {!isCanceled && (
          <View style={styles.dangerSection}>
            <GSButton
              title={t('issuing.cancelCard')}
              onPress={handleCancelCard}
              loading={cancelLoading}
              variant="outline"
              style={styles.cancelButton}
            />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  cardSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: 'center',
  },
  visualCard: {
    width: '100%',
    aspectRatio: 1.6,
    borderRadius: 16,
    padding: 24,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  visualCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visualCardNumber: {
    letterSpacing: 3,
    textAlign: 'center',
  },
  visualCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  revealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionsSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  txSectionTitle: {
    marginBottom: 12,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txContent: {
    flex: 1,
  },
  emptyTx: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  dangerSection: {
    paddingHorizontal: 16,
    marginTop: 32,
  },
  cancelButton: {
    borderColor: '#ef4444',
  },
});
