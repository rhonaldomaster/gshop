import { Injectable, NotFoundException, BadRequestException, Inject, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, MoreThan, In } from 'typeorm';
import { LiveStream, LiveStreamProduct, LiveStreamMessage, LiveStreamViewer, StreamStatus, HostType, LiveStreamReaction, ReactionType } from './live.entity';
import { CreateLiveStreamDto, CreateAffiliateLiveStreamDto, UpdateLiveStreamDto, AddProductToStreamDto, SendMessageDto, LiveDashboardStatsDto, LiveStreamAnalyticsDto, NativeStreamCredentialsDto, OBSSetupInfoDto } from './dto';
import { Affiliate, AffiliateStatus } from '../affiliates/entities/affiliate.entity';
import { Order } from '../database/entities/order.entity';
import { StreamerFollow } from '../database/entities/streamer-follow.entity';
import { IIvsService } from './interfaces/ivs-service.interface';
import { IVS_SERVICE } from './live.constants';
import { v4 as uuidv4 } from 'uuid';
import { CacheMockService } from '../common/cache/cache-mock.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserNotificationsService } from '../notifications/user-notifications.service';

@Injectable()
export class LiveService {
  private liveGateway: any; // Will be set via setGateway method

  constructor(
    @InjectRepository(LiveStream)
    private liveStreamRepository: Repository<LiveStream>,
    @InjectRepository(LiveStreamProduct)
    private streamProductRepository: Repository<LiveStreamProduct>,
    @InjectRepository(LiveStreamMessage)
    private streamMessageRepository: Repository<LiveStreamMessage>,
    @InjectRepository(LiveStreamViewer)
    private streamViewerRepository: Repository<LiveStreamViewer>,
    @InjectRepository(LiveStreamReaction)
    private streamReactionRepository: Repository<LiveStreamReaction>,
    @InjectRepository(Affiliate)
    private affiliateRepository: Repository<Affiliate>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(StreamerFollow)
    private streamerFollowRepository: Repository<StreamerFollow>,
    @Inject(IVS_SERVICE)
    private ivsService: IIvsService,
    private cacheService: CacheMockService,
    private notificationsService: NotificationsService,
    private userNotificationsService: UserNotificationsService,
  ) {}

  // Method to set gateway reference (called from gateway's onModuleInit)
  setGateway(gateway: any) {
    this.liveGateway = gateway;
  }

  async createLiveStream(hostId: string, createLiveStreamDto: CreateLiveStreamDto, hostType: HostType = HostType.SELLER): Promise<LiveStream> {
    // Validate affiliate exists if creating affiliate stream
    if (hostType === HostType.AFFILIATE) {
      const affiliate = await this.affiliateRepository.findOne({
        where: { id: hostId, status: AffiliateStatus.APPROVED, isActive: true }
      });
      if (!affiliate) {
        throw new BadRequestException('Affiliate not found or not approved');
      }
    }

    // Try to reuse an existing IVS channel from ended streams first
    let ivsChannel = await this.tryReuseExistingChannel(hostId, hostType);

    // If no reusable channel found, try to create a new one
    if (!ivsChannel) {
      try {
        const channelName = `${hostType}-${hostId}-${Date.now()}`;
        ivsChannel = await this.ivsService.createChannel(channelName);
      } catch (error) {
        // If quota exceeded, try harder to find a reusable channel
        if (error.message?.includes('quota') || error.Code === 'ServiceQuotaExceededException') {
          console.log('[Live Service] AWS IVS quota exceeded, attempting to reuse any available channel...');
          ivsChannel = await this.tryReuseAnyAvailableChannel();

          if (!ivsChannel) {
            throw new BadRequestException(
              'AWS IVS stream quota exceeded and no reusable channels available. ' +
              'Please delete some old streams or contact support to increase your quota.'
            );
          }
        } else {
          throw error;
        }
      }
    }

    // Generate thumbnail URL
    const thumbnailUrl = this.ivsService.getThumbnailUrl(ivsChannel.channel.arn);

    // Create live stream entity
    const liveStream = this.liveStreamRepository.create({
      ...createLiveStreamDto,
      hostType,
      sellerId: hostType === HostType.SELLER ? hostId : null,
      affiliateId: hostType === HostType.AFFILIATE ? hostId : null,
      streamKey: ivsChannel.streamKey.value,
      rtmpUrl: ivsChannel.channel.ingestEndpoint,
      hlsUrl: ivsChannel.channel.playbackUrl,
      ivsChannelArn: ivsChannel.channel.arn,
      thumbnailUrl,
    });

    const savedStream = await this.liveStreamRepository.save(liveStream);

    console.log(`[Live Service] Created stream ${savedStream.id} with IVS channel ${ivsChannel.channel.arn}`);

    return savedStream;
  }

  /**
   * Try to reuse an IVS channel from ended/cancelled/old scheduled streams belonging to the same host
   */
  private async tryReuseExistingChannel(hostId: string, hostType: HostType): Promise<any> {
    // First try ended/cancelled streams
    const whereConditionEnded = hostType === HostType.SELLER
      ? { sellerId: hostId, status: In([StreamStatus.ENDED, StreamStatus.CANCELLED]) }
      : { affiliateId: hostId, status: In([StreamStatus.ENDED, StreamStatus.CANCELLED]) };

    let reusableStream = await this.liveStreamRepository.findOne({
      where: {
        ...whereConditionEnded,
        ivsChannelArn: Not(IsNull()),
        streamKey: Not(IsNull()),
      },
      order: { updatedAt: 'DESC' },
    });

    // If no ended stream, try old scheduled streams (older than 24 hours)
    if (!reusableStream) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const whereConditionScheduled = hostType === HostType.SELLER
        ? { sellerId: hostId, status: StreamStatus.SCHEDULED }
        : { affiliateId: hostId, status: StreamStatus.SCHEDULED };

      reusableStream = await this.liveStreamRepository
        .createQueryBuilder('stream')
        .where(whereConditionScheduled)
        .andWhere('stream."ivsChannelArn" IS NOT NULL')
        .andWhere('stream."streamKey" IS NOT NULL')
        .andWhere('stream."createdAt" < :oneDayAgo', { oneDayAgo })
        .orderBy('stream."createdAt"', 'ASC')
        .getOne();
    }

    if (!reusableStream) {
      return null;
    }

    console.log(`[Live Service] Reusing IVS channel from stream ${reusableStream.id} (status: ${reusableStream.status})`);

    // Clear the old stream's IVS credentials so it can't be reused again
    await this.liveStreamRepository.update(reusableStream.id, {
      ivsChannelArn: null,
      streamKey: null,
      rtmpUrl: null,
      hlsUrl: null,
      status: StreamStatus.CANCELLED, // Mark as cancelled if it was scheduled
    });

    return {
      channel: {
        arn: reusableStream.ivsChannelArn,
        ingestEndpoint: reusableStream.rtmpUrl,
        playbackUrl: reusableStream.hlsUrl,
      },
      streamKey: {
        value: reusableStream.streamKey,
      },
    };
  }

  /**
   * Try to reuse any available IVS channel from ended/cancelled/old scheduled streams (fallback when quota exceeded)
   */
  private async tryReuseAnyAvailableChannel(): Promise<any> {
    // First try ended/cancelled streams from database
    let reusableStream = await this.liveStreamRepository.findOne({
      where: {
        status: In([StreamStatus.ENDED, StreamStatus.CANCELLED]),
        ivsChannelArn: Not(IsNull()),
        streamKey: Not(IsNull()),
      },
      order: { updatedAt: 'DESC' },
    });

    // If no ended stream, try old scheduled streams (older than 1 hour for emergency fallback)
    if (!reusableStream) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      reusableStream = await this.liveStreamRepository
        .createQueryBuilder('stream')
        .where('stream.status = :status', { status: StreamStatus.SCHEDULED })
        .andWhere('stream."ivsChannelArn" IS NOT NULL')
        .andWhere('stream."streamKey" IS NOT NULL')
        .andWhere('stream."createdAt" < :oneHourAgo', { oneHourAgo })
        .orderBy('stream."createdAt"', 'ASC')
        .getOne();
    }

    if (reusableStream) {
      console.log(`[Live Service] Emergency reuse of IVS channel from stream ${reusableStream.id} (status: ${reusableStream.status})`);

      // Clear the old stream's IVS credentials
      await this.liveStreamRepository.update(reusableStream.id, {
        ivsChannelArn: null,
        streamKey: null,
        rtmpUrl: null,
        hlsUrl: null,
        status: StreamStatus.CANCELLED,
      });

      return {
        channel: {
          arn: reusableStream.ivsChannelArn,
          ingestEndpoint: reusableStream.rtmpUrl,
          playbackUrl: reusableStream.hlsUrl,
        },
        streamKey: {
          value: reusableStream.streamKey,
        },
      };
    }

    // If no reusable stream in database, try to get existing channels directly from AWS IVS
    console.log('[Live Service] No reusable streams in database, checking AWS IVS for existing channels...');
    return this.tryReuseChannelFromAws();
  }

  /**
   * Try to reuse an existing channel directly from AWS IVS
   * This is called when database has no valid channels but AWS might have existing ones
   */
  private async tryReuseChannelFromAws(): Promise<any> {
    try {
      // List existing channels from AWS
      const existingChannels = await this.ivsService.listChannels();

      if (existingChannels.length === 0) {
        console.log('[Live Service] No existing channels found in AWS IVS');
        return null;
      }

      console.log(`[Live Service] Found ${existingChannels.length} existing channels in AWS IVS`);

      // Try to get credentials for the first available channel
      for (const channel of existingChannels) {
        try {
          const channelWithKey = await this.ivsService.getExistingChannelWithKey(channel.arn);

          if (channelWithKey && channelWithKey.streamKey) {
            console.log(`[Live Service] Successfully retrieved credentials for AWS channel: ${channel.arn}`);
            return channelWithKey;
          }
        } catch (error) {
          console.warn(`[Live Service] Failed to get credentials for channel ${channel.arn}: ${error.message}`);
          continue;
        }
      }

      console.log('[Live Service] Could not retrieve credentials for any existing AWS channel');
      return null;
    } catch (error) {
      console.error('[Live Service] Error listing AWS IVS channels:', error.message);
      return null;
    }
  }

  async createAffiliateLiveStream(affiliateId: string, dto: CreateAffiliateLiveStreamDto): Promise<LiveStream> {
    // Validate affiliate exists and is approved
    const affiliate = await this.affiliateRepository.findOne({
      where: { id: affiliateId, status: AffiliateStatus.APPROVED, isActive: true }
    });
    if (!affiliate) {
      throw new BadRequestException('Affiliate not found or not approved');
    }

    // Try to reuse an existing IVS channel from ended streams first
    let ivsChannel = await this.tryReuseExistingChannel(affiliateId, HostType.AFFILIATE);

    // If no reusable channel found, try to create a new one
    if (!ivsChannel) {
      try {
        const channelName = `affiliate-${affiliateId}-${Date.now()}`;
        ivsChannel = await this.ivsService.createChannel(channelName);
      } catch (error) {
        // If quota exceeded, try harder to find a reusable channel
        if (error.message?.includes('quota') || error.Code === 'ServiceQuotaExceededException') {
          console.log('[Live Service] AWS IVS quota exceeded, attempting to reuse any available channel...');
          ivsChannel = await this.tryReuseAnyAvailableChannel();

          if (!ivsChannel) {
            throw new BadRequestException(
              'AWS IVS stream quota exceeded and no reusable channels available. ' +
              'Please delete some old streams or contact support to increase your quota.'
            );
          }
        } else {
          throw error;
        }
      }
    }

    // Generate thumbnail URL
    const thumbnailUrl = this.ivsService.getThumbnailUrl(ivsChannel.channel.arn);

    // Create live stream entity with both affiliateId and sellerId
    const liveStream = this.liveStreamRepository.create({
      title: dto.title,
      description: dto.description,
      scheduledAt: dto.scheduledAt,
      hostType: HostType.AFFILIATE,
      sellerId: dto.sellerId,
      affiliateId: affiliateId,
      streamKey: ivsChannel.streamKey.value,
      rtmpUrl: ivsChannel.channel.ingestEndpoint,
      hlsUrl: ivsChannel.channel.playbackUrl,
      ivsChannelArn: ivsChannel.channel.arn,
      thumbnailUrl,
    });

    const savedStream = await this.liveStreamRepository.save(liveStream);

    console.log(`[Live Service] Created affiliate stream ${savedStream.id} for seller ${dto.sellerId}`);

    return savedStream;
  }

  async findLiveStreamsBySeller(sellerId: string): Promise<LiveStream[]> {
    return this.liveStreamRepository.find({
      where: { sellerId, hostType: HostType.SELLER },
      relations: ['products', 'products.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findLiveStreamsByAffiliate(affiliateId: string): Promise<LiveStream[]> {
    return this.liveStreamRepository.find({
      where: { affiliateId, hostType: HostType.AFFILIATE },
      relations: ['products', 'products.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveLiveStreams(): Promise<LiveStream[]> {
    return this.liveStreamRepository.find({
      where: { status: StreamStatus.LIVE },
      relations: ['seller', 'affiliate', 'products', 'products.product'],
      order: { viewerCount: 'DESC' },
    });
  }

  async findLiveStreamById(id: string): Promise<LiveStream> {
    const liveStream = await this.liveStreamRepository.findOne({
      where: { id },
      relations: ['seller', 'affiliate', 'products', 'products.product', 'messages', 'messages.user'],
    });

    if (!liveStream) {
      throw new NotFoundException('Live stream not found');
    }

    return liveStream;
  }

  async updateLiveStream(id: string, hostId: string, updateLiveStreamDto: UpdateLiveStreamDto, hostType: HostType = HostType.SELLER): Promise<LiveStream> {
    const whereCondition = hostType === HostType.SELLER
      ? { id, sellerId: hostId }
      : { id, affiliateId: hostId };

    const liveStream = await this.liveStreamRepository.findOne({
      where: whereCondition,
    });

    if (!liveStream) {
      throw new NotFoundException('Live stream not found');
    }

    Object.assign(liveStream, updateLiveStreamDto);
    return this.liveStreamRepository.save(liveStream);
  }

  async deleteLiveStream(id: string, hostId: string, hostType: HostType = HostType.SELLER): Promise<void> {
    const whereCondition = hostType === HostType.SELLER
      ? { id, sellerId: hostId }
      : { id, affiliateId: hostId };

    const liveStream = await this.liveStreamRepository.findOne({
      where: whereCondition,
    });

    if (!liveStream) {
      throw new NotFoundException('Live stream not found');
    }

    if (liveStream.status === StreamStatus.LIVE) {
      throw new BadRequestException('Cannot delete a live stream that is currently broadcasting');
    }

    await this.liveStreamRepository.remove(liveStream);
  }

  async startLiveStream(id: string, hostId: string, hostType: HostType = HostType.SELLER): Promise<LiveStream> {
    const whereCondition = hostType === HostType.SELLER
      ? { id, sellerId: hostId }
      : { id, affiliateId: hostId };

    const liveStream = await this.liveStreamRepository.findOne({
      where: whereCondition,
    });

    if (!liveStream) {
      throw new NotFoundException('Live stream not found');
    }

    if (liveStream.status === StreamStatus.LIVE) {
      throw new BadRequestException('Stream is already live');
    }

    liveStream.status = StreamStatus.LIVE;
    liveStream.startedAt = new Date();

    const savedStream = await this.liveStreamRepository.save(liveStream);

    console.log(`[Live Service] Stream ${savedStream.id} started`);

    // Send notifications to followers
    const streamerId = savedStream.sellerId || savedStream.affiliateId;
    if (streamerId) {
      this.sendLiveStartNotifications(streamerId, savedStream).catch((error) => {
        console.error(`[Live Service] Failed to send notifications: ${error.message}`);
      });
    }

    return savedStream;
  }

  /**
   * Send both push and in-app notifications when a stream starts
   */
  private async sendLiveStartNotifications(streamerId: string, stream: LiveStream): Promise<void> {
    try {
      // Send push notification
      await this.notificationsService.notifyLiveStreamStarted(
        streamerId,
        stream.title,
        stream.id,
        stream.thumbnailUrl,
      );

      // Get followers with notifications enabled
      const followers = await this.streamerFollowRepository.find({
        where: { streamerId, notificationsEnabled: true },
        select: ['followerId'],
      });

      if (followers.length === 0) {
        console.log(`[Live Service] No followers to notify for streamer ${streamerId}`);
        return;
      }

      // Create in-app notifications for all followers
      const followerIds = followers.map((f) => f.followerId);
      await this.userNotificationsService.createLiveNotificationForUsers(
        followerIds,
        stream.title,
        stream.id,
        stream.thumbnailUrl,
      );

      console.log(`[Live Service] Sent notifications to ${followerIds.length} followers`);
    } catch (error) {
      console.error(`[Live Service] Error sending live notifications: ${error.message}`);
    }
  }

  async endLiveStream(id: string, hostId: string, hostType: HostType = HostType.SELLER): Promise<LiveStream> {
    const whereCondition = hostType === HostType.SELLER
      ? { id, sellerId: hostId }
      : { id, affiliateId: hostId };

    const liveStream = await this.liveStreamRepository.findOne({
      where: whereCondition,
    });

    if (!liveStream) {
      throw new NotFoundException('Live stream not found');
    }

    if (liveStream.status !== StreamStatus.LIVE) {
      throw new BadRequestException('Stream is not live');
    }

    liveStream.status = StreamStatus.ENDED;
    liveStream.endedAt = new Date();

    const savedStream = await this.liveStreamRepository.save(liveStream);

    console.log(`[Live Service] Stream ${savedStream.id} ended`);

    // Calculate final stats and notify admin dashboard
    if (this.liveGateway) {
      try {
        const stats = await this.getStreamStats(id, hostId);
        const duration = liveStream.startedAt && liveStream.endedAt
          ? Math.floor((liveStream.endedAt.getTime() - liveStream.startedAt.getTime()) / 1000 / 60)
          : 0;

        await this.liveGateway.notifyStreamEnded(id, {
          streamId: id,
          streamTitle: liveStream.title,
          totalViewers: stats.totalViewers,
          peakViewers: stats.peakViewers,
          totalSales: stats.totalSales,
          ordersCount: stats.totalOrders,
          duration,
          endedAt: liveStream.endedAt,
        });

        // Also broadcast updated dashboard stats
        const dashboardStats = await this.getDashboardStats();
        await this.liveGateway.broadcastDashboardStatsUpdate(dashboardStats);
      } catch (error) {
        console.error('Failed to send stream ended notification:', error);
      }
    }

    return savedStream;
  }

  async addProductToStream(streamId: string, sellerId: string, addProductDto: AddProductToStreamDto): Promise<LiveStreamProduct> {
    const liveStream = await this.liveStreamRepository.findOne({
      where: { id: streamId, sellerId },
    });

    if (!liveStream) {
      throw new NotFoundException('Live stream not found');
    }

    const streamProduct = this.streamProductRepository.create({
      streamId,
      ...addProductDto,
    });

    return this.streamProductRepository.save(streamProduct);
  }

  async removeProductFromStream(streamId: string, productId: string, sellerId: string): Promise<void> {
    const liveStream = await this.liveStreamRepository.findOne({
      where: { id: streamId, sellerId },
    });

    if (!liveStream) {
      throw new NotFoundException('Live stream not found');
    }

    await this.streamProductRepository.delete({
      streamId,
      productId,
    });
  }

  async updateStreamProduct(streamId: string, productId: string, sellerId: string, updates: Partial<LiveStreamProduct>): Promise<LiveStreamProduct> {
    const liveStream = await this.liveStreamRepository.findOne({
      where: { id: streamId, sellerId },
    });

    if (!liveStream) {
      throw new NotFoundException('Live stream not found');
    }

    const streamProduct = await this.streamProductRepository.findOne({
      where: { streamId, productId },
    });

    if (!streamProduct) {
      throw new NotFoundException('Product not found in stream');
    }

    Object.assign(streamProduct, updates);
    return this.streamProductRepository.save(streamProduct);
  }

  async sendMessage(streamId: string, sendMessageDto: SendMessageDto): Promise<LiveStreamMessage> {
    const liveStream = await this.findLiveStreamById(streamId);

    if (liveStream.status !== StreamStatus.LIVE) {
      throw new BadRequestException('Cannot send message to inactive stream');
    }

    const message = this.streamMessageRepository.create({
      streamId,
      ...sendMessageDto,
    });

    return this.streamMessageRepository.save(message);
  }

  async getStreamMessages(streamId: string, limit: number = 50): Promise<LiveStreamMessage[]> {
    return this.streamMessageRepository.find({
      where: { streamId },
      relations: ['user'],
      order: { sentAt: 'DESC' },
      take: limit,
    });
  }

  async joinStream(streamId: string, userId?: string, sessionId?: string, ipAddress?: string, userAgent?: string): Promise<LiveStreamViewer> {
    const liveStream = await this.findLiveStreamById(streamId);

    // Check if viewer already exists
    const existingViewer = await this.streamViewerRepository.findOne({
      where: {
        streamId,
        ...(userId ? { userId } : { sessionId }),
        leftAt: null
      },
    });

    if (existingViewer) {
      return existingViewer;
    }

    const viewer = this.streamViewerRepository.create({
      streamId,
      userId,
      sessionId,
      ipAddress,
      userAgent,
    });

    const savedViewer = await this.streamViewerRepository.save(viewer);

    // Update viewer count
    await this.updateViewerCount(streamId);

    return savedViewer;
  }

  async leaveStream(streamId: string, userId?: string, sessionId?: string): Promise<void> {
    const viewer = await this.streamViewerRepository.findOne({
      where: {
        streamId,
        ...(userId ? { userId } : { sessionId }),
        leftAt: null
      },
    });

    if (viewer) {
      viewer.leftAt = new Date();
      await this.streamViewerRepository.save(viewer);

      // Update viewer count
      await this.updateViewerCount(streamId);
    }
  }

  private async updateViewerCount(streamId: string): Promise<void> {
    const currentViewers = await this.streamViewerRepository.count({
      where: { streamId, leftAt: null },
    });

    const liveStream = await this.liveStreamRepository.findOne({
      where: { id: streamId },
    });

    if (liveStream) {
      liveStream.viewerCount = currentViewers;
      liveStream.peakViewers = Math.max(liveStream.peakViewers, currentViewers);
      await this.liveStreamRepository.save(liveStream);
    }
  }

  async getStreamStats(streamId: string, sellerId: string): Promise<any> {
    const liveStream = await this.liveStreamRepository.findOne({
      where: { id: streamId, sellerId },
      relations: ['products'],
    });

    if (!liveStream) {
      throw new NotFoundException('Live stream not found');
    }

    const totalViewers = await this.streamViewerRepository.count({
      where: { streamId },
    });

    const totalMessages = await this.streamMessageRepository.count({
      where: { streamId },
    });

    const totalProducts = liveStream.products.length;
    const totalSales = liveStream.products.reduce((sum, p) => sum + Number(p.revenue), 0);
    const totalOrders = liveStream.products.reduce((sum, p) => sum + p.orderCount, 0);

    return {
      streamId,
      status: liveStream.status,
      currentViewers: liveStream.viewerCount,
      peakViewers: liveStream.peakViewers,
      totalViewers,
      totalMessages,
      totalProducts,
      totalOrders,
      totalSales,
      duration: liveStream.startedAt && liveStream.endedAt
        ? Math.floor((liveStream.endedAt.getTime() - liveStream.startedAt.getTime()) / 1000 / 60)
        : liveStream.startedAt
        ? Math.floor((new Date().getTime() - liveStream.startedAt.getTime()) / 1000 / 60)
        : 0,
    };
  }

  async getDashboardStats(): Promise<LiveDashboardStatsDto> {
    // Get total streams count
    const totalStreams = await this.liveStreamRepository.count();

    // Get currently live streams
    const liveStreams = await this.liveStreamRepository.count({
      where: { status: StreamStatus.LIVE },
    });

    // Get total viewers (all time unique viewers)
    const totalViewers = await this.streamViewerRepository.count();

    // Get total sales from live streams (orders with liveSessionId)
    const salesResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.liveSessionId IS NOT NULL')
      .getRawOne();

    const totalSales = parseFloat(salesResult?.total) || 0;

    // Calculate average view time
    const viewTimeResult = await this.streamViewerRepository
      .createQueryBuilder('viewer')
      .select('AVG(EXTRACT(EPOCH FROM (viewer.leftAt - viewer.joinedAt)))', 'avgSeconds')
      .where('viewer.leftAt IS NOT NULL')
      .getRawOne();

    const avgViewTime = Math.round(parseFloat(viewTimeResult?.avgSeconds) || 0);

    // Calculate conversion rate
    const ordersCount = await this.orderRepository.count({
      where: { liveSessionId: Not(IsNull()) },
    });

    const conversionRate = totalViewers > 0 ? ordersCount / totalViewers : 0;

    // Get total messages
    const totalMessages = await this.streamMessageRepository.count();

    // Calculate engagement rate (messages per viewer)
    const engagementRate = totalViewers > 0 ? totalMessages / totalViewers : 0;

    return {
      totalStreams,
      liveStreams,
      totalViewers,
      totalSales: Math.round(totalSales * 100) / 100,
      avgViewTime,
      conversionRate: Math.round(conversionRate * 10000) / 10000,
      totalMessages,
      engagementRate: Math.round(engagementRate * 100) / 100,
    };
  }

  async getStreamAnalytics(streamId: string): Promise<LiveStreamAnalyticsDto> {
    const liveStream = await this.liveStreamRepository.findOne({
      where: { id: streamId },
      relations: ['products', 'products.product'],
    });

    if (!liveStream) {
      throw new NotFoundException('Live stream not found');
    }

    // Get total unique viewers
    const totalViewers = await this.streamViewerRepository.count({
      where: { streamId },
    });

    // Get peak viewers
    const peakViewers = liveStream.peakViewers;

    // Calculate average watch time
    const watchTimeResult = await this.streamViewerRepository
      .createQueryBuilder('viewer')
      .select('AVG(EXTRACT(EPOCH FROM (viewer.leftAt - viewer.joinedAt)))', 'avgSeconds')
      .where('viewer.streamId = :streamId', { streamId })
      .andWhere('viewer.leftAt IS NOT NULL')
      .getRawOne();

    const avgWatchTime = Math.round(parseFloat(watchTimeResult?.avgSeconds) || 0);

    // Get orders from this stream
    const ordersResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .addSelect('COUNT(order.id)', 'count')
      .where('order.liveSessionId = :streamId', { streamId })
      .getRawOne();

    const totalSales = parseFloat(ordersResult?.total) || 0;
    const ordersCount = parseInt(ordersResult?.count) || 0;

    // Calculate conversion rate
    const conversionRate = totalViewers > 0 ? ordersCount / totalViewers : 0;

    // Get messages count
    const messages = await this.streamMessageRepository.count({
      where: { streamId },
    });

    // Get viewer count over time (simplified - can be enhanced)
    const viewersByTime = await this.streamViewerRepository
      .createQueryBuilder('viewer')
      .select('viewer.joinedAt', 'timestamp')
      .addSelect('COUNT(*)', 'viewers')
      .where('viewer.streamId = :streamId', { streamId })
      .groupBy('viewer.joinedAt')
      .orderBy('viewer.joinedAt', 'ASC')
      .limit(50)
      .getRawMany();

    // Get top products sold during stream
    const topProducts = liveStream.products
      .filter(p => p.orderCount > 0)
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5)
      .map(p => ({
        productId: p.productId,
        name: p.product?.name || 'Unknown Product',
        units: p.orderCount,
        revenue: Math.round(Number(p.revenue) * 100) / 100,
      }));

    return {
      streamId,
      title: liveStream.title,
      status: liveStream.status,
      hostType: liveStream.hostType,
      metrics: {
        peakViewers,
        totalViewers,
        avgWatchTime,
        totalSales: Math.round(totalSales * 100) / 100,
        ordersCount,
        conversionRate: Math.round(conversionRate * 10000) / 10000,
        messages,
      },
      viewersByTime: viewersByTime.map(v => ({
        timestamp: v.timestamp,
        viewers: parseInt(v.viewers),
      })),
      topProducts,
    };
  }

  /**
   * Highlight product in stream overlay
   */
  async highlightProduct(streamId: string, productId: string, sellerId: string): Promise<LiveStreamProduct> {
    const streamProduct = await this.streamProductRepository.findOne({
      where: { streamId, productId },
      relations: ['stream', 'product'],
    });

    if (!streamProduct) {
      throw new NotFoundException('Product not found in stream');
    }

    // Verify ownership
    if (streamProduct.stream.sellerId !== sellerId) {
      throw new BadRequestException('You do not have permission to manage this stream');
    }

    // Unhighlight all other products
    await this.streamProductRepository.update(
      { streamId, isHighlighted: true },
      { isHighlighted: false }
    );

    // Highlight this product
    streamProduct.isHighlighted = true;
    streamProduct.highlightedAt = new Date();

    const updated = await this.streamProductRepository.save(streamProduct);

    // Broadcast via WebSocket
    if (this.liveGateway) {
      await this.liveGateway.broadcastProductHighlighted(streamId, {
        productId,
        product: streamProduct.product,
        specialPrice: streamProduct.specialPrice,
      });
    }

    console.log(`[Live Service] Product ${productId} highlighted in stream ${streamId}`);

    return updated;
  }

  /**
   * Hide highlighted product
   */
  async hideProduct(streamId: string, productId: string, sellerId: string): Promise<LiveStreamProduct> {
    const streamProduct = await this.streamProductRepository.findOne({
      where: { streamId, productId },
      relations: ['stream'],
    });

    if (!streamProduct) {
      throw new NotFoundException('Product not found in stream');
    }

    // Verify ownership
    if (streamProduct.stream.sellerId !== sellerId) {
      throw new BadRequestException('You do not have permission to manage this stream');
    }

    streamProduct.isHighlighted = false;

    const updated = await this.streamProductRepository.save(streamProduct);

    // Broadcast via WebSocket
    if (this.liveGateway) {
      await this.liveGateway.broadcastProductHidden(streamId, { productId });
    }

    console.log(`[Live Service] Product ${productId} hidden in stream ${streamId}`);

    return updated;
  }

  /**
   * Reorder products in stream
   */
  async reorderProducts(streamId: string, sellerId: string, productOrder: { productId: string; position: number }[]): Promise<void> {
    const liveStream = await this.liveStreamRepository.findOne({
      where: { id: streamId, sellerId },
    });

    if (!liveStream) {
      throw new NotFoundException('Live stream not found');
    }

    // Update positions
    for (const item of productOrder) {
      await this.streamProductRepository.update(
        { streamId, productId: item.productId },
        { position: item.position }
      );
    }

    console.log(`[Live Service] Reordered ${productOrder.length} products in stream ${streamId}`);
  }

  /**
   * Get highlighted products for stream
   */
  async getHighlightedProducts(streamId: string): Promise<LiveStreamProduct[]> {
    return this.streamProductRepository.find({
      where: { streamId, isHighlighted: true },
      relations: ['product'],
      order: { position: 'ASC' },
    });
  }

  // ==================== REACTIONS ====================

  /**
   * Send a reaction to the live stream
   */
  async sendReaction(streamId: string, userId: string | null, sessionId: string | null, type: ReactionType): Promise<LiveStreamReaction> {
    const reaction = this.streamReactionRepository.create({
      streamId,
      userId,
      sessionId,
      type,
    });

    const saved = await this.streamReactionRepository.save(reaction);

    // Update stream likes count if reaction is LIKE or HEART
    if (type === ReactionType.LIKE || type === ReactionType.HEART) {
      await this.liveStreamRepository.increment({ id: streamId }, 'likesCount', 1);
    }

    console.log(`[Live Service] Reaction ${type} sent to stream ${streamId}`);

    return saved;
  }

  /**
   * Get recent reactions for a stream
   */
  async getStreamReactions(streamId: string, limit: number = 50): Promise<LiveStreamReaction[]> {
    return this.streamReactionRepository.find({
      where: { streamId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // ==================== BADGES ====================

  /**
   * Get user badge based on their role in the stream
   */
  async getUserBadge(streamId: string, userId: string | null): Promise<string | null> {
    if (!userId) return null;

    const stream = await this.liveStreamRepository.findOne({
      where: { id: streamId },
      relations: ['seller', 'affiliate'],
    });

    if (!stream) return null;

    // Check if user is the seller/host
    if (stream.sellerId === userId) return 'seller';
    if (stream.affiliateId === userId) return 'affiliate';

    // Check if user is a moderator (can be extended to check moderator table)
    // For now, we'll use a simple check - extend this with a moderators table later

    // Check if user has made purchases in this stream (VIP badge)
    const purchases = await this.orderRepository.count({
      where: { liveSessionId: streamId, userId },
    });

    if (purchases > 0) return 'vip';

    return null;
  }

  // ==================== MODERATION ====================

  /**
   * Delete a chat message
   */
  async deleteMessage(messageId: string, moderatorId: string): Promise<void> {
    const message = await this.streamMessageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    message.isDeleted = true;
    message.deletedBy = moderatorId;
    message.deletedAt = new Date();

    await this.streamMessageRepository.save(message);

    console.log(`[Live Service] Message ${messageId} deleted by ${moderatorId}`);
  }

  /**
   * Ban a user from the stream
   */
  async banUser(streamId: string, userId: string, bannedBy: string, reason: string): Promise<void> {
    // Find all viewer records for this user in this stream
    const viewers = await this.streamViewerRepository.find({
      where: { streamId, userId },
    });

    for (const viewer of viewers) {
      viewer.isBanned = true;
      viewer.bannedBy = bannedBy;
      viewer.banReason = reason;
      await this.streamViewerRepository.save(viewer);
    }

    console.log(`[Live Service] User ${userId} banned from stream ${streamId} by ${bannedBy}`);
  }

  /**
   * Timeout a user temporarily
   */
  async timeoutUser(streamId: string, userId: string, timeoutMinutes: number, moderatorId: string): Promise<void> {
    const viewer = await this.streamViewerRepository.findOne({
      where: { streamId, userId, leftAt: IsNull() },
    });

    if (!viewer) {
      throw new NotFoundException('Viewer not found in stream');
    }

    const timeoutUntil = new Date();
    timeoutUntil.setMinutes(timeoutUntil.getMinutes() + timeoutMinutes);

    viewer.timeoutUntil = timeoutUntil;
    viewer.bannedBy = moderatorId;

    await this.streamViewerRepository.save(viewer);

    console.log(`[Live Service] User ${userId} timed out for ${timeoutMinutes} minutes in stream ${streamId}`);
  }

  /**
   * Check if a user is banned from a stream
   */
  async isUserBanned(streamId: string, userId: string): Promise<boolean> {
    const viewer = await this.streamViewerRepository.findOne({
      where: { streamId, userId, isBanned: true },
    });

    return !!viewer;
  }

  /**
   * Check if a user is currently timed out
   */
  async isUserTimedOut(streamId: string, userId: string): Promise<boolean> {
    const viewer = await this.streamViewerRepository.findOne({
      where: {
        streamId,
        userId,
        timeoutUntil: MoreThan(new Date()),
      },
    });

    return !!viewer;
  }

  // ==================== RATE LIMITING ====================

  private messageRateLimiter = new Map<string, { count: number; resetAt: Date }>();

  /**
   * Check if user can send a message (rate limiting)
   */
  async checkRateLimit(userId: string, maxMessages: number = 5, windowSeconds: number = 10): Promise<boolean> {
    const now = new Date();
    const key = userId;

    const limiter = this.messageRateLimiter.get(key);

    if (!limiter || limiter.resetAt < now) {
      // Reset or initialize rate limiter
      const resetAt = new Date(now.getTime() + windowSeconds * 1000);
      this.messageRateLimiter.set(key, { count: 1, resetAt });
      return true;
    }

    if (limiter.count >= maxMessages) {
      return false; // Rate limit exceeded
    }

    limiter.count++;
    return true;
  }

  /**
   * Clear rate limiter for a user (useful for VIPs or moderators)
   */
  clearRateLimit(userId: string): void {
    this.messageRateLimiter.delete(userId);
  }

  // ==================== DISCOVERY & RECOMMENDATIONS ====================

  /**
   * Get active streams with pagination and filters (with caching)
   */
  async getActiveStreamsWithFilters(params: {
    page?: number;
    limit?: number;
    category?: string;
    tags?: string[];
    sortBy?: 'viewers' | 'likes' | 'trending' | 'recent';
  }): Promise<{
    streams: LiveStream[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    // Create cache key from params
    const cacheKey = `active_streams:${JSON.stringify(params)}`;

    // Try to get from cache first (30s TTL)
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      console.log(`[Live Service] Cache HIT for ${cacheKey}`);
      return cached;
    }

    console.log(`[Live Service] Cache MISS for ${cacheKey}`);

    const queryBuilder = this.liveStreamRepository
      .createQueryBuilder('stream')
      .leftJoinAndSelect('stream.seller', 'seller')
      .leftJoinAndSelect('stream.affiliate', 'affiliate')
      .leftJoinAndSelect('stream.products', 'products')
      .leftJoinAndSelect('products.product', 'product')
      .where('stream.status = :status', { status: StreamStatus.LIVE });

    // Filter by category
    if (params.category) {
      queryBuilder.andWhere('stream.category = :category', { category: params.category });
    }

    // Filter by tags
    if (params.tags && params.tags.length > 0) {
      queryBuilder.andWhere('stream.tags && :tags', { tags: params.tags });
    }

    // Sorting
    switch (params.sortBy) {
      case 'viewers':
        queryBuilder.orderBy('stream.viewerCount', 'DESC');
        break;
      case 'likes':
        queryBuilder.orderBy('stream.likesCount', 'DESC');
        break;
      case 'trending':
        // Trending score = viewerCount + (likesCount * 0.5) + (totalSales * 2) - age penalty
        queryBuilder
          .addSelect(
            `(stream.viewerCount + (stream.likesCount * 0.5) + (stream.totalSales * 2) -
            EXTRACT(EPOCH FROM (NOW() - stream.startedAt)) / 3600)`,
            'trendingScore'
          )
          .orderBy('trendingScore', 'DESC');
        break;
      case 'recent':
      default:
        queryBuilder.orderBy('stream.startedAt', 'DESC');
        break;
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    const streams = await queryBuilder.skip(skip).take(limit).getMany();

    const totalPages = Math.ceil(total / limit);

    const result = {
      streams,
      total,
      page,
      totalPages,
    };

    // Cache for 30 seconds
    await this.cacheService.set(cacheKey, result, 30);

    return result;
  }

  /**
   * Search streams with full-text search
   */
  async searchStreams(params: {
    query: string;
    page?: number;
    limit?: number;
    category?: string;
    status?: StreamStatus;
  }): Promise<{
    streams: LiveStream[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.liveStreamRepository
      .createQueryBuilder('stream')
      .leftJoinAndSelect('stream.seller', 'seller')
      .leftJoinAndSelect('stream.affiliate', 'affiliate')
      .leftJoinAndSelect('stream.products', 'products')
      .leftJoinAndSelect('products.product', 'product');

    // Full-text search on title and description
    if (params.query) {
      queryBuilder.where(
        '(LOWER(stream.title) LIKE LOWER(:query) OR LOWER(stream.description) LIKE LOWER(:query))',
        { query: `%${params.query}%` }
      );
    }

    // Filter by status (default to LIVE)
    const status = params.status || StreamStatus.LIVE;
    queryBuilder.andWhere('stream.status = :status', { status });

    // Filter by category
    if (params.category) {
      queryBuilder.andWhere('stream.category = :category', { category: params.category });
    }

    // Order by relevance (viewer count as proxy)
    queryBuilder.orderBy('stream.viewerCount', 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    const streams = await queryBuilder.skip(skip).take(limit).getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      streams,
      total,
      page,
      totalPages,
    };
  }

  /**
   * Get trending streams
   */
  async getTrendingStreams(limit: number = 10): Promise<LiveStream[]> {
    return this.liveStreamRepository
      .createQueryBuilder('stream')
      .leftJoinAndSelect('stream.seller', 'seller')
      .leftJoinAndSelect('stream.affiliate', 'affiliate')
      .leftJoinAndSelect('stream.products', 'products')
      .leftJoinAndSelect('products.product', 'product')
      .where('stream.status = :status', { status: StreamStatus.LIVE })
      .addSelect(
        `(stream.viewerCount + (stream.likesCount * 0.5) + (stream.totalSales * 2) -
        EXTRACT(EPOCH FROM (NOW() - stream.startedAt)) / 3600)`,
        'trendingScore'
      )
      .orderBy('trendingScore', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * Get available categories
   */
  async getCategories(): Promise<string[]> {
    const result = await this.liveStreamRepository
      .createQueryBuilder('stream')
      .select('DISTINCT stream.category', 'category')
      .where('stream.category IS NOT NULL')
      .andWhere('stream.category != :empty', { empty: '' })
      .getRawMany();

    return result.map(r => r.category).filter(Boolean);
  }

  // ==================== RECOMMENDATION ENGINE ====================

  /**
   * Collaborative Filtering: "Users who watched X also watched Y"
   */
  async getCollaborativeRecommendations(
    userId: string,
    limit: number = 10,
  ): Promise<{ stream: LiveStream; score: number; reason: string }[]> {
    // Get streams the user has watched
    const userViewHistory = await this.streamViewerRepository.find({
      where: { userId },
      select: ['streamId'],
      order: { joinedAt: 'DESC' },
      take: 20, // Last 20 watched streams
    });

    if (userViewHistory.length === 0) {
      return [];
    }

    const watchedStreamIds = userViewHistory.map(v => v.streamId);

    // Find other users who watched the same streams
    const similarUsers = await this.streamViewerRepository
      .createQueryBuilder('viewer')
      .select('viewer.userId')
      .addSelect('COUNT(DISTINCT viewer.streamId)', 'commonStreams')
      .where('viewer.streamId IN (:...streamIds)', { streamIds: watchedStreamIds })
      .andWhere('viewer.userId != :userId', { userId })
      .andWhere('viewer.userId IS NOT NULL')
      .groupBy('viewer.userId')
      .having('COUNT(DISTINCT viewer.streamId) >= 2') // At least 2 common streams
      .orderBy('commonStreams', 'DESC')
      .limit(50)
      .getRawMany();

    if (similarUsers.length === 0) {
      return [];
    }

    const similarUserIds = similarUsers.map(u => u.viewer_userId);

    // Find streams watched by similar users but not by current user
    const recommendedStreamIds = await this.streamViewerRepository
      .createQueryBuilder('viewer')
      .select('viewer.streamId')
      .addSelect('COUNT(DISTINCT viewer.userId)', 'watchCount')
      .where('viewer.userId IN (:...userIds)', { userIds: similarUserIds })
      .andWhere('viewer.streamId NOT IN (:...watchedIds)', { watchedIds: watchedStreamIds })
      .groupBy('viewer.streamId')
      .orderBy('watchCount', 'DESC')
      .limit(limit * 2) // Get more to filter later
      .getRawMany();

    // Get the actual stream entities
    const streamIds = recommendedStreamIds.map(r => r.viewer_streamId);

    if (streamIds.length === 0) {
      return [];
    }

    const streams = await this.liveStreamRepository
      .createQueryBuilder('stream')
      .leftJoinAndSelect('stream.seller', 'seller')
      .leftJoinAndSelect('stream.affiliate', 'affiliate')
      .leftJoinAndSelect('stream.products', 'products')
      .where('stream.id IN (:...ids)', { ids: streamIds })
      .andWhere('stream.status = :status', { status: StreamStatus.LIVE })
      .getMany();

    // Calculate collaborative score based on how many similar users watched it
    const recommendations = streams.map(stream => {
      const watchCount = recommendedStreamIds.find(r => r.viewer_streamId === stream.id)?.watchCount || 0;
      const score = Math.min(100, watchCount * 10); // Max 100

      return {
        stream,
        score,
        reason: `${watchCount} users with similar taste watched this`,
      };
    });

    return recommendations.slice(0, limit);
  }

  /**
   * Content-Based Filtering: Recommend based on user preferences
   */
  async getContentBasedRecommendations(
    userId: string,
    limit: number = 10,
  ): Promise<{ stream: LiveStream; score: number; reason: string }[]> {
    // Get user's viewing history to understand preferences
    const viewHistory = await this.streamViewerRepository
      .createQueryBuilder('viewer')
      .leftJoin('viewer.stream', 'stream')
      .select('stream.category', 'category')
      .addSelect('stream.sellerId', 'sellerId')
      .addSelect('stream.affiliateId', 'affiliateId')
      .addSelect('COUNT(*)', 'count')
      .where('viewer.userId = :userId', { userId })
      .andWhere('stream.category IS NOT NULL')
      .groupBy('stream.category, stream.sellerId, stream.affiliateId')
      .orderBy('count', 'DESC')
      .getRawMany();

    if (viewHistory.length === 0) {
      return [];
    }

    // Extract preferred categories and sellers
    const preferredCategories = [...new Set(viewHistory.map(h => h.category).filter(Boolean))].slice(0, 3);
    const preferredSellers = [...new Set(viewHistory.map(h => h.sellerId).filter(Boolean))].slice(0, 5);
    const preferredAffiliates = [...new Set(viewHistory.map(h => h.affiliateId).filter(Boolean))].slice(0, 5);

    // Get streams that match user preferences
    const queryBuilder = this.liveStreamRepository
      .createQueryBuilder('stream')
      .leftJoinAndSelect('stream.seller', 'seller')
      .leftJoinAndSelect('stream.affiliate', 'affiliate')
      .leftJoinAndSelect('stream.products', 'products')
      .where('stream.status = :status', { status: StreamStatus.LIVE });

    // Build OR conditions for matching preferences
    const conditions: string[] = [];

    if (preferredCategories.length > 0) {
      conditions.push('stream.category IN (:...categories)');
    }
    if (preferredSellers.length > 0) {
      conditions.push('stream.sellerId IN (:...sellers)');
    }
    if (preferredAffiliates.length > 0) {
      conditions.push('stream.affiliateId IN (:...affiliates)');
    }

    if (conditions.length > 0) {
      queryBuilder.andWhere(`(${conditions.join(' OR ')})`, {
        categories: preferredCategories,
        sellers: preferredSellers,
        affiliates: preferredAffiliates,
      });
    }

    // Exclude streams user has already watched
    const watchedStreamIds = await this.streamViewerRepository
      .createQueryBuilder('viewer')
      .select('viewer.streamId')
      .where('viewer.userId = :userId', { userId })
      .getRawMany();

    const watchedIds = watchedStreamIds.map(w => w.viewer_streamId);
    if (watchedIds.length > 0) {
      queryBuilder.andWhere('stream.id NOT IN (:...watchedIds)', { watchedIds: watchedIds });
    }

    const streams = await queryBuilder
      .orderBy('stream.viewerCount', 'DESC')
      .limit(limit)
      .getMany();

    // Calculate content-based score
    const recommendations = streams.map(stream => {
      let score = 50; // Base score
      let reasons: string[] = [];

      // Boost for matching category
      if (stream.category && preferredCategories.includes(stream.category)) {
        score += 30;
        reasons.push(`You like ${stream.category}`);
      }

      // Boost for matching seller
      if (stream.sellerId && preferredSellers.includes(stream.sellerId)) {
        score += 20;
        reasons.push('From a seller you watched before');
      }

      // Boost for matching affiliate
      if (stream.affiliateId && preferredAffiliates.includes(stream.affiliateId)) {
        score += 20;
        reasons.push('From an affiliate you follow');
      }

      return {
        stream,
        score: Math.min(100, score),
        reason: reasons.join(' • ') || 'Recommended for you',
      };
    });

    return recommendations;
  }

  /**
   * Hybrid "For You" Feed: Combines collaborative and content-based filtering
   */
  async getForYouFeed(
    userId: string | null,
    limit: number = 20,
  ): Promise<{
    streams: { stream: LiveStream; score: number; reason: string }[];
    total: number;
  }> {
    // If no userId, return trending streams
    if (!userId) {
      const trending = await this.getTrendingStreams(limit);
      return {
        streams: trending.map(stream => ({
          stream,
          score: 75,
          reason: 'Popular now',
        })),
        total: trending.length,
      };
    }

    // Get recommendations from both methods
    const [collaborative, contentBased] = await Promise.all([
      this.getCollaborativeRecommendations(userId, limit),
      this.getContentBasedRecommendations(userId, limit),
    ]);

    // Merge and deduplicate
    const streamMap = new Map<string, { stream: LiveStream; score: number; reason: string }>();

    // Add collaborative recommendations (higher priority)
    collaborative.forEach(rec => {
      streamMap.set(rec.stream.id, {
        ...rec,
        score: rec.score * 0.6, // 60% weight for collaborative
      });
    });

    // Add content-based recommendations
    contentBased.forEach(rec => {
      const existing = streamMap.get(rec.stream.id);
      if (existing) {
        // If stream appears in both, boost score
        existing.score = existing.score + rec.score * 0.4; // 40% weight for content-based
        existing.reason = `${existing.reason} • ${rec.reason}`;
      } else {
        streamMap.set(rec.stream.id, {
          ...rec,
          score: rec.score * 0.4,
        });
      }
    });

    // If not enough recommendations, add trending streams
    if (streamMap.size < limit) {
      const trending = await this.getTrendingStreams(limit - streamMap.size);
      trending.forEach(stream => {
        if (!streamMap.has(stream.id)) {
          streamMap.set(stream.id, {
            stream,
            score: 50,
            reason: 'Trending now',
          });
        }
      });
    }

    // Convert to array and sort by score
    const recommendations = Array.from(streamMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return {
      streams: recommendations,
      total: recommendations.length,
    };
  }

  // ==================== NATIVE STREAMING CREDENTIALS ====================

  /**
   * Get native streaming credentials for mobile broadcasting
   * Returns RTMP ingest endpoint and stream key for the broadcaster
   */
  async getNativeStreamCredentials(
    streamId: string,
    hostId: string,
    hostType: HostType,
  ): Promise<NativeStreamCredentialsDto> {
    const whereCondition = hostType === HostType.SELLER
      ? { id: streamId, sellerId: hostId }
      : { id: streamId, affiliateId: hostId };

    const liveStream = await this.liveStreamRepository.findOne({
      where: whereCondition,
    });

    if (!liveStream) {
      throw new NotFoundException('Live stream not found or you do not have permission to access it');
    }

    // Only allow getting credentials for scheduled or live streams
    if (liveStream.status === StreamStatus.ENDED || liveStream.status === StreamStatus.CANCELLED) {
      throw new BadRequestException('Cannot get credentials for an ended or cancelled stream');
    }

    // Verify stream has IVS credentials
    if (!liveStream.streamKey || !liveStream.rtmpUrl) {
      throw new BadRequestException('Stream does not have valid streaming credentials. Please recreate the stream.');
    }

    return {
      streamId: liveStream.id,
      title: liveStream.title,
      ingestEndpoint: liveStream.rtmpUrl,
      streamKey: liveStream.streamKey,
      channelArn: liveStream.ivsChannelArn,
      playbackUrl: liveStream.hlsUrl,
      recommendedBitrate: 2500, // 2.5 Mbps for 720p
      recommendedResolution: '720p',
      maxBitrate: 8500, // AWS IVS max for STANDARD channel type
    };
  }

  /**
   * Get OBS setup information for external streaming software
   */
  async getOBSSetupInfo(
    streamId: string,
    hostId: string,
    hostType: HostType,
  ): Promise<OBSSetupInfoDto> {
    const whereCondition = hostType === HostType.SELLER
      ? { id: streamId, sellerId: hostId }
      : { id: streamId, affiliateId: hostId };

    const liveStream = await this.liveStreamRepository.findOne({
      where: whereCondition,
    });

    if (!liveStream) {
      throw new NotFoundException('Live stream not found or you do not have permission to access it');
    }

    if (!liveStream.streamKey || !liveStream.rtmpUrl) {
      throw new BadRequestException('Stream does not have valid streaming credentials');
    }

    return {
      rtmpUrl: liveStream.rtmpUrl,
      streamKey: liveStream.streamKey,
      recommendedSettings: {
        encoder: 'x264 or NVENC',
        bitrate: 2500,
        keyframeInterval: 2,
        resolution: '1280x720',
        fps: 30,
      },
    };
  }

  /**
   * Verify stream ownership for any host type
   */
  async verifyStreamOwnership(
    streamId: string,
    hostId: string,
    hostType: HostType,
  ): Promise<LiveStream> {
    const whereCondition = hostType === HostType.SELLER
      ? { id: streamId, sellerId: hostId }
      : { id: streamId, affiliateId: hostId };

    const liveStream = await this.liveStreamRepository.findOne({
      where: whereCondition,
    });

    if (!liveStream) {
      throw new ForbiddenException('You do not have permission to access this stream');
    }

    return liveStream;
  }

  /**
   * Regenerate stream key if compromised
   */
  async regenerateStreamKey(
    streamId: string,
    hostId: string,
    hostType: HostType,
  ): Promise<{ streamKey: string }> {
    const liveStream = await this.verifyStreamOwnership(streamId, hostId, hostType);

    if (liveStream.status === StreamStatus.LIVE) {
      throw new BadRequestException('Cannot regenerate stream key while streaming. Please end the stream first.');
    }

    // Get new stream key from IVS
    const newStreamKey = await this.ivsService.getStreamKey(liveStream.ivsChannelArn);

    if (!newStreamKey) {
      // If no stream key exists, we need to create one - this is handled by the mock/real IVS service
      throw new BadRequestException('Failed to regenerate stream key. Please recreate the stream.');
    }

    // Update the stream with the new key
    liveStream.streamKey = newStreamKey.value;
    await this.liveStreamRepository.save(liveStream);

    console.log(`[Live Service] Regenerated stream key for stream ${streamId}`);

    return {
      streamKey: newStreamKey.value,
    };
  }

  // ==================== TikTok Shop Style Features ====================

  // In-memory store for stream purchase counts (per product)
  private streamPurchaseCounts = new Map<string, Map<string, number>>();

  /**
   * Increment purchase count for a product during a live stream
   * Used for real-time "X sold" notifications
   */
  async incrementStreamPurchaseCount(streamId: string, productId: string): Promise<number> {
    // Get or create stream's purchase count map
    if (!this.streamPurchaseCounts.has(streamId)) {
      this.streamPurchaseCounts.set(streamId, new Map<string, number>());
    }

    const streamCounts = this.streamPurchaseCounts.get(streamId)!;
    const currentCount = streamCounts.get(productId) || 0;
    const newCount = currentCount + 1;
    streamCounts.set(productId, newCount);

    // Also update the database for persistence
    try {
      const streamProduct = await this.streamProductRepository.findOne({
        where: { streamId, productId },
      });

      if (streamProduct) {
        streamProduct.orderCount = (streamProduct.orderCount || 0) + 1;
        await this.streamProductRepository.save(streamProduct);
      }
    } catch (error) {
      console.error(`[Live Service] Failed to update product order count: ${error.message}`);
    }

    console.log(`[Live Service] Stream ${streamId} - Product ${productId} purchase count: ${newCount}`);

    return newCount;
  }

  /**
   * Get purchase stats for all products in a stream
   */
  async getStreamPurchaseStats(streamId: string): Promise<{
    totalPurchases: number;
    productStats: Array<{ productId: string; purchaseCount: number }>;
  }> {
    // Get in-memory counts
    const streamCounts = this.streamPurchaseCounts.get(streamId);

    if (!streamCounts) {
      // If no in-memory counts, try to get from database
      const streamProducts = await this.streamProductRepository.find({
        where: { streamId },
        select: ['productId', 'orderCount'],
      });

      const productStats = streamProducts.map(sp => ({
        productId: sp.productId,
        purchaseCount: sp.orderCount || 0,
      }));

      const totalPurchases = productStats.reduce((sum, p) => sum + p.purchaseCount, 0);

      return {
        totalPurchases,
        productStats,
      };
    }

    // Convert in-memory counts to array
    const productStats = Array.from(streamCounts.entries()).map(([productId, count]) => ({
      productId,
      purchaseCount: count,
    }));

    const totalPurchases = productStats.reduce((sum, p) => sum + p.purchaseCount, 0);

    return {
      totalPurchases,
      productStats,
    };
  }

  /**
   * Clear purchase counts when stream ends
   * Called when stream status changes to ENDED
   */
  clearStreamPurchaseCounts(streamId: string): void {
    this.streamPurchaseCounts.delete(streamId);
    console.log(`[Live Service] Cleared purchase counts for stream ${streamId}`);
  }

  /**
   * Get the pinned product for a stream
   */
  async getPinnedProduct(streamId: string): Promise<LiveStreamProduct | null> {
    // For now, we use the isHighlighted field to track pinned products
    // In a more robust implementation, we could add a separate pinnedAt timestamp
    const pinnedProduct = await this.streamProductRepository.findOne({
      where: { streamId, isHighlighted: true },
      relations: ['product'],
    });

    return pinnedProduct;
  }

  /**
   * Get all active products for a stream (for the carousel)
   */
  async getActiveStreamProducts(streamId: string): Promise<LiveStreamProduct[]> {
    return this.streamProductRepository.find({
      where: { streamId, isActive: true },
      relations: ['product'],
      order: { position: 'ASC' },
    });
  }
}