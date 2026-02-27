import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import {
  issuingService,
  Cardholder,
  VirtualCard,
} from '../../services/issuing.service';

// Visual card component for the list
interface CardItemProps {
  card: VirtualCard;
  onPress: (card: VirtualCard) => void;
}

const CardItem: React.FC<CardItemProps> = ({ card, onPress }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return t('issuing.statusActive');
      case 'inactive':
        return t('issuing.statusInactive');
      case 'canceled':
        return t('issuing.statusCanceled');
      case 'pending':
        return t('issuing.statusPending');
      default:
        return status;
    }
  };

  const statusColor = issuingService.getStatusColor(card.status);

  // Get a gradient-like background based on card index
  const cardBg = card.status === 'canceled'
    ? '#6b7280'
    : theme.colors.primary;

  return (
    <TouchableOpacity
      style={[styles.cardItem, { backgroundColor: cardBg }]}
      onPress={() => onPress(card)}
      activeOpacity={0.8}
    >
      {/* Card brand and status */}
      <View style={styles.cardTopRow}>
        <GSText variant="caption" color="white" weight="medium" style={{ textTransform: 'uppercase', opacity: 0.8 }}>
          {card.brand.toUpperCase()} {card.type === 'virtual' ? t('issuing.virtual') : t('issuing.physical')}
        </GSText>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '30' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <GSText variant="caption" color="white" weight="medium">
            {getStatusLabel(card.status)}
          </GSText>
        </View>
      </View>

      {/* Card number (masked) */}
      <View style={styles.cardNumberRow}>
        <GSText variant="h4" color="white" weight="bold" style={{ letterSpacing: 2 }}>
          **** **** **** {card.last4}
        </GSText>
      </View>

      {/* Expiry and spending limit */}
      <View style={styles.cardBottomRow}>
        <View>
          <GSText variant="caption" color="white" style={{ opacity: 0.7 }}>
            {t('issuing.expires')}
          </GSText>
          <GSText variant="body" color="white" weight="medium">
            {card.expMonth}/{card.expYear}
          </GSText>
        </View>
        {card.spendingControls?.spendingLimits?.[0] && (
          <View style={styles.cardLimitBadge}>
            <GSText variant="caption" color="white" style={{ opacity: 0.7 }}>
              {t('issuing.spendingLimit')}
            </GSText>
            <GSText variant="body" color="white" weight="medium">
              {issuingService.formatUSD(card.spendingControls.spendingLimits[0].amount / 100)}
              /{card.spendingControls.spendingLimits[0].interval}
            </GSText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function CardsListScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const [cardholder, setCardholder] = useState<Cardholder | null>(null);
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cardholderChecked, setCardholderChecked] = useState(false);
  const [creatingCard, setCreatingCard] = useState(false);

  // Load cardholder and cards data
  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }

      // Check cardholder status
      const cardholderData = await issuingService.getMyCardholder();
      setCardholder(cardholderData);
      setCardholderChecked(true);

      // If cardholder exists and is active, load cards
      if (cardholderData && cardholderData.status === 'active') {
        const cardsData = await issuingService.getMyCards();
        setCards(cardsData);
      }
    } catch (error: any) {
      console.error('Failed to load issuing data:', error);
      if (!isRefresh) {
        Alert.alert(t('common.error'), error.message || t('issuing.errors.loadFailed'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        loadData();
      }
    }, [isAuthenticated, loadData])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, [loadData]);

  const handleCardPress = useCallback((card: VirtualCard) => {
    navigation.navigate('CardDetail' as any, { cardId: card.id });
  }, [navigation]);

  const handleSetupCardholder = useCallback(() => {
    navigation.navigate('CardholderSetup' as any);
  }, [navigation]);

  const handleCreateCard = useCallback(async () => {
    try {
      setCreatingCard(true);
      const newCard = await issuingService.createCard();
      setCards((prev) => [newCard, ...prev]);
      navigation.navigate('CardDetail' as any, { cardId: newCard.id });
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('issuing.errors.createCardFailed'));
    } finally {
      setCreatingCard(false);
    }
  }, [navigation, t]);

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <GSText variant="h3" weight="bold">
            {t('issuing.myCards')}
          </GSText>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <GSText variant="body" color="textSecondary" style={{ marginTop: 16 }}>
            {t('common.loading')}
          </GSText>
        </View>
      </SafeAreaView>
    );
  }

  // Show cardholder setup banner if no cardholder or not active
  const needsCardholderSetup = cardholderChecked && (!cardholder || cardholder.status !== 'active');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <GSText variant="h3" weight="bold">
          {t('issuing.myCards')}
        </GSText>
        <View style={{ width: 24 }} />
      </View>

      {needsCardholderSetup ? (
        // Cardholder setup banner
        <View style={styles.setupContainer}>
          <View style={[styles.setupCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.setupIconCircle, { backgroundColor: theme.colors.primary + '15' }]}>
              <Ionicons name="card-outline" size={48} color={theme.colors.primary} />
            </View>
            <GSText variant="h4" weight="bold" style={styles.setupTitle}>
              {t('issuing.setupTitle')}
            </GSText>
            <GSText variant="body" color="textSecondary" style={styles.setupSubtitle}>
              {t('issuing.setupSubtitle')}
            </GSText>
            {cardholder?.status === 'pending' ? (
              <View style={[styles.pendingBanner, { backgroundColor: '#f59e0b20' }]}>
                <Ionicons name="time-outline" size={20} color="#f59e0b" />
                <GSText variant="body" weight="medium" style={{ marginLeft: 8, color: '#f59e0b' }}>
                  {t('issuing.cardholderPending')}
                </GSText>
              </View>
            ) : cardholder?.status === 'rejected' ? (
              <View style={[styles.pendingBanner, { backgroundColor: '#ef444420' }]}>
                <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
                <GSText variant="body" weight="medium" style={{ marginLeft: 8, color: '#ef4444' }}>
                  {t('issuing.cardholderRejected')}
                </GSText>
              </View>
            ) : (
              <GSButton
                title={t('issuing.setupButton')}
                onPress={handleSetupCardholder}
                style={styles.setupButton}
              />
            )}
          </View>
        </View>
      ) : (
        // Cards list
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CardItem card={item} onPress={handleCardPress} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <GSText variant="body" color="textSecondary">
                {t('issuing.cardCount', { count: cards.length })}
              </GSText>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="card-outline" size={60} color={theme.colors.textSecondary} />
              <GSText variant="h4" weight="bold" style={{ marginTop: 16, textAlign: 'center' }}>
                {t('issuing.noCards')}
              </GSText>
              <GSText variant="body" color="textSecondary" style={{ marginTop: 8, textAlign: 'center' }}>
                {t('issuing.noCardsSubtitle')}
              </GSText>
            </View>
          }
          ListFooterComponent={<View style={{ height: 80 }} />}
        />
      )}

      {/* Create card FAB - only when cardholder is active */}
      {!needsCardholderSetup && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={handleCreateCard}
          disabled={creatingCard}
          activeOpacity={0.8}
        >
          {creatingCard ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="add" size={28} color="#fff" />
          )}
        </TouchableOpacity>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  listHeader: {
    paddingVertical: 12,
  },
  cardItem: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  cardNumberRow: {
    marginBottom: 20,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardLimitBadge: {
    alignItems: 'flex-end',
  },
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  setupCard: {
    width: '100%',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  setupIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  setupTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  setupSubtitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  setupButton: {
    minWidth: 200,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
