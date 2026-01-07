import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Ionicons name="swap-horizontal" size={24} color={theme.colors.white} />
        <GSText variant="h4" color="white" weight="bold" style={{ marginLeft: 8 }}>
          Resumen de Transferencia
        </GSText>
      </View>

      {/* Breakdown */}
      <View style={[styles.breakdown, { backgroundColor: theme.colors.surface }]}>
        {/* Amount Sent */}
        <View style={styles.row}>
          <View style={styles.rowLabel}>
            <Ionicons name="arrow-up-circle-outline" size={20} color={theme.colors.text} />
            <GSText variant="body" style={{ marginLeft: 8 }}>
              Tu envias
            </GSText>
          </View>
          <GSText variant="h4" weight="bold">
            {transferService.formatCOP(preview.amountToSend)}
          </GSText>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        {/* Recipient Gets */}
        <View style={styles.row}>
          <View style={styles.rowLabel}>
            <Ionicons name="arrow-down-circle-outline" size={20} color={theme.colors.success} />
            <GSText variant="body" style={{ marginLeft: 8 }}>
              {preview.recipientName} recibe
            </GSText>
          </View>
          <GSText variant="h4" weight="bold" style={{ color: theme.colors.success }}>
            {transferService.formatCOP(preview.amountReceived)}
          </GSText>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        {/* Platform Fee */}
        <View style={styles.row}>
          <View style={styles.rowLabel}>
            <Ionicons name="remove-circle-outline" size={20} color={theme.colors.warning} />
            <View style={{ marginLeft: 8, flex: 1 }}>
              <GSText variant="body">
                Comision GSHOP ({preview.feePercentage})
              </GSText>
              <GSText variant="caption" color="textSecondary">
                Se descuenta del monto recibido
              </GSText>
            </View>
          </View>
          <GSText variant="body" weight="medium" style={{ color: theme.colors.warning }}>
            -{transferService.formatCOP(preview.platformFee)}
          </GSText>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        {/* Net Amount */}
        <View style={[styles.row, styles.highlightRow]}>
          <View style={styles.rowLabel}>
            <Ionicons name="wallet-outline" size={20} color={theme.colors.primary} />
            <GSText variant="body" weight="bold" style={{ marginLeft: 8 }}>
              {preview.recipientName} tendra
            </GSText>
          </View>
          <GSText variant="h3" weight="bold" style={{ color: theme.colors.primary }}>
            {transferService.formatCOP(preview.recipientNetAmount)}
          </GSText>
        </View>
      </View>

      {/* Info Note */}
      <View style={[styles.infoNote, { backgroundColor: theme.colors.info + '15' }]}>
        <Ionicons name="information-circle" size={20} color={theme.colors.info} />
        <GSText variant="caption" style={{ marginLeft: 8, flex: 1, color: theme.colors.info }}>
          La comision de servicio de 0.2% permite mantener GSHOP seguro y confiable.
          El destinatario recibe el monto completo y luego se descuenta la comision.
        </GSText>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: theme.colors.gray200 }]}
          onPress={onCancel}
          disabled={isLoading}
        >
          <GSText variant="body" weight="medium">
            Cancelar
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
                Confirmar Envio
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
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
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
