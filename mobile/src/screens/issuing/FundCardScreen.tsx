import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import GSInput from '../../components/ui/GSInput';
import { issuingService } from '../../services/issuing.service';
import { paymentsService, WalletBalance } from '../../services/payments.service';

type FundMode = 'fund' | 'withdraw';
type FundStep = 'amount' | 'processing' | 'success';

const QUICK_AMOUNTS = [5, 10, 25, 50, 100];

export default function FundCardScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();

  const { cardId, mode } = route.params as { cardId: string; mode: FundMode };
  const isFund = mode === 'fund';

  const [amount, setAmount] = useState('');
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [step, setStep] = useState<FundStep>('amount');
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [resultAmount, setResultAmount] = useState(0);

  // Load wallet balance
  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      setBalanceLoading(true);
      const balance = await paymentsService.getWalletBalance();
      setWalletBalance(balance);
    } catch (error: any) {
      console.error('Failed to load wallet balance:', error);
    } finally {
      setBalanceLoading(false);
    }
  };

  const formatUSD = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // Handle submit
  const handleSubmit = useCallback(async () => {
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount < 0.5) {
      Alert.alert(t('common.error'), t('issuing.errors.minAmount'));
      return;
    }

    if (numAmount > 10000) {
      Alert.alert(t('common.error'), t('issuing.errors.maxAmount'));
      return;
    }

    // Check wallet balance when funding
    if (isFund && walletBalance && numAmount > walletBalance.tokenBalance) {
      Alert.alert(t('common.error'), t('issuing.errors.insufficientBalance'));
      return;
    }

    try {
      setLoading(true);
      setStep('processing');

      if (isFund) {
        await issuingService.fundCard(cardId, numAmount);
      } else {
        await issuingService.withdrawFromCard(cardId, numAmount);
      }

      setResultAmount(numAmount);
      setStep('success');
    } catch (error: any) {
      setStep('amount');
      Alert.alert(t('common.error'), error.message || t('issuing.errors.operationFailed'));
    } finally {
      setLoading(false);
    }
  }, [amount, cardId, isFund, walletBalance, t]);

  const handleDone = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Render amount step
  const renderAmountStep = () => (
    <>
      {/* Wallet balance info */}
      <View style={[styles.balanceCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.balanceRow}>
          <Ionicons name="wallet-outline" size={20} color={theme.colors.primary} />
          <GSText variant="body" weight="medium" style={{ marginLeft: 8 }}>
            {t('issuing.walletBalance')}
          </GSText>
        </View>
        {balanceLoading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 4 }} />
        ) : (
          <GSText variant="h4" weight="bold" style={{ marginTop: 4 }}>
            {walletBalance ? formatUSD(walletBalance.tokenBalance) : '$0.00'}
          </GSText>
        )}
      </View>

      {/* Amount input */}
      <GSText variant="h5" weight="bold" style={styles.sectionTitle}>
        {isFund ? t('issuing.amountToFund') : t('issuing.amountToWithdraw')}
      </GSText>

      <GSInput
        label={t('issuing.enterAmount')}
        value={amount}
        onChangeText={(text) => {
          const cleaned = text.replace(/[^0-9.]/g, '');
          setAmount(cleaned);
        }}
        placeholder="0.00"
        keyboardType="numeric"
        leftIcon="cash-outline"
      />

      {/* Quick amount buttons */}
      <View style={styles.quickAmounts}>
        {QUICK_AMOUNTS.map((quickAmount) => (
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

      {/* Info text */}
      <View style={[styles.infoBox, { backgroundColor: theme.colors.primary + '10' }]}>
        <Ionicons name="information-circle-outline" size={18} color={theme.colors.primary} />
        <GSText variant="caption" color="textSecondary" style={{ marginLeft: 8, flex: 1 }}>
          {isFund ? t('issuing.fundInfo') : t('issuing.withdrawInfo')}
        </GSText>
      </View>
    </>
  );

  // Render processing step
  const renderProcessingStep = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <GSText variant="h4" weight="bold" style={{ marginTop: 20 }}>
        {t('issuing.processing')}
      </GSText>
      <GSText variant="body" color="textSecondary" style={{ marginTop: 8, textAlign: 'center' }}>
        {t('issuing.dontClose')}
      </GSText>
    </View>
  );

  // Render success step
  const renderSuccessStep = () => (
    <View style={styles.centerContainer}>
      <View style={[styles.successIcon, { backgroundColor: theme.colors.success + '20' }]}>
        <Ionicons name="checkmark-circle" size={60} color={theme.colors.success} />
      </View>
      <GSText variant="h3" weight="bold" style={{ marginTop: 20 }}>
        {isFund ? t('issuing.fundSuccess') : t('issuing.withdrawSuccess')}
      </GSText>
      <GSText variant="h4" color="primary" weight="bold" style={{ marginTop: 8 }}>
        {formatUSD(resultAmount)}
      </GSText>
      <GSText variant="body" color="textSecondary" style={{ marginTop: 8, textAlign: 'center' }}>
        {isFund ? t('issuing.fundSuccessMessage') : t('issuing.withdrawSuccessMessage')}
      </GSText>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={step === 'processing'}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={step === 'processing' ? theme.colors.textSecondary : theme.colors.text}
          />
        </TouchableOpacity>
        <GSText variant="h3" weight="bold">
          {isFund ? t('issuing.fundCard') : t('issuing.withdrawFromCard')}
        </GSText>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 'amount' && renderAmountStep()}
          {step === 'processing' && renderProcessingStep()}
          {step === 'success' && renderSuccessStep()}
        </ScrollView>

        {/* Footer button */}
        <View style={styles.footer}>
          {step === 'amount' && (
            <GSButton
              title={
                amount
                  ? (isFund ? t('issuing.fundAmount', { amount: formatUSD(Number(amount)) }) : t('issuing.withdrawAmount', { amount: formatUSD(Number(amount)) }))
                  : (isFund ? t('issuing.fund') : t('issuing.withdraw'))
              }
              onPress={handleSubmit}
              loading={loading}
              disabled={!amount || loading}
              style={styles.submitButton}
            />
          )}
          {step === 'success' && (
            <GSButton
              title={t('common.done')}
              onPress={handleDone}
              style={styles.submitButton}
            />
          )}
        </View>
      </KeyboardAvoidingView>
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
    padding: 16,
  },
  balanceCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    marginBottom: 12,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 24,
  },
  quickAmountButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  centerContainer: {
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
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  submitButton: {
    marginBottom: 0,
  },
});
