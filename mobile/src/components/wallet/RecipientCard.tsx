import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import GSText from '../ui/GSText';
import { SearchUserResult } from '../../services/transfer.service';

interface RecipientCardProps {
  recipient: SearchUserResult;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirmed?: boolean;
}

export const RecipientCard: React.FC<RecipientCardProps> = ({
  recipient,
  onConfirm,
  onCancel,
  isConfirmed = false,
}) => {
  const { theme } = useTheme();

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isConfirmed
            ? theme.colors.success + '10'
            : theme.colors.surface,
          borderColor: isConfirmed ? theme.colors.success : theme.colors.border,
        },
      ]}
    >
      <View style={styles.header}>
        {isConfirmed && (
          <View style={[styles.confirmedBadge, { backgroundColor: theme.colors.success }]}>
            <Ionicons name="checkmark" size={12} color={theme.colors.white} />
            <GSText variant="caption" color="white" weight="medium" style={{ marginLeft: 4 }}>
              Confirmado
            </GSText>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
          <GSText variant="h4" color="white" weight="bold">
            {getInitials(recipient.firstName, recipient.lastName)}
          </GSText>
        </View>

        <View style={styles.info}>
          <GSText variant="h4" weight="bold">
            {recipient.firstName} {recipient.lastName}
          </GSText>
          <View style={styles.emailRow}>
            <Ionicons name="mail-outline" size={14} color={theme.colors.textSecondary} />
            <GSText variant="body" color="textSecondary" style={{ marginLeft: 4 }}>
              {recipient.maskedEmail}
            </GSText>
          </View>
        </View>
      </View>

      {!isConfirmed ? (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: theme.colors.gray200 }]}
            onPress={onCancel}
          >
            <GSText variant="body" weight="medium">
              Cambiar
            </GSText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: theme.colors.primary }]}
            onPress={onConfirm}
          >
            <Ionicons name="checkmark" size={20} color={theme.colors.white} />
            <GSText variant="body" weight="medium" color="white" style={{ marginLeft: 4 }}>
              Confirmar
            </GSText>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.changeButton, { borderColor: theme.colors.textSecondary }]}
          onPress={onCancel}
        >
          <Ionicons name="swap-horizontal" size={16} color={theme.colors.textSecondary} />
          <GSText variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
            Cambiar destinatario
          </GSText>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: 8,
    minHeight: 24,
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
});

export default RecipientCard;
