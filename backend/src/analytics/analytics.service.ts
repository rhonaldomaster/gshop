import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between } from 'typeorm'
import { PixelEvent } from '../pixel/entities/pixel-event.entity'
import { Order } from '../orders/entities/order.entity'
import { Seller } from '../sellers/entities/seller.entity'
import { User } from '../database/entities/user.entity'
import { Product } from '../database/entities/product.entity'
import { VatReportDto, VatBreakdownDto, VatCategoryDto } from './dto/vat-report.dto'
import { SalesTrendsDto, TimePeriod, SalesTrendDataPoint } from './dto/sales-trends.dto'

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(PixelEvent)
    private pixelEventRepository: Repository<PixelEvent>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Seller)
    private sellerRepository: Repository<Seller>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
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

  /**
   * Get analytics overview data for admin dashboard
   * Returns key metrics: revenue, orders, users, products, avg order value, conversion rate
   */
  async getAnalyticsOverview() {
    // Get all completed orders
    const orders = await this.orderRepository.find({
      where: { status: 'delivered' as any }, // Only count delivered orders as revenue
    })

    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount || order.total || 0), 0)
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Get total users
    const totalUsers = await this.userRepository.count()

    // Get total products
    const totalProducts = await this.productRepository.count()

    // Calculate conversion rate (orders / unique visitors from last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recentPixelEvents = await this.pixelEventRepository.find({
      where: {
        createdAt: Between(thirtyDaysAgo, new Date()),
      },
    })

    const uniqueVisitors = new Set(recentPixelEvents.map(e => e.sessionId)).size
    const conversionRate = uniqueVisitors > 0 ? (totalOrders / uniqueVisitors) * 100 : 0

    return {
      totalRevenue,
      totalOrders,
      totalUsers,
      totalProducts,
      averageOrderValue,
      conversionRate,
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

  /**
   * Generate sales trends report with time-series data
   * @param period Time period for aggregation (daily, weekly, monthly, yearly)
   * @param startDate Start date for report
   * @param endDate End date for report
   * @returns Sales trends with aggregated data by period
   */
  async generateSalesTrends(
    period: TimePeriod,
    startDate?: Date,
    endDate?: Date,
  ): Promise<SalesTrendsDto> {
    // Default to current year if no dates provided
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), 0, 1);
    const defaultEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

    const start = startDate || defaultStart;
    const end = endDate || defaultEnd;

    // Get orders within date range (only confirmed, shipped, or delivered orders)
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.createdAt >= :start', { start })
      .andWhere('order.createdAt <= :end', { end })
      .andWhere('order.status IN (:...statuses)', {
        statuses: ['confirmed', 'shipped', 'delivered'],
      })
      .getMany();

    // Group orders by period and calculate totals
    const dataMap = new Map<string, SalesTrendDataPoint>();
    let totalSales = 0;
    let totalOrders = 0;
    let totalVat = 0;

    orders.forEach(order => {
      const periodKey = this.getPeriodKey(order.createdAt, period);
      const periodLabel = this.getPeriodLabel(order.createdAt, period);

      if (!dataMap.has(periodKey)) {
        dataMap.set(periodKey, {
          date: periodLabel,
          sales: 0,
          orders: 0,
          vatAmount: 0,
        });
      }

      const dataPoint = dataMap.get(periodKey)!;
      dataPoint.sales += Number(order.totalAmount || 0);
      dataPoint.orders += 1;
      dataPoint.vatAmount += Number(order.totalVatAmount || 0);

      totalSales += Number(order.totalAmount || 0);
      totalOrders += 1;
      totalVat += Number(order.totalVatAmount || 0);
    });

    // Convert map to array and sort by date
    const data = Array.from(dataMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, dataPoint]) => ({
        ...dataPoint,
        sales: Math.round(dataPoint.sales * 100) / 100,
        vatAmount: Math.round(dataPoint.vatAmount * 100) / 100,
      }));

    return {
      period,
      data,
      startDate: start,
      endDate: end,
      totalSales: Math.round(totalSales * 100) / 100,
      totalOrders,
      totalVat: Math.round(totalVat * 100) / 100,
    };
  }

  /**
   * Get period key for grouping (sortable format)
   */
  private getPeriodKey(date: Date, period: TimePeriod): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (period) {
      case TimePeriod.DAILY:
        return `${year}-${month}-${day}`;
      case TimePeriod.WEEKLY:
        const weekNumber = this.getWeekNumber(date);
        return `${year}-W${String(weekNumber).padStart(2, '0')}`;
      case TimePeriod.MONTHLY:
        return `${year}-${month}`;
      case TimePeriod.YEARLY:
        return `${year}`;
      default:
        return `${year}-${month}`;
    }
  }

  /**
   * Get period label for display
   */
  private getPeriodLabel(date: Date, period: TimePeriod): string {
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthNamesSpanish = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    switch (period) {
      case TimePeriod.DAILY:
        return `${date.getDate()} ${monthNamesSpanish[month]}`;
      case TimePeriod.WEEKLY:
        const weekNumber = this.getWeekNumber(date);
        return `Sem ${weekNumber}`;
      case TimePeriod.MONTHLY:
        return monthNamesSpanish[month];
      case TimePeriod.YEARLY:
        return `${year}`;
      default:
        return monthNamesSpanish[month];
    }
  }

  /**
   * Get ISO week number
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}