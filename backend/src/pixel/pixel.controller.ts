import { Controller, Post, Get, Body, Query, Req, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { Request } from 'express'
import { PixelService } from './pixel.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@ApiTags('pixel')
@Controller('pixel')
export class PixelController {
  constructor(private readonly pixelService: PixelService) {}

  @Post('track')
  @ApiOperation({ summary: 'Track pixel event' })
  async trackEvent(@Body() body: any, @Req() req: Request) {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown'
    const userAgent = req.headers['user-agent']
    const referer = req.headers.referer

    // Extract event data from body
    const {
      sellerId,
      eventType,
      productId,
      orderId,
      value,
      currency,
      sessionId,
      pageInfo,
      customData,
      ...otherData
    } = body

    const eventData = {
      sellerId,
      eventType,
      productId,
      orderId,
      value: value ? parseFloat(value) : undefined,
      currency,
      sessionId,
      ipAddress,
      userAgent,
      referer: referer || pageInfo?.referrer,
      url: pageInfo?.url,
      customData: {
        ...customData,
        ...otherData,
        pageInfo
      }
    }

    return this.pixelService.trackEvent(eventData)
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get seller analytics' })
  async getAnalytics(
    @Query('sellerId') sellerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined
    const end = endDate ? new Date(endDate) : undefined

    return this.pixelService.getSellerAnalytics(sellerId, start, end)
  }

  @Get('realtime')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get realtime events' })
  async getRealtimeEvents(
    @Query('sellerId') sellerId: string,
    @Query('limit') limit?: string
  ) {
    const limitNum = limit ? parseInt(limit) : 50
    return this.pixelService.getRealtimeEvents(sellerId, limitNum)
  }
}