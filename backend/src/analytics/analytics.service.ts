import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between } from 'typeorm'
import { PixelEvent } from '../pixel/entities/pixel-event.entity'
import { Order } from '../orders/entities/order.entity'
import { Seller } from '../sellers/entities/seller.entity'
import { VatReportDto, VatBreakdownDto, VatCategoryDto } from './dto/vat-report.dto'

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

  /**
   * Generate VAT report for Colombian tax compliance
   * @param startDate Start date for report
   * @param endDate End date for report
   * @param sellerId Optional seller ID to filter by specific seller
   * @returns VAT report with breakdown by category
   */
  async generateVatReport(
    startDate: Date,
    endDate: Date,
    sellerId?: string,
  ): Promise<VatReportDto> {
    const where: any = {
      createdAt: Between(startDate, endDate),
      status: 'delivered', // Only count completed orders for tax reporting
    }

    if (sellerId) {
      where.sellerId = sellerId
    }

    // Get all orders within date range
    const orders = await this.orderRepository.find({
      where,
      relations: ['items', 'items.product'],
    })

    // Initialize breakdown structure
    const breakdown: VatBreakdownDto = {
      excluido: { base: 0, vat: 0, total: 0, orders: 0 },
      exento: { base: 0, vat: 0, total: 0, orders: 0 },
      reducido: { base: 0, vat: 0, total: 0, orders: 0 },
      general: { base: 0, vat: 0, total: 0, orders: 0 },
    }

    let totalBase = 0
    let totalVat = 0
    let totalWithVat = 0
    const processedOrders = new Set<string>()

    // Process each order
    orders.forEach(order => {
      // Count unique orders per category
      if (!processedOrders.has(order.id)) {
        processedOrders.add(order.id)
      }

      // Use vatBreakdown if available (newer orders)
      if (order.vatBreakdown) {
        Object.keys(breakdown).forEach(category => {
          const orderVat = order.vatBreakdown[category]
          if (orderVat) {
            breakdown[category].base += Number(orderVat.base || 0)
            breakdown[category].vat += Number(orderVat.vat || 0)
            breakdown[category].total += Number(orderVat.total || 0)
          }
        })

        // Add to totals
        totalBase += Number(order.subtotalBase || 0)
        totalVat += Number(order.totalVatAmount || 0)
        totalWithVat += Number(order.subtotal || 0)
      } else {
        // Fallback: calculate from items for older orders
        order.items?.forEach(item => {
          const vatType = item.vatType || 'general'
          const itemBase = Number(item.totalBasePrice || item.totalPrice)
          const itemVat = Number(item.totalVatAmount || 0)
          const itemTotal = Number(item.totalPrice)

          if (breakdown[vatType]) {
            breakdown[vatType].base += itemBase
            breakdown[vatType].vat += itemVat
            breakdown[vatType].total += itemTotal

            totalBase += itemBase
            totalVat += itemVat
            totalWithVat += itemTotal
          }
        })
      }
    })

    // Count orders per category (simplified: count all orders for each category that has items)
    const orderCountPerCategory = {
      excluido: 0,
      exento: 0,
      reducido: 0,
      general: 0,
    }

    orders.forEach(order => {
      if (order.vatBreakdown) {
        Object.keys(orderCountPerCategory).forEach(category => {
          if (order.vatBreakdown[category]?.total > 0) {
            orderCountPerCategory[category]++
          }
        })
      }
    })

    // Assign order counts
    Object.keys(breakdown).forEach(category => {
      breakdown[category].orders = orderCountPerCategory[category]
    })

    return {
      startDate,
      endDate,
      breakdown,
      totalBase: Math.round(totalBase * 100) / 100,
      totalVat: Math.round(totalVat * 100) / 100,
      totalWithVat: Math.round(totalWithVat * 100) / 100,
      totalOrders: orders.length,
    }
  }
}