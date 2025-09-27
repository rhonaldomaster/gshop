import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
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
import { AdminCreatorService } from './services/admin-creator.service'
import { AffiliateStatus } from './entities/affiliate.entity'

@ApiTags('admin-creators')
@Controller('admin/creators')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminCreatorController {
  constructor(
    private adminCreatorService: AdminCreatorService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Admin statistics retrieved successfully' })
  async getAdminStats() {
    return this.adminCreatorService.getAdminStats()
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get creator analytics for admin' })
  @ApiResponse({ status: 200, description: 'Creator analytics retrieved successfully' })
  async getCreatorAnalytics() {
    return this.adminCreatorService.getCreatorAnalytics()
  }

  @Get()
  @ApiOperation({ summary: 'Get all creators with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Creators list retrieved successfully' })
  async getAllCreators(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('sortBy', new DefaultValuePipe('createdAt')) sortBy: string,
    @Query('sortOrder', new DefaultValuePipe('DESC')) sortOrder: 'ASC' | 'DESC',
    @Query('status') status?: AffiliateStatus,
    @Query('search') search?: string,
  ) {
    return this.adminCreatorService.getAllCreators(page, limit, status, search, sortBy, sortOrder)
  }

  @Get(':creatorId')
  @ApiOperation({ summary: 'Get detailed creator information' })
  @ApiResponse({ status: 200, description: 'Creator details retrieved successfully' })
  async getCreatorDetails(
    @Param('creatorId', ParseUUIDPipe) creatorId: string,
  ) {
    return this.adminCreatorService.getCreatorDetails(creatorId)
  }

  @Put(':creatorId/approve')
  @ApiOperation({ summary: 'Approve a pending creator' })
  @ApiResponse({ status: 200, description: 'Creator approved successfully' })
  async approveCreator(
    @Request() req,
    @Param('creatorId', ParseUUIDPipe) creatorId: string,
  ) {
    const adminId = req.user.sub
    const creator = await this.adminCreatorService.approveCreator(creatorId, adminId)
    return {
      success: true,
      message: 'Creator approved successfully',
      creator: {
        id: creator.id,
        username: creator.username,
        status: creator.status
      }
    }
  }

  @Put(':creatorId/reject')
  @ApiOperation({ summary: 'Reject a pending creator' })
  @ApiResponse({ status: 200, description: 'Creator rejected successfully' })
  async rejectCreator(
    @Request() req,
    @Param('creatorId', ParseUUIDPipe) creatorId: string,
    @Body() body: { reason: string },
  ) {
    const adminId = req.user.sub
    const creator = await this.adminCreatorService.rejectCreator(creatorId, body.reason, adminId)
    return {
      success: true,
      message: 'Creator rejected successfully',
      creator: {
        id: creator.id,
        username: creator.username,
        status: creator.status
      }
    }
  }

  @Put(':creatorId/suspend')
  @ApiOperation({ summary: 'Suspend a creator' })
  @ApiResponse({ status: 200, description: 'Creator suspended successfully' })
  async suspendCreator(
    @Request() req,
    @Param('creatorId', ParseUUIDPipe) creatorId: string,
    @Body() body: { reason: string },
  ) {
    const adminId = req.user.sub
    const creator = await this.adminCreatorService.suspendCreator(creatorId, body.reason, adminId)
    return {
      success: true,
      message: 'Creator suspended successfully',
      creator: {
        id: creator.id,
        username: creator.username,
        status: creator.status
      }
    }
  }

  @Put(':creatorId/unsuspend')
  @ApiOperation({ summary: 'Unsuspend a creator' })
  @ApiResponse({ status: 200, description: 'Creator unsuspended successfully' })
  async unsuspendCreator(
    @Request() req,
    @Param('creatorId', ParseUUIDPipe) creatorId: string,
  ) {
    const adminId = req.user.sub
    const creator = await this.adminCreatorService.unsuspendCreator(creatorId, adminId)
    return {
      success: true,
      message: 'Creator unsuspended successfully',
      creator: {
        id: creator.id,
        username: creator.username,
        status: creator.status
      }
    }
  }

  @Put(':creatorId/verify')
  @ApiOperation({ summary: 'Verify a creator account' })
  @ApiResponse({ status: 200, description: 'Creator verified successfully' })
  async verifyCreator(
    @Request() req,
    @Param('creatorId', ParseUUIDPipe) creatorId: string,
  ) {
    const adminId = req.user.sub
    const creator = await this.adminCreatorService.verifyCreator(creatorId, adminId)
    return {
      success: true,
      message: 'Creator verified successfully',
      creator: {
        id: creator.id,
        username: creator.username,
        isVerified: creator.isVerified
      }
    }
  }

  @Put(':creatorId/commission-rate')
  @ApiOperation({ summary: 'Update creator commission rate' })
  @ApiResponse({ status: 200, description: 'Commission rate updated successfully' })
  async updateCommissionRate(
    @Request() req,
    @Param('creatorId', ParseUUIDPipe) creatorId: string,
    @Body() body: { commissionRate: number },
  ) {
    const adminId = req.user.sub
    const creator = await this.adminCreatorService.updateCreatorCommissionRate(
      creatorId,
      body.commissionRate,
      adminId
    )
    return {
      success: true,
      message: 'Commission rate updated successfully',
      creator: {
        id: creator.id,
        username: creator.username,
        commissionRate: creator.commissionRate
      }
    }
  }

  @Put('videos/:videoId/moderate')
  @ApiOperation({ summary: 'Moderate creator content' })
  @ApiResponse({ status: 200, description: 'Content moderated successfully' })
  async moderateContent(
    @Request() req,
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Body() body: { action: 'approve' | 'remove' | 'flag'; reason?: string },
  ) {
    const adminId = req.user.sub
    await this.adminCreatorService.moderateContent(videoId, body.action, body.reason, adminId)
    return {
      success: true,
      message: `Content ${body.action}ed successfully`
    }
  }

  @Get('pending/count')
  @ApiOperation({ summary: 'Get count of pending approvals' })
  @ApiResponse({ status: 200, description: 'Pending count retrieved successfully' })
  async getPendingCount() {
    const stats = await this.adminCreatorService.getAdminStats()
    return {
      pendingCreators: stats.pendingApproval,
      totalCreators: stats.totalCreators
    }
  }

  @Get('dashboard/overview')
  @ApiOperation({ summary: 'Get complete admin dashboard overview' })
  @ApiResponse({ status: 200, description: 'Admin dashboard overview retrieved successfully' })
  async getDashboardOverview() {
    const [stats, analytics] = await Promise.all([
      this.adminCreatorService.getAdminStats(),
      this.adminCreatorService.getCreatorAnalytics()
    ])

    return {
      stats,
      analytics,
      summary: {
        totalRevenue: stats.totalEarnings,
        activeCreators: stats.activeCreators,
        totalContent: analytics.contentStats.totalVideos + analytics.contentStats.totalLiveStreams,
        platformGrowth: analytics.platformGrowth.newCreatorsThisMonth,
        averageEngagement: analytics.contentStats.avgEngagementRate,
        pendingActions: stats.pendingApproval,
        topPerformer: analytics.topCreators[0] || null
      }
    }
  }

  @Get('reports/performance')
  @ApiOperation({ summary: 'Get creator performance report' })
  @ApiResponse({ status: 200, description: 'Performance report retrieved successfully' })
  async getPerformanceReport(
    @Query('period', new DefaultValuePipe('month')) period: 'week' | 'month' | 'year',
    @Query('metric', new DefaultValuePipe('earnings')) metric: 'earnings' | 'views' | 'followers',
  ) {
    // This could be expanded to generate detailed reports
    const analytics = await this.adminCreatorService.getCreatorAnalytics()

    return {
      period,
      metric,
      topCreators: analytics.topCreators.slice(0, 20),
      platformStats: analytics.contentStats,
      growth: analytics.platformGrowth
    }
  }

  @Get('moderation/queue')
  @ApiOperation({ summary: 'Get content moderation queue' })
  @ApiResponse({ status: 200, description: 'Moderation queue retrieved successfully' })
  async getModerationQueue(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    // This would return content that needs moderation
    // For now, returning a placeholder structure
    return {
      items: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0
      }
    }
  }
}