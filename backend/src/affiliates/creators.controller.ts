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
  BadRequestException,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AffiliatesService } from './affiliates.service'
import { CreatorProfileService } from './services/creator-profile.service'
import { CreatorContentService } from './services/creator-content.service'
import { CreatorLiveService } from './services/creator-live.service'
import { CreateAffiliateDto } from './dto/create-affiliate.dto'
import { ConvertToAffiliateDto } from './dto/convert-to-affiliate.dto'

@ApiTags('creators')
@Controller('creators')
export class CreatorsController {
  constructor(
    private affiliatesService: AffiliatesService,
    private creatorProfileService: CreatorProfileService,
    private creatorContentService: CreatorContentService,
    private creatorLiveService: CreatorLiveService,
  ) {}

  // ========== REGISTRATION ==========

  @Post('register')
  @ApiOperation({ summary: 'Register as affiliate/creator (public endpoint)' })
  @ApiResponse({
    status: 201,
    description: 'Affiliate registered successfully with PENDING status. Returns affiliate data and JWT token for immediate login.'
  })
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  @ApiResponse({ status: 400, description: 'Validation error - invalid input data' })
  async registerAffiliate(@Body() createAffiliateDto: CreateAffiliateDto) {
    return this.affiliatesService.registerAffiliate(createAffiliateDto)
  }

  @Post('convert')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Convert authenticated user to affiliate',
    description: 'Allows an existing authenticated user to become an affiliate without creating new credentials.'
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully converted to affiliate with PENDING status.'
  })
  @ApiResponse({ status: 409, description: 'User is already an affiliate or username taken' })
  @ApiResponse({ status: 401, description: 'User not authenticated' })
  async convertToAffiliate(
    @Request() req,
    @Body() convertDto: ConvertToAffiliateDto,
  ) {
    const userId = req.user.id
    const userEmail = req.user.email
    const userName = req.user.firstName && req.user.lastName
      ? `${req.user.firstName} ${req.user.lastName}`
      : req.user.email.split('@')[0]

    return this.affiliatesService.convertUserToAffiliate(
      userId,
      userEmail,
      userName,
      convertDto,
    )
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if current user is an affiliate' })
  async checkAffiliateStatus(@Request() req) {
    const userId = req.user.id
    const affiliate = await this.affiliatesService.getAffiliateByUserId(userId)

    if (!affiliate) {
      return { isAffiliate: false, affiliate: null }
    }

    return {
      isAffiliate: true,
      affiliate: {
        id: affiliate.id,
        username: affiliate.username,
        status: affiliate.status,
        commissionRate: affiliate.commissionRate,
        affiliateCode: affiliate.affiliateCode,
      }
    }
  }

  // ========== PROFILE MANAGEMENT ==========

  @Get('profile/:username')
  @ApiOperation({ summary: 'Get public creator profile' })
  async getPublicProfile(
    @Param('username') username: string,
    @Query('viewerId') viewerId?: string,
  ) {
    return this.creatorProfileService.getPublicProfile(username, viewerId)
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update creator profile' })
  async updateProfile(@Request() req, @Body() updateData: any) {
    const affiliateId = req.user.affiliateId || req.user.id
    return this.creatorProfileService.updateProfile(affiliateId, updateData)
  }

  @Post('follow/:creatorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow a creator' })
  async followCreator(
    @Request() req,
    @Param('creatorId', ParseUUIDPipe) creatorId: string,
  ) {
    const userId = req.user.id
    await this.creatorProfileService.followAffiliate(userId, creatorId)
    return { success: true, message: 'Successfully followed creator' }
  }

  @Delete('follow/:creatorId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfollow a creator' })
  async unfollowCreator(
    @Request() req,
    @Param('creatorId', ParseUUIDPipe) creatorId: string,
  ) {
    const userId = req.user.id
    await this.creatorProfileService.unfollowAffiliate(userId, creatorId)
    return { success: true, message: 'Successfully unfollowed creator' }
  }

  @Get(':creatorId/followers')
  @ApiOperation({ summary: 'Get creator followers' })
  async getFollowers(
    @Param('creatorId', ParseUUIDPipe) creatorId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.creatorProfileService.getFollowers(creatorId, page || 1, limit || 20)
  }

  @Get(':creatorId/following')
  @ApiOperation({ summary: 'Get creator following' })
  async getFollowing(
    @Param('creatorId', ParseUUIDPipe) creatorId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.creatorProfileService.getFollowing(creatorId, page || 1, limit || 20)
  }

  @Get('search')
  @ApiOperation({ summary: 'Search creators' })
  async searchCreators(
    @Query('q') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('category') category?: string,
  ) {
    return this.creatorProfileService.searchCreators(query, category, page || 1, limit || 20)
  }

  // ========== CONTENT MANAGEMENT ==========

  @Post('videos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new video' })
  async createVideo(@Request() req, @Body() videoData: any) {
    const affiliateId = req.user.affiliateId || req.user.id
    return this.creatorContentService.createVideo(affiliateId, videoData)
  }

  @Put('videos/:videoId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update video' })
  async updateVideo(
    @Request() req,
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Body() updateData: any,
  ) {
    const affiliateId = req.user.affiliateId || req.user.id
    return this.creatorContentService.updateVideo(videoId, affiliateId, updateData)
  }

  @Post('videos/:videoId/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish video' })
  async publishVideo(
    @Request() req,
    @Param('videoId', ParseUUIDPipe) videoId: string,
  ) {
    const affiliateId = req.user.affiliateId || req.user.id
    return this.creatorContentService.publishVideo(videoId, affiliateId)
  }

  @Delete('videos/:videoId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete video' })
  async deleteVideo(
    @Request() req,
    @Param('videoId', ParseUUIDPipe) videoId: string,
  ) {
    const affiliateId = req.user.affiliateId || req.user.id
    await this.creatorContentService.deleteVideo(videoId, affiliateId)
    return { success: true, message: 'Video deleted successfully' }
  }

  @Get('videos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get creator videos' })
  async getMyVideos(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('status') status?: string,
  ) {
    const affiliateId = req.user.affiliateId || req.user.id
    return this.creatorContentService.getAffiliateVideos(affiliateId, status as any, page || 1, limit || 20)
  }

  @Get('videos/public')
  @ApiOperation({ summary: 'Get public videos feed' })
  async getPublicVideos(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('category') category?: string,
  ) {
    return this.creatorContentService.getPublicVideos(page || 1, limit || 20, category)
  }

  @Get('videos/:videoId')
  @ApiOperation({ summary: 'Get video details' })
  async getVideo(
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Query('viewerId') viewerId?: string,
  ) {
    return this.creatorContentService.getVideo(videoId, viewerId)
  }

  @Post('videos/:videoId/interact')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Interact with video (like, comment, share)' })
  async interactWithVideo(
    @Request() req,
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Body() interactionData: { type: string; content?: string; watchDuration?: number },
  ) {
    const userId = req.user.id
    await this.creatorContentService.trackInteraction(
      videoId,
      userId,
      interactionData.type,
      interactionData.content,
      interactionData.watchDuration,
    )
    return { success: true, message: 'Interaction recorded' }
  }

  @Get('videos/:videoId/analytics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get video analytics' })
  async getVideoAnalytics(
    @Request() req,
    @Param('videoId', ParseUUIDPipe) videoId: string,
  ) {
    const affiliateId = req.user.affiliateId || req.user.id
    return this.creatorContentService.getVideoAnalytics(videoId, affiliateId)
  }

  // ========== LIVE STREAMING ==========

  @Post('live/streams')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create affiliate live stream' })
  async createLiveStream(
    @Request() req,
    @Body() streamData: { title: string; description?: string; sellerId: string; productIds?: string[] },
  ) {
    const affiliateId = req.user.affiliateId || req.user.id
    return this.creatorLiveService.createAffiliateStream(affiliateId, streamData.sellerId, streamData)
  }

  @Post('live/streams/schedule')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Schedule affiliate live stream' })
  async scheduleLiveStream(
    @Request() req,
    @Body() streamData: { title: string; description?: string; sellerId: string; scheduledAt: string; productIds?: string[] },
  ) {
    const affiliateId = req.user.affiliateId || req.user.id
    const scheduledAt = new Date(streamData.scheduledAt)

    return this.creatorLiveService.scheduleStream(affiliateId, streamData.sellerId, {
      ...streamData,
      scheduledAt
    })
  }

  @Post('live/streams/:streamId/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start live stream' })
  async startLiveStream(
    @Request() req,
    @Param('streamId', ParseUUIDPipe) streamId: string,
  ) {
    const affiliateId = req.user.affiliateId || req.user.id
    return this.creatorLiveService.startAffiliateStream(streamId, affiliateId)
  }

  @Post('live/streams/:streamId/end')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'End live stream' })
  async endLiveStream(
    @Request() req,
    @Param('streamId', ParseUUIDPipe) streamId: string,
  ) {
    const affiliateId = req.user.affiliateId || req.user.id
    return this.creatorLiveService.endAffiliateStream(streamId, affiliateId)
  }

  @Get('live/streams')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get creator live streams' })
  async getMyLiveStreams(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('status') status?: string,
  ) {
    const affiliateId = req.user.affiliateId || req.user.id
    return this.creatorLiveService.getAffiliateStreams(affiliateId, status as any, page || 1, limit || 20)
  }

  @Get('live/streams/active')
  @ApiOperation({ summary: 'Get active affiliate live streams' })
  async getActiveLiveStreams(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.creatorLiveService.getActiveAffiliateStreams(page, limit)
  }

  @Get('live/streams/upcoming')
  @ApiOperation({ summary: 'Get upcoming live streams' })
  async getUpcomingStreams(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('creatorId') creatorId?: string,
  ) {
    return this.creatorLiveService.getUpcomingStreams(creatorId, page || 1, limit || 10)
  }

  @Get('live/streams/:streamId/analytics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get live stream analytics' })
  async getLiveStreamAnalytics(
    @Request() req,
    @Param('streamId', ParseUUIDPipe) streamId: string,
  ) {
    const affiliateId = req.user.affiliateId || req.user.id
    return this.creatorLiveService.getStreamAnalytics(streamId, affiliateId)
  }

  @Put('live/streams/:streamId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update scheduled live stream' })
  async updateScheduledStream(
    @Request() req,
    @Param('streamId', ParseUUIDPipe) streamId: string,
    @Body() updateData: any,
  ) {
    const affiliateId = req.user.affiliateId || req.user.id
    return this.creatorLiveService.updateScheduledStream(streamId, affiliateId, updateData)
  }
}