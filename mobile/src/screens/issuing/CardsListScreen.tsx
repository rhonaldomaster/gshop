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
import { LinearGradient } from 'expo-linear-gradient';
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

// Gradient palettes for card variants
const CARD_GRADIENTS: [string, string, string][] = [
  ['#1a6dff', '#633EBB', '#4527a0'],
  ['#0d47a1', '#1565c0', '#1e88e5'],
  ['#4a148c', '#7b1fa2', '#ab47bc'],
  ['#00695c', '#00897b', '#26a69a'],
  ['#bf360c', '#e64a19', '#ff7043'],
];

// Brand logo rendered with Ionicons
const CardBrandLogo: React.FC<{ brand: string }> = ({ brand }) => {
  const name = brand.toLowerCase();
  if (name === 'visa') {
    return (
      <GSText weight="bold" style={cardStyles.brandVisa}>
        VISA
      </GSText>
    );
  }
  if (name === 'mastercard') {
    return (
      <View style={cardStyles.mastercardLogo}>
        <View style={[cardStyles.mastercardCircle, { backgroundColor: '#EB001B' }]} />
        <View style={[cardStyles.mastercardCircle, { backgroundColor: '#F79E1B', marginLeft: -8 }]} />
      </View>
    );
  }
  return (
    <GSText weight="bold" style={cardStyles.brandGeneric}>
      {brand.toUpperCase()}
    </GSText>
  );
};

const CardItem: React.FC<CardItemProps> = ({ card, onPress }) => {
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

  // Pick gradient based on last4 for consistent color per card
  const gradientIndex = (parseInt(card.last4, 10) || 0) % CARD_GRADIENTS.length;
  const gradient = card.status === 'canceled'
    ? ['#6b7280', '#4b5563', '#374151'] as [string, string, string]
    : CARD_GRADIENTS[gradientIndex];

  return (
    <TouchableOpacity
      onPress={() => onPress(card)}
      activeOpacity={0.85}
      style={cardStyles.cardShadow}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={cardStyles.cardGradient}
      >
        {/* Decorative circles */}
        <View style={cardStyles.decoCircleLarge} />
        <View style={cardStyles.decoCircleSmall} />

        {/* Top row: chip + brand logo + status */}
        <View style={cardStyles.topRow}>
          <View style={cardStyles.topLeft}>
            {/* Chip */}
            <View style={cardStyles.chip}>
              <View style={cardStyles.chipLineH} />
              <View style={cardStyles.chipLineV} />
            </View>
            {/* Contactless icon */}
            <Ionicons name="wifi-outline" size={18} color="rgba(255,255,255,0.6)" style={{ transform: [{ rotate: '90deg' }], marginLeft: 8 }} />
          </View>
          <View style={cardStyles.topRight}>
            <CardBrandLogo brand={card.brand} />
          </View>
        </View>

        {/* Card number */}
        <View style={cardStyles.numberRow}>
          <GSText style={cardStyles.numberText}>
            ····  ····  ····  {card.last4}
          </GSText>
        </View>

        {/* Bottom row: expiry, limit, status badge */}
        <View style={cardStyles.bottomRow}>
          <View style={cardStyles.bottomLeft}>
            <View style={cardStyles.infoBlock}>
              <GSText style={cardStyles.labelText}>
                {card.type === 'virtual' ? t('issuing.virtual').toUpperCase() : t('issuing.physical').toUpperCase()}
              </GSText>
              <GSText style={cardStyles.valueText}>
                {t('issuing.expires')} {card.expMonth}/{card.expYear}
              </GSText>
            </View>
            {card.spendingControls?.spendingLimits?.[0] && (
              <View style={[cardStyles.infoBlock, { marginLeft: 20 }]}>
                <GSText style={cardStyles.labelText}>
                  {t('issuing.spendingLimit').toUpperCase()}
                </GSText>
                <GSText style={cardStyles.valueText}>
                  {issuingService.formatUSD(card.spendingControls.spendingLimits[0].amount / 100)}
                  /{card.spendingControls.spendingLimits[0].interval}
                </GSText>
              </View>
            )}
          </View>
          <View style={[cardStyles.statusBadge, { backgroundColor: statusColor + '40' }]}>
            <View style={[cardStyles.statusDot, { backgroundColor: statusColor }]} />
            <GSText style={cardStyles.statusText}>
              {getStatusLabel(card.status)}
            </GSText>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const cardStyles = StyleSheet.create({
  cardShadow: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  cardGradient: {
    borderRadius: 16,
    padding: 22,
    aspectRatio: 1.586,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  // Decorative elements
  decoCircleLarge: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -40,
  },
  decoCircleSmall: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -30,
    left: -20,
  },
  // Chip
  chip: {
    width: 36,
    height: 26,
    borderRadius: 5,
    backgroundColor: '#d4af37',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  chipLineH: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  chipLineV: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  // Top row
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topRight: {
    alignItems: 'flex-end',
  },
  // Brand logos
  brandVisa: {
    color: '#fff',
    fontSize: 22,
    fontStyle: 'italic',
    letterSpacing: 2,
  },
  mastercardLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mastercardCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    opacity: 0.9,
  },
  brandGeneric: {
    color: '#fff',
    fontSize: 16,
    letterSpacing: 1,
  },
  // Card number
  numberRow: {
    paddingVertical: 4,
  },
  numberText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 3,
    fontFamily: undefined,
  },
  // Bottom row
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  bottomLeft: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  infoBlock: {},
  labelText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 2,
  },
  valueText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  // Status
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
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});

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
  const [requestsEnabled, setRequestsEnabled] = useState(false);

  // Load cardholder and cards data
  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }

      // Check feature status
      const featureStatus = await issuingService.getFeatureStatus();
      setRequestsEnabled(featureStatus.requestsEnabled);

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

      {needsCardholderSetup && requestsEnabled ? (
        // Cardholder setup banner (only when requests are enabled)
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
      ) : needsCardholderSetup && !requestsEnabled ? (
        // No cardholder and requests disabled - show unavailable message
        <View style={styles.setupContainer}>
          <View style={[styles.setupCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.setupIconCircle, { backgroundColor: theme.colors.textSecondary + '15' }]}>
              <Ionicons name="card-outline" size={48} color={theme.colors.textSecondary} />
            </View>
            <GSText variant="h4" weight="bold" style={styles.setupTitle}>
              {t('issuing.requestsUnavailableTitle')}
            </GSText>
            <GSText variant="body" color="textSecondary" style={styles.setupSubtitle}>
              {t('issuing.requestsUnavailableSubtitle')}
            </GSText>
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

      {/* Create card FAB - only when cardholder is active AND requests are enabled */}
      {!needsCardholderSetup && requestsEnabled && (
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
