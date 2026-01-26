import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Affiliate } from '../entities/affiliate.entity'
import { AffiliateFollower } from '../entities/affiliate-follower.entity'
import { AffiliateNotification, NotificationType } from '../entities/affiliate-notification.entity'
import { User } from '../../users/user.entity'

export interface CreatorProfileData {
  username?: string
  name?: string
  bio?: string
  avatarUrl?: string
  coverImageUrl?: string
  location?: string
  categories?: string[]
  website?: string
  socialMedia?: string
  isProfilePublic?: boolean
}

export interface FollowStats {
  followersCount: number
  followingCount: number
  isFollowing: boolean
  mutualFollows: number
}

@Injectable()
export class CreatorProfileService {
  constructor(
    @InjectRepository(Affiliate)
    private affiliateRepository: Repository<Affiliate>,
    @InjectRepository(AffiliateFollower)
    private followerRepository: Repository<AffiliateFollower>,
    @InjectRepository(AffiliateNotification)
    private notificationRepository: Repository<AffiliateNotification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async updateProfile(affiliateId: string, data: CreatorProfileData): Promise<Affiliate> {
    const affiliate = await this.affiliateRepository.findOne({
      where: { id: affiliateId }
    })

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found')
    }

    // Check username uniqueness if provided
    if (data.username && data.username !== affiliate.username) {
      const existingUsername = await this.affiliateRepository.findOne({
        where: { username: data.username }
      })
      if (existingUsername) {
        throw new ConflictException('Username already taken')
      }
    }

    // Update profile
    Object.assign(affiliate, data)
    affiliate.updatedAt = new Date()

    return this.affiliateRepository.save(affiliate)
  }

  async getPublicProfile(username: string, viewerUserId?: string): Promise<any> {
    const affiliate = await this.affiliateRepository.findOne({
      where: { username, isProfilePublic: true, isActive: true },
      relations: ['videos', 'liveStreams', 'affiliateProducts', 'affiliateProducts.product']
    })

    if (!affiliate) {
      throw new NotFoundException('Creator not found or profile is private')
    }

    // Get follow stats
    const followStats = await this.getFollowStats(affiliate.id, viewerUserId)

    // Get recent videos (published only)
    const recentVideos = affiliate.videos
      ?.filter(video => video.status === 'published')
      ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      ?.slice(0, 12)

    // Get active live streams
    const activeLiveStreams = affiliate.liveStreams
      ?.filter(stream => stream.status === 'live' || stream.status === 'scheduled')
      ?.sort((a, b) => new Date(b.scheduledAt || b.createdAt).getTime() - new Date(a.scheduledAt || a.createdAt).getTime())

    // Get promoted products
    const promotedProducts = affiliate.affiliateProducts
      ?.filter(ap => ap.status === 'active')
      ?.map(ap => ({
        id: ap.id,
        product: ap.product,
        specialPrice: ap.specialPrice,
        promotionalText: ap.promotionalText,
        clicks: ap.totalClicks,
        sales: ap.totalSales
      }))

    return {
      id: affiliate.id,
      username: affiliate.username,
      name: affiliate.name,
      bio: affiliate.bio,
      avatarUrl: affiliate.avatarUrl,
      coverImageUrl: affiliate.coverImageUrl,
      location: affiliate.location,
      categories: affiliate.categories,
      website: affiliate.website,
      socialMedia: affiliate.socialMedia,
      isVerified: affiliate.isVerified,
      stats: {
        followersCount: affiliate.followersCount,
        followingCount: affiliate.followingCount,
        totalViews: affiliate.totalViews,
        totalSales: affiliate.totalSales,
        productsPromoted: affiliate.productsPromoted,
        videosCount: affiliate.videosCount,
        liveStreamsCount: affiliate.liveStreamsCount
      },
      followStats,
      recentVideos,
      activeLiveStreams,
      promotedProducts,
      createdAt: affiliate.createdAt
    }
  }

  async followAffiliate(followerId: string, affiliateId: string): Promise<void> {
    // Check if affiliate exists
    const affiliate = await this.affiliateRepository.findOne({
      where: { id: affiliateId, isActive: true }
    })
    if (!affiliate) {
      throw new NotFoundException('Creator not found')
    }

    // Check if already following
    const existingFollow = await this.followerRepository.findOne({
      where: { followerId, followingId: affiliateId, isActive: true }
    })
    if (existingFollow) {
      throw new ConflictException('Already following this creator')
    }

    // Create follow relationship
    const follow = this.followerRepository.create({
      followerId,
      followingId: affiliateId,
      isActive: true,
      receiveNotifications: true
    })
    await this.followerRepository.save(follow)

    // Update follower count
    await this.affiliateRepository.increment({ id: affiliateId }, 'followersCount', 1)

    // Create notification
    await this.createNotification({
      recipientId: affiliateId,
      triggeredByUserId: followerId,
      type: NotificationType.NEW_FOLLOWER,
      title: 'New Follower',
      message: 'You have a new follower!',
      data: { followerId }
    })
  }

  async unfollowAffiliate(followerId: string, affiliateId: string): Promise<void> {
    const follow = await this.followerRepository.findOne({
      where: { followerId, followingId: affiliateId, isActive: true }
    })

    if (!follow) {
      throw new NotFoundException('Not following this creator')
    }

    // Soft delete
    follow.isActive = false
    await this.followerRepository.save(follow)

    // Update follower count
    await this.affiliateRepository.decrement({ id: affiliateId }, 'followersCount', 1)
  }

  async getFollowStats(affiliateId: string, viewerUserId?: string): Promise<FollowStats> {
    const affiliate = await this.affiliateRepository.findOne({
      where: { id: affiliateId }
    })

    if (!affiliate) {
      throw new NotFoundException('Creator not found')
    }

    let isFollowing = false
    let mutualFollows = 0

    if (viewerUserId) {
      // Check if viewer is following this affiliate
      const followRelation = await this.followerRepository.findOne({
        where: { followerId: viewerUserId, followingId: affiliateId, isActive: true }
      })
      isFollowing = !!followRelation

      // Count mutual follows (people both follow)
      const viewerFollowing = await this.followerRepository.find({
        where: { followerId: viewerUserId, isActive: true },
        select: ['followingId']
      })
      const affiliateFollowing = await this.followerRepository.find({
        where: { followerId: affiliateId, isActive: true },
        select: ['followingId']
      })

      const viewerFollowingIds = new Set(viewerFollowing.map(f => f.followingId))
      mutualFollows = affiliateFollowing.filter(f => viewerFollowingIds.has(f.followingId)).length
    }

    return {
      followersCount: affiliate.followersCount,
      followingCount: affiliate.followingCount,
      isFollowing,
      mutualFollows
    }
  }

  async getFollowers(affiliateId: string, page: number = 1, limit: number = 20): Promise<any> {
    const offset = (page - 1) * limit

    const [followers, total] = await this.followerRepository.findAndCount({
      where: { followingId: affiliateId, isActive: true },
      relations: ['followerUser', 'followerAffiliate'],
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit
    })

    const followersData = followers.map(follow => ({
      id: follow.id,
      user: follow.followerUser,
      followedAt: follow.createdAt
    }))

    return {
      followers: followersData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async getFollowing(affiliateId: string, page: number = 1, limit: number = 20): Promise<any> {
    const offset = (page - 1) * limit

    const [following, total] = await this.followerRepository.findAndCount({
      where: { followerId: affiliateId, isActive: true },
      relations: ['following'],
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit
    })

    const followingData = following.map(follow => ({
      id: follow.id,
      affiliate: follow.following,
      followedAt: follow.createdAt
    }))

    return {
      following: followingData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async searchCreators(query: string, category?: string, page: number = 1, limit: number = 20): Promise<any> {
    const offset = (page - 1) * limit

    const queryBuilder = this.affiliateRepository.createQueryBuilder('affiliate')
      .where('affiliate.isProfilePublic = :isPublic', { isPublic: true })
      .andWhere('affiliate.isActive = :isActive', { isActive: true })

    if (query) {
      queryBuilder.andWhere(
        '(affiliate.username ILIKE :query OR affiliate.name ILIKE :query OR affiliate.bio ILIKE :query)',
        { query: `%${query}%` }
      )
    }

    if (category) {
      queryBuilder.andWhere('affiliate.categories @> :category', { category: [category] })
    }

    const [creators, total] = await queryBuilder
      .orderBy('affiliate.followersCount', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount()

    return {
      creators: creators.map(creator => ({
        id: creator.id,
        username: creator.username,
        name: creator.name,
        bio: creator.bio,
        avatarUrl: creator.avatarUrl,
        location: creator.location,
        categories: creator.categories,
        isVerified: creator.isVerified,
        followersCount: creator.followersCount,
        totalViews: creator.totalViews,
        videosCount: creator.videosCount
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  private async createNotification(data: any): Promise<void> {
    const notification = this.notificationRepository.create(data)
    await this.notificationRepository.save(notification)
  }

  async updateLastActive(affiliateId: string): Promise<void> {
    await this.affiliateRepository.update(affiliateId, {
      lastActiveAt: new Date()
    })
  }

  /**
   * Get public profile by affiliate ID (for mobile app)
   */
  async getPublicProfileById(affiliateId: string, viewerUserId?: string): Promise<any> {
    const affiliate = await this.affiliateRepository.findOne({
      where: { id: affiliateId, isProfilePublic: true, isActive: true },
      relations: ['videos', 'liveStreams', 'affiliateProducts', 'affiliateProducts.product']
    })

    if (!affiliate) {
      throw new NotFoundException('Creator not found or profile is private')
    }

    // Get follow stats
    const followStats = await this.getFollowStats(affiliate.id, viewerUserId)

    // Get recent videos (published only)
    const recentVideos = affiliate.videos
      ?.filter(video => video.status === 'published')
      ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      ?.slice(0, 12)

    // Get active live streams
    const activeLiveStreams = affiliate.liveStreams
      ?.filter(stream => stream.status === 'live' || stream.status === 'scheduled')
      ?.sort((a, b) => new Date(b.scheduledAt || b.createdAt).getTime() - new Date(a.scheduledAt || a.createdAt).getTime())

    // Get promoted products
    const promotedProducts = affiliate.affiliateProducts
      ?.filter(ap => ap.status === 'active')
      ?.map(ap => ({
        id: ap.id,
        product: ap.product,
        specialPrice: ap.specialPrice,
        promotionalText: ap.promotionalText,
        clicks: ap.totalClicks,
        sales: ap.totalSales
      }))

    return {
      id: affiliate.id,
      username: affiliate.username,
      name: affiliate.name,
      bio: affiliate.bio,
      avatarUrl: affiliate.avatarUrl,
      coverImageUrl: affiliate.coverImageUrl,
      location: affiliate.location,
      categories: affiliate.categories,
      website: affiliate.website,
      socialMedia: affiliate.socialMedia,
      isVerified: affiliate.isVerified,
      stats: {
        followersCount: affiliate.followersCount,
        followingCount: affiliate.followingCount,
        totalViews: affiliate.totalViews,
        totalSales: affiliate.totalSales,
        productsPromoted: affiliate.productsPromoted,
        videosCount: affiliate.videosCount,
        liveStreamsCount: affiliate.liveStreamsCount
      },
      followStats,
      recentVideos,
      activeLiveStreams,
      promotedProducts,
      createdAt: affiliate.createdAt
    }
  }

  /**
   * Get affiliate streams with pagination (for mobile app profile tabs)
   */
  async getAffiliateStreams(
    affiliateId: string,
    status?: 'live' | 'ended' | 'all',
    page: number = 1,
    limit: number = 20
  ): Promise<any> {
    const affiliate = await this.affiliateRepository.findOne({
      where: { id: affiliateId, isProfilePublic: true, isActive: true }
    })

    if (!affiliate) {
      throw new NotFoundException('Creator not found or profile is private')
    }

    const offset = (page - 1) * limit

    // Build query for streams
    const queryBuilder = this.affiliateRepository
      .createQueryBuilder('affiliate')
      .leftJoinAndSelect('affiliate.liveStreams', 'stream')
      .where('affiliate.id = :affiliateId', { affiliateId })

    if (status === 'live') {
      queryBuilder.andWhere('stream.status = :status', { status: 'live' })
    } else if (status === 'ended') {
      queryBuilder.andWhere('stream.status = :status', { status: 'ended' })
    }
    // 'all' returns all streams

    const result = await queryBuilder.getOne()

    const allStreams = result?.liveStreams || []
    const filteredStreams = status && status !== 'all'
      ? allStreams.filter(s => s.status === status)
      : allStreams

    // Sort by created date desc
    const sortedStreams = filteredStreams.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Paginate
    const paginatedStreams = sortedStreams.slice(offset, offset + limit)
    const total = sortedStreams.length

    return {
      streams: paginatedStreams.map(s => ({
        id: s.id,
        title: s.title,
        description: s.description,
        thumbnailUrl: s.thumbnailUrl,
        status: s.status,
        viewerCount: s.viewerCount,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        createdAt: s.createdAt
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
}