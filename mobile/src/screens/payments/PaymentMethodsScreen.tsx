import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import GSText from '../../components/ui/GSText';

export default function PaymentMethodsScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <GSText variant="h3" weight="bold">
          {t('payments.paymentMethods')}
        </GSText>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoContainer}>
          {/* MercadoPago Icon */}
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '20' }]}>
            <Ionicons name="wallet-outline" size={60} color={theme.colors.primary} />
          </View>

          {/* Title */}
          <GSText variant="h2" weight="bold" style={styles.title}>
            MercadoPago
          </GSText>

          {/* Description */}
          <GSText variant="body" color="textSecondary" style={styles.description}>
            {t('payments.mercadoPagoDescription')}
          </GSText>

          {/* Features List */}
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark" size={24} color={theme.colors.success} />
              <GSText variant="body" style={styles.featureText}>
                {t('payments.securePay')}
              </GSText>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="card" size={24} color={theme.colors.success} />
              <GSText variant="body" style={styles.featureText}>
                {t('payments.allCards')}
              </GSText>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="flash" size={24} color={theme.colors.success} />
              <GSText variant="body" style={styles.featureText}>
                {t('payments.instantProcess')}
              </GSText>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="lock-closed" size={24} color={theme.colors.success} />
              <GSText variant="body" style={styles.featureText}>
                {t('payments.dataProtected')}
              </GSText>
            </View>
          </View>

          {/* Info Note */}
          <View style={[styles.infoNote, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
            <GSText variant="caption" color="textSecondary" style={styles.infoNoteText}>
              {t('payments.mercadoPagoNote')}
            </GSText>
          </View>
        </View>
      </ScrollView>
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
  },
  infoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 40,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresList: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  featureText: {
    marginLeft: 16,
    flex: 1,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  infoNoteText: {
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});