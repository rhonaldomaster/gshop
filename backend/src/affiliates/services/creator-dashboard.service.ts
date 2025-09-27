import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Affiliate } from '../entities/affiliate.entity'
import { AffiliateVideo, VideoStatus } from '../entities/affiliate-video.entity'
import { AffiliateFollower } from '../entities/affiliate-follower.entity'
import { AffiliateProduct } from '../entities/affiliate-product.entity'
import { LiveStream, StreamStatus } from '../../live/live.entity'
import { AffiliateNotification } from '../entities/affiliate-notification.entity'

export interface DashboardStats {
  profile: {
    followersCount: number
    followingCount: number
    totalViews: number
    videosCount: number
    liveStreamsCount: number
    totalSales: number
    productsPromoted: number
  }
  earnings: {
    totalEarnings: number
    availableBalance: number
    pendingBalance: number
    commissionRate: number
    thisMonthEarnings: number
    lastMonthEarnings: number
  }
  content: {
    totalVideos: number
    publishedVideos: number
    draftVideos: number
    totalVideoViews: number
    totalVideoLikes: number
    averageEngagement: number
  }
  liveStreams: {
    totalStreams: number
    scheduledStreams: number
    totalStreamViews: number
    totalStreamRevenue: number
    averageViewers: number
  }
  recent: {
    newFollowers: number
    newComments: number
    newLikes: number
    unreadNotifications: number
  }
}

export interface PerformanceMetrics {
  followers: { date: string; count: number }[]
  views: { date: string; count: number }[]
  earnings: { date: string; amount: number }[]
  engagement: { date: string; rate: number }[]
}

@Injectable()
export class CreatorDashboardService {
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

  async getDashboardStats(affiliateId: string): Promise<DashboardStats> {
    const affiliate = await this.affiliateRepository.findOne({
      where: { id: affiliateId }
    })

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found')
    }

    // Get date ranges
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Video statistics
    const videoStats = await this.videoRepository
      .createQueryBuilder('video')
      .select([
        'COUNT(*) as totalVideos',
        'SUM(CASE WHEN status = \'published\' THEN 1 ELSE 0 END) as publishedVideos',
        'SUM(CASE WHEN status = \'draft\' THEN 1 ELSE 0 END) as draftVideos',
        'SUM(views) as totalVideoViews',
        'SUM(likes) as totalVideoLikes',
        'AVG(CASE WHEN views > 0 THEN (likes + comments + shares) * 100.0 / views ELSE 0 END) as averageEngagement'
      ])
      .where('video.affiliateId = :affiliateId', { affiliateId })
      .getRawOne()

    // Live stream statistics
    const streamStats = await this.liveStreamRepository
      .createQueryBuilder('stream')
      .select([
        'COUNT(*) as totalStreams',
        'SUM(CASE WHEN status = \'scheduled\' THEN 1 ELSE 0 END) as scheduledStreams',
        'SUM(peakViewers) as totalStreamViews',
        'SUM(totalSales) as totalStreamRevenue',
        'AVG(peakViewers) as averageViewers'
      ])
      .where('stream.affiliateId = :affiliateId', { affiliateId })
      .getRawOne()

    // Recent activity (last 7 days)
    const newFollowers = await this.followerRepository.count({
      where: {
        followingId: affiliateId,
        isActive: true,
        createdAt: { $gte: last7Days } as any
      }
    })

    const recentVideoInteractions = await this.videoRepository
      .createQueryBuilder('video')
      .leftJoin('video.interactions', 'interaction')
      .select([
        'SUM(CASE WHEN interaction.type = \'comment\' AND interaction.createdAt >= :last7Days THEN 1 ELSE 0 END) as newComments',
        'SUM(CASE WHEN interaction.type = \'like\' AND interaction.createdAt >= :last7Days THEN 1 ELSE 0 END) as newLikes'
      ])
      .where('video.affiliateId = :affiliateId', { affiliateId })
      .setParameter('last7Days', last7Days)
      .getRawOne()

    const unreadNotifications = await this.notificationRepository.count({
      where: {
        recipientId: affiliateId,
        isRead: false
      }
    })

    // Calculate this month and last month earnings
    const thisMonthEarnings = await this.calculateEarningsForPeriod(affiliateId, thisMonthStart, now)
    const lastMonthEarnings = await this.calculateEarningsForPeriod(affiliateId, lastMonthStart, lastMonthEnd)

    return {
      profile: {
        followersCount: affiliate.followersCount,
        followingCount: affiliate.followingCount,
        totalViews: affiliate.totalViews,
        videosCount: affiliate.videosCount,
        liveStreamsCount: affiliate.liveStreamsCount,
        totalSales: affiliate.totalSales,
        productsPromoted: affiliate.productsPromoted
      },
      earnings: {
        totalEarnings: Number(affiliate.totalEarnings),
        availableBalance: Number(affiliate.availableBalance),
        pendingBalance: Number(affiliate.pendingBalance),
        commissionRate: Number(affiliate.commissionRate),
        thisMonthEarnings,
        lastMonthEarnings
      },
      content: {
        totalVideos: parseInt(videoStats.totalVideos) || 0,
        publishedVideos: parseInt(videoStats.publishedVideos) || 0,
        draftVideos: parseInt(videoStats.draftVideos) || 0,
        totalVideoViews: parseInt(videoStats.totalVideoViews) || 0,
        totalVideoLikes: parseInt(videoStats.totalVideoLikes) || 0,
        averageEngagement: parseFloat(videoStats.averageEngagement) || 0
      },
      liveStreams: {
        totalStreams: parseInt(streamStats.totalStreams) || 0,
        scheduledStreams: parseInt(streamStats.scheduledStreams) || 0,
        totalStreamViews: parseInt(streamStats.totalStreamViews) || 0,
        totalStreamRevenue: parseFloat(streamStats.totalStreamRevenue) || 0,
        averageViewers: parseFloat(streamStats.averageViewers) || 0
      },
      recent: {
        newFollowers,
        newComments: parseInt(recentVideoInteractions.newComments) || 0,
        newLikes: parseInt(recentVideoInteractions.newLikes) || 0,
        unreadNotifications
      }
    }
  }

  async getPerformanceMetrics(affiliateId: string, days: number = 30): Promise<PerformanceMetrics> {
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)

    // Generate date range
    const dates = []
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split('T')[0])
    }

    // Followers growth
    const followersData = await this.getFollowersGrowth(affiliateId, startDate, endDate)

    // Views over time
    const viewsData = await this.getViewsOverTime(affiliateId, startDate, endDate)

    // Earnings over time
    const earningsData = await this.getEarningsOverTime(affiliateId, startDate, endDate)

    // Engagement rate over time
    const engagementData = await this.getEngagementOverTime(affiliateId, startDate, endDate)

    return {
      followers: this.fillMissingDates(followersData, dates),
      views: this.fillMissingDates(viewsData, dates),
      earnings: this.fillMissingDates(earningsData, dates),
      engagement: this.fillMissingDates(engagementData, dates)
    }
  }

  async getTopPerformingContent(affiliateId: string, limit: number = 10): Promise<any> {
    // Top videos by views
    const topVideos = await this.videoRepository.find({
      where: { affiliateId, status: VideoStatus.PUBLISHED },
      order: { views: 'DESC' },
      take: limit,
      select: ['id', 'title', 'views', 'likes', 'comments', 'shares', 'revenue', 'publishedAt']
    })

    // Top live streams by peak viewers
    const topStreams = await this.liveStreamRepository.find({
      where: { affiliateId, status: StreamStatus.ENDED },
      order: { peakViewers: 'DESC' },
      take: limit,
      select: ['id', 'title', 'peakViewers', 'totalSales', 'startedAt', 'endedAt']
    })

    // Top products by sales
    const topProducts = await this.affiliateProductRepository
      .createQueryBuilder('ap')
      .leftJoinAndSelect('ap.product', 'product')
      .where('ap.affiliateId = :affiliateId', { affiliateId })
      .orderBy('ap.totalSales', 'DESC')
      .take(limit)
      .getMany()

    return {
      topVideos,
      topStreams,
      topProducts: topProducts.map(ap => ({
        product: ap.product,
        totalSales: ap.totalSales,
        totalRevenue: ap.totalRevenue,
        totalCommissions: ap.totalCommissions,
        conversionRate: ap.totalClicks > 0 ? (ap.totalSales / ap.totalClicks) * 100 : 0
      }))
    }
  }

  async getNotifications(affiliateId: string, page: number = 1, limit: number = 20): Promise<any> {
    const offset = (page - 1) * limit

    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { recipientId: affiliateId },
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
      relations: ['triggeredByUser', 'triggeredByAffiliate']
    })

    return {
      notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async markNotificationAsRead(notificationId: string, affiliateId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, recipientId: affiliateId },
      { isRead: true }
    )
  }

  async markAllNotificationsAsRead(affiliateId: string): Promise<void> {
    await this.notificationRepository.update(
      { recipientId: affiliateId, isRead: false },
      { isRead: true }
    )
  }

  private async calculateEarningsForPeriod(affiliateId: string, startDate: Date, endDate: Date): Promise<number> {
    // This would need to be calculated from actual commission records
    // For now, we'll use a simplified calculation
    const videos = await this.videoRepository.find({
      where: {
        affiliateId,
        publishedAt: { $gte: startDate, $lte: endDate } as any
      },
      select: ['revenue']
    })

    const streams = await this.liveStreamRepository.find({
      where: {
        affiliateId,
        startedAt: { $gte: startDate, $lte: endDate } as any
      },
      select: ['totalSales']
    })

    const affiliate = await this.affiliateRepository.findOne({
      where: { id: affiliateId },
      select: ['commissionRate']
    })

    const commissionRate = Number(affiliate?.commissionRate || 5) / 100
    const videoRevenue = videos.reduce((sum, video) => sum + Number(video.revenue), 0)
    const streamRevenue = streams.reduce((sum, stream) => sum + Number(stream.totalSales), 0)

    return (videoRevenue + streamRevenue) * commissionRate
  }

  private async getFollowersGrowth(affiliateId: string, startDate: Date, endDate: Date): Promise<Array<{date: string; count: number}>> {
    const result = await this.followerRepository
      .createQueryBuilder('follower')
      .select([
        'DATE(follower.createdAt) as date',
        'COUNT(*) as count'
      ])
      .where('follower.followingId = :affiliateId', { affiliateId })
      .andWhere('follower.isActive = :isActive', { isActive: true })
      .andWhere('follower.createdAt >= :startDate', { startDate })
      .andWhere('follower.createdAt <= :endDate', { endDate })
      .groupBy('DATE(follower.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany()

    return result.map(r => ({
      date: r.date,
      count: parseInt(r.count)
    }))
  }

  private async getViewsOverTime(affiliateId: string, startDate: Date, endDate: Date): Promise<Array<{date: string; count: number}>> {
    const result = await this.videoRepository
      .createQueryBuilder('video')
      .leftJoin('video.interactions', 'interaction')
      .select([
        'DATE(interaction.createdAt) as date',
        'COUNT(*) as count'
      ])
      .where('video.affiliateId = :affiliateId', { affiliateId })
      .andWhere('interaction.type = :type', { type: 'view' })
      .andWhere('interaction.createdAt >= :startDate', { startDate })
      .andWhere('interaction.createdAt <= :endDate', { endDate })
      .groupBy('DATE(interaction.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany()

    return result.map(r => ({
      date: r.date,
      count: parseInt(r.count)
    }))
  }

  private async getEarningsOverTime(affiliateId: string, startDate: Date, endDate: Date): Promise<Array<{date: string; amount: number}>> {
    // Simplified earnings calculation
    const result = await this.videoRepository
      .createQueryBuilder('video')
      .select([
        'DATE(video.publishedAt) as date',
        'SUM(video.revenue) as amount'
      ])
      .where('video.affiliateId = :affiliateId', { affiliateId })
      .andWhere('video.publishedAt >= :startDate', { startDate })
      .andWhere('video.publishedAt <= :endDate', { endDate })
      .groupBy('DATE(video.publishedAt)')
      .orderBy('date', 'ASC')
      .getRawMany()

    return result.map(r => ({
      date: r.date,
      amount: parseFloat(r.amount) || 0
    }))
  }

  private async getEngagementOverTime(affiliateId: string, startDate: Date, endDate: Date): Promise<Array<{date: string; rate: number}>> {
    const result = await this.videoRepository
      .createQueryBuilder('video')
      .leftJoin('video.interactions', 'interaction')
      .select([
        'DATE(interaction.createdAt) as date',
        'AVG(CASE WHEN video.views > 0 THEN (video.likes + video.comments + video.shares) * 100.0 / video.views ELSE 0 END) as rate'
      ])
      .where('video.affiliateId = :affiliateId', { affiliateId })
      .andWhere('interaction.createdAt >= :startDate', { startDate })
      .andWhere('interaction.createdAt <= :endDate', { endDate })
      .groupBy('DATE(interaction.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany()

    return result.map(r => ({
      date: r.date,
      rate: parseFloat(r.rate) || 0
    }))
  }

  private fillMissingDates(data: Array<{date: string; count?: number; amount?: number; rate?: number}>, dates: string[]): any[] {
    const dataMap = new Map(data.map(item => [item.date, item]))

    return dates.map(date => {
      const existing = dataMap.get(date)
      return {
        date,
        count: existing?.count || 0,
        amount: existing?.amount || 0,
        rate: existing?.rate || 0
      }
    })
  }
}