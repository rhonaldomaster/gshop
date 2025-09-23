import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between } from 'typeorm'
import { PixelEvent } from './entities/pixel-event.entity'

@Injectable()
export class PixelService {
  constructor(
    @InjectRepository(PixelEvent)
    private pixelEventRepository: Repository<PixelEvent>,
  ) {}

  async trackEvent(eventData: {
    sellerId: string
    eventType: string
    productId?: string
    orderId?: string
    value?: number
    currency?: string
    sessionId: string
    ipAddress: string
    userAgent?: string
    referer?: string
    url?: string
    customData?: any
  }) {
    const event = this.pixelEventRepository.create({
      ...eventData,
      currency: eventData.currency || 'USD',
    })

    return this.pixelEventRepository.save(event)
  }

  async getSellerAnalytics(sellerId: string, startDate?: Date, endDate?: Date) {
    const where: any = { sellerId }

    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate)
    }

    const events = await this.pixelEventRepository.find({
      where,
      order: { createdAt: 'DESC' }
    })

    // Calculate metrics
    const totalEvents = events.length
    const pageViews = events.filter(e => e.eventType === 'page_view').length
    const productViews = events.filter(e => e.eventType === 'product_view').length
    const addToCarts = events.filter(e => e.eventType === 'add_to_cart').length
    const purchases = events.filter(e => e.eventType === 'purchase').length

    const totalRevenue = events
      .filter(e => e.eventType === 'purchase' && e.value)
      .reduce((sum, e) => sum + Number(e.value), 0)

    const uniqueSessions = new Set(events.map(e => e.sessionId)).size

    // Conversion funnel
    const conversionRate = pageViews > 0 ? (purchases / pageViews) * 100 : 0
    const addToCartRate = productViews > 0 ? (addToCarts / productViews) * 100 : 0
    const purchaseRate = addToCarts > 0 ? (purchases / addToCarts) * 100 : 0

    // Top pages
    const pageViewEvents = events.filter(e => e.eventType === 'page_view' && e.url)
    const pageStats = pageViewEvents.reduce((acc, event) => {
      acc[event.url] = (acc[event.url] || 0) + 1
      return acc
    }, {})

    const topPages = Object.entries(pageStats)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([url, views]) => ({ url, views }))

    // Top products
    const productViewEvents = events.filter(e => e.eventType === 'product_view' && e.productId)
    const productStats = productViewEvents.reduce((acc, event) => {
      acc[event.productId] = (acc[event.productId] || 0) + 1
      return acc
    }, {})

    const topProducts = Object.entries(productStats)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([productId, views]) => ({ productId, views }))

    // Events by day (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentEvents = events.filter(e => e.createdAt >= thirtyDaysAgo)
    const eventsByDay = recentEvents.reduce((acc, event) => {
      const day = event.createdAt.toISOString().split('T')[0]
      acc[day] = (acc[day] || 0) + 1
      return acc
    }, {})

    return {
      overview: {
        totalEvents,
        pageViews,
        productViews,
        addToCarts,
        purchases,
        totalRevenue,
        uniqueSessions,
        conversionRate,
        addToCartRate,
        purchaseRate,
      },
      topPages,
      topProducts,
      eventsByDay,
      dateRange: {
        startDate: startDate || (events.length > 0 ? events[events.length - 1].createdAt : new Date()),
        endDate: endDate || new Date(),
      }
    }
  }

  async getRealtimeEvents(sellerId: string, limit = 50) {
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)

    return this.pixelEventRepository.find({
      where: {
        sellerId,
        createdAt: Between(oneHourAgo, new Date())
      },
      order: { createdAt: 'DESC' },
      take: limit
    })
  }
}