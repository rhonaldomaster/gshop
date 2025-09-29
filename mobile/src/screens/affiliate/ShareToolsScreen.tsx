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
      title: '🌟 Product Recommendation',
      description: 'Share a product with personal recommendation',
      template: '🌟 Just found this amazing {{productName}}! Perfect for {{audience}}. Check it out: {{link}} #affiliate #recommendation',
      category: 'product',
    },
    {
      id: 'deal_alert',
      title: '🔥 Deal Alert',
      description: 'Highlight special offers and discounts',
      template: '🔥 DEAL ALERT! Amazing {{productName}} at just ${{price}}! Don\'t miss out: {{link}} #deals #shopping',
      category: 'promotional',
    },
    {
      id: 'review_share',
      title: '⭐ Product Review',
      description: 'Share your honest product review',
      template: '⭐ Just tried {{productName}} and I\'m impressed! Here\'s my honest review and where to get it: {{link}} #review #honest',
      category: 'personal',
    },
    {
      id: 'lifestyle_post',
      title: '💫 Lifestyle Post',
      description: 'Integrate product into lifestyle content',
      template: '💫 Living my best life with {{productName}}! It has made such a difference. Get yours here: {{link}} #lifestyle #wellness',
      category: 'personal',
    },
    {
      id: 'gift_idea',
      title: '🎁 Gift Idea',
      description: 'Suggest product as a perfect gift',
      template: '🎁 Looking for the perfect gift? {{productName}} is absolutely perfect! Your loved ones will thank you: {{link}} #gifts #presents',
      category: 'general',
    },
    {
      id: 'comparison_post',
      title: '🤔 Product Comparison',
      description: 'Compare products and highlight benefits',
      template: '🤔 After trying many options, {{productName}} stands out! Here\'s why it\'s the best choice: {{link}} #comparison #bestchoice',
      category: 'product',
    },
    {
      id: 'unboxing_story',
      title: '📦 Unboxing Story',
      description: 'Share unboxing experience',
      template: '📦 Unboxing my new {{productName}} and I\'m so excited! The quality is amazing. Get yours: {{link}} #unboxing #excited',
      category: 'personal',
    },
    {
      id: 'tutorial_share',
      title: '📚 How-to Tutorial',
      description: 'Educational content with product mention',
      template: '📚 Tutorial: How to get the most out of {{productName}}! It\'s been a game-changer for me: {{link}} #tutorial #tips',
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
          `Share to ${platform.name}`,
          'Content copied to clipboard! Open the app and paste it in your post.',
          [
            { text: 'Cancel' },
            { text: 'Open App', onPress: () => console.log(`Open ${platform.name}`) }
          ]
        );
        return;
      }

      // For other platforms, use native share or open in browser
      const result = await Share.share({
        message: content,
      });

      if (result.action === Share.sharedAction) {
        Alert.alert('Shared!', `Content shared to ${platform.name} successfully! 🎉`);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share content. Please try again.');
    }
  }, []);

  const copyToClipboard = useCallback(async (content: string) => {
    try {
      await Clipboard.setString(content);
      Alert.alert('Copied! 📋', 'Content copied to clipboard.');
    } catch (error) {
      console.error('Error copying:', error);
      Alert.alert('Error', 'Failed to copy content.');
    }
  }, []);

  useEffect(() => {
    setShareAnalytics(mockAnalytics);
  }, []);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Sign in Required"
          description="Please sign in to access sharing tools"
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
      <Text style={styles.templateCategory}>{template.category}</Text>
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
          <Text style={styles.analyticsLabel}>Shares</Text>
        </View>
        <View style={styles.analyticsStat}>
          <Text style={styles.analyticsValue}>{analytics.clicks}</Text>
          <Text style={styles.analyticsLabel}>Clicks</Text>
        </View>
        <View style={styles.analyticsStat}>
          <Text style={styles.analyticsValue}>{analytics.conversions}</Text>
          <Text style={styles.analyticsLabel}>Sales</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Share Tools</Text>
        <Text style={styles.headerSubtitle}>Create engaging content for social media</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Content Templates */}
        <View style={styles.templatesSection}>
          <Text style={styles.sectionTitle}>📝 Content Templates</Text>
          <Text style={styles.sectionSubtitle}>
            Choose a template to generate engaging content for your posts
          </Text>
          <View style={styles.templatesGrid}>
            {shareTemplates.map(renderTemplate)}
          </View>
        </View>

        {/* Generated Content */}
        {generatedContent ? (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>✨ Generated Content</Text>
            <View style={styles.contentCard}>
              <Text style={styles.contentText}>{generatedContent}</Text>
              <View style={styles.contentActions}>
                <TouchableOpacity
                  style={styles.contentAction}
                  onPress={() => copyToClipboard(generatedContent)}
                >
                  <Text style={styles.contentActionText}>📋 Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.contentAction}
                  onPress={() => setGeneratedContent('')}
                >
                  <Text style={styles.contentActionText}>🗑️ Clear</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        {/* Social Platforms */}
        <View style={styles.platformsSection}>
          <Text style={styles.sectionTitle}>📱 Share to Social Media</Text>
          <Text style={styles.sectionSubtitle}>
            {generatedContent ? 'Choose a platform to share your content' : 'Generate content first to enable sharing'}
          </Text>
          <View style={styles.platformsGrid}>
            {socialPlatforms.map(renderSocialPlatform)}
          </View>
        </View>

        {/* Performance Analytics */}
        <View style={styles.analyticsSection}>
          <Text style={styles.sectionTitle}>📊 Sharing Performance</Text>
          <Text style={styles.sectionSubtitle}>
            Track how your shared content performs across platforms
          </Text>
          {shareAnalytics.map(renderAnalytics)}
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>💡 Sharing Tips</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>🎯</Text>
            <Text style={styles.tipText}>
              Personalize templates with your own voice and style for authenticity
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>📸</Text>
            <Text style={styles.tipText}>
              Add high-quality images or videos to increase engagement
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>⏰</Text>
            <Text style={styles.tipText}>
              Post at optimal times when your audience is most active
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>💬</Text>
            <Text style={styles.tipText}>
              Engage with comments and questions to build trust with your audience
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>📈</Text>
            <Text style={styles.tipText}>
              Track performance and adjust your strategy based on what works best
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