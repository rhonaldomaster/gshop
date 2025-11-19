import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, MoreThan } from 'typeorm';
import { LiveStream, LiveStreamProduct, LiveStreamMessage, LiveStreamViewer, StreamStatus, HostType, LiveStreamReaction, ReactionType } from './live.entity';
import { CreateLiveStreamDto, UpdateLiveStreamDto, AddProductToStreamDto, SendMessageDto, LiveDashboardStatsDto, LiveStreamAnalyticsDto } from './dto';
import { Affiliate, AffiliateStatus } from '../affiliates/entities/affiliate.entity';
import { Order } from '../database/entities/order.entity';
import { IIvsService } from './interfaces/ivs-service.interface';
import { IVS_SERVICE } from './live.module';
import { v4 as uuidv4 } from 'uuid';

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
    @Inject(IVS_SERVICE)
    private ivsService: IIvsService,
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

    // Create AWS IVS channel (automatically uses mock or real based on config)
    const channelName = `${hostType}-${hostId}-${Date.now()}`;
    const ivsChannel = await this.ivsService.createChannel(channelName);

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

    return savedStream;
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
}