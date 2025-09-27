import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AffiliateVideo, VideoStatus, VideoType } from '../entities/affiliate-video.entity'
import { AffiliateVideoProduct, VideoInteraction } from '../entities/affiliate-video.entity'
import { Affiliate } from '../entities/affiliate.entity'
import { Product } from '../../products/product.entity'
import { AffiliateNotification, NotificationType } from '../entities/affiliate-notification.entity'
import { AffiliateFollower } from '../entities/affiliate-follower.entity'

export interface CreateVideoData {
  title: string
  description?: string
  videoUrl: string
  thumbnailUrl?: string
  duration?: number
  type: VideoType
  tags?: string[]
  hashtags?: string[]
  allowComments?: boolean
  allowSharing?: boolean
  isPublic?: boolean
  taggedProducts?: string[] // product IDs
}

export interface UpdateVideoData {
  title?: string
  description?: string
  thumbnailUrl?: string
  tags?: string[]
  hashtags?: string[]
  allowComments?: boolean
  allowSharing?: boolean
  isPublic?: boolean
}

@Injectable()
export class CreatorContentService {
  constructor(
    @InjectRepository(AffiliateVideo)
    private videoRepository: Repository<AffiliateVideo>,
    @InjectRepository(AffiliateVideoProduct)
    private videoProductRepository: Repository<AffiliateVideoProduct>,
    @InjectRepository(VideoInteraction)
    private interactionRepository: Repository<VideoInteraction>,
    @InjectRepository(Affiliate)
    private affiliateRepository: Repository<Affiliate>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(AffiliateNotification)
    private notificationRepository: Repository<AffiliateNotification>,
    @InjectRepository(AffiliateFollower)
    private followerRepository: Repository<AffiliateFollower>,
  ) {}

  async createVideo(affiliateId: string, data: CreateVideoData): Promise<AffiliateVideo> {
    const affiliate = await this.affiliateRepository.findOne({
      where: { id: affiliateId, isActive: true }
    })

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found')
    }

    // Create video
    const video = this.videoRepository.create({
      affiliateId,
      title: data.title,
      description: data.description,
      videoUrl: data.videoUrl,
      thumbnailUrl: data.thumbnailUrl,
      duration: data.duration || 0,
      type: data.type,
      tags: data.tags || [],
      hashtags: data.hashtags || [],
      allowComments: data.allowComments !== false,
      allowSharing: data.allowSharing !== false,
      isPublic: data.isPublic !== false,
      status: VideoStatus.DRAFT
    })

    const savedVideo = await this.videoRepository.save(video)

    // Tag products if provided
    if (data.taggedProducts && data.taggedProducts.length > 0) {
      await this.tagProductsToVideo(savedVideo.id, data.taggedProducts, affiliateId)
    }

    return savedVideo
  }

  async updateVideo(videoId: string, affiliateId: string, data: UpdateVideoData): Promise<AffiliateVideo> {
    const video = await this.videoRepository.findOne({
      where: { id: videoId, affiliateId }
    })

    if (!video) {
      throw new NotFoundException('Video not found')
    }

    // Update video data
    Object.assign(video, data, { updatedAt: new Date() })
    return this.videoRepository.save(video)
  }

  async publishVideo(videoId: string, affiliateId: string): Promise<AffiliateVideo> {
    const video = await this.videoRepository.findOne({
      where: { id: videoId, affiliateId }
    })

    if (!video) {
      throw new NotFoundException('Video not found')
    }

    if (video.status !== VideoStatus.DRAFT) {
      throw new BadRequestException('Only draft videos can be published')
    }

    // Publish video
    video.status = VideoStatus.PUBLISHED
    video.publishedAt = new Date()

    const publishedVideo = await this.videoRepository.save(video)

    // Update affiliate stats
    await this.affiliateRepository.increment({ id: affiliateId }, 'videosCount', 1)

    // Notify followers
    await this.notifyFollowersOfNewVideo(affiliateId, publishedVideo)

    return publishedVideo
  }

  async deleteVideo(videoId: string, affiliateId: string): Promise<void> {
    const video = await this.videoRepository.findOne({
      where: { id: videoId, affiliateId }
    })

    if (!video) {
      throw new NotFoundException('Video not found')
    }

    // Soft delete - archive instead of hard delete
    video.status = VideoStatus.ARCHIVED
    await this.videoRepository.save(video)

    // Update affiliate stats if it was published
    if (video.publishedAt) {
      await this.affiliateRepository.decrement({ id: affiliateId }, 'videosCount', 1)
    }
  }

  async tagProductsToVideo(videoId: string, productIds: string[], affiliateId: string): Promise<void> {
    const video = await this.videoRepository.findOne({
      where: { id: videoId, affiliateId }
    })

    if (!video) {
      throw new NotFoundException('Video not found')
    }

    // Verify products exist and affiliate has access to them
    const products = await this.productRepository.findByIds(productIds)
    if (products.length !== productIds.length) {
      throw new BadRequestException('Some products not found')
    }

    // Remove existing tagged products
    await this.videoProductRepository.delete({ videoId })

    // Add new tagged products
    const videoProducts = productIds.map(productId =>
      this.videoProductRepository.create({
        videoId,
        productId
      })
    )

    await this.videoProductRepository.save(videoProducts)
  }

  async getVideo(videoId: string, viewerId?: string): Promise<any> {
    const video = await this.videoRepository.findOne({
      where: { id: videoId },
      relations: ['affiliate', 'taggedProducts', 'taggedProducts.product']
    })

    if (!video) {
      throw new NotFoundException('Video not found')
    }

    // Check if viewer can see this video
    if (!video.isPublic && (!viewerId || viewerId !== video.affiliateId)) {
      throw new ForbiddenException('Video is private')
    }

    if (video.status !== VideoStatus.PUBLISHED && (!viewerId || viewerId !== video.affiliateId)) {
      throw new ForbiddenException('Video is not published')
    }

    // Track view if viewer is different from creator
    if (viewerId && viewerId !== video.affiliateId) {
      await this.trackInteraction(videoId, viewerId, 'view')
    }

    return {
      ...video,
      taggedProducts: video.taggedProducts.map(vp => ({
        id: vp.id,
        product: vp.product,
        specialPrice: vp.specialPrice,
        clicks: vp.clicks,
        purchases: vp.purchases,
        revenue: vp.revenue
      }))
    }
  }

  async getAffiliateVideos(affiliateId: string, status?: VideoStatus, page: number = 1, limit: number = 20): Promise<any> {
    const offset = (page - 1) * limit

    const queryBuilder = this.videoRepository.createQueryBuilder('video')
      .where('video.affiliateId = :affiliateId', { affiliateId })
      .leftJoinAndSelect('video.taggedProducts', 'taggedProducts')
      .leftJoinAndSelect('taggedProducts.product', 'product')

    if (status) {
      queryBuilder.andWhere('video.status = :status', { status })
    }

    const [videos, total] = await queryBuilder
      .orderBy('video.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount()

    return {
      videos,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async getPublicVideos(page: number = 1, limit: number = 20, category?: string): Promise<any> {
    const offset = (page - 1) * limit

    const queryBuilder = this.videoRepository.createQueryBuilder('video')
      .leftJoinAndSelect('video.affiliate', 'affiliate')
      .leftJoinAndSelect('video.taggedProducts', 'taggedProducts')
      .leftJoinAndSelect('taggedProducts.product', 'product')
      .where('video.status = :status', { status: VideoStatus.PUBLISHED })
      .andWhere('video.isPublic = :isPublic', { isPublic: true })
      .andWhere('affiliate.isProfilePublic = :isProfilePublic', { isProfilePublic: true })

    if (category) {
      queryBuilder.andWhere('affiliate.categories @> :category', { category: [category] })
    }

    const [videos, total] = await queryBuilder
      .orderBy('video.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount()

    return {
      videos,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async trackInteraction(videoId: string, userId: string, type: string, content?: string, watchDuration?: number): Promise<void> {
    const video = await this.videoRepository.findOne({
      where: { id: videoId }
    })

    if (!video) {
      throw new NotFoundException('Video not found')
    }

    // Create interaction record
    const interaction = this.interactionRepository.create({
      videoId,
      userId,
      sessionId: `${userId}_${Date.now()}`,
      type,
      content,
      watchDuration
    })

    await this.interactionRepository.save(interaction)

    // Update video metrics
    switch (type) {
      case 'view':
        await this.videoRepository.increment({ id: videoId }, 'views', 1)
        await this.affiliateRepository.increment({ id: video.affiliateId }, 'totalViews', 1)
        break
      case 'like':
        await this.videoRepository.increment({ id: videoId }, 'likes', 1)
        // Notify creator
        await this.createNotification({
          recipientId: video.affiliateId,
          triggeredByUserId: userId,
          type: NotificationType.VIDEO_LIKED,
          title: 'Video Liked',
          message: 'Someone liked your video!',
          data: { videoId, videoTitle: video.title }
        })
        break
      case 'comment':
        await this.videoRepository.increment({ id: videoId }, 'comments', 1)
        // Notify creator
        await this.createNotification({
          recipientId: video.affiliateId,
          triggeredByUserId: userId,
          type: NotificationType.VIDEO_COMMENTED,
          title: 'New Comment',
          message: 'Someone commented on your video!',
          data: { videoId, videoTitle: video.title, comment: content }
        })
        break
      case 'share':
        await this.videoRepository.increment({ id: videoId }, 'shares', 1)
        break
      case 'product_click':
        await this.videoRepository.increment({ id: videoId }, 'clicks', 1)
        break
    }
  }

  async getVideoAnalytics(videoId: string, affiliateId: string): Promise<any> {
    const video = await this.videoRepository.findOne({
      where: { id: videoId, affiliateId },
      relations: ['taggedProducts']
    })

    if (!video) {
      throw new NotFoundException('Video not found')
    }

    // Get interaction breakdown
    const interactions = await this.interactionRepository
      .createQueryBuilder('interaction')
      .select('interaction.type, COUNT(*) as count')
      .where('interaction.videoId = :videoId', { videoId })
      .groupBy('interaction.type')
      .getRawMany()

    const interactionBreakdown = interactions.reduce((acc, curr) => {
      acc[curr.type] = parseInt(curr.count)
      return acc
    }, {})

    // Get watch time analytics
    const watchTimeStats = await this.interactionRepository
      .createQueryBuilder('interaction')
      .select('AVG(interaction.watchDuration) as avgWatchTime, MAX(interaction.watchDuration) as maxWatchTime')
      .where('interaction.videoId = :videoId AND interaction.type = :type', { videoId, type: 'view' })
      .getRawOne()

    return {
      video: {
        id: video.id,
        title: video.title,
        views: video.views,
        likes: video.likes,
        comments: video.comments,
        shares: video.shares,
        clicks: video.clicks,
        purchases: video.purchases,
        revenue: video.revenue
      },
      interactions: interactionBreakdown,
      watchTime: {
        average: parseFloat(watchTimeStats.avgWatchTime) || 0,
        maximum: parseInt(watchTimeStats.maxWatchTime) || 0,
        completionRate: video.duration > 0 ? (parseFloat(watchTimeStats.avgWatchTime) || 0) / video.duration * 100 : 0
      },
      taggedProducts: video.taggedProducts.map(tp => ({
        productId: tp.productId,
        clicks: tp.clicks,
        purchases: tp.purchases,
        revenue: tp.revenue,
        conversionRate: tp.clicks > 0 ? (tp.purchases / tp.clicks) * 100 : 0
      }))
    }
  }

  private async notifyFollowersOfNewVideo(affiliateId: string, video: AffiliateVideo): Promise<void> {
    // Get followers who have notifications enabled
    const followers = await this.followerRepository.find({
      where: { followingId: affiliateId, isActive: true, receiveNotifications: true },
      relations: ['followerUser']
    })

    // Create notifications for each follower
    const notifications = followers.map(follower =>
      this.notificationRepository.create({
        recipientId: follower.followerId,
        triggeredByAffiliateId: affiliateId,
        type: NotificationType.NEW_VIDEO,
        title: 'New Video',
        message: `${video.title}`,
        data: { videoId: video.id, videoTitle: video.title },
        actionUrl: `/videos/${video.id}`
      })
    )

    if (notifications.length > 0) {
      await this.notificationRepository.save(notifications)
    }
  }

  private async createNotification(data: any): Promise<void> {
    const notification = this.notificationRepository.create(data)
    await this.notificationRepository.save(notification)
  }
}