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
  Request
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LiveService } from './live.service';
import { LiveMetricsService } from './live-metrics.service';
import { CreateLiveStreamDto, CreateAffiliateLiveStreamDto, UpdateLiveStreamDto, AddProductToStreamDto, SendMessageDto, JoinStreamDto, LiveDashboardStatsDto, LiveStreamAnalyticsDto, NativeStreamCredentialsDto, OBSSetupInfoDto } from './dto';
import { HostType } from './live.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Live Shopping')

@Controller('live')
export class LiveController {
  constructor(
    private readonly liveService: LiveService,
    private readonly metricsService: LiveMetricsService,
  ) {}

  // Seller endpoints
  @Post('streams')
  @UseGuards(JwtAuthGuard)
  async createLiveStream(@Request() req, @Body() createLiveStreamDto: CreateLiveStreamDto) {
    return this.liveService.createLiveStream(req.user.sellerId, createLiveStreamDto, HostType.SELLER);
  }

  // Affiliate endpoints
  @Post('affiliate/streams')
  @UseGuards(JwtAuthGuard)
  async createAffiliateLiveStream(@Request() req, @Body() dto: CreateAffiliateLiveStreamDto) {
    return this.liveService.createAffiliateLiveStream(req.user.affiliateId, dto);
  }

  @Get('streams')
  @UseGuards(JwtAuthGuard)
  async getLiveStreams(@Request() req) {
    return this.liveService.findLiveStreamsBySeller(req.user.sellerId);
  }

  @Get('affiliate/streams')
  @UseGuards(JwtAuthGuard)
  async getAffiliateLiveStreams(@Request() req) {
    return this.liveService.findLiveStreamsByAffiliate(req.user.affiliateId);
  }

  @Get('streams/active')
  async getActiveLiveStreams() {
    return this.liveService.findActiveLiveStreams();
  }

  @Get('streams/:id')
  async getLiveStream(@Param('id') id: string) {
    return this.liveService.findLiveStreamById(id);
  }

  @Put('streams/:id')
  @UseGuards(JwtAuthGuard)
  async updateLiveStream(
    @Request() req,
    @Param('id') id: string,
    @Body() updateLiveStreamDto: UpdateLiveStreamDto,
  ) {
    return this.liveService.updateLiveStream(id, req.user.sellerId, updateLiveStreamDto, HostType.SELLER);
  }

  @Put('affiliate/streams/:id')
  @UseGuards(JwtAuthGuard)
  async updateAffiliateLiveStream(
    @Request() req,
    @Param('id') id: string,
    @Body() updateLiveStreamDto: UpdateLiveStreamDto,
  ) {
    return this.liveService.updateLiveStream(id, req.user.affiliateId, updateLiveStreamDto, HostType.AFFILIATE);
  }

  @Delete('streams/:id')
  @UseGuards(JwtAuthGuard)
  async deleteLiveStream(@Request() req, @Param('id') id: string) {
    await this.liveService.deleteLiveStream(id, req.user.sellerId, HostType.SELLER);
    return { message: 'Live stream deleted successfully' };
  }

  @Delete('affiliate/streams/:id')
  @UseGuards(JwtAuthGuard)
  async deleteAffiliateLiveStream(@Request() req, @Param('id') id: string) {
    await this.liveService.deleteLiveStream(id, req.user.affiliateId, HostType.AFFILIATE);
    return { message: 'Live stream deleted successfully' };
  }

  @Post('streams/:id/start')
  @UseGuards(JwtAuthGuard)
  async startLiveStream(@Request() req, @Param('id') id: string) {
    return this.liveService.startLiveStream(id, req.user.sellerId, HostType.SELLER);
  }

  @Post('affiliate/streams/:id/start')
  @UseGuards(JwtAuthGuard)
  async startAffiliateLiveStream(@Request() req, @Param('id') id: string) {
    return this.liveService.startLiveStream(id, req.user.affiliateId, HostType.AFFILIATE);
  }

  @Post('streams/:id/end')
  @UseGuards(JwtAuthGuard)
  async endLiveStream(@Request() req, @Param('id') id: string) {
    return this.liveService.endLiveStream(id, req.user.sellerId, HostType.SELLER);
  }

  @Post('affiliate/streams/:id/end')
  @UseGuards(JwtAuthGuard)
  async endAffiliateLiveStream(@Request() req, @Param('id') id: string) {
    return this.liveService.endLiveStream(id, req.user.affiliateId, HostType.AFFILIATE);
  }

  // ==================== NATIVE STREAMING CREDENTIALS ====================

  @Get('streams/:id/native-credentials')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get native streaming credentials for mobile broadcasting (Seller)' })
  @ApiResponse({
    status: 200,
    description: 'Native streaming credentials retrieved successfully',
    type: NativeStreamCredentialsDto,
  })
  async getNativeCredentials(
    @Request() req,
    @Param('id') id: string,
  ): Promise<NativeStreamCredentialsDto> {
    return this.liveService.getNativeStreamCredentials(id, req.user.sellerId, HostType.SELLER);
  }

  @Get('affiliate/streams/:id/native-credentials')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get native streaming credentials for mobile broadcasting (Affiliate)' })
  @ApiResponse({
    status: 200,
    description: 'Native streaming credentials retrieved successfully',
    type: NativeStreamCredentialsDto,
  })
  async getAffiliateNativeCredentials(
    @Request() req,
    @Param('id') id: string,
  ): Promise<NativeStreamCredentialsDto> {
    return this.liveService.getNativeStreamCredentials(id, req.user.affiliateId, HostType.AFFILIATE);
  }

  @Get('streams/:id/obs-setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get OBS setup information for external streaming (Seller)' })
  @ApiResponse({
    status: 200,
    description: 'OBS setup information retrieved successfully',
    type: OBSSetupInfoDto,
  })
  async getOBSSetup(
    @Request() req,
    @Param('id') id: string,
  ): Promise<OBSSetupInfoDto> {
    return this.liveService.getOBSSetupInfo(id, req.user.sellerId, HostType.SELLER);
  }

  @Get('affiliate/streams/:id/obs-setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get OBS setup information for external streaming (Affiliate)' })
  @ApiResponse({
    status: 200,
    description: 'OBS setup information retrieved successfully',
    type: OBSSetupInfoDto,
  })
  async getAffiliateOBSSetup(
    @Request() req,
    @Param('id') id: string,
  ): Promise<OBSSetupInfoDto> {
    return this.liveService.getOBSSetupInfo(id, req.user.affiliateId, HostType.AFFILIATE);
  }

  @Post('streams/:id/regenerate-key')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Regenerate stream key if compromised (Seller)' })
  @ApiResponse({
    status: 200,
    description: 'Stream key regenerated successfully',
  })
  async regenerateStreamKey(
    @Request() req,
    @Param('id') id: string,
  ) {
    return this.liveService.regenerateStreamKey(id, req.user.sellerId, HostType.SELLER);
  }

  @Post('affiliate/streams/:id/regenerate-key')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Regenerate stream key if compromised (Affiliate)' })
  @ApiResponse({
    status: 200,
    description: 'Stream key regenerated successfully',
  })
  async regenerateAffiliateStreamKey(
    @Request() req,
    @Param('id') id: string,
  ) {
    return this.liveService.regenerateStreamKey(id, req.user.affiliateId, HostType.AFFILIATE);
  }

  @Post('streams/:id/products')
  @UseGuards(JwtAuthGuard)
  async addProductToStream(
    @Request() req,
    @Param('id') streamId: string,
    @Body() addProductDto: AddProductToStreamDto,
  ) {
    return this.liveService.addProductToStream(streamId, req.user.sellerId, addProductDto);
  }

  @Delete('streams/:id/products/:productId')
  @UseGuards(JwtAuthGuard)
  async removeProductFromStream(
    @Request() req,
    @Param('id') streamId: string,
    @Param('productId') productId: string,
  ) {
    await this.liveService.removeProductFromStream(streamId, productId, req.user.sellerId);
    return { message: 'Product removed from stream successfully' };
  }

  @Put('streams/:id/products/:productId')
  @UseGuards(JwtAuthGuard)
  async updateStreamProduct(
    @Request() req,
    @Param('id') streamId: string,
    @Param('productId') productId: string,
    @Body() updates: any,
  ) {
    return this.liveService.updateStreamProduct(streamId, productId, req.user.sellerId, updates);
  }

  @Post('streams/:id/messages')
  async sendMessage(
    @Param('id') streamId: string,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.liveService.sendMessage(streamId, sendMessageDto);
  }

  @Get('streams/:id/messages')
  async getStreamMessages(
    @Param('id') streamId: string,
    @Query('limit') limit?: number,
  ) {
    return this.liveService.getStreamMessages(streamId, limit ? parseInt(limit.toString()) : 50);
  }

  @Post('streams/:id/join')
  async joinStream(
    @Param('id') streamId: string,
    @Body() joinStreamDto: JoinStreamDto,
  ) {
    return this.liveService.joinStream(
      streamId,
      joinStreamDto.userId,
      joinStreamDto.sessionId,
      joinStreamDto.ipAddress,
      joinStreamDto.userAgent,
    );
  }

  @Post('streams/:id/leave')
  async leaveStream(
    @Param('id') streamId: string,
    @Body() body: { userId?: string; sessionId?: string },
  ) {
    await this.liveService.leaveStream(streamId, body.userId, body.sessionId);
    return { message: 'Left stream successfully' };
  }

  @Get('streams/:id/stats')
  @UseGuards(JwtAuthGuard)
  async getStreamStats(@Request() req, @Param('id') id: string) {
    return this.liveService.getStreamStats(id, req.user.sellerId);
  }

  @Get('dashboard-stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get live shopping dashboard statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    type: LiveDashboardStatsDto,
  })
  async getDashboardStats(): Promise<LiveDashboardStatsDto> {
    return this.liveService.getDashboardStats();
  }

  @Get('analytics/:streamId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get detailed analytics for a specific live stream' })
  @ApiResponse({
    status: 200,
    description: 'Stream analytics retrieved successfully',
    type: LiveStreamAnalyticsDto,
  })
  async getStreamAnalytics(@Param('streamId') streamId: string): Promise<LiveStreamAnalyticsDto> {
    return this.liveService.getStreamAnalytics(streamId);
  }

  // Product Overlay System Endpoints
  @Put('streams/:streamId/products/:productId/highlight')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Highlight product in live stream overlay' })
  @ApiResponse({ status: 200, description: 'Product highlighted successfully' })
  async highlightProduct(
    @Param('streamId') streamId: string,
    @Param('productId') productId: string,
    @Request() req
  ) {
    return this.liveService.highlightProduct(streamId, productId, req.user.sellerId);
  }

  @Put('streams/:streamId/products/:productId/hide')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Hide highlighted product from overlay' })
  @ApiResponse({ status: 200, description: 'Product hidden successfully' })
  async hideProduct(
    @Param('streamId') streamId: string,
    @Param('productId') productId: string,
    @Request() req
  ) {
    return this.liveService.hideProduct(streamId, productId, req.user.sellerId);
  }

  @Put('streams/:streamId/products/reorder')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Reorder products in stream' })
  @ApiResponse({ status: 200, description: 'Products reordered successfully' })
  async reorderProducts(
    @Param('streamId') streamId: string,
    @Request() req,
    @Body() body: { productOrder: { productId: string; position: number }[] }
  ) {
    await this.liveService.reorderProducts(streamId, req.user.sellerId, body.productOrder);
    return { message: 'Products reordered successfully' };
  }

  @Get('streams/:streamId/products/highlighted')
  @ApiOperation({ summary: 'Get highlighted products for stream' })
  @ApiResponse({ status: 200, description: 'Highlighted products retrieved successfully' })
  async getHighlightedProducts(@Param('streamId') streamId: string) {
    return this.liveService.getHighlightedProducts(streamId);
  }

  @Get('streams/:streamId/products')
  @ApiOperation({ summary: 'Get all products for a stream' })
  @ApiResponse({ status: 200, description: 'Stream products retrieved successfully' })
  async getStreamProducts(@Param('streamId') streamId: string) {
    return this.liveService.getActiveStreamProducts(streamId);
  }

  // ==================== METRICS ENDPOINTS ====================

  @Get('streams/:streamId/metrics/history')
  @ApiOperation({ summary: 'Get metrics history for a stream' })
  @ApiResponse({ status: 200, description: 'Metrics history retrieved successfully' })
  async getMetricsHistory(
    @Param('streamId') streamId: string,
    @Query('limit') limit?: number,
  ) {
    return this.metricsService.getStreamMetricsHistory(streamId, limit || 60);
  }

  @Get('streams/:streamId/metrics/summary')
  @ApiOperation({ summary: 'Get aggregated metrics summary for a stream' })
  @ApiResponse({ status: 200, description: 'Metrics summary retrieved successfully' })
  async getMetricsSummary(@Param('streamId') streamId: string) {
    return this.metricsService.getStreamMetricsSummary(streamId);
  }

  @Post('streams/:streamId/metrics/collect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Manually trigger metrics collection for a stream' })
  @ApiResponse({ status: 200, description: 'Metrics collected successfully' })
  async collectStreamMetrics(@Param('streamId') streamId: string) {
    return this.metricsService.collectStreamMetrics(streamId);
  }

  // ==================== DISCOVERY & SEARCH ENDPOINTS ====================

  @Get('discover')
  @ApiOperation({ summary: 'Discover active streams with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Active streams retrieved successfully' })
  async discoverStreams(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('category') category?: string,
    @Query('tags') tags?: string,
    @Query('sortBy') sortBy?: 'viewers' | 'likes' | 'trending' | 'recent',
  ) {
    const tagsArray = tags ? tags.split(',').map(t => t.trim()) : undefined;

    return this.liveService.getActiveStreamsWithFilters({
      page: page ? parseInt(page.toString()) : 1,
      limit: limit ? parseInt(limit.toString()) : 20,
      category,
      tags: tagsArray,
      sortBy: sortBy || 'trending',
    });
  }

  @Get('search')
  @ApiOperation({ summary: 'Search live streams by title or description' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async searchStreams(
    @Query('q') query: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('category') category?: string,
  ) {
    return this.liveService.searchStreams({
      query,
      page: page ? parseInt(page.toString()) : 1,
      limit: limit ? parseInt(limit.toString()) : 20,
      category,
    });
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending live streams' })
  @ApiResponse({ status: 200, description: 'Trending streams retrieved successfully' })
  async getTrendingStreams(@Query('limit') limit?: number) {
    return this.liveService.getTrendingStreams(
      limit ? parseInt(limit.toString()) : 10,
    );
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all available stream categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategories() {
    return this.liveService.getCategories();
  }

  @Get('for-you')
  @ApiOperation({ summary: 'Get personalized "For You" feed with recommendations' })
  @ApiResponse({ status: 200, description: 'Personalized feed retrieved successfully' })
  async getForYouFeed(
    @Request() req,
    @Query('limit') limit?: number,
  ) {
    // Extract userId from JWT if available (optional auth)
    const userId = req.user?.userId || req.user?.id || null;

    return this.liveService.getForYouFeed(
      userId,
      limit ? parseInt(limit.toString()) : 20,
    );
  }
}