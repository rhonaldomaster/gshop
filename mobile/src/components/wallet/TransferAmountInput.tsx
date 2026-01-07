import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import GSText from '../ui/GSText';
import { TransferLimits, transferService } from '../../services/transfer.service';

interface TransferAmountInputProps {
  value: number;
  onChangeValue: (value: number) => void;
  limits: TransferLimits;
  balance: number;
  error?: string | null;
}

export const TransferAmountInput: React.FC<TransferAmountInputProps> = ({
  value,
  onChangeValue,
  limits,
  balance,
  error,
}) => {
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState(value > 0 ? value.toString() : '');

  const quickAmounts = [10000, 50000, 100000, 500000];

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
    ? new Intl.NumberFormat('es-CO').format(parseInt(inputValue, 10) || 0)
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
        COP (Pesos Colombianos)
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
              {transferService.formatCOP(amount)}
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
                Tu saldo
              </GSText>
              <GSText variant="body" weight="bold">
                {transferService.formatCOP(balance)}
              </GSText>
            </View>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.infoItem}>
            <Ionicons name="today-outline" size={18} color={theme.colors.warning} />
            <View style={{ marginLeft: 8 }}>
              <GSText variant="caption" color="textSecondary">
                Limite diario disponible
              </GSText>
              <GSText variant="body" weight="bold">
                {transferService.formatCOP(limits.dailyRemaining)}
              </GSText>
            </View>
          </View>
        </View>
      </View>

      {/* Level Info */}
      <View style={styles.levelInfo}>
        <Ionicons name="shield-checkmark-outline" size={14} color={theme.colors.textSecondary} />
        <GSText variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
          Nivel: {transferService.getLevelDisplayName(limits.level)} |
          Max por transaccion: {transferService.formatCOP(limits.maxPerTransaction)}
        </GSText>
      </View>
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
});

export default TransferAmountInput;
