import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { SellerFollower } from '../entities/seller-follower.entity'
import { Seller, VerificationStatus } from '../entities/seller.entity'
import { User } from '../../database/entities/user.entity'

export interface SellerFollowerInfo {
  id: string
  firstName: string
  lastName: string
  avatar?: string
  followedAt: Date
}

export interface SellerFollowStats {
  followersCount: number
  isFollowing: boolean
  notificationsEnabled: boolean
}

@Injectable()
export class SellerFollowService {
  constructor(
    @InjectRepository(SellerFollower)
    private readonly followerRepository: Repository<SellerFollower>,
    @InjectRepository(Seller)
    private readonly sellerRepository: Repository<Seller>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Follow a seller
   */
  async followSeller(userId: string, sellerId: string): Promise<SellerFollower> {
    // Verify seller exists and is approved
    const seller = await this.sellerRepository.findOne({
      where: { id: sellerId },
    })

    if (!seller) {
      throw new NotFoundException('Seller not found')
    }

    if (seller.verificationStatus !== VerificationStatus.APPROVED) {
      throw new BadRequestException('Cannot follow an unverified seller')
    }

    // Check if already following
    const existingFollow = await this.followerRepository.findOne({
      where: { followerId: userId, sellerId, isActive: true },
    })

    if (existingFollow) {
      throw new ConflictException('Already following this seller')
    }

    // Check if there's an inactive follow to reactivate
    const inactiveFollow = await this.followerRepository.findOne({
      where: { followerId: userId, sellerId, isActive: false },
    })

    if (inactiveFollow) {
      inactiveFollow.isActive = true
      inactiveFollow.notificationsEnabled = true
      await this.followerRepository.save(inactiveFollow)
      await this.updateFollowersCount(sellerId)
      return inactiveFollow
    }

    // Create new follow
    const follow = this.followerRepository.create({
      followerId: userId,
      sellerId,
      notificationsEnabled: true,
      isActive: true,
    })

    const savedFollow = await this.followerRepository.save(follow)
    await this.updateFollowersCount(sellerId)

    return savedFollow
  }

  /**
   * Unfollow a seller (soft delete)
   */
  async unfollowSeller(userId: string, sellerId: string): Promise<void> {
    const follow = await this.followerRepository.findOne({
      where: { followerId: userId, sellerId, isActive: true },
    })

    if (!follow) {
      throw new NotFoundException('Not following this seller')
    }

    follow.isActive = false
    await this.followerRepository.save(follow)
    await this.updateFollowersCount(sellerId)
  }

  /**
   * Check if user is following a seller
   */
  async isFollowing(
    userId: string,
    sellerId: string,
  ): Promise<{ isFollowing: boolean; notificationsEnabled?: boolean; followedAt?: Date }> {
    const follow = await this.followerRepository.findOne({
      where: { followerId: userId, sellerId, isActive: true },
    })

    if (!follow) {
      return { isFollowing: false }
    }

    return {
      isFollowing: true,
      notificationsEnabled: follow.notificationsEnabled,
      followedAt: follow.createdAt,
    }
  }

  /**
   * Toggle notifications for a followed seller
   */
  async toggleNotifications(
    userId: string,
    sellerId: string,
    enabled: boolean,
  ): Promise<SellerFollower> {
    const follow = await this.followerRepository.findOne({
      where: { followerId: userId, sellerId, isActive: true },
    })

    if (!follow) {
      throw new NotFoundException('Not following this seller')
    }

    follow.notificationsEnabled = enabled
    return this.followerRepository.save(follow)
  }

  /**
   * Get followers of a seller with pagination
   */
  async getFollowers(
    sellerId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    followers: SellerFollowerInfo[]
    total: number
    page: number
    totalPages: number
  }> {
    const offset = (page - 1) * limit

    const [follows, total] = await this.followerRepository.findAndCount({
      where: { sellerId, isActive: true },
      relations: ['follower'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    })

    const followers: SellerFollowerInfo[] = follows.map((f) => ({
      id: f.follower.id,
      firstName: f.follower.firstName,
      lastName: f.follower.lastName,
      avatar: f.follower.avatar,
      followedAt: f.createdAt,
    }))

    return {
      followers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Get sellers a user is following
   */
  async getFollowingSellers(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    sellers: Array<{
      id: string
      businessName: string
      logoUrl?: string
      followersCount: number
      followedAt: Date
    }>
    total: number
    page: number
    totalPages: number
  }> {
    const offset = (page - 1) * limit

    const [follows, total] = await this.followerRepository.findAndCount({
      where: { followerId: userId, isActive: true },
      relations: ['seller'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    })

    const sellers = follows.map((f) => ({
      id: f.seller.id,
      businessName: f.seller.businessName,
      logoUrl: f.seller.logoUrl,
      followersCount: f.seller.followersCount,
      followedAt: f.createdAt,
    }))

    return {
      sellers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Get follower count for a seller
   */
  async getFollowersCount(sellerId: string): Promise<number> {
    return this.followerRepository.count({
      where: { sellerId, isActive: true },
    })
  }

  /**
   * Update the cached followers count on the seller entity
   */
  private async updateFollowersCount(sellerId: string): Promise<void> {
    const count = await this.getFollowersCount(sellerId)
    await this.sellerRepository.update(sellerId, { followersCount: count })
  }

  /**
   * Get follower IDs with notifications enabled (for push notifications)
   */
  async getFollowerIdsWithNotifications(sellerId: string): Promise<string[]> {
    const follows = await this.followerRepository.find({
      where: { sellerId, isActive: true, notificationsEnabled: true },
      select: ['followerId'],
    })

    return follows.map((f) => f.followerId)
  }
}
