import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  TextInput,
  ScrollView,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  seller: {
    businessName: string;
  };
}

interface ShareOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  action: () => void;
}

export default function SocialShareScreen({ route, navigation }: any) {
  const { t } = useTranslation('translation');
  const { productId, product: initialProduct } = route.params || {};

  const [product, setProduct] = useState<Product | null>(initialProduct || null);
  const [loading, setLoading] = useState(!initialProduct);
  const [customMessage, setCustomMessage] = useState('');
  const [affiliateCode, setAffiliateCode] = useState('');

  useEffect(() => {
    if (productId && !initialProduct) {
      fetchProduct();
    }
    generateAffiliateCode();
  }, [productId, initialProduct]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`${process.env.API_BASE_URL}/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      Alert.alert(t('common.error'), t('social.errorLoadingProduct'));
    } finally {
      setLoading(false);
    }
  };

  const generateAffiliateCode = async () => {
    try {
      // In a real app, this would generate/fetch user's affiliate code
      const userAffiliateCode = 'USER123'; // Mock affiliate code
      setAffiliateCode(userAffiliateCode);
    } catch (error) {
      console.error('Failed to generate affiliate code:', error);
    }
  };

  const generateShareUrl = (withAffiliate = false) => {
    const baseUrl = `https://gshop.com/product/${productId}`;
    return withAffiliate ? `${baseUrl}?ref=${affiliateCode}` : baseUrl;
  };

  const generateShareMessage = () => {
    if (!product) return '';

    const defaultMessage = t('social.defaultShareMessage', {
      name: product.name,
      price: product.price,
      seller: product.seller.businessName
    });
    const url = generateShareUrl(true);
    const message = customMessage.trim() || defaultMessage;

    return `${message}\n\n${url}`;
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert(t('social.copied'), t('social.copiedToClipboard', { label }));
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      Alert.alert(t('common.error'), t('social.errorCopying'));
    }
  };

  const shareViaSystem = async () => {
    try {
      const message = generateShareMessage();

      const result = await Share.share({
        message,
        title: t('social.checkOut', { name: product?.name }),
      });

      if (result.action === Share.sharedAction) {
        // Track successful share
        trackShare('system_share');
      }
    } catch (error) {
      console.error('Failed to share:', error);
      Alert.alert(t('common.error'), t('social.errorSharing'));
    }
  };

  const openSocialApp = (url: string, appName: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert(t('common.error'), t('social.unableToOpen', { appName }));
    });
  };

  const trackShare = async (platform: string) => {
    try {
      // Track sharing analytics
      await fetch(`${process.env.API_BASE_URL}/analytics/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          platform,
          affiliateCode,
        }),
      });
    } catch (error) {
      console.error('Failed to track share:', error);
    }
  };

  const shareOptions: ShareOption[] = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: 'message',
      color: '#25D366',
      action: () => {
        const message = encodeURIComponent(generateShareMessage());
        const url = `whatsapp://send?text=${message}`;
        openSocialApp(url, 'WhatsApp');
        trackShare('whatsapp');
      }
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: 'send',
      color: '#0088cc',
      action: () => {
        const message = encodeURIComponent(generateShareMessage());
        const url = `tg://msg_url?url=${generateShareUrl(true)}&text=${encodeURIComponent(customMessage || t('social.checkOut', { name: product?.name }))}`;
        openSocialApp(url, 'Telegram');
        trackShare('telegram');
      }
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: 'alternate-email',
      color: '#1DA1F2',
      action: () => {
        const text = encodeURIComponent(customMessage || t('social.checkOut', { name: product?.name }));
        const url = encodeURIComponent(generateShareUrl(true));
        const twitterUrl = `twitter://post?message=${text}&url=${url}`;
        openSocialApp(twitterUrl, 'Twitter');
        trackShare('twitter');
      }
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: 'photo-camera',
      color: '#E4405F',
      action: () => {
        Alert.alert('Instagram', t('social.instagramMessage'), [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('social.copyLink'),
            onPress: () => copyToClipboard(generateShareUrl(true), t('social.productLink'))
          }
        ]);
        trackShare('instagram');
      }
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: 'facebook',
      color: '#1877F2',
      action: () => {
        const url = encodeURIComponent(generateShareUrl(true));
        const fbUrl = `fb://facewebmodal/f?href=${url}`;
        openSocialApp(fbUrl, 'Facebook');
        trackShare('facebook');
      }
    },
    {
      id: 'email',
      name: 'Email',
      icon: 'email',
      color: '#EA4335',
      action: () => {
        const subject = encodeURIComponent(t('social.checkOut', { name: product?.name }));
        const body = encodeURIComponent(generateShareMessage());
        const emailUrl = `mailto:?subject=${subject}&body=${body}`;
        openSocialApp(emailUrl, 'Email');
        trackShare('email');
      }
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{t('social.loadingProduct')}</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text>{t('social.productNotFound')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="close" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('social.shareProduct')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Preview */}
        <View style={styles.productPreview}>
          <Image
            source={{ uri: product.images[0] || 'https://via.placeholder.com/120x120' }}
            style={styles.productImage}
          />
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {product.name}
            </Text>
            <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
            <Text style={styles.sellerName}>{t('social.by')} {product.seller.businessName}</Text>
          </View>
        </View>

        {/* Custom Message */}
        <View style={styles.messageSection}>
          <Text style={styles.sectionTitle}>{t('social.customMessage')}</Text>
          <TextInput
            style={styles.messageInput}
            value={customMessage}
            onChangeText={setCustomMessage}
            placeholder={t('social.customMessagePlaceholder', { seller: product.seller.businessName })}
            multiline={true}
            maxLength={280}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>
            {customMessage.length}/280 {t('reviews.characters')}
          </Text>
        </View>

        {/* Share Links */}
        <View style={styles.linksSection}>
          <Text style={styles.sectionTitle}>{t('social.shareLinks')}</Text>

          <View style={styles.linkItem}>
            <View style={styles.linkInfo}>
              <Text style={styles.linkLabel}>{t('social.productLink')}</Text>
              <Text style={styles.linkUrl} numberOfLines={1}>
                {generateShareUrl(false)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => copyToClipboard(generateShareUrl(false), t('social.productLink'))}
            >
              <MaterialIcons name="content-copy" size={20} color="#8b5cf6" />
            </TouchableOpacity>
          </View>

          <View style={styles.linkItem}>
            <View style={styles.linkInfo}>
              <Text style={styles.linkLabel}>{t('social.affiliateLink')}</Text>
              <Text style={styles.linkUrl} numberOfLines={1}>
                {generateShareUrl(true)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => copyToClipboard(generateShareUrl(true), t('social.affiliateLink'))}
            >
              <MaterialIcons name="content-copy" size={20} color="#8b5cf6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Share Options */}
        <View style={styles.shareSection}>
          <Text style={styles.sectionTitle}>{t('social.shareOn')}</Text>

          <View style={styles.shareGrid}>
            {shareOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.shareOption, { borderColor: option.color }]}
                onPress={option.action}
                activeOpacity={0.7}
              >
                <View style={[styles.shareIcon, { backgroundColor: option.color }]}>
                  <MaterialIcons name={option.icon as any} size={24} color="white" />
                </View>
                <Text style={styles.shareLabel}>{option.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* System Share */}
        <TouchableOpacity style={styles.systemShareButton} onPress={shareViaSystem}>
          <MaterialIcons name="share" size={24} color="white" />
          <Text style={styles.systemShareText}>{t('social.moreSharingOptions')}</Text>
        </TouchableOpacity>

        {/* Affiliate Info */}
        <View style={styles.affiliateInfo}>
          <MaterialIcons name="info-outline" size={20} color="#6b7280" />
          <Text style={styles.affiliateText}>
            {t('social.affiliateInfo')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productPreview: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 12,
    color: '#6b7280',
  },
  messageSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    height: 100,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
  linksSection: {
    marginBottom: 24,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  linkInfo: {
    flex: 1,
  },
  linkLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 2,
  },
  linkUrl: {
    fontSize: 12,
    color: '#374151',
  },
  copyButton: {
    padding: 8,
  },
  shareSection: {
    marginBottom: 24,
  },
  shareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  shareOption: {
    alignItems: 'center',
    width: '30%',
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  shareIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  shareLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  systemShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  systemShareText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  affiliateInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  affiliateText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
});