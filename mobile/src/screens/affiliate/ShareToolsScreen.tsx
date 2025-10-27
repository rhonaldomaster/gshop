import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Clipboard,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { affiliatesService } from '../../services/affiliates.service';
import { EmptyState } from '../../components/ui/EmptyState';

const { width } = Dimensions.get('window');

interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  shareUrl: (link: string, text: string) => string;
}

interface ShareTemplate {
  id: string;
  title: string;
  description: string;
  template: string;
  category: 'general' | 'product' | 'promotional' | 'personal';
}

interface ShareAnalytics {
  platform: string;
  shares: number;
  clicks: number;
  conversions: number;
}

export const ShareToolsScreen = () => {
  const { t } = useTranslation('translation');
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [generatedContent, setGeneratedContent] = useState('');
  const [shareAnalytics, setShareAnalytics] = useState<ShareAnalytics[]>([]);
  const [loading, setLoading] = useState(false);

  const socialPlatforms: SocialPlatform[] = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: '💬',
      color: '#25D366',
      shareUrl: (link, text) => `https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`,
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: '📘',
      color: '#1877F2',
      shareUrl: (link, text) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(text)}`,
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: '🐦',
      color: '#1DA1F2',
      shareUrl: (link, text) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`,
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: '📷',
      color: '#E4405F',
      shareUrl: (link, text) => '', // Instagram doesn't support direct link sharing
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: '✈️',
      color: '#0088CC',
      shareUrl: (link, text) => `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`,
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: '💼',
      color: '#0A66C2',
      shareUrl: (link, text) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: '🎵',
      color: '#000000',
      shareUrl: (link, text) => '', // TikTok doesn't support direct link sharing
    },
    {
      id: 'pinterest',
      name: 'Pinterest',
      icon: '📌',
      color: '#BD081C',
      shareUrl: (link, text) => `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(link)}&description=${encodeURIComponent(text)}`,
    },
  ];

  const shareTemplates: ShareTemplate[] = [
    {
      id: 'product_recommendation',
      title: t('affiliate.templates.productRecommendation.title'),
      description: t('affiliate.templates.productRecommendation.description'),
      template: t('affiliate.templates.productRecommendation.template'),
      category: 'product',
    },
    {
      id: 'deal_alert',
      title: t('affiliate.templates.dealAlert.title'),
      description: t('affiliate.templates.dealAlert.description'),
      template: t('affiliate.templates.dealAlert.template'),
      category: 'promotional',
    },
    {
      id: 'review_share',
      title: t('affiliate.templates.reviewShare.title'),
      description: t('affiliate.templates.reviewShare.description'),
      template: t('affiliate.templates.reviewShare.template'),
      category: 'personal',
    },
    {
      id: 'lifestyle_post',
      title: t('affiliate.templates.lifestylePost.title'),
      description: t('affiliate.templates.lifestylePost.description'),
      template: t('affiliate.templates.lifestylePost.template'),
      category: 'personal',
    },
    {
      id: 'gift_idea',
      title: t('affiliate.templates.giftIdea.title'),
      description: t('affiliate.templates.giftIdea.description'),
      template: t('affiliate.templates.giftIdea.template'),
      category: 'general',
    },
    {
      id: 'comparison_post',
      title: t('affiliate.templates.comparisonPost.title'),
      description: t('affiliate.templates.comparisonPost.description'),
      template: t('affiliate.templates.comparisonPost.template'),
      category: 'product',
    },
    {
      id: 'unboxing_story',
      title: t('affiliate.templates.unboxingStory.title'),
      description: t('affiliate.templates.unboxingStory.description'),
      template: t('affiliate.templates.unboxingStory.template'),
      category: 'personal',
    },
    {
      id: 'tutorial_share',
      title: t('affiliate.templates.tutorialShare.title'),
      description: t('affiliate.templates.tutorialShare.description'),
      template: t('affiliate.templates.tutorialShare.template'),
      category: 'general',
    },
  ];

  // Mock analytics data
  const mockAnalytics: ShareAnalytics[] = [
    { platform: 'WhatsApp', shares: 45, clicks: 120, conversions: 8 },
    { platform: 'Facebook', shares: 32, clicks: 89, conversions: 5 },
    { platform: 'Instagram', shares: 28, clicks: 76, conversions: 4 },
    { platform: 'Twitter', shares: 18, clicks: 42, conversions: 2 },
    { platform: 'TikTok', shares: 15, clicks: 38, conversions: 3 },
  ];

  const generateContent = useCallback((template: ShareTemplate, product?: any) => {
    let content = template.template;

    if (product) {
      content = content
        .replace(/{{productName}}/g, product.name || 'this amazing product')
        .replace(/{{price}}/g, product.price?.toFixed(2) || '0.00')
        .replace(/{{audience}}/g, 'everyone')
        .replace(/{{link}}/g, '[Your Affiliate Link]');
    } else {
      content = content
        .replace(/{{productName}}/g, '[Product Name]')
        .replace(/{{price}}/g, '[Price]')
        .replace(/{{audience}}/g, '[Target Audience]')
        .replace(/{{link}}/g, '[Your Affiliate Link]');
    }

    setGeneratedContent(content);
  }, []);

  const shareToSocial = useCallback(async (platform: SocialPlatform, content: string) => {
    try {
      if (platform.id === 'instagram' || platform.id === 'tiktok') {
        // For Instagram and TikTok, copy content to clipboard
        await Clipboard.setString(content);
        Alert.alert(
          t('affiliate.shareToTitle', { platform: platform.name }),
          t('affiliate.shareToMessage'),
          [
            { text: t('common.cancel') },
            { text: t('affiliate.openApp'), onPress: () => console.log(`Open ${platform.name}`) }
          ]
        );
        return;
      }

      // For other platforms, use native share or open in browser
      const result = await Share.share({
        message: content,
      });

      if (result.action === Share.sharedAction) {
        Alert.alert(t('affiliate.sharedTitle'), t('affiliate.sharedMessage', { platform: platform.name }));
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert(t('common.error'), t('affiliate.failedShareContent'));
    }
  }, [t]);

  const copyToClipboard = useCallback(async (content: string) => {
    try {
      await Clipboard.setString(content);
      Alert.alert(t('affiliate.copiedTitle'), t('affiliate.copiedMessage'));
    } catch (error) {
      console.error('Error copying:', error);
      Alert.alert(t('common.error'), t('affiliate.failedCopyContent'));
    }
  }, [t]);

  useEffect(() => {
    setShareAnalytics(mockAnalytics);
  }, []);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title={t('affiliate.signInRequired')}
          description={t('affiliate.signInToAccessTools')}
          icon="🔐"
        />
      </SafeAreaView>
    );
  }

  const renderTemplate = (template: ShareTemplate) => (
    <TouchableOpacity
      key={template.id}
      style={styles.templateCard}
      onPress={() => generateContent(template, selectedProduct)}
    >
      <Text style={styles.templateTitle}>{template.title}</Text>
      <Text style={styles.templateDescription}>{template.description}</Text>
      <Text style={styles.templateCategory}>{t(`affiliate.categories.${template.category}`)}</Text>
    </TouchableOpacity>
  );

  const renderSocialPlatform = (platform: SocialPlatform) => (
    <TouchableOpacity
      key={platform.id}
      style={[styles.platformCard, { borderColor: platform.color }]}
      onPress={() => shareToSocial(platform, generatedContent)}
      disabled={!generatedContent}
    >
      <Text style={styles.platformIcon}>{platform.icon}</Text>
      <Text style={styles.platformName}>{platform.name}</Text>
    </TouchableOpacity>
  );

  const renderAnalytics = (analytics: ShareAnalytics) => (
    <View key={analytics.platform} style={styles.analyticsCard}>
      <Text style={styles.analyticsTitle}>{analytics.platform}</Text>
      <View style={styles.analyticsRow}>
        <View style={styles.analyticsStat}>
          <Text style={styles.analyticsValue}>{analytics.shares}</Text>
          <Text style={styles.analyticsLabel}>{t('affiliate.shares')}</Text>
        </View>
        <View style={styles.analyticsStat}>
          <Text style={styles.analyticsValue}>{analytics.clicks}</Text>
          <Text style={styles.analyticsLabel}>{t('affiliate.clicks')}</Text>
        </View>
        <View style={styles.analyticsStat}>
          <Text style={styles.analyticsValue}>{analytics.conversions}</Text>
          <Text style={styles.analyticsLabel}>{t('affiliate.sales')}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('affiliate.shareTools')}</Text>
        <Text style={styles.headerSubtitle}>{t('affiliate.shareToolsSubtitle')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Content Templates */}
        <View style={styles.templatesSection}>
          <Text style={styles.sectionTitle}>{t('affiliate.contentTemplates')}</Text>
          <Text style={styles.sectionSubtitle}>
            {t('affiliate.contentTemplatesSubtitle')}
          </Text>
          <View style={styles.templatesGrid}>
            {shareTemplates.map(renderTemplate)}
          </View>
        </View>

        {/* Generated Content */}
        {generatedContent ? (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>{t('affiliate.generatedContent')}</Text>
            <View style={styles.contentCard}>
              <Text style={styles.contentText}>{generatedContent}</Text>
              <View style={styles.contentActions}>
                <TouchableOpacity
                  style={styles.contentAction}
                  onPress={() => copyToClipboard(generatedContent)}
                >
                  <Text style={styles.contentActionText}>{t('affiliate.copy')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.contentAction}
                  onPress={() => setGeneratedContent('')}
                >
                  <Text style={styles.contentActionText}>{t('affiliate.clear')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        {/* Social Platforms */}
        <View style={styles.platformsSection}>
          <Text style={styles.sectionTitle}>{t('affiliate.shareToSocialMedia')}</Text>
          <Text style={styles.sectionSubtitle}>
            {generatedContent ? t('affiliate.choosePlatform') : t('affiliate.generateFirst')}
          </Text>
          <View style={styles.platformsGrid}>
            {socialPlatforms.map(renderSocialPlatform)}
          </View>
        </View>

        {/* Performance Analytics */}
        <View style={styles.analyticsSection}>
          <Text style={styles.sectionTitle}>{t('affiliate.sharingPerformance')}</Text>
          <Text style={styles.sectionSubtitle}>
            {t('affiliate.sharingPerformanceSubtitle')}
          </Text>
          {shareAnalytics.map(renderAnalytics)}
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>{t('affiliate.sharingTips')}</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>🎯</Text>
            <Text style={styles.tipText}>
              {t('affiliate.shareTip1')}
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>📸</Text>
            <Text style={styles.tipText}>
              {t('affiliate.shareTip2')}
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>⏰</Text>
            <Text style={styles.tipText}>
              {t('affiliate.shareTip3')}
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>💬</Text>
            <Text style={styles.tipText}>
              {t('affiliate.shareTip4')}
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>📈</Text>
            <Text style={styles.tipText}>
              {t('affiliate.shareTip5')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  templatesSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  templateCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    margin: 8,
    width: (width - 72) / 2,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  templateTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  templateDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 8,
  },
  templateCategory: {
    fontSize: 11,
    color: '#007bff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  contentSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contentCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  contentText: {
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 24,
    marginBottom: 16,
  },
  contentActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  contentAction: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  contentActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  platformsSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  platformCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    margin: 8,
    width: (width - 88) / 3,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  platformIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  platformName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
    textAlign: 'center',
  },
  analyticsSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  analyticsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  analyticsStat: {
    alignItems: 'center',
  },
  analyticsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 4,
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#666',
  },
  tipsSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    marginBottom: 40,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    fontSize: 14,
    color: '#495057',
    flex: 1,
    lineHeight: 20,
  },
});