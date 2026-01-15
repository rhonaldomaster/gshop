import { Injectable, ConflictException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { JwtService } from '@nestjs/jwt'
import { Affiliate, AffiliateStatus } from './entities/affiliate.entity'
import { AffiliateLink } from './entities/affiliate-link.entity'
import { AffiliateClick } from './entities/affiliate-click.entity'
import { CreateAffiliateDto } from './dto/create-affiliate.dto'
import { ConvertToAffiliateDto } from './dto/convert-to-affiliate.dto'
import * as crypto from 'crypto'
import * as bcrypt from 'bcryptjs'

@Injectable()
export class AffiliatesService {
  constructor(
    @InjectRepository(Affiliate)
    private affiliateRepository: Repository<Affiliate>,
    @InjectRepository(AffiliateLink)
    private affiliateLinkRepository: Repository<AffiliateLink>,
    @InjectRepository(AffiliateClick)
    private affiliateClickRepository: Repository<AffiliateClick>,
    private jwtService: JwtService,
  ) {}

  async registerAffiliate(createAffiliateDto: CreateAffiliateDto) {
    // Check email uniqueness
    const existingEmail = await this.affiliateRepository.findOne({
      where: { email: createAffiliateDto.email.toLowerCase() }
    })

    if (existingEmail) {
      throw new ConflictException('Email already registered')
    }

    // Check username uniqueness
    const existingUsername = await this.affiliateRepository.findOne({
      where: { username: createAffiliateDto.username }
    })

    if (existingUsername) {
      throw new ConflictException('Username already taken')
    }

    // Hash password
    const passwordHash = await bcrypt.hash(createAffiliateDto.password, 10)

    // Generate unique affiliate code
    const affiliateCode = `AFF-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

    // Create affiliate with PENDING status
    const affiliate = this.affiliateRepository.create({
      email: createAffiliateDto.email.toLowerCase(),
      passwordHash,
      username: createAffiliateDto.username,
      name: createAffiliateDto.name,
      phone: createAffiliateDto.phone,
      website: createAffiliateDto.website,
      socialMedia: createAffiliateDto.socialMedia,
      bio: createAffiliateDto.bio,
      categories: createAffiliateDto.categories,
      documentType: createAffiliateDto.documentType,
      documentNumber: createAffiliateDto.documentNumber,
      affiliateCode,
      status: AffiliateStatus.PENDING,
      commissionRate: 5.0, // Default 5%
      isActive: true,
      isProfilePublic: false, // Private until approved
    })

    const savedAffiliate = await this.affiliateRepository.save(affiliate)

    // Generate JWT token
    const payload = {
      sub: savedAffiliate.id,
      email: savedAffiliate.email,
      role: 'affiliate',
      affiliateId: savedAffiliate.id,
    }

    const access_token = this.jwtService.sign(payload)

    // Remove passwordHash from response
    const { passwordHash: _, ...affiliateWithoutPassword } = savedAffiliate

    return {
      affiliate: affiliateWithoutPassword,
      access_token,
      token_type: 'Bearer',
      expires_in: '7d',
    }
  }

  /**
   * Convert an existing authenticated user to an affiliate.
   * Does not require password since the user is already logged in.
   */
  async convertUserToAffiliate(
    userId: string,
    userEmail: string,
    userName: string,
    convertDto: ConvertToAffiliateDto,
  ) {
    // Check if user is already an affiliate
    const existingAffiliate = await this.affiliateRepository.findOne({
      where: [
        { userId },
        { email: userEmail.toLowerCase() }
      ]
    })

    if (existingAffiliate) {
      throw new ConflictException('User is already registered as an affiliate')
    }

    // Check username uniqueness
    const existingUsername = await this.affiliateRepository.findOne({
      where: { username: convertDto.username }
    })

    if (existingUsername) {
      throw new ConflictException('Username already taken')
    }

    // Generate unique affiliate code
    const affiliateCode = `AFF-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

    // Create affiliate linked to user (no password needed)
    const affiliate = this.affiliateRepository.create({
      userId,
      email: userEmail.toLowerCase(),
      passwordHash: null, // No password - uses main user authentication
      username: convertDto.username,
      name: userName,
      phone: convertDto.phone,
      website: convertDto.website,
      socialMedia: convertDto.socialMedia,
      bio: convertDto.bio,
      categories: convertDto.categories,
      documentType: convertDto.documentType,
      documentNumber: convertDto.documentNumber,
      affiliateCode,
      status: AffiliateStatus.PENDING,
      commissionRate: 5.0,
      isActive: true,
      isProfilePublic: false,
    })

    const savedAffiliate = await this.affiliateRepository.save(affiliate)

    // Return affiliate data (no new token needed - user keeps their existing session)
    // Message is handled by frontend i18n
    return {
      affiliate: savedAffiliate,
    }
  }

  /**
   * Get affiliate by userId (for checking if user is already an affiliate)
   */
  async getAffiliateByUserId(userId: string): Promise<Affiliate | null> {
    return this.affiliateRepository.findOne({
      where: { userId }
    })
  }

  async generateAffiliateCode(): Promise<string> {
    let code: string
    let exists = true

    while (exists) {
      code = crypto.randomBytes(4).toString('hex').toUpperCase()
      const existing = await this.affiliateRepository.findOne({
        where: { affiliateCode: code }
      })
      exists = !!existing
    }

    return code
  }

  async createAffiliateLink(affiliateId: string, originalUrl: string, productId?: string, sellerId?: string) {
    const affiliate = await this.affiliateRepository.findOne({
      where: { id: affiliateId }
    })

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found')
    }

    // Generate unique short code
    let shortCode: string
    let exists = true

    while (exists) {
      shortCode = crypto.randomBytes(6).toString('hex')
      const existing = await this.affiliateLinkRepository.findOne({
        where: { shortCode }
      })
      exists = !!existing
    }

    const fullUrl = `${process.env.APP_URL || 'http://localhost:3001'}/aff/${shortCode}`

    const affiliateLink = this.affiliateLinkRepository.create({
      affiliateId,
      productId,
      sellerId,
      originalUrl,
      shortCode,
      fullUrl,
    })

    return this.affiliateLinkRepository.save(affiliateLink)
  }

  async trackClick(shortCode: string, ipAddress: string, userAgent?: string, referer?: string) {
    const affiliateLink = await this.affiliateLinkRepository.findOne({
      where: { shortCode, isActive: true }
    })

    if (!affiliateLink) {
      throw new NotFoundException('Affiliate link not found')
    }

    // Create click record
    const click = this.affiliateClickRepository.create({
      affiliateLinkId: affiliateLink.id,
      ipAddress,
      userAgent,
      referer,
    })

    await this.affiliateClickRepository.save(click)

    // Update link clicks count
    affiliateLink.clicks += 1
    await this.affiliateLinkRepository.save(affiliateLink)

    return {
      redirectUrl: affiliateLink.originalUrl,
      clickId: click.id
    }
  }

  async trackConversion(clickId: string, orderId: string, orderValue: number) {
    const click = await this.affiliateClickRepository.findOne({
      where: { id: clickId },
      relations: ['affiliateLink', 'affiliateLink.affiliate']
    })

    if (!click) {
      throw new NotFoundException('Click not found')
    }

    if (click.converted) {
      return // Already converted
    }

    // Mark as converted
    click.converted = true
    click.orderId = orderId
    await this.affiliateClickRepository.save(click)

    // Update link stats
    const affiliateLink = click.affiliateLink
    affiliateLink.conversions += 1
    affiliateLink.revenue = Number(affiliateLink.revenue) + orderValue
    await this.affiliateLinkRepository.save(affiliateLink)

    // Update affiliate earnings
    const affiliate = affiliateLink.affiliate
    const commission = (orderValue * Number(affiliate.commissionRate)) / 100

    affiliate.totalEarnings = Number(affiliate.totalEarnings) + commission
    affiliate.pendingBalance = Number(affiliate.pendingBalance) + commission
    await this.affiliateRepository.save(affiliate)

    return commission
  }

  async getAffiliateStats(affiliateId: string) {
    const affiliate = await this.affiliateRepository.findOne({
      where: { id: affiliateId }
    })

    if (!affiliate) {
      throw new NotFoundException('Affiliate not found')
    }

    const links = await this.affiliateLinkRepository.find({
      where: { affiliateId, isActive: true }
    })

    const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0)
    const totalConversions = links.reduce((sum, link) => sum + link.conversions, 0)
    const totalRevenue = links.reduce((sum, link) => sum + Number(link.revenue), 0)

    return {
      totalLinks: links.length,
      totalClicks,
      totalConversions,
      conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      totalRevenue,
      totalEarnings: affiliate.totalEarnings,
      availableBalance: affiliate.availableBalance,
      pendingBalance: affiliate.pendingBalance,
      commissionRate: affiliate.commissionRate,
      affiliateCode: affiliate.affiliateCode,
    }
  }

  async getAffiliateLinks(affiliateId: string) {
    return this.affiliateLinkRepository.find({
      where: { affiliateId },
      order: { createdAt: 'DESC' }
    })
  }
}