
import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';

type WelcomeNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const navigation = useNavigation<WelcomeNavigationProp>();
  const { theme } = useTheme();
  const { t } = useTranslation('translation');

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.accent]}
        style={styles.heroSection}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.logoContainer}>
          <View style={[styles.logo, { backgroundColor: theme.colors.white }]}>
            <GSText style={[styles.logoText, { color: theme.colors.primary }]} variant="h1">
              G
            </GSText>
          </View>
          <GSText variant="h1" style={styles.appName} color="white">
            GSHOP
          </GSText>
          <GSText variant="body" style={styles.tagline} color="white">
            {t('welcome.tagline')}
          </GSText>
        </View>
      </LinearGradient>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <GSText variant="h2" style={styles.welcomeTitle}>
          {t('welcome.title')}
        </GSText>
        <GSText variant="body" style={styles.welcomeSubtitle} color="textSecondary">
          {t('welcome.subtitle')}
        </GSText>

        <View style={styles.featuresGrid}>
          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: theme.colors.primary + '20' }]}>
              <GSText variant="h2" style={{ color: theme.colors.primary }}>🛍️</GSText>
            </View>
            <GSText variant="h6" style={styles.featureTitle}>{t('welcome.features.shopEasily.title')}</GSText>
            <GSText variant="caption" color="textSecondary" style={styles.featureDescription}>
              {t('welcome.features.shopEasily.description')}
            </GSText>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: theme.colors.accent + '20' }]}>
              <GSText variant="h2" style={{ color: theme.colors.accent }}>🚚</GSText>
            </View>
            <GSText variant="h6" style={styles.featureTitle}>{t('welcome.features.fastDelivery.title')}</GSText>
            <GSText variant="caption" color="textSecondary" style={styles.featureDescription}>
              {t('welcome.features.fastDelivery.description')}
            </GSText>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: theme.colors.primary + '20' }]}>
              <GSText variant="h2" style={{ color: theme.colors.primary }}>💳</GSText>
            </View>
            <GSText variant="h6" style={styles.featureTitle}>{t('welcome.features.securePayments.title')}</GSText>
            <GSText variant="caption" color="textSecondary" style={styles.featureDescription}>
              {t('welcome.features.securePayments.description')}
            </GSText>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: theme.colors.accent + '20' }]}>
              <GSText variant="h2" style={{ color: theme.colors.accent }}>🤝</GSText>
            </View>
            <GSText variant="h6" style={styles.featureTitle}>{t('welcome.features.socialShopping.title')}</GSText>
            <GSText variant="caption" color="textSecondary" style={styles.featureDescription}>
              {t('welcome.features.socialShopping.description')}
            </GSText>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <GSButton
          title={t('welcome.getStarted')}
          onPress={() => navigation.navigate('Register')}
          style={styles.primaryButton}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={styles.loginLink}
        >
          <GSText variant="body" color="textSecondary">
            {t('auth.hasAccount')}{' '}
            <GSText variant="body" style={{ color: theme.colors.primary }}>
              {t('auth.signIn')}
            </GSText>
          </GSText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  heroSection: {
    height: height * 0.45,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontWeight: 'bold',
  },
  appName: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    textAlign: 'center',
    opacity: 0.9,
  },
  featuresSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  welcomeTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  featureCard: {
    width: (width - 48 - 16) / 2,
    alignItems: 'center',
    marginBottom: 24,
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    textAlign: 'center',
    lineHeight: 20,
  },
  actionSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  primaryButton: {
    marginBottom: 16,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
});
