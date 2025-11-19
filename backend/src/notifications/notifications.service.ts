import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { DeviceToken } from './device-token.entity';

// FCM notification payload interface
export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private fcmEnabled = false;
  private admin: any = null;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(DeviceToken)
    private readonly deviceTokenRepository: Repository<DeviceToken>,
  ) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      // Check if firebase-admin is available and configured
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

      if (!serviceAccountPath) {
        this.logger.warn('Firebase service account not configured - push notifications disabled');
        this.fcmEnabled = false;
        return;
      }

      // Dynamic import to avoid errors if firebase-admin is not installed
      const admin = require('firebase-admin');

      if (!admin.apps.length) {
        const serviceAccount = require(serviceAccountPath);

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });

        this.admin = admin;
        this.fcmEnabled = true;
        this.logger.log('Firebase Cloud Messaging initialized successfully');
      }
    } catch (error) {
      this.logger.warn(`Firebase initialization failed: ${error.message} - push notifications disabled`);
      this.fcmEnabled = false;
    }
  }

  /**
   * Send notification to a single device token
   */
  async sendToDevice(
    token: string,
    payload: NotificationPayload,
  ): Promise<boolean> {
    if (!this.fcmEnabled) {
      this.logger.warn('FCM not enabled - skipping notification send');
      return false;
    }

    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
        },
        data: payload.data || {},
        token,
      };

      const response = await this.admin.messaging().send(message);
      this.logger.log(`Notification sent successfully: ${response}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
      return false;
    }
  }

  /**
   * Send notification to multiple device tokens
   */
  async sendToMultipleDevices(
    tokens: string[],
    payload: NotificationPayload,
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!this.fcmEnabled) {
      this.logger.warn('FCM not enabled - skipping notification send');
      return { successCount: 0, failureCount: tokens.length };
    }

    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
        },
        data: payload.data || {},
        tokens,
      };

      const response = await this.admin.messaging().sendMulticast(message);

      this.logger.log(
        `Notifications sent: ${response.successCount} success, ${response.failureCount} failures`,
      );

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      this.logger.error(`Failed to send batch notifications: ${error.message}`);
      return { successCount: 0, failureCount: tokens.length };
    }
  }

  /**
   * Send notification when seller starts a live stream
   */
  async notifyLiveStreamStarted(
    sellerId: string,
    streamTitle: string,
    streamId: string,
    thumbnailUrl?: string,
  ): Promise<void> {
    try {
      // Get seller info
      const seller = await this.userRepository.findOne({
        where: { id: sellerId },
      });

      if (!seller) {
        this.logger.error(`Seller not found: ${sellerId}`);
        return;
      }

      // TODO: Get followers' device tokens from database
      // For now, we'll use a mock implementation
      const followerTokens = await this.getFollowerTokens(sellerId);

      if (followerTokens.length === 0) {
        this.logger.log('No followers to notify');
        return;
      }

      const payload: NotificationPayload = {
        title: `${seller.name || 'Seller'} is now live! 🔴`,
        body: streamTitle,
        data: {
          type: 'live_stream_started',
          streamId,
          sellerId,
        },
        imageUrl: thumbnailUrl,
      };

      await this.sendToMultipleDevices(followerTokens, payload);
    } catch (error) {
      this.logger.error(`Failed to notify live stream started: ${error.message}`);
    }
  }

  /**
   * Send notification when a purchase is made during live stream
   */
  async notifyPurchaseMade(
    sellerId: string,
    buyerName: string,
    productName: string,
    amount: number,
    orderId: string,
  ): Promise<void> {
    try {
      // Get seller's device tokens
      const sellerTokens = await this.getUserTokens(sellerId);

      if (sellerTokens.length === 0) {
        this.logger.log('No device tokens for seller');
        return;
      }

      const payload: NotificationPayload = {
        title: '🎉 New Purchase!',
        body: `${buyerName} bought ${productName} for $${amount.toFixed(2)}`,
        data: {
          type: 'purchase_made',
          orderId,
          sellerId,
          amount: amount.toString(),
        },
      };

      await this.sendToMultipleDevices(sellerTokens, payload);
    } catch (error) {
      this.logger.error(`Failed to notify purchase made: ${error.message}`);
    }
  }

  /**
   * Send notification reminder for scheduled stream (15 min before)
   */
  async notifyScheduledStreamReminder(
    streamId: string,
    streamTitle: string,
    sellerId: string,
    thumbnailUrl?: string,
  ): Promise<void> {
    try {
      const followerTokens = await this.getFollowerTokens(sellerId);

      if (followerTokens.length === 0) {
        this.logger.log('No followers to notify for reminder');
        return;
      }

      const seller = await this.userRepository.findOne({
        where: { id: sellerId },
      });

      const payload: NotificationPayload = {
        title: `📅 Reminder: ${seller?.name || 'Seller'} goes live in 15 minutes!`,
        body: streamTitle,
        data: {
          type: 'scheduled_stream_reminder',
          streamId,
          sellerId,
        },
        imageUrl: thumbnailUrl,
      };

      await this.sendToMultipleDevices(followerTokens, payload);
    } catch (error) {
      this.logger.error(`Failed to send scheduled stream reminder: ${error.message}`);
    }
  }

  /**
   * Register a device token for push notifications
   */
  async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android' | 'web',
  ): Promise<void> {
    try {
      // Check if token already exists
      const existingToken = await this.deviceTokenRepository.findOne({
        where: { token },
      });

      if (existingToken) {
        // Update existing token
        existingToken.userId = userId;
        existingToken.platform = platform;
        existingToken.isActive = true;
        await this.deviceTokenRepository.save(existingToken);
        this.logger.log(`Device token updated: userId=${userId}, platform=${platform}`);
      } else {
        // Create new token
        const newToken = this.deviceTokenRepository.create({
          userId,
          token,
          platform,
          isActive: true,
        });
        await this.deviceTokenRepository.save(newToken);
        this.logger.log(`Device token registered: userId=${userId}, platform=${platform}`);
      }
    } catch (error) {
      this.logger.error(`Failed to register device token: ${error.message}`);
    }
  }

  /**
   * Remove a device token (e.g., when user logs out)
   */
  async removeDeviceToken(token: string): Promise<void> {
    try {
      await this.deviceTokenRepository.update(
        { token },
        { isActive: false },
      );
      this.logger.log(`Device token deactivated: ${token.substring(0, 10)}...`);
    } catch (error) {
      this.logger.error(`Failed to remove device token: ${error.message}`);
    }
  }

  /**
   * Get all device tokens for a user
   */
  private async getUserTokens(userId: string): Promise<string[]> {
    try {
      const tokens = await this.deviceTokenRepository.find({
        where: { userId, isActive: true },
      });
      return tokens.map((t) => t.token);
    } catch (error) {
      this.logger.error(`Failed to get user tokens: ${error.message}`);
      return [];
    }
  }

  /**
   * Get all device tokens for followers of a seller
   * Note: Requires a followers/following system to be implemented
   */
  private async getFollowerTokens(sellerId: string): Promise<string[]> {
    try {
      // TODO: This requires a followers table/system
      // For now, return empty array
      // When followers system is implemented, uncomment and modify:
      // const followers = await this.followersRepository.find({ where: { followingId: sellerId } });
      // const followerIds = followers.map(f => f.followerId);
      // const tokens = await this.deviceTokenRepository.find({ where: { userId: In(followerIds), isActive: true } });
      // return tokens.map(t => t.token);
      return [];
    } catch (error) {
      this.logger.error(`Failed to get follower tokens: ${error.message}`);
      return [];
    }
  }

  /**
   * Check if FCM is enabled
   */
  isFcmEnabled(): boolean {
    return this.fcmEnabled;
  }
}
