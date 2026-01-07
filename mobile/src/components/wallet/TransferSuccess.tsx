import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        Transferencia Exitosa!
      </GSText>
      <GSText variant="body" color="textSecondary" style={styles.subtitle}>
        Tu dinero ha sido enviado correctamente
      </GSText>

      {/* Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.summaryRow}>
          <GSText variant="body" color="textSecondary">
            Monto enviado
          </GSText>
          <GSText variant="h3" weight="bold">
            {transferService.formatCOP(result.summary.amountSent)}
          </GSText>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.summaryRow}>
          <GSText variant="body" color="textSecondary">
            Destinatario
          </GSText>
          <GSText variant="body" weight="medium">
            {recipientName}
          </GSText>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.summaryRow}>
          <GSText variant="body" color="textSecondary">
            Comision GSHOP
          </GSText>
          <GSText variant="body" style={{ color: theme.colors.warning }}>
            -{transferService.formatCOP(result.summary.feeCharged)}
          </GSText>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.summaryRow}>
          <GSText variant="body" color="textSecondary">
            {recipientName} recibio
          </GSText>
          <GSText variant="h4" weight="bold" style={{ color: theme.colors.success }}>
            {transferService.formatCOP(result.summary.recipientNetBalance)}
          </GSText>
        </View>
      </View>

      {/* Transaction Details */}
      <View style={[styles.detailsCard, { backgroundColor: theme.colors.gray100 }]}>
        <View style={styles.detailRow}>
          <Ionicons name="document-text-outline" size={16} color={theme.colors.textSecondary} />
          <GSText variant="caption" color="textSecondary" style={{ marginLeft: 6 }}>
            ID: {result.transferId.slice(0, 8)}...
          </GSText>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
          <GSText variant="caption" color="textSecondary" style={{ marginLeft: 6 }}>
            {result.transactions[0]
              ? formatDate(result.transactions[0].createdAt)
              : formatDate(new Date().toISOString())
            }
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
          <GSText variant="body" weight="medium" style={{ color: theme.colors.primary, marginLeft: 8 }}>
            Nueva Transferencia
          </GSText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
          onPress={onDone}
        >
          <Ionicons name="home-outline" size={20} color={theme.colors.white} />
          <GSText variant="body" weight="medium" color="white" style={{ marginLeft: 8 }}>
            Volver a Wallet
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
    marginBottom: 32,
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
