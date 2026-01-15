import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { affiliatesService } from '../../services/affiliates.service';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import GSInput from '../../components/ui/GSInput';

type DocumentType = 'CC' | 'CE' | 'NIT' | 'PASSPORT';

export const AffiliateRegistrationScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { login, user } = useAuth();
  const { t } = useTranslation('translation');

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    documentType: 'CC' as DocumentType,
    documentNumber: '',
    password: '',
    confirmPassword: '',
    bio: '',
    website: '',
    socialMedia: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  // Pre-fill form with user data if authenticated
  useEffect(() => {
    if (user) {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
      const suggestedUsername = user.firstName
        ? user.firstName.toLowerCase().replace(/[^a-z0-9]/g, '')
        : '';

      setFormData(prev => ({
        ...prev,
        name: fullName || prev.name,
        username: suggestedUsername || prev.username,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        bio: user.bio || prev.bio,
      }));
    }
  }, [user]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = t('affiliate.registration.nameRequired');
    }
    if (!formData.username.trim()) {
      newErrors.username = t('affiliate.registration.usernameRequired');
    } else if (formData.username.length < 3) {
      newErrors.username = t('affiliate.registration.usernameMinLength');
    }
    if (!formData.email.trim()) {
      newErrors.email = t('affiliate.registration.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('affiliate.registration.emailInvalid');
    }
    if (!formData.password) {
      newErrors.password = t('affiliate.registration.passwordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = t('affiliate.registration.passwordMinLength');
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('affiliate.registration.passwordMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      Alert.alert(
        t('common.error'),
        t('affiliate.registration.fillRequired')
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await affiliatesService.registerAffiliate({
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        documentType: formData.documentType,
        documentNumber: formData.documentNumber || undefined,
        bio: formData.bio || undefined,
        website: formData.website || undefined,
        socialMedia: formData.socialMedia || undefined,
      });

      // Auto-login with returned token
      if (response.access_token) {
        await login(formData.email, formData.password);

        Alert.alert(
          t('common.success'),
          t('affiliate.registration.successMessage'),
          [
            {
              text: t('common.ok'),
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error registering affiliate:', error);
      Alert.alert(
        t('common.error'),
        error.response?.data?.message || t('affiliate.registration.failed')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={[styles.logo, { backgroundColor: theme.colors.primary }]}>
              <GSText style={styles.logoText} variant="h2" color="white">
                G
              </GSText>
            </View>
            <GSText variant="h1" style={styles.title}>
              {t('affiliate.registration.title')}
            </GSText>
            <GSText variant="body" color="textSecondary" style={styles.subtitle}>
              {t('affiliate.registration.subtitle')}
            </GSText>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Personal Info Section */}
            <GSText variant="h3" style={styles.sectionTitle}>
              {t('affiliate.registration.personalInfo')}
            </GSText>

            <GSInput
              label={t('affiliate.registration.fullName')}
              placeholder={t('affiliate.registration.fullNamePlaceholder')}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              error={errors.name}
              leftIcon={<Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} />}
            />

            <GSInput
              label={t('affiliate.registration.username')}
              placeholder={t('affiliate.registration.usernamePlaceholder')}
              value={formData.username}
              onChangeText={(text) => setFormData(prev => ({ ...prev, username: text.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
              error={errors.username}
              autoCapitalize="none"
              leftIcon={<Ionicons name="at-outline" size={20} color={theme.colors.textSecondary} />}
            />

            <GSInput
              label={t('affiliate.registration.email')}
              placeholder={t('affiliate.registration.emailPlaceholder')}
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} />}
            />

            <GSInput
              label={t('affiliate.registration.phone')}
              placeholder={t('affiliate.registration.phonePlaceholder')}
              value={formData.phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
              keyboardType="phone-pad"
              leftIcon={<Ionicons name="call-outline" size={20} color={theme.colors.textSecondary} />}
            />

            {/* Document Type Picker */}
            <View style={styles.pickerContainer}>
              <GSText style={styles.label}>{t('affiliate.registration.documentType')}</GSText>
              <View style={[styles.picker, { borderColor: theme.colors.gray300 }]}>
                <Picker
                  selectedValue={formData.documentType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, documentType: value as DocumentType }))}
                  style={styles.pickerInput}
                >
                  <Picker.Item label="Cédula de Ciudadanía (CC)" value="CC" />
                  <Picker.Item label="Cédula de Extranjería (CE)" value="CE" />
                  <Picker.Item label="NIT" value="NIT" />
                  <Picker.Item label="Pasaporte" value="PASSPORT" />
                </Picker>
              </View>
            </View>

            <GSInput
              label={t('affiliate.registration.documentNumber')}
              placeholder={t('affiliate.registration.documentNumberPlaceholder')}
              value={formData.documentNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, documentNumber: text }))}
              keyboardType="numeric"
              leftIcon={<Ionicons name="card-outline" size={20} color={theme.colors.textSecondary} />}
            />

            {/* Password Section */}
            <GSText variant="h3" style={styles.sectionTitle}>
              {t('affiliate.registration.security')}
            </GSText>

            <GSInput
              label={t('affiliate.registration.password')}
              placeholder={t('affiliate.registration.passwordPlaceholder')}
              value={formData.password}
              onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
              error={errors.password}
              secureTextEntry={!showPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              }
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} />}
            />

            <GSInput
              label={t('affiliate.registration.confirmPassword')}
              placeholder={t('affiliate.registration.confirmPasswordPlaceholder')}
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
              error={errors.confirmPassword}
              secureTextEntry={!showConfirmPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              }
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} />}
            />

            {/* Social Media Section */}
            <GSText variant="h3" style={styles.sectionTitle}>
              {t('affiliate.registration.socialMedia')} {t('affiliate.registration.optional')}
            </GSText>

            <GSInput
              label={t('affiliate.registration.bio')}
              placeholder={t('affiliate.registration.bioPlaceholder')}
              value={formData.bio}
              onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: 'top' }}
              leftIcon={<Ionicons name="reader-outline" size={20} color={theme.colors.textSecondary} />}
            />

            <GSInput
              label={t('affiliate.registration.website')}
              placeholder={t('affiliate.registration.websitePlaceholder')}
              value={formData.website}
              onChangeText={(text) => setFormData(prev => ({ ...prev, website: text }))}
              keyboardType="url"
              autoCapitalize="none"
              leftIcon={<Ionicons name="globe-outline" size={20} color={theme.colors.textSecondary} />}
            />

            <GSInput
              label={t('affiliate.registration.socialMediaHandle')}
              placeholder={t('affiliate.registration.socialMediaPlaceholder')}
              value={formData.socialMedia}
              onChangeText={(text) => setFormData(prev => ({ ...prev, socialMedia: text }))}
              autoCapitalize="none"
              leftIcon={<Ionicons name="logo-instagram" size={20} color={theme.colors.textSecondary} />}
            />

            <GSButton
              title={t('affiliate.registration.submit')}
              onPress={handleRegister}
              loading={isLoading}
              style={styles.submitButton}
            />

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
              <GSText variant="caption" color="textSecondary" style={styles.infoText}>
                {t('affiliate.registration.pendingMessage')}
              </GSText>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontWeight: 'bold',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  form: {
    gap: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontWeight: '600',
    marginTop: 8,
    marginBottom: -8,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  picker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pickerInput: {
    height: 48,
  },
  submitButton: {
    marginTop: 10,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  infoText: {
    flex: 1,
    lineHeight: 18,
  },
});
