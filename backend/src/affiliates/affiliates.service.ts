import { Injectable, ConflictException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Affiliate } from './entities/affiliate.entity'
import { AffiliateLink } from './entities/affiliate-link.entity'
import { AffiliateClick } from './entities/affiliate-click.entity'
import * as crypto from 'crypto'

@Injectable()
export class AffiliatesService {
  constructor(
    @InjectRepository(Affiliate)
    private affiliateRepository: Repository<Affiliate>,
    @InjectRepository(AffiliateLink)
    private affiliateLinkRepository: Repository<AffiliateLink>,
    @InjectRepository(AffiliateClick)
    private affiliateClickRepository: Repository<AffiliateClick>,
  ) {}

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