import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { LiveStream, StreamStatus, HostType } from '../../live/live.entity'
import { Affiliate } from '../entities/affiliate.entity'
import { AffiliateNotification, NotificationType } from '../entities/affiliate-notification.entity'
import { AffiliateFollower } from '../entities/affiliate-follower.entity'
import { AffiliateProduct, AffiliateProductStatus } from '../entities/affiliate-product.entity'
import { Product } from '../../products/product.entity'
import * as crypto from 'crypto'

export interface CreateLiveStreamData {
  title: string
  description?: string
  scheduledAt?: Date
  productIds?: string[] // Products to feature in the live stream
}

@Injectable()
export class CreatorLiveService {
  constructor(
    @InjectRepository(LiveStream)
    private liveStreamRepository: Repository<LiveStream>,
    @InjectRepository(Affiliate)
    private affiliateRepository: Repository<Affiliate>,
    @InjectRepository(AffiliateNotification)
    private notificationRepository: Repository<AffiliateNotification>,
    @InjectRepository(AffiliateFollower)
    private followerRepository: Repository<AffiliateFollower>,
    @InjectRepository(AffiliateProduct)
    private affiliateProductRepository: Repository<AffiliateProduct>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async createAffiliateStream(affiliateId: string, sellerId: string, data: CreateLiveStreamData): Promise<LiveStream> {
    const affiliate = await this.affiliateRepository.findOne({
      where: { id: affiliateId, isActive: true }
    })

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found')
    }

    // Generate stream key
    const streamKey = crypto.randomUUID()
    const rtmpUrl = `${process.env.RTMP_SERVER_URL || 'rtmp://localhost:1935/live'}/${streamKey}`
    const hlsUrl = `${process.env.HLS_SERVER_URL || 'http://localhost:8080/hls'}/${streamKey}.m3u8`

    // Create live stream with affiliate as host
    const liveStream = this.liveStreamRepository.create({
      title: data.title,
      description: data.description,
      hostType: HostType.AFFILIATE,
      affiliateId,
      sellerId, // Products will be from this seller
      streamKey,
      rtmpUrl,
      hlsUrl,
      scheduledAt: data.scheduledAt || new Date(),
      status: data.scheduledAt ? StreamStatus.SCHEDULED : StreamStatus.LIVE
    })

    const savedStream = await this.liveStreamRepository.save(liveStream)

    // Add products to stream if specified
    if (data.productIds && data.productIds.length > 0) {
      await this.addProductsToStream(savedStream.id, data.productIds, affiliateId)
    }

    // Update affiliate stats
    await this.affiliateRepository.increment({ id: affiliateId }, 'liveStreamsCount', 1)

    return savedStream
  }

  async addProductsToStream(streamId: string, productIds: string[], affiliateId: string): Promise<void> {
    const stream = await this.liveStreamRepository.findOne({
      where: { id: streamId, affiliateId }
    })

    if (!stream) {
      throw new NotFoundException('Live stream not found')
    }

    // Verify affiliate has access to these products
    const affiliateProducts = await this.affiliateProductRepository.find({
      where: {
        affiliateId,
        productId: productIds.map(id => ({ productId: id })) as any,
        status: AffiliateProductStatus.ACTIVE
      },
      relations: ['product']
    })

    if (affiliateProducts.length !== productIds.length) {
      throw new BadRequestException('Some products are not available for affiliate promotion')
    }

    // Import existing LiveStreamProduct entity from live module
    const { LiveStreamProduct } = await import('../../live/live.entity')
    const LiveStreamProductRepository = this.liveStreamRepository.manager.getRepository(LiveStreamProduct)

    // Add products to stream
    const streamProducts = affiliateProducts.map(ap =>
      LiveStreamProductRepository.create({
        streamId,
        productId: ap.productId,
        specialPrice: ap.specialPrice,
        isActive: true
      })
    )

    await LiveStreamProductRepository.save(streamProducts)
  }

  async startAffiliateStream(streamId: string, affiliateId: string): Promise<LiveStream> {
    const stream = await this.liveStreamRepository.findOne({
      where: { id: streamId, affiliateId }
    })

    if (!stream) {
      throw new NotFoundException('Live stream not found')
    }

    if (stream.status !== StreamStatus.SCHEDULED) {
      throw new BadRequestException('Stream is not scheduled')
    }

    // Update stream status
    stream.status = StreamStatus.LIVE
    stream.startedAt = new Date()

    const updatedStream = await this.liveStreamRepository.save(stream)

    // Notify followers about live stream
    await this.notifyFollowersOfLiveStream(affiliateId, updatedStream)

    return updatedStream
  }

  async endAffiliateStream(streamId: string, affiliateId: string): Promise<LiveStream> {
    const stream = await this.liveStreamRepository.findOne({
      where: { id: streamId, affiliateId }
    })

    if (!stream) {
      throw new NotFoundException('Live stream not found')
    }

    if (stream.status !== StreamStatus.LIVE) {
      throw new BadRequestException('Stream is not live')
    }

    // Update stream status
    stream.status = StreamStatus.ENDED
    stream.endedAt = new Date()

    return this.liveStreamRepository.save(stream)
  }

  async getAffiliateStreams(affiliateId: string, status?: StreamStatus, page: number = 1, limit: number = 20): Promise<any> {
    const offset = (page - 1) * limit

    const queryBuilder = this.liveStreamRepository.createQueryBuilder('stream')
      .leftJoinAndSelect('stream.products', 'products')
      .leftJoinAndSelect('products.product', 'product')
      .where('stream.affiliateId = :affiliateId', { affiliateId })

    if (status) {
      queryBuilder.andWhere('stream.status = :status', { status })
    }

    const [streams, total] = await queryBuilder
      .orderBy('stream.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount()

    return {
      streams,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async getActiveAffiliateStreams(page: number = 1, limit: number = 20): Promise<any> {
    const offset = (page - 1) * limit

    const [streams, total] = await this.liveStreamRepository.findAndCount({
      where: {
        hostType: HostType.AFFILIATE,
        status: StreamStatus.LIVE
      },
      relations: ['affiliate', 'products', 'products.product'],
      order: { startedAt: 'DESC' },
      skip: offset,
      take: limit
    })

    return {
      streams: streams.map(stream => ({
        ...stream,
        host: stream.affiliate,
        hostType: 'affiliate'
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async getStreamAnalytics(streamId: string, affiliateId: string): Promise<any> {
    const stream = await this.liveStreamRepository.findOne({
      where: { id: streamId, affiliateId },
      relations: ['products', 'viewers', 'messages']
    })

    if (!stream) {
      throw new NotFoundException('Live stream not found')
    }

    // Calculate stream duration
    const duration = stream.endedAt && stream.startedAt
      ? Math.floor((stream.endedAt.getTime() - stream.startedAt.getTime()) / 1000)
      : stream.startedAt
        ? Math.floor((new Date().getTime() - stream.startedAt.getTime()) / 1000)
        : 0

    // Get unique viewers count
    const uniqueViewers = new Set(stream.viewers?.map(v => v.userId || v.sessionId)).size

    // Calculate product performance
    const productPerformance = stream.products?.map(product => ({
      productId: product.productId,
      clicks: product.orderCount, // Using orderCount as a proxy for engagement
      revenue: product.revenue,
      conversionRate: product.orderCount > 0 ? (product.revenue / product.orderCount) : 0
    })) || []

    // Calculate engagement metrics
    const totalMessages = stream.messages?.length || 0
    const engagementRate = uniqueViewers > 0 ? (totalMessages / uniqueViewers) * 100 : 0

    return {
      stream: {
        id: stream.id,
        title: stream.title,
        duration,
        status: stream.status,
        peakViewers: stream.peakViewers,
        totalSales: stream.totalSales
      },
      audience: {
        uniqueViewers,
        peakViewers: stream.peakViewers,
        averageViewTime: duration > 0 && uniqueViewers > 0 ? duration / uniqueViewers : 0
      },
      engagement: {
        totalMessages,
        engagementRate,
        messagesPerMinute: duration > 0 ? (totalMessages / (duration / 60)) : 0
      },
      products: productPerformance,
      revenue: {
        total: stream.totalSales,
        commission: stream.totalSales * (0.075), // 7.5% commission rate
        productsCount: stream.products?.length || 0
      }
    }
  }

  async scheduleStream(affiliateId: string, sellerId: string, data: CreateLiveStreamData & { scheduledAt: Date }): Promise<LiveStream> {
    if (data.scheduledAt < new Date()) {
      throw new BadRequestException('Scheduled time must be in the future')
    }

    return this.createAffiliateStream(affiliateId, sellerId, data)
  }

  async updateScheduledStream(streamId: string, affiliateId: string, data: Partial<CreateLiveStreamData>): Promise<LiveStream> {
    const stream = await this.liveStreamRepository.findOne({
      where: { id: streamId, affiliateId }
    })

    if (!stream) {
      throw new NotFoundException('Live stream not found')
    }

    if (stream.status !== StreamStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled streams can be updated')
    }

    // Update stream data
    Object.assign(stream, data, { updatedAt: new Date() })
    return this.liveStreamRepository.save(stream)
  }

  private async notifyFollowersOfLiveStream(affiliateId: string, stream: LiveStream): Promise<void> {
    // Get followers who have notifications enabled
    const followers = await this.followerRepository.find({
      where: { followingId: affiliateId, isActive: true, receiveNotifications: true }
    })

    // Create notifications for each follower
    const notifications = followers.map(follower =>
      this.notificationRepository.create({
        recipientId: follower.followerId,
        triggeredByAffiliateId: affiliateId,
        type: NotificationType.LIVE_STARTING,
        title: 'Live Stream Started',
        message: `${stream.title}`,
        data: { streamId: stream.id, streamTitle: stream.title },
        actionUrl: `/live/${stream.id}`
      })
    )

    if (notifications.length > 0) {
      await this.notificationRepository.save(notifications)
    }
  }

  async getUpcomingStreams(affiliateId?: string, page: number = 1, limit: number = 10): Promise<any> {
    const offset = (page - 1) * limit

    const queryBuilder = this.liveStreamRepository.createQueryBuilder('stream')
      .leftJoinAndSelect('stream.affiliate', 'affiliate')
      .where('stream.status = :status', { status: StreamStatus.SCHEDULED })
      .andWhere('stream.hostType = :hostType', { hostType: HostType.AFFILIATE })
      .andWhere('stream.scheduledAt > :now', { now: new Date() })

    if (affiliateId) {
      queryBuilder.andWhere('stream.affiliateId = :affiliateId', { affiliateId })
    }

    const [streams, total] = await queryBuilder
      .orderBy('stream.scheduledAt', 'ASC')
      .skip(offset)
      .take(limit)
      .getManyAndCount()

    return {
      streams,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
}