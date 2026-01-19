import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserNotification, NotificationType } from './user-notification.entity';

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  data?: Record<string, any>;
  imageUrl?: string;
  actionUrl?: string;
}

export interface NotificationSettingsDto {
  orders: boolean;
  promotions: boolean;
  system: boolean;
  live: boolean;
  priceDrops: boolean;
}

@Injectable()
export class UserNotificationsService {
  constructor(
    @InjectRepository(UserNotification)
    private readonly notificationRepository: Repository<UserNotification>,
  ) {}

  /**
   * Create a new notification for a user
   */
  async create(dto: CreateNotificationDto): Promise<UserNotification> {
    const notification = this.notificationRepository.create({
      userId: dto.userId,
      title: dto.title,
      message: dto.message,
      type: dto.type || NotificationType.SYSTEM,
      data: dto.data,
      imageUrl: dto.imageUrl,
      actionUrl: dto.actionUrl,
      isRead: false,
    });

    return this.notificationRepository.save(notification);
  }

  /**
   * Create notifications for multiple users
   */
  async createBulk(
    userIds: string[],
    notification: Omit<CreateNotificationDto, 'userId'>,
  ): Promise<void> {
    const notifications = userIds.map((userId) =>
      this.notificationRepository.create({
        userId,
        title: notification.title,
        message: notification.message,
        type: notification.type || NotificationType.SYSTEM,
        data: notification.data,
        imageUrl: notification.imageUrl,
        actionUrl: notification.actionUrl,
        isRead: false,
      }),
    );

    await this.notificationRepository.save(notifications);
  }

  /**
   * Get all notifications for a user
   */
  async findByUser(
    userId: string,
    options?: {
      unreadOnly?: boolean;
      type?: NotificationType;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ notifications: UserNotification[]; total: number; unreadCount: number }> {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC');

    if (options?.unreadOnly) {
      queryBuilder.andWhere('notification.isRead = :isRead', { isRead: false });
    }

    if (options?.type) {
      queryBuilder.andWhere('notification.type = :type', { type: options.type });
    }

    const total = await queryBuilder.getCount();

    if (options?.limit) {
      queryBuilder.take(options.limit);
    }

    if (options?.offset) {
      queryBuilder.skip(options.offset);
    }

    const notifications = await queryBuilder.getMany();

    // Get unread count
    const unreadCount = await this.notificationRepository.count({
      where: { userId, isRead: false },
    });

    return { notifications, total, unreadCount };
  }

  /**
   * Get a single notification
   */
  async findOne(id: string, userId: string): Promise<UserNotification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string, userId: string): Promise<UserNotification> {
    const notification = await this.findOne(id, userId);

    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  /**
   * Delete a notification
   */
  async delete(id: string, userId: string): Promise<void> {
    const notification = await this.findOne(id, userId);
    await this.notificationRepository.remove(notification);
  }

  /**
   * Delete multiple notifications
   */
  async deleteMultiple(ids: string[], userId: string): Promise<void> {
    await this.notificationRepository.delete({
      id: In(ids),
      userId,
    });
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Create order notification
   */
  async createOrderNotification(
    userId: string,
    orderId: string,
    status: string,
    message: string,
  ): Promise<UserNotification> {
    const titles: Record<string, string> = {
      confirmed: 'Order Confirmed',
      processing: 'Order Processing',
      shipped: 'Order Shipped',
      delivered: 'Order Delivered',
      cancelled: 'Order Cancelled',
    };

    return this.create({
      userId,
      title: titles[status] || 'Order Update',
      message,
      type: NotificationType.ORDER,
      data: { orderId, status },
      actionUrl: `/orders/${orderId}`,
    });
  }

  /**
   * Create promotion notification
   */
  async createPromotionNotification(
    userId: string,
    title: string,
    message: string,
    promoData?: Record<string, any>,
  ): Promise<UserNotification> {
    return this.create({
      userId,
      title,
      message,
      type: NotificationType.PROMOTION,
      data: promoData,
    });
  }

  /**
   * Create live stream notification
   */
  async createLiveNotification(
    userId: string,
    sellerName: string,
    streamId: string,
    streamTitle: string,
    thumbnailUrl?: string,
  ): Promise<UserNotification> {
    return this.create({
      userId,
      title: `${sellerName} is now live!`,
      message: streamTitle,
      type: NotificationType.LIVE,
      data: { streamId, sellerName },
      imageUrl: thumbnailUrl,
      actionUrl: `/live/${streamId}`,
    });
  }

  /**
   * Create price drop notification
   */
  async createPriceDropNotification(
    userId: string,
    productId: string,
    productName: string,
    oldPrice: number,
    newPrice: number,
    imageUrl?: string,
  ): Promise<UserNotification> {
    const discount = Math.round(((oldPrice - newPrice) / oldPrice) * 100);

    return this.create({
      userId,
      title: 'Price Drop Alert!',
      message: `${productName} is now ${discount}% off!`,
      type: NotificationType.PRICE_DROP,
      data: { productId, oldPrice, newPrice, discount },
      imageUrl,
      actionUrl: `/products/${productId}`,
    });
  }
}
