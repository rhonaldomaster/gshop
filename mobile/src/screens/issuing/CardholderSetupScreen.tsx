import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import GSInput from '../../components/ui/GSInput';
import { issuingService } from '../../services/issuing.service';

interface FormErrors {
  name?: string;
  phoneNumber?: string;
  line1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export default function CardholderSetupScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();

  // Form state
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country] = useState('CO');

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Validate form fields
  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = t('issuing.errors.nameRequired');
    }
    if (!line1.trim()) {
      newErrors.line1 = t('issuing.errors.addressRequired');
    }
    if (!city.trim()) {
      newErrors.city = t('issuing.errors.cityRequired');
    }
    if (!state.trim()) {
      newErrors.state = t('issuing.errors.stateRequired');
    }
    if (!postalCode.trim()) {
      newErrors.postalCode = t('issuing.errors.postalCodeRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, line1, city, state, postalCode, t]);

  // Submit cardholder creation
  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);

      await issuingService.createCardholder({
        name: name.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        billingAddress: {
          line1: line1.trim(),
          line2: line2.trim() || undefined,
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          country,
        },
      });

      Alert.alert(
        t('common.success'),
        t('issuing.cardholderCreated'),
        [{ text: t('common.ok'), onPress: () => navigation.goBack() }],
      );
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('issuing.errors.createCardholderFailed'));
    } finally {
      setSubmitting(false);
    }
  }, [name, phoneNumber, line1, line2, city, state, postalCode, country, validate, navigation, t]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <GSText variant="h3" weight="bold">
          {t('issuing.cardholderSetup')}
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
          {/* Info banner */}
          <View style={[styles.infoBanner, { backgroundColor: theme.colors.primary + '10' }]}>
            <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
            <GSText variant="caption" color="textSecondary" style={{ marginLeft: 8, flex: 1 }}>
              {t('issuing.setupInfo')}
            </GSText>
          </View>

          {/* Personal info section */}
          <GSText variant="h5" weight="bold" style={styles.sectionTitle}>
            {t('issuing.personalInfo')}
          </GSText>

          <GSInput
            label={t('issuing.fullName')}
            value={name}
            onChangeText={setName}
            placeholder="Juan Perez"
            error={errors.name}
            autoCapitalize="words"
          />

          <GSInput
            label={t('issuing.phoneNumber')}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="+573001234567"
            keyboardType="phone-pad"
            error={errors.phoneNumber}
          />

          {/* Billing address section */}
          <GSText variant="h5" weight="bold" style={styles.sectionTitle}>
            {t('issuing.billingAddress')}
          </GSText>

          <GSInput
            label={t('issuing.addressLine1')}
            value={line1}
            onChangeText={setLine1}
            placeholder="Calle 123 #45-67"
            error={errors.line1}
          />

          <GSInput
            label={t('issuing.addressLine2')}
            value={line2}
            onChangeText={setLine2}
            placeholder={t('issuing.addressLine2Placeholder')}
          />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <GSInput
                label={t('issuing.city')}
                value={city}
                onChangeText={setCity}
                placeholder="Bogota"
                error={errors.city}
              />
            </View>
            <View style={styles.halfInput}>
              <GSInput
                label={t('issuing.state')}
                value={state}
                onChangeText={setState}
                placeholder="Cundinamarca"
                error={errors.state}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <GSInput
                label={t('issuing.postalCode')}
                value={postalCode}
                onChangeText={setPostalCode}
                placeholder="110111"
                keyboardType="numeric"
                error={errors.postalCode}
              />
            </View>
            <View style={styles.halfInput}>
              <View style={styles.countryDisplay}>
                <GSText variant="caption" color="textSecondary" style={styles.countryLabel}>
                  {t('issuing.country')}
                </GSText>
                <View style={[styles.countryValue, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border || 'rgba(0,0,0,0.1)' }]}>
                  <GSText variant="body">Colombia (CO)</GSText>
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Submit button */}
        <View style={styles.footer}>
          <GSButton
            title={t('issuing.createCardholder')}
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
            style={styles.submitButton}
          />
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  countryDisplay: {
    marginBottom: 16,
  },
  countryLabel: {
    marginBottom: 6,
  },
  countryValue: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
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
