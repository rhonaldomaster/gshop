import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Clipboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import GSText from '../ui/GSText';
import { TransferExecuteResponse } from '../../services/transfer.service';
import { transferService } from '../../services/transfer.service';

interface TransferSuccessProps {
  result: TransferExecuteResponse;
  recipientName: string;
  onDone: () => void;
  onNewTransfer: () => void;
}

export const TransferSuccess: React.FC<TransferSuccessProps> = ({
  result,
  recipientName,
  onDone,
  onNewTransfer,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [codeCopied, setCodeCopied] = useState(false);

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const copyDynamicCode = () => {
    if (result.dynamicCode) {
      Clipboard.setString(result.dynamicCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  return (
    <View style={styles.container}>
      {/* Success Icon */}
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.success + '20' }]}>
        <View style={[styles.iconCircle, { backgroundColor: theme.colors.success }]}>
          <Ionicons name="checkmark" size={48} color={theme.colors.white} />
        </View>
      </View>

      {/* Title */}
      <GSText variant="h2" weight="bold" style={styles.title}>
        {t('wallet.transferScreen.success')}
      </GSText>
      <GSText variant="body" color="textSecondary" style={styles.subtitle}>
        {t('wallet.transferScreen.successMessage')}
      </GSText>

      {/* Dynamic Code Section - PROMINENT */}
      {result.dynamicCode && (
        <View style={styles.dynamicCodeContainer}>
          <GSText variant="caption" color="textSecondary">
            {t('wallet.transferScreen.dynamicCode.label')}
          </GSText>
          <TouchableOpacity
            style={[
              styles.dynamicCodeBox,
              {
                backgroundColor: theme.colors.primary + '10',
                borderColor: theme.colors.primary,
              },
            ]}
            onPress={copyDynamicCode}
            activeOpacity={0.7}
          >
            <GSText
              variant="h2"
              weight="bold"
              style={[styles.dynamicCodeText, { color: theme.colors.primary }]}
            >
              {result.dynamicCode}
            </GSText>
            <Ionicons
              name={codeCopied ? 'checkmark-circle' : 'copy-outline'}
              size={24}
              color={codeCopied ? theme.colors.success : theme.colors.primary}
            />
          </TouchableOpacity>
          <GSText variant="caption" color="textSecondary" style={styles.hint}>
            {codeCopied
              ? t('wallet.transferScreen.dynamicCode.copied')
              : t('wallet.transferScreen.dynamicCode.copyHint')}
          </GSText>
        </View>
      )}

      {/* Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.summaryRow}>
          <GSText variant="body" color="textSecondary">
            {t('wallet.transferScreen.amountSent')}
          </GSText>
          <GSText variant="h3" weight="bold">
            {transferService.formatCOP(result.summary.amountSent)}
          </GSText>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.gray300 }]} />

        <View style={styles.summaryRow}>
          <GSText variant="body" color="textSecondary">
            {t('wallet.transferScreen.recipient')}
          </GSText>
          <GSText variant="body" weight="semiBold">
            {recipientName}
          </GSText>
        </View>

      </View>

      {/* Transaction Details */}
      <View style={[styles.detailsCard, { backgroundColor: theme.colors.gray100 }]}>
        <View style={styles.detailRow}>
          <Ionicons name="key-outline" size={16} color={theme.colors.textSecondary} />
          <GSText variant="caption" color="textSecondary" style={{ marginLeft: 6 }}>
            {result.dynamicCode || `ID: ${result.transferId.slice(0, 8)}...`}
          </GSText>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
          <GSText variant="caption" color="textSecondary" style={{ marginLeft: 6 }}>
            {formatDateTime(result.executedAt || result.timestamp || new Date().toISOString())}
          </GSText>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: theme.colors.primary }]}
          onPress={onNewTransfer}
        >
          <Ionicons name="add" size={20} color={theme.colors.primary} />
          <GSText variant="body" weight="semiBold" style={{ color: theme.colors.primary, marginLeft: 8 }}>
            {t('wallet.transferScreen.newTransfer')}
          </GSText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
          onPress={onDone}
        >
          <Ionicons name="home-outline" size={20} color={theme.colors.white} />
          <GSText variant="body" weight="semiBold" color="white" style={{ marginLeft: 8 }}>
            {t('wallet.transferScreen.backToWallet')}
          </GSText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  dynamicCodeContainer: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  dynamicCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginVertical: 8,
  },
  dynamicCodeText: {
    letterSpacing: 4,
    marginRight: 12,
  },
  hint: {
    textAlign: 'center',
    marginTop: 4,
  },
  summaryCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  detailsCard: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
});

export default TransferSuccess;
