import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between } from 'typeorm'
import { PixelEvent } from '../pixel/entities/pixel-event.entity'
import { Order } from '../orders/entities/order.entity'
import { Seller } from '../sellers/entities/seller.entity'

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(PixelEvent)
    private pixelEventRepository: Repository<PixelEvent>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Seller)
    private sellerRepository: Repository<Seller>,
  ) {}

  async getGlobalStats(startDate?: Date, endDate?: Date) {
    const where: any = {}

    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate)
    }

    // Get orders data
    const orders = await this.orderRepository.find({ where })
    const totalOrders = orders.length
    const totalGMV = orders.reduce((sum, order) => sum + Number(order.total), 0)
    const avgOrderValue = totalOrders > 0 ? totalGMV / totalOrders : 0

    // Get seller stats
    const sellers = await this.sellerRepository.find()
    const totalSellers = sellers.length
    const activeSellers = sellers.filter(s => s.isActive).length
    const totalCommissionsPaid = sellers.reduce((sum, seller) => sum + Number(seller.totalEarnings), 0)

    // Get pixel events
    const pixelEvents = await this.pixelEventRepository.find({ where })
    const totalPageViews = pixelEvents.filter(e => e.eventType === 'page_view').length
    const totalProductViews = pixelEvents.filter(e => e.eventType === 'product_view').length

    return {
      gmv: {
        total: totalGMV,
        orders: totalOrders,
        avgOrderValue,
      },
      sellers: {
        total: totalSellers,
        active: activeSellers,
        commissionsPaid: totalCommissionsPaid,
      },
      traffic: {
        pageViews: totalPageViews,
        productViews: totalProductViews,
        uniqueVisitors: new Set(pixelEvents.map(e => e.sessionId)).size,
      },
      dateRange: {
        startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: endDate || new Date(),
      }
    }
  }

  async getSellerPerformance(limit = 10) {
    const sellers = await this.sellerRepository
      .createQueryBuilder('seller')
      .leftJoinAndSelect('seller.products', 'product')
      .orderBy('seller.totalEarnings', 'DESC')
      .take(limit)
      .getMany()

    return sellers.map(seller => ({
      id: seller.id,
      businessName: seller.businessName,
      totalEarnings: seller.totalEarnings,
      productCount: seller.products?.length || 0,
      commissionRate: seller.commissionRate,
      status: seller.status,
    }))
  }
}