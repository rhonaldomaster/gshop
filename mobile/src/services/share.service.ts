/**
 * Share Service
 *
 * Handles social sharing and dynamic link generation for products, live streams, and affiliate links.
 */

import Share, { ShareOptions, Social } from 'react-native-share';
import { Platform } from 'react-native';
import analyticsService from './analytics.service';
import {
  buildProductLink,
  buildLiveStreamLink,
  buildAffiliateLink,
  buildOrderLink,
} from './deeplink.service';

/**
 * Share platforms
 */
export enum SharePlatform {
  WHATSAPP = 'whatsapp',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  INSTAGRAM = 'instagram',
  TELEGRAM = 'telegram',
  EMAIL = 'email',
  SMS = 'sms',
  GENERIC = 'generic',
}

/**
 * Share content types
 */
export enum ShareContentType {
  PRODUCT = 'product',
  LIVE_STREAM = 'live_stream',
  AFFILIATE_LINK = 'affiliate_link',
  ORDER = 'order',
  PROFILE = 'profile',
}

/**
 * Share result interface
 */
export interface ShareResult {
  success: boolean;
  platform?: string;
  activityType?: string;
}

/**
 * Product share data
 */
export interface ProductShareData {
  id: string;
  name: string;
  price: number;
  currency?: string;
  imageUrl?: string;
  description?: string;
}

/**
 * Live stream share data
 */
export interface LiveStreamShareData {
  id: string;
  title: string;
  hostName: string;
  thumbnailUrl?: string;
}

/**
 * Affiliate share data
 */
export interface AffiliateShareData {
  code: string;
  productId?: string;
  productName?: string;
  customMessage?: string;
}

/**
 * Share Service Class
 */
class ShareService {
  /**
   * Share product
   */
  async shareProduct(
    data: ProductShareData,
    platform: SharePlatform = SharePlatform.GENERIC
  ): Promise<ShareResult> {
    const url = buildProductLink(data.id);

    const message = this.formatProductMessage(data);

    const shareOptions: ShareOptions = {
      title: data.name,
      message: Platform.OS === 'ios' ? message : `${message}\n${url}`,
      url: Platform.OS === 'ios' ? url : undefined,
    };

    return await this.share(shareOptions, platform, ShareContentType.PRODUCT, data.id);
  }

  /**
   * Share live stream
   */
  async shareLiveStream(
    data: LiveStreamShareData,
    platform: SharePlatform = SharePlatform.GENERIC
  ): Promise<ShareResult> {
    const url = buildLiveStreamLink(data.id);

    const message = this.formatLiveStreamMessage(data);

    const shareOptions: ShareOptions = {
      title: data.title,
      message: Platform.OS === 'ios' ? message : `${message}\n${url}`,
      url: Platform.OS === 'ios' ? url : undefined,
    };

    return await this.share(shareOptions, platform, ShareContentType.LIVE_STREAM, data.id);
  }

  /**
   * Share affiliate link
   */
  async shareAffiliateLink(
    data: AffiliateShareData,
    platform: SharePlatform = SharePlatform.GENERIC
  ): Promise<ShareResult> {
    const url = buildAffiliateLink(data.code);

    const message = data.customMessage || this.formatAffiliateMessage(data);

    const shareOptions: ShareOptions = {
      title: data.productName || 'Check out GSHOP!',
      message: Platform.OS === 'ios' ? message : `${message}\n${url}`,
      url: Platform.OS === 'ios' ? url : undefined,
    };

    return await this.share(shareOptions, platform, ShareContentType.AFFILIATE_LINK, data.code);
  }

  /**
   * Share order confirmation
   */
  async shareOrderConfirmation(
    orderId: string,
    orderTotal: number,
    platform: SharePlatform = SharePlatform.GENERIC
  ): Promise<ShareResult> {
    const url = buildOrderLink(orderId);

    const message = `🎉 Just made a purchase on GSHOP! Order #${orderId}`;

    const shareOptions: ShareOptions = {
      title: 'GSHOP Order',
      message: Platform.OS === 'ios' ? message : `${message}\n${url}`,
      url: Platform.OS === 'ios' ? url : undefined,
    };

    return await this.share(shareOptions, platform, ShareContentType.ORDER, orderId);
  }

  /**
   * Generic share function
   */
  private async share(
    options: ShareOptions,
    platform: SharePlatform,
    contentType: ShareContentType,
    contentId: string
  ): Promise<ShareResult> {
    try {
      let result;

      // Platform-specific sharing
      switch (platform) {
        case SharePlatform.WHATSAPP:
          result = await Share.shareSingle({
            ...options,
            social: Social.Whatsapp,
          });
          break;

        case SharePlatform.FACEBOOK:
          result = await Share.shareSingle({
            ...options,
            social: Social.Facebook,
          });
          break;

        case SharePlatform.TWITTER:
          result = await Share.shareSingle({
            ...options,
            social: Social.Twitter,
          });
          break;

        case SharePlatform.INSTAGRAM:
          result = await Share.shareSingle({
            ...options,
            social: Social.Instagram,
          });
          break;

        case SharePlatform.TELEGRAM:
          result = await Share.shareSingle({
            ...options,
            social: Social.Telegram,
          });
          break;

        case SharePlatform.EMAIL:
          result = await Share.shareSingle({
            ...options,
            social: Social.Email,
          });
          break;

        case SharePlatform.SMS:
          result = await Share.shareSingle({
            ...options,
            social: Social.Sms,
          });
          break;

        case SharePlatform.GENERIC:
        default:
          result = await Share.open(options);
          break;
      }

      // Track successful share
      await analyticsService.track('share' as any, {
        platform,
        contentType,
        contentId,
        success: true,
      });

      return {
        success: true,
        platform: result.app || platform,
        activityType: result.activityType,
      };
    } catch (error: any) {
      // User cancelled or error occurred
      console.log('[Share] Share cancelled or failed:', error);

      // Track failed share
      await analyticsService.track('share' as any, {
        platform,
        contentType,
        contentId,
        success: false,
        error: error.message,
      });

      return {
        success: false,
      };
    }
  }

  /**
   * Format product share message
   */
  private formatProductMessage(data: ProductShareData): string {
    const price = data.currency
      ? `${data.currency} ${data.price.toFixed(2)}`
      : `$${data.price.toFixed(2)}`;

    return `🛍️ Check out ${data.name} on GSHOP!\n\n💰 Only ${price}\n\n`;
  }

  /**
   * Format live stream share message
   */
  private formatLiveStreamMessage(data: LiveStreamShareData): string {
    return `🎥 ${data.hostName} is LIVE on GSHOP!\n\n${data.title}\n\nJoin now! `;
  }

  /**
   * Format affiliate share message
   */
  private formatAffiliateMessage(data: AffiliateShareData): string {
    if (data.productName) {
      return `💎 Found this amazing product: ${data.productName}\n\nShop on GSHOP with my link! `;
    }
    return `🛍️ Shop on GSHOP with my special link and get great deals! `;
  }

  /**
   * Check if sharing is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      return await Share.isPackageInstalled('generic');
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if specific platform is available
   */
  async isPlatformAvailable(platform: SharePlatform): Promise<boolean> {
    try {
      let packageName: string;

      switch (platform) {
        case SharePlatform.WHATSAPP:
          packageName = Social.Whatsapp;
          break;
        case SharePlatform.FACEBOOK:
          packageName = Social.Facebook;
          break;
        case SharePlatform.TWITTER:
          packageName = Social.Twitter;
          break;
        case SharePlatform.INSTAGRAM:
          packageName = Social.Instagram;
          break;
        case SharePlatform.TELEGRAM:
          packageName = Social.Telegram;
          break;
        default:
          return true; // Generic sharing always available
      }

      return await Share.isPackageInstalled(packageName);
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const shareService = new ShareService();
export default shareService;