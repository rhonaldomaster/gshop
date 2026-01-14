import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSocialAuth } from '../../hooks/useSocialAuth';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import GSInput from '../../components/ui/GSInput';

type LoginNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<LoginNavigationProp>();
  const { login, socialLogin } = useAuth();
  const { theme } = useTheme();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSocialSuccess = async (response: any) => {
    // Social login handled in useSocialAuth hook via authService
  };

  const handleSocialError = (error: Error) => {
    Alert.alert(
      t('auth.socialLoginError'),
      error.message || t('auth.socialLoginErrorMessage'),
    );
  };

  const {
    loginWithGoogle,
    loginWithFacebook,
    isLoading: isSocialLoading,
    error: socialError,
    isGoogleEnabled,
    isFacebookEnabled,
  } = useSocialAuth(handleSocialSuccess, handleSocialError);

  const hasSocialLogin = isGoogleEnabled || isFacebookEnabled;

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      return;
    }

    setIsLoading(true);
    try {
      await login(formData.email, formData.password);
    } catch (error) {
      console.error('Login error:', error);
      // TODO: Show error message
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
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
              {t('auth.welcomeBack')}
            </GSText>
            <GSText variant="body" color="#6B7280" style={styles.subtitle}>
              {t('auth.signInToAccount')}
            </GSText>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <GSInput
              label={t('auth.email')}
              placeholder={t('auth.enterEmail')}
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={20} color="#6B7280" />}
            />

            <GSInput
              label={t('auth.password')}
              placeholder={t('auth.enterPassword')}
              value={formData.password}
              onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
              secureTextEntry={!showPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              }
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#6B7280" />}
            />

            <TouchableOpacity style={styles.forgotPassword}>
              <GSText variant="body" style={{ color: theme.colors.primary }}>
                {t('auth.forgotPassword')}
              </GSText>
            </TouchableOpacity>

            <GSButton
              title={t('auth.signIn')}
              onPress={handleLogin}
              loading={isLoading}
              style={styles.signInButton}
            />

            {/* Social Login Section - Only show if at least one provider is configured */}
            {hasSocialLogin && (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <GSText variant="caption" color="#6B7280" style={styles.dividerText}>
                    {t('auth.continueWith')}
                  </GSText>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.socialButtons}>
                  {isFacebookEnabled && (
                    <TouchableOpacity
                      style={[styles.socialButton, styles.facebookButton]}
                      onPress={loginWithFacebook}
                      disabled={isSocialLoading}
                    >
                      {isSocialLoading ? (
                        <ActivityIndicator size="small" color="#1877F2" />
                      ) : (
                        <>
                          <Ionicons name="logo-facebook" size={20} color="#1877F2" />
                          <GSText variant="body" weight="semiBold">
                            {t('auth.facebook')}
                          </GSText>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  {isGoogleEnabled && (
                    <TouchableOpacity
                      style={[styles.socialButton, styles.googleButton]}
                      onPress={loginWithGoogle}
                      disabled={isSocialLoading}
                    >
                      {isSocialLoading ? (
                        <ActivityIndicator size="small" color="#DB4437" />
                      ) : (
                        <>
                          <Ionicons name="logo-google" size={20} color="#DB4437" />
                          <GSText variant="body" weight="semiBold">
                            {t('auth.google')}
                          </GSText>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.signUpLink}
          >
            <GSText variant="body" color="#6B7280">
              {t('auth.noAccount')}{' '}
              <GSText variant="body" style={{ color: theme.colors.primary }}>
                {t('auth.signUp')}
              </GSText>
            </GSText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    marginBottom: 40,
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
  },
  subtitle: {
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -10,
  },
  signInButton: {
    marginTop: 10,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  dividerText: {
    marginHorizontal: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    gap: 8,
  },
  facebookButton: {
    borderColor: '#1877F2',
    backgroundColor: '#E7F3FF',
  },
  googleButton: {
    borderColor: '#DB4437',
    backgroundColor: '#FEEAE9',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  signUpLink: {
    paddingVertical: 10,
  },
});