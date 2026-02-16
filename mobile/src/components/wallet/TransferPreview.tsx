import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import GSText from '../ui/GSText';
import { TransferPreviewResponse } from '../../services/transfer.service';
import { transferService } from '../../services/transfer.service';

interface TransferPreviewProps {
  preview: TransferPreviewResponse;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
  note?: string;
  onNoteChange?: (note: string) => void;
}

export const TransferPreview: React.FC<TransferPreviewProps> = ({
  preview,
  onConfirm,
  onCancel,
  isLoading,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Ionicons name="swap-horizontal" size={24} color={theme.colors.white} />
        <GSText variant="h4" color="white" weight="bold" style={{ marginLeft: 8 }}>
          {t('wallet.transferPreview.title')}
        </GSText>
      </View>

      {/* Breakdown */}
      <View style={[styles.breakdown, { backgroundColor: theme.colors.surface }]}>
        {/* Amount Sent */}
        <View style={styles.row}>
          <View style={styles.rowLabel}>
            <Ionicons name="arrow-up-circle-outline" size={20} color={theme.colors.text} />
            <GSText variant="body" style={{ marginLeft: 8 }}>
              {t('wallet.transferPreview.youSend')}
            </GSText>
          </View>
          <GSText variant="h4" weight="bold">
            {transferService.formatUSD(Number(preview.amountSent) || 0)}
          </GSText>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.colors.gray300 }]} />

        {/* Recipient Gets */}
        <View style={[styles.row, styles.highlightRow]}>
          <View style={styles.rowLabel}>
            <Ionicons name="arrow-down-circle-outline" size={20} color={theme.colors.success} />
            <GSText variant="body" weight="bold" style={{ marginLeft: 8 }}>
              {t('wallet.transferPreview.recipientReceives', { name: preview.recipientName })}
            </GSText>
          </View>
          <GSText variant="h3" weight="bold" style={{ color: theme.colors.success }}>
            {transferService.formatUSD(Number(preview.amountReceived) || 0)}
          </GSText>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: theme.colors.gray200 }]}
          onPress={onCancel}
          disabled={isLoading}
        >
          <GSText variant="body" weight="semiBold">
            {t('common.cancel')}
          </GSText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.confirmButton,
            { backgroundColor: isLoading ? theme.colors.gray400 : theme.colors.success },
          ]}
          onPress={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.white} />
              <GSText variant="body" weight="bold" color="white" style={{ marginLeft: 8 }}>
                {t('wallet.transferPreview.confirmSend')}
              </GSText>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  breakdown: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  highlightRow: {
    paddingVertical: 16,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
});

export default TransferPreview;
