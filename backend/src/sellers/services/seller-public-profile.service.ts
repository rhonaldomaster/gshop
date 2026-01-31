import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Seller, VerificationStatus } from '../entities/seller.entity'
import { SellerFollower } from '../entities/seller-follower.entity'
import { Product, ProductStatus } from '../../products/product.entity'
import { LiveStream, StreamStatus, HostType } from '../../live/live.entity'

export interface SellerPublicProfile {
  id: string
  businessName: string
  logoUrl?: string
  profileDescription?: string
  isVerified: boolean
  followersCount: number
  productsCount: number
  rating: number
  totalReviews: number
  city?: string
  state?: string
  createdAt: Date
  isFollowing?: boolean
  notificationsEnabled?: boolean
}

export interface SellerStreamSummary {
  id: string
  title: string
  description?: string
  thumbnailUrl?: string
  status: StreamStatus
  viewerCount: number
  startedAt?: Date
  endedAt?: Date
  createdAt: Date
}

export interface SellerProductSummary {
  id: string
  name: string
  price: number
  images: string[]
  vatType: string
  stock: number
}

export interface SellerSearchResult {
  id: string
  businessName: string
  logoUrl?: string
  profileDescription?: string
  isVerified: boolean
  followersCount: number
  productsCount: number
  city?: string
  state?: string
}

@Injectable()
export class SellerPublicProfileService {
  constructor(
    @InjectRepository(Seller)
    private readonly sellerRepository: Repository<Seller>,
    @InjectRepository(SellerFollower)
    private readonly followerRepository: Repository<SellerFollower>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(LiveStream)
    private readonly liveStreamRepository: Repository<LiveStream>,
  ) {}

  /**
   * Get public profile of a seller
   */
  async getPublicProfile(sellerId: string, viewerId?: string): Promise<SellerPublicProfile> {
    const seller = await this.sellerRepository.findOne({
      where: { id: sellerId },
    })

    if (!seller) {
      throw new NotFoundException('Seller not found')
    }

    if (seller.verificationStatus !== VerificationStatus.APPROVED) {
      throw new NotFoundException('Seller profile is not available')
    }

    if (!seller.isProfilePublic) {
      throw new NotFoundException('Seller profile is private')
    }

    // Get products count
    const productsCount = await this.productRepository.count({
      where: { sellerId, status: ProductStatus.ACTIVE },
    })

    // Get rating info from products
    const ratingInfo = await this.getSellerRatingFromProducts(sellerId)

    // Check if viewer is following
    let isFollowing = false
    let notificationsEnabled = false

    if (viewerId) {
      const follow = await this.followerRepository.findOne({
        where: { followerId: viewerId, sellerId, isActive: true },
      })
      if (follow) {
        isFollowing = true
        notificationsEnabled = follow.notificationsEnabled
      }
    }

    return {
      id: seller.id,
      businessName: seller.businessName,
      logoUrl: seller.logoUrl,
      profileDescription: seller.profileDescription,
      isVerified: seller.verificationStatus === VerificationStatus.APPROVED,
      followersCount: seller.followersCount,
      productsCount,
      rating: ratingInfo.rating,
      totalReviews: ratingInfo.totalReviews,
      city: seller.city,
      state: seller.state,
      createdAt: seller.createdAt,
      isFollowing,
      notificationsEnabled,
    }
  }

  /**
   * Get seller's public products with pagination
   */
  async getSellerProducts(
    sellerId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    products: SellerProductSummary[]
    total: number
    page: number
    totalPages: number
  }> {
    // Verify seller exists and is public
    const seller = await this.sellerRepository.findOne({
      where: { id: sellerId, verificationStatus: VerificationStatus.APPROVED },
    })

    if (!seller || !seller.isProfilePublic) {
      throw new NotFoundException('Seller not found or profile is private')
    }

    const offset = (page - 1) * limit

    const [products, total] = await this.productRepository.findAndCount({
      where: { sellerId, status: ProductStatus.ACTIVE },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    })

    const productSummaries: SellerProductSummary[] = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      images: p.images || [],
      vatType: p.vatType,
      stock: p.stock || 0,
    }))

    return {
      products: productSummaries,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Get seller's live streams (live and past)
   */
  async getSellerStreams(
    sellerId: string,
    status?: 'live' | 'ended' | 'all',
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    streams: SellerStreamSummary[]
    total: number
    page: number
    totalPages: number
  }> {
    // Verify seller exists and is public
    const seller = await this.sellerRepository.findOne({
      where: { id: sellerId, verificationStatus: VerificationStatus.APPROVED },
    })

    if (!seller || !seller.isProfilePublic) {
      throw new NotFoundException('Seller not found or profile is private')
    }

    const offset = (page - 1) * limit

    const whereClause: any = { sellerId, hostType: HostType.SELLER }

    if (status === 'live') {
      whereClause.status = StreamStatus.LIVE
    } else if (status === 'ended') {
      whereClause.status = StreamStatus.ENDED
    }
    // 'all' or undefined = no status filter

    const [streams, total] = await this.liveStreamRepository.findAndCount({
      where: whereClause,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    })

    const streamSummaries: SellerStreamSummary[] = streams.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      thumbnailUrl: s.thumbnailUrl,
      status: s.status,
      viewerCount: s.viewerCount,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      createdAt: s.createdAt,
    }))

    return {
      streams: streamSummaries,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Search sellers by name or business name
   */
  async searchSellers(
    query: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    sellers: SellerSearchResult[]
    total: number
    page: number
    totalPages: number
  }> {
    const offset = (page - 1) * limit
    const searchTerm = `%${query.toLowerCase()}%`

    const queryBuilder = this.sellerRepository
      .createQueryBuilder('seller')
      .where('seller.verificationStatus = :status', { status: VerificationStatus.APPROVED })
      .andWhere('seller.isProfilePublic = :isPublic', { isPublic: true })
      .andWhere('seller.isActive = :isActive', { isActive: true })

    if (query.trim()) {
      queryBuilder.andWhere(
        '(LOWER(seller.businessName) LIKE :search OR LOWER(seller.ownerName) LIKE :search)',
        { search: searchTerm },
      )
    }

    const [sellers, total] = await queryBuilder
      .orderBy('seller.followersCount', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount()

    // Get product counts for each seller
    const sellerIds = sellers.map((s) => s.id)
    let productCounts: Record<string, number> = {}

    if (sellerIds.length > 0) {
      const counts = await this.productRepository
        .createQueryBuilder('product')
        .select('product.sellerId', 'sellerId')
        .addSelect('COUNT(*)', 'count')
        .where('product.sellerId IN (:...ids)', { ids: sellerIds })
        .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
        .groupBy('product.sellerId')
        .getRawMany()

      productCounts = counts.reduce((acc, c) => {
        acc[c.sellerId] = parseInt(c.count, 10)
        return acc
      }, {} as Record<string, number>)
    }

    const results: SellerSearchResult[] = sellers.map((seller) => ({
      id: seller.id,
      businessName: seller.businessName,
      logoUrl: seller.logoUrl,
      profileDescription: seller.profileDescription,
      isVerified: seller.verificationStatus === VerificationStatus.APPROVED,
      followersCount: seller.followersCount,
      productsCount: productCounts[seller.id] || 0,
      city: seller.city,
      state: seller.state,
    }))

    return {
      sellers: results,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Get seller rating (placeholder - can be enhanced later with actual review system)
   */
  private async getSellerRatingFromProducts(
    _sellerId: string,
  ): Promise<{ rating: number; totalReviews: number }> {
    // TODO: Implement actual rating system when reviews are integrated with products
    // For now, return placeholder values
    return {
      rating: 0,
      totalReviews: 0,
    }
  }
}
