import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Affiliate, AffiliateStatus } from '../entities/affiliate.entity'
import { AffiliateVideo, VideoStatus } from '../entities/affiliate-video.entity'
import { AffiliateFollower } from '../entities/affiliate-follower.entity'
import { AffiliateProduct } from '../entities/affiliate-product.entity'
import { LiveStream, HostType } from '../../live/live.entity'
import { AffiliateNotification, NotificationType } from '../entities/affiliate-notification.entity'

export interface AdminCreatorStats {
  totalCreators: number
  activeCreators: number
  pendingApproval: number
  suspendedCreators: number
  totalVideos: number
  totalViews: number
  totalEarnings: number
  totalSales: number
}

export interface CreatorAnalytics {
  topCreators: Array<{
    id: string
    username: string
    name: string
    followersCount: number
    totalViews: number
    totalSales: number
    totalEarnings: number
    engagementRate: number
  }>
  contentStats: {
    totalVideos: number
    totalLiveStreams: number
    avgViewsPerVideo: number
    avgEngagementRate: number
  }
  platformGrowth: {
    newCreatorsThisMonth: number
    newContentThisMonth: number
    totalFollowsThisMonth: number
  }
}

@Injectable()
export class AdminCreatorService {
  constructor(
    @InjectRepository(Affiliate)
    private affiliateRepository: Repository<Affiliate>,
    @InjectRepository(AffiliateVideo)
    private videoRepository: Repository<AffiliateVideo>,
    @InjectRepository(AffiliateFollower)
    private followerRepository: Repository<AffiliateFollower>,
    @InjectRepository(AffiliateProduct)
    private affiliateProductRepository: Repository<AffiliateProduct>,
    @InjectRepository(LiveStream)
    private liveStreamRepository: Repository<LiveStream>,
    @InjectRepository(AffiliateNotification)
    private notificationRepository: Repository<AffiliateNotification>,
  ) {}

  async getAdminStats(): Promise<AdminCreatorStats> {
    const [
      totalCreators,
      activeCreators,
      pendingApproval,
      suspendedCreators
    ] = await Promise.all([
      this.affiliateRepository.count(),
      this.affiliateRepository.count({ where: { status: AffiliateStatus.APPROVED, isActive: true } }),
      this.affiliateRepository.count({ where: { status: AffiliateStatus.PENDING } }),
      this.affiliateRepository.count({ where: { status: AffiliateStatus.SUSPENDED } })
    ])

    const videoStats = await this.videoRepository
      .createQueryBuilder('video')
      .select([
        'COUNT(*) as totalVideos',
        'SUM(views) as totalViews'
      ])
      .where('video.status = :status', { status: VideoStatus.PUBLISHED })
      .getRawOne()

    const affiliateStats = await this.affiliateRepository
      .createQueryBuilder('affiliate')
      .select([
        'SUM(totalEarnings) as totalEarnings',
        'SUM(totalSales) as totalSales'
      ])
      .getRawOne()

    return {
      totalCreators,
      activeCreators,
      pendingApproval,
      suspendedCreators,
      totalVideos: parseInt(videoStats.totalVideos) || 0,
      totalViews: parseInt(videoStats.totalViews) || 0,
      totalEarnings: parseFloat(affiliateStats.totalEarnings) || 0,
      totalSales: parseInt(affiliateStats.totalSales) || 0
    }
  }

  async getCreatorAnalytics(): Promise<CreatorAnalytics> {
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Top creators by performance
    const topCreators = await this.affiliateRepository
      .createQueryBuilder('affiliate')
      .select([
        'affiliate.id',
        'affiliate.username',
        'affiliate.name',
        'affiliate.followersCount',
        'affiliate.totalViews',
        'affiliate.totalSales',
        'affiliate.totalEarnings'
      ])
      .where('affiliate.status = :status', { status: AffiliateStatus.APPROVED })
      .andWhere('affiliate.isActive = :isActive', { isActive: true })
      .orderBy('affiliate.totalEarnings', 'DESC')
      .limit(10)
      .getMany()

    // Calculate engagement rates for top creators
    const topCreatorsWithEngagement = await Promise.all(
      topCreators.map(async (creator) => {
        const engagementStats = await this.videoRepository
          .createQueryBuilder('video')
          .select('AVG(CASE WHEN video.views > 0 THEN (video.likes + video.comments + video.shares) * 100.0 / video.views ELSE 0 END) as engagementRate')
          .where('video.affiliateId = :affiliateId', { affiliateId: creator.id })
          .andWhere('video.status = :status', { status: VideoStatus.PUBLISHED })
          .getRawOne()

        return {
          ...creator,
          engagementRate: parseFloat(engagementStats.engagementRate) || 0
        }
      })
    )

    // Content statistics
    const contentStats = await this.videoRepository
      .createQueryBuilder('video')
      .select([
        'COUNT(*) as totalVideos',
        'AVG(video.views) as avgViewsPerVideo',
        'AVG(CASE WHEN video.views > 0 THEN (video.likes + video.comments + video.shares) * 100.0 / video.views ELSE 0 END) as avgEngagementRate'
      ])
      .where('video.status = :status', { status: VideoStatus.PUBLISHED })
      .getRawOne()

    const totalLiveStreams = await this.liveStreamRepository.count({
      where: { hostType: HostType.AFFILIATE }
    })

    // Platform growth this month
    const [newCreatorsThisMonth, newContentThisMonth, totalFollowsThisMonth] = await Promise.all([
      this.affiliateRepository.count({
        where: { createdAt: { $gte: thisMonthStart } as any }
      }),
      this.videoRepository.count({
        where: { publishedAt: { $gte: thisMonthStart } as any }
      }),
      this.followerRepository.count({
        where: { createdAt: { $gte: thisMonthStart } as any, isActive: true }
      })
    ])

    return {
      topCreators: topCreatorsWithEngagement,
      contentStats: {
        totalVideos: parseInt(contentStats.totalVideos) || 0,
        totalLiveStreams,
        avgViewsPerVideo: parseFloat(contentStats.avgViewsPerVideo) || 0,
        avgEngagementRate: parseFloat(contentStats.avgEngagementRate) || 0
      },
      platformGrowth: {
        newCreatorsThisMonth,
        newContentThisMonth,
        totalFollowsThisMonth
      }
    }
  }

  async getAllCreators(
    page: number = 1,
    limit: number = 20,
    status?: AffiliateStatus,
    search?: string,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Promise<any> {
    const offset = (page - 1) * limit

    const queryBuilder = this.affiliateRepository.createQueryBuilder('affiliate')

    if (status) {
      queryBuilder.where('affiliate.status = :status', { status })
    }

    if (search) {
      queryBuilder.andWhere(
        '(affiliate.username ILIKE :search OR affiliate.name ILIKE :search OR affiliate.email ILIKE :search)',
        { search: `%${search}%` }
      )
    }

    const [creators, total] = await queryBuilder
      .orderBy(`affiliate.${sortBy}`, sortOrder)
      .skip(offset)
      .take(limit)
      .getManyAndCount()

    return {
      creators: creators.map(creator => ({
        id: creator.id,
        username: creator.username,
        name: creator.name,
        email: creator.email,
        status: creator.status,
        isVerified: creator.isVerified,
        isActive: creator.isActive,
        followersCount: creator.followersCount,
        videosCount: creator.videosCount,
        totalViews: creator.totalViews,
        totalSales: creator.totalSales,
        totalEarnings: creator.totalEarnings,
        commissionRate: creator.commissionRate,
        createdAt: creator.createdAt,
        lastActiveAt: creator.lastActiveAt
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async getCreatorDetails(creatorId: string): Promise<any> {
    const creator = await this.affiliateRepository.findOne({
      where: { id: creatorId }
    })

    if (!creator) {
      throw new NotFoundException('Creator not found')
    }

    // Get additional statistics (wrap in try-catch to prevent failures)
    let videoStats = null
    let streamStats = null
    let productStats = null

    try {
      [videoStats, streamStats, productStats] = await Promise.all([
        this.getCreatorVideoStats(creatorId),
        this.getCreatorStreamStats(creatorId),
        this.getCreatorProductStats(creatorId)
      ])
    } catch (error) {
      console.error('Error fetching creator stats:', error)
    }

    // Remove sensitive data
    const { passwordHash, ...creatorData } = creator

    return {
      creator: creatorData,
      stats: {
        videos: videoStats,
        streams: streamStats,
        products: productStats
      }
    }
  }

  async approveCreator(creatorId: string, adminId: string): Promise<Affiliate> {
    const creator = await this.affiliateRepository.findOne({
      where: { id: creatorId }
    })

    if (!creator) {
      throw new NotFoundException('Creator not found')
    }

    if (creator.status !== AffiliateStatus.PENDING) {
      throw new BadRequestException('Only pending creators can be approved')
    }

    creator.status = AffiliateStatus.APPROVED
    creator.updatedAt = new Date()

    const updatedCreator = await this.affiliateRepository.save(creator)

    // Send approval notification
    await this.createNotification({
      recipientId: creatorId,
      type: NotificationType.MILESTONE_REACHED,
      title: 'Account Approved',
      message: 'Your creator account has been approved! You can now start earning commissions.',
      data: { status: 'approved' }
    })

    return updatedCreator
  }

  async rejectCreator(creatorId: string, reason: string, adminId: string): Promise<Affiliate> {
    const creator = await this.affiliateRepository.findOne({
      where: { id: creatorId }
    })

    if (!creator) {
      throw new NotFoundException('Creator not found')
    }

    creator.status = AffiliateStatus.REJECTED
    creator.updatedAt = new Date()

    const updatedCreator = await this.affiliateRepository.save(creator)

    // Send rejection notification
    await this.createNotification({
      recipientId: creatorId,
      type: NotificationType.MILESTONE_REACHED,
      title: 'Account Rejected',
      message: `Your creator account application was rejected. Reason: ${reason}`,
      data: { status: 'rejected', reason }
    })

    return updatedCreator
  }

  async suspendCreator(creatorId: string, reason: string, adminId: string): Promise<Affiliate> {
    const creator = await this.affiliateRepository.findOne({
      where: { id: creatorId }
    })

    if (!creator) {
      throw new NotFoundException('Creator not found')
    }

    creator.status = AffiliateStatus.SUSPENDED
    creator.isActive = false
    creator.updatedAt = new Date()

    const updatedCreator = await this.affiliateRepository.save(creator)

    // Send suspension notification
    await this.createNotification({
      recipientId: creatorId,
      type: NotificationType.MILESTONE_REACHED,
      title: 'Account Suspended',
      message: `Your creator account has been suspended. Reason: ${reason}`,
      data: { status: 'suspended', reason }
    })

    return updatedCreator
  }

  async unsuspendCreator(creatorId: string, adminId: string): Promise<Affiliate> {
    const creator = await this.affiliateRepository.findOne({
      where: { id: creatorId }
    })

    if (!creator) {
      throw new NotFoundException('Creator not found')
    }

    creator.status = AffiliateStatus.APPROVED
    creator.isActive = true
    creator.updatedAt = new Date()

    const updatedCreator = await this.affiliateRepository.save(creator)

    // Send reactivation notification
    await this.createNotification({
      recipientId: creatorId,
      type: NotificationType.MILESTONE_REACHED,
      title: 'Account Reactivated',
      message: 'Your creator account has been reactivated. Welcome back!',
      data: { status: 'reactivated' }
    })

    return updatedCreator
  }

  async updateCreatorCommissionRate(creatorId: string, newRate: number, adminId: string): Promise<Affiliate> {
    if (newRate < 0 || newRate > 50) {
      throw new BadRequestException('Commission rate must be between 0% and 50%')
    }

    const creator = await this.affiliateRepository.findOne({
      where: { id: creatorId }
    })

    if (!creator) {
      throw new NotFoundException('Creator not found')
    }

    const oldRate = creator.commissionRate
    creator.commissionRate = newRate
    creator.updatedAt = new Date()

    const updatedCreator = await this.affiliateRepository.save(creator)

    // Send rate change notification
    await this.createNotification({
      recipientId: creatorId,
      type: NotificationType.MILESTONE_REACHED,
      title: 'Commission Rate Updated',
      message: `Your commission rate has been updated from ${oldRate}% to ${newRate}%.`,
      data: { oldRate, newRate }
    })

    return updatedCreator
  }

  async verifyCreator(creatorId: string, adminId: string): Promise<Affiliate> {
    const creator = await this.affiliateRepository.findOne({
      where: { id: creatorId }
    })

    if (!creator) {
      throw new NotFoundException('Creator not found')
    }

    creator.isVerified = true
    creator.updatedAt = new Date()

    const updatedCreator = await this.affiliateRepository.save(creator)

    // Send verification notification
    await this.createNotification({
      recipientId: creatorId,
      type: NotificationType.MILESTONE_REACHED,
      title: 'Account Verified',
      message: 'Congratulations! Your creator account has been verified.',
      data: { verified: true }
    })

    return updatedCreator
  }

  async moderateContent(videoId: string, action: 'approve' | 'remove' | 'flag', reason?: string, adminId?: string): Promise<void> {
    const video = await this.videoRepository.findOne({
      where: { id: videoId },
      relations: ['affiliate']
    })

    if (!video) {
      throw new NotFoundException('Video not found')
    }

    switch (action) {
      case 'approve':
        video.status = VideoStatus.PUBLISHED
        break
      case 'remove':
        video.status = VideoStatus.REMOVED
        break
      case 'flag':
        video.status = VideoStatus.REPORTED
        break
    }

    video.updatedAt = new Date()
    await this.videoRepository.save(video)

    // Notify creator about moderation action
    if (action !== 'approve') {
      await this.createNotification({
        recipientId: video.affiliateId,
        type: NotificationType.MILESTONE_REACHED,
        title: 'Content Moderated',
        message: `Your video "${video.title}" has been ${action}ed. ${reason ? `Reason: ${reason}` : ''}`,
        data: { videoId, action, reason }
      })
    }
  }

  private async getCreatorVideoStats(creatorId: string): Promise<any> {
    return this.videoRepository
      .createQueryBuilder('video')
      .select([
        'COUNT(*) as total',
        'SUM(CASE WHEN video.status = \'published\' THEN 1 ELSE 0 END) as published',
        'SUM(video.views) as "totalViews"',
        'SUM(video.likes) as "totalLikes"',
        'SUM(video.comments) as "totalComments"',
        'SUM(video.shares) as "totalShares"',
        'AVG(CASE WHEN video.views > 0 THEN (video.likes + video.comments + video.shares) * 100.0 / video.views ELSE 0 END) as "avgEngagement"'
      ])
      .where('video."affiliateId" = :creatorId', { creatorId })
      .getRawOne()
  }

  private async getCreatorStreamStats(creatorId: string): Promise<any> {
    return this.liveStreamRepository
      .createQueryBuilder('stream')
      .select([
        'COUNT(*) as total',
        'SUM(stream."peakViewers") as "totalViewers"',
        'SUM(stream."totalSales") as "totalRevenue"',
        'AVG(stream."peakViewers") as "avgViewers"'
      ])
      .where('stream."affiliateId" = :creatorId', { creatorId })
      .getRawOne()
  }

  private async getCreatorProductStats(creatorId: string): Promise<any> {
    return this.affiliateProductRepository
      .createQueryBuilder('product')
      .select([
        'COUNT(*) as total',
        'SUM(product."totalSales") as "totalSales"',
        'SUM(product."totalRevenue") as "totalRevenue"',
        'SUM(product."totalCommissions") as "totalCommissions"'
      ])
      .where('product."affiliateId" = :creatorId', { creatorId })
      .getRawOne()
  }

  private async createNotification(data: any): Promise<void> {
    const notification = this.notificationRepository.create(data)
    await this.notificationRepository.save(notification)
  }
}