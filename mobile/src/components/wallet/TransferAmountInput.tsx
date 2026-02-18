import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import GSText from '../ui/GSText';
import { TransferLimits, transferService } from '../../services/transfer.service';

interface TransferAmountInputProps {
  value: number;
  onChangeValue: (value: number) => void;
  limits: TransferLimits;
  balance: number;
  error?: string | null;
  showUpgradePrompt?: boolean;
}

export const TransferAmountInput: React.FC<TransferAmountInputProps> = ({
  value,
  onChangeValue,
  limits,
  balance,
  error,
  showUpgradePrompt = true,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [inputValue, setInputValue] = useState(value > 0 ? value.toString() : '');

  // Check if user can upgrade their limits
  const canUpgrade = useMemo(() => {
    // Can upgrade if not at max level (level_2)
    return limits.level !== 'level_2';
  }, [limits.level]);

  // Check if user is hitting their limits
  const isHittingLimits = useMemo(() => {
    if (!canUpgrade) return false;
    // Show upgrade prompt if:
    // 1. Current amount exceeds daily/monthly remaining
    // 2. Current amount exceeds max per transaction
    // 3. Daily remaining is less than 20% of max per transaction
    // 4. Monthly remaining is low
    const amountExceedsDaily = value > limits.dailyRemaining;
    const amountExceedsMonthly = value > limits.monthlyRemaining;
    const amountExceedsMax = value > limits.maxPerTransaction;
    const dailyLow = limits.dailyRemaining < limits.maxPerTransaction * 0.2;
    const monthlyLow = limits.monthlyRemaining < limits.dailyLimit * 0.5;
    return amountExceedsDaily || amountExceedsMonthly || amountExceedsMax || dailyLow || monthlyLow;
  }, [canUpgrade, limits, value]);

  const handleUpgradeLimits = useCallback(() => {
    navigation.navigate('Profile', {
      screen: 'Verification',
    });
  }, [navigation]);

  const quickAmounts = [5, 10, 25, 50];

  const handleTextChange = useCallback((text: string) => {
    // Only allow numeric input
    const numericText = text.replace(/[^0-9]/g, '');
    setInputValue(numericText);

    const numValue = parseInt(numericText, 10) || 0;
    onChangeValue(numValue);
  }, [onChangeValue]);

  const handleQuickAmount = useCallback((amount: number) => {
    setInputValue(amount.toString());
    onChangeValue(amount);
  }, [onChangeValue]);

  const handleMaxAmount = useCallback(() => {
    const maxAvailable = Math.min(
      balance,
      limits.dailyRemaining,
      limits.monthlyRemaining,
      limits.maxPerTransaction
    );
    setInputValue(maxAvailable.toString());
    onChangeValue(maxAvailable);
  }, [balance, limits, onChangeValue]);

  const displayValue = inputValue
    ? new Intl.NumberFormat('en-US').format(parseInt(inputValue, 10) || 0)
    : '';

  return (
    <View style={styles.container}>
      {/* Amount Input */}
      <View style={styles.inputWrapper}>
        <GSText variant="h2" weight="bold" style={{ marginRight: 4 }}>
          $
        </GSText>
        <TextInput
          style={[
            styles.input,
            {
              color: theme.colors.text,
              borderBottomColor: error ? theme.colors.error : theme.colors.primary,
            },
          ]}
          value={displayValue}
          onChangeText={handleTextChange}
          placeholder="0"
          placeholderTextColor={theme.colors.gray400}
          keyboardType="number-pad"
          maxLength={15}
        />
        <TouchableOpacity
          style={[styles.maxButton, { backgroundColor: theme.colors.primary + '20' }]}
          onPress={handleMaxAmount}
        >
          <GSText variant="caption" weight="bold" style={{ color: theme.colors.primary }}>
            MAX
          </GSText>
        </TouchableOpacity>
      </View>

      <GSText variant="caption" color="textSecondary" style={styles.currency}>
        {t('wallet.transferScreen.currency')}
      </GSText>

      {/* Error Message */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: theme.colors.error + '15' }]}>
          <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
          <GSText variant="caption" style={{ color: theme.colors.error, marginLeft: 6, flex: 1 }}>
            {error}
          </GSText>
        </View>
      )}

      {/* Quick Amounts */}
      <View style={styles.quickAmounts}>
        {quickAmounts.map((amount) => (
          <TouchableOpacity
            key={amount}
            style={[
              styles.quickAmountButton,
              {
                backgroundColor: value === amount ? theme.colors.primary : theme.colors.surface,
                borderColor: value === amount ? theme.colors.primary : theme.colors.border,
              },
            ]}
            onPress={() => handleQuickAmount(amount)}
          >
            <GSText
              variant="caption"
              weight="medium"
              style={{
                color: value === amount ? theme.colors.white : theme.colors.text,
              }}
            >
              {transferService.formatUSD(amount)}
            </GSText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Balance and Limits Info */}
      <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="wallet-outline" size={18} color={theme.colors.primary} />
            <View style={{ marginLeft: 8 }}>
              <GSText variant="caption" color="textSecondary">
                {t('wallet.transferScreen.yourBalance')}
              </GSText>
              <GSText variant="body" weight="bold">
                {transferService.formatUSD(balance)}
              </GSText>
            </View>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.infoItem}>
            <Ionicons name="today-outline" size={18} color={theme.colors.warning} />
            <View style={{ marginLeft: 8 }}>
              <GSText variant="caption" color="textSecondary">
                {t('wallet.transferScreen.dailyLimitRemaining')}
              </GSText>
              <GSText variant="body" weight="bold">
                {transferService.formatUSD(limits.dailyRemaining)}
              </GSText>
            </View>
          </View>
        </View>
      </View>

      {/* Level Info */}
      <View style={styles.levelInfo}>
        <Ionicons name="shield-checkmark-outline" size={14} color={theme.colors.textSecondary} />
        <GSText variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
          {t('wallet.transferScreen.levelInfo')}: {transferService.getLevelDisplayName(limits.level)} |
          {t('wallet.transferScreen.maxPerTransaction')}: {transferService.formatUSD(limits.maxPerTransaction)}
        </GSText>
      </View>

      {/* Upgrade Limits Prompt */}
      {showUpgradePrompt && canUpgrade && isHittingLimits && (
        <TouchableOpacity
          style={[styles.upgradePrompt, { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary }]}
          onPress={handleUpgradeLimits}
          activeOpacity={0.7}
        >
          <View style={styles.upgradePromptContent}>
            <View style={[styles.upgradeIconContainer, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="trending-up" size={18} color={theme.colors.white} />
            </View>
            <View style={styles.upgradeTextContainer}>
              <GSText variant="body" weight="semibold" style={{ color: theme.colors.primary }}>
                {t('wallet.transferScreen.upgradeLimits')}
              </GSText>
              <GSText variant="caption" color="textSecondary">
                {limits.level === 'none'
                  ? t('wallet.transferScreen.upgradeLevel1Message')
                  : t('wallet.transferScreen.upgradeLevel2Message')}
              </GSText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  input: {
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
    minWidth: 100,
    maxWidth: 220,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
  },
  maxButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  currency: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  quickAmountButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  upgradePrompt: {
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  upgradePromptContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeTextContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
});

export default TransferAmountInput;
