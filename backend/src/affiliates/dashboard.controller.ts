import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CreatorDashboardService } from './services/creator-dashboard.service'

@ApiTags('creator-dashboard')
@Controller('creators/dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CreatorDashboardController {
  constructor(
    private dashboardService: CreatorDashboardService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved successfully' })
  async getDashboardStats(@Request() req) {
    const affiliateId = req.user.affiliateId || req.user.sub
    return this.dashboardService.getDashboardStats(affiliateId)
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get performance metrics over time' })
  @ApiResponse({ status: 200, description: 'Performance metrics retrieved successfully' })
  async getPerformanceMetrics(
    @Request() req,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    const affiliateId = req.user.affiliateId || req.user.sub
    return this.dashboardService.getPerformanceMetrics(affiliateId, days)
  }

  @Get('top-content')
  @ApiOperation({ summary: 'Get top performing content' })
  @ApiResponse({ status: 200, description: 'Top content retrieved successfully' })
  async getTopPerformingContent(
    @Request() req,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const affiliateId = req.user.affiliateId || req.user.sub
    return this.dashboardService.getTopPerformingContent(affiliateId, limit)
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async getNotifications(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const affiliateId = req.user.affiliateId || req.user.sub
    return this.dashboardService.getNotifications(affiliateId, page, limit)
  }

  @Put('notifications/:notificationId/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markNotificationAsRead(
    @Request() req,
    @Param('notificationId', ParseUUIDPipe) notificationId: string,
  ) {
    const affiliateId = req.user.affiliateId || req.user.sub
    await this.dashboardService.markNotificationAsRead(notificationId, affiliateId)
    return { success: true, message: 'Notification marked as read' }
  }

  @Put('notifications/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllNotificationsAsRead(@Request() req) {
    const affiliateId = req.user.affiliateId || req.user.sub
    await this.dashboardService.markAllNotificationsAsRead(affiliateId)
    return { success: true, message: 'All notifications marked as read' }
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get complete dashboard overview' })
  @ApiResponse({ status: 200, description: 'Dashboard overview retrieved successfully' })
  async getDashboardOverview(@Request() req) {
    const affiliateId = req.user.affiliateId || req.user.sub

    // Get all dashboard data in parallel
    const [stats, performance, topContent, notifications] = await Promise.all([
      this.dashboardService.getDashboardStats(affiliateId),
      this.dashboardService.getPerformanceMetrics(affiliateId, 30),
      this.dashboardService.getTopPerformingContent(affiliateId, 5),
      this.dashboardService.getNotifications(affiliateId, 1, 10)
    ])

    return {
      stats,
      performance,
      topContent,
      recentNotifications: notifications.notifications,
      summary: {
        totalFollowers: stats.profile.followersCount,
        totalViews: stats.profile.totalViews,
        totalEarnings: stats.earnings.totalEarnings,
        availableBalance: stats.earnings.availableBalance,
        contentCount: stats.content.totalVideos + stats.liveStreams.totalStreams,
        engagementRate: stats.content.averageEngagement,
        growthRate: this.calculateGrowthRate(performance.followers),
        topPerformingVideo: topContent.topVideos[0] || null,
        upcomingStream: null // Could add upcoming stream logic
      }
    }
  }

  private calculateGrowthRate(followersData: Array<{date: string; count: number}>): number {
    if (followersData.length < 2) return 0

    const recent = followersData.slice(-7).reduce((sum, day) => sum + day.count, 0)
    const previous = followersData.slice(-14, -7).reduce((sum, day) => sum + day.count, 0)

    if (previous === 0) return recent > 0 ? 100 : 0
    return ((recent - previous) / previous) * 100
  }
}