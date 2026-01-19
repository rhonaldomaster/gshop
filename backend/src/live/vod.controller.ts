import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VodService } from './vod.service';
import {
  VodResponseDto,
  VodListResponseDto,
  VodQueryDto,
  CreateVodFromStreamDto,
  IVSRecordingWebhookDto,
} from './dto';
import { HostType } from './live.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('VOD - Video On Demand')
@Controller('vod')
export class VodController {
  constructor(private readonly vodService: VodService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  @Get()
  @ApiOperation({ summary: 'Get all available VODs with pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of VODs retrieved successfully',
    type: VodListResponseDto,
  })
  async getVods(@Query() query: VodQueryDto): Promise<VodListResponseDto> {
    const result = await this.vodService.findAll({
      page: query.page,
      limit: query.limit,
      sellerId: query.sellerId,
      affiliateId: query.affiliateId,
      status: query.status,
    });

    return {
      vods: result.vods.map(vod => this.mapVodToResponse(vod)),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending VODs' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Trending VODs retrieved successfully',
  })
  async getTrendingVods(@Query('limit') limit?: number): Promise<VodResponseDto[]> {
    const vods = await this.vodService.getTrendingVods(limit || 10);
    return vods.map(vod => this.mapVodToResponse(vod));
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent VODs' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Recent VODs retrieved successfully',
  })
  async getRecentVods(@Query('limit') limit?: number): Promise<VodResponseDto[]> {
    const vods = await this.vodService.getRecentVods(limit || 10);
    return vods.map(vod => this.mapVodToResponse(vod));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get VOD by ID' })
  @ApiResponse({
    status: 200,
    description: 'VOD retrieved successfully',
    type: VodResponseDto,
  })
  @ApiResponse({ status: 404, description: 'VOD not found' })
  async getVodById(@Param('id') id: string): Promise<VodResponseDto> {
    const vod = await this.vodService.findById(id);
    return this.mapVodToResponse(vod);
  }

  @Post(':id/view')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Increment view count for a VOD' })
  @ApiResponse({ status: 204, description: 'View count incremented' })
  async incrementViewCount(@Param('id') id: string): Promise<void> {
    await this.vodService.incrementViewCount(id);
  }

  @Get('stream/:streamId')
  @ApiOperation({ summary: 'Get VOD by stream ID' })
  @ApiResponse({
    status: 200,
    description: 'VOD retrieved successfully',
    type: VodResponseDto,
  })
  @ApiResponse({ status: 404, description: 'VOD not found for this stream' })
  async getVodByStreamId(@Param('streamId') streamId: string): Promise<VodResponseDto | null> {
    const vod = await this.vodService.findByStreamId(streamId);
    if (!vod) {
      return null;
    }
    return this.mapVodToResponse(vod);
  }

  // ==================== SELLER ENDPOINTS ====================

  @Get('seller/my-vods')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get VODs for the authenticated seller' })
  @ApiResponse({
    status: 200,
    description: 'Seller VODs retrieved successfully',
    type: VodListResponseDto,
  })
  async getSellerVods(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<VodListResponseDto> {
    const result = await this.vodService.findBySellerId(
      req.user.sellerId,
      page || 1,
      limit || 20,
    );

    return {
      vods: result.vods.map(vod => this.mapVodToResponse(vod)),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  @Delete('seller/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a VOD (Seller)' })
  @ApiResponse({ status: 200, description: 'VOD deleted successfully' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  @ApiResponse({ status: 404, description: 'VOD not found' })
  async deleteSellerVod(
    @Request() req,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.vodService.deleteVod(id, req.user.sellerId, HostType.SELLER);
    return { message: 'VOD deleted successfully' };
  }

  @Post('seller/create-from-stream')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Manually create VOD from an ended stream (Seller)' })
  @ApiResponse({
    status: 201,
    description: 'VOD created successfully',
    type: VodResponseDto,
  })
  async createSellerVodFromStream(
    @Request() req,
    @Body() dto: CreateVodFromStreamDto,
  ): Promise<VodResponseDto> {
    // First verify the seller owns the stream
    await this.vodService['liveStreamRepository'].findOneOrFail({
      where: { id: dto.streamId, sellerId: req.user.sellerId },
    });

    const vod = await this.vodService.createVodFromStream(dto.streamId);
    return this.mapVodToResponse(vod);
  }

  // ==================== AFFILIATE ENDPOINTS ====================

  @Get('affiliate/my-vods')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get VODs for the authenticated affiliate' })
  @ApiResponse({
    status: 200,
    description: 'Affiliate VODs retrieved successfully',
    type: VodListResponseDto,
  })
  async getAffiliateVods(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<VodListResponseDto> {
    const result = await this.vodService.findByAffiliateId(
      req.user.affiliateId,
      page || 1,
      limit || 20,
    );

    return {
      vods: result.vods.map(vod => this.mapVodToResponse(vod)),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  @Delete('affiliate/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a VOD (Affiliate)' })
  @ApiResponse({ status: 200, description: 'VOD deleted successfully' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  @ApiResponse({ status: 404, description: 'VOD not found' })
  async deleteAffiliateVod(
    @Request() req,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.vodService.deleteVod(id, req.user.affiliateId, HostType.AFFILIATE);
    return { message: 'VOD deleted successfully' };
  }

  @Post('affiliate/create-from-stream')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Manually create VOD from an ended stream (Affiliate)' })
  @ApiResponse({
    status: 201,
    description: 'VOD created successfully',
    type: VodResponseDto,
  })
  async createAffiliateVodFromStream(
    @Request() req,
    @Body() dto: CreateVodFromStreamDto,
  ): Promise<VodResponseDto> {
    // First verify the affiliate owns the stream
    await this.vodService['liveStreamRepository'].findOneOrFail({
      where: { id: dto.streamId, affiliateId: req.user.affiliateId },
    });

    const vod = await this.vodService.createVodFromStream(dto.streamId);
    return this.mapVodToResponse(vod);
  }

  // ==================== WEBHOOK ENDPOINTS ====================

  @Post('webhook/ivs-recording')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook endpoint for AWS IVS recording events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleIVSRecordingWebhook(
    @Body() payload: IVSRecordingWebhookDto,
  ): Promise<{ received: boolean }> {
    console.log('[VOD Controller] Received IVS recording webhook:', payload.recording_status);

    if (payload.recording_status === 'RECORDING_ENDED') {
      await this.vodService.handleRecordingComplete({
        stream_id: payload.stream_id,
        recording_s3_bucket_name: payload.recording_s3_bucket_name,
        recording_s3_key_prefix: payload.recording_s3_key_prefix,
        recording_duration_ms: payload.recording_duration_ms,
        recording_status: payload.recording_status,
        channel_arn: payload.channel_arn,
      });
    }

    return { received: true };
  }

  // ==================== HELPER METHODS ====================

  private mapVodToResponse(vod: any): VodResponseDto {
    const response: VodResponseDto = {
      id: vod.id,
      streamId: vod.streamId,
      videoUrl: vod.videoUrl,
      thumbnailUrl: vod.thumbnailUrl,
      hlsManifestUrl: vod.hlsManifestUrl,
      duration: vod.duration,
      fileSize: vod.fileSize,
      viewCount: vod.viewCount,
      status: vod.status,
      storageProvider: vod.storageProvider,
      qualities: vod.qualities || [],
      createdAt: vod.createdAt,
      processedAt: vod.processedAt,
    };

    // Add stream info if available
    if (vod.stream) {
      response.stream = {
        id: vod.stream.id,
        title: vod.stream.title,
        description: vod.stream.description,
        hostType: vod.stream.hostType,
        sellerId: vod.stream.sellerId,
        affiliateId: vod.stream.affiliateId,
        thumbnailUrl: vod.stream.thumbnailUrl,
        totalSales: Number(vod.stream.totalSales) || 0,
        peakViewers: vod.stream.peakViewers || 0,
        category: vod.stream.category,
        tags: vod.stream.tags || [],
      };

      // Add host info
      if (vod.stream.seller) {
        response.host = {
          id: vod.stream.seller.id,
          name: vod.stream.seller.businessName || vod.stream.seller.name,
          avatar: vod.stream.seller.logo || vod.stream.seller.avatar,
          type: 'seller',
        };
      } else if (vod.stream.affiliate) {
        response.host = {
          id: vod.stream.affiliate.id,
          name: vod.stream.affiliate.name,
          avatar: vod.stream.affiliate.avatar,
          type: 'affiliate',
        };
      }

      // Add products if available
      if (vod.stream.products && vod.stream.products.length > 0) {
        response.products = vod.stream.products
          .filter((sp: any) => sp.product)
          .map((sp: any) => ({
            id: sp.product.id,
            name: sp.product.name,
            price: Number(sp.product.price) || 0,
            specialPrice: sp.specialPrice ? Number(sp.specialPrice) : undefined,
            imageUrl: sp.product.images?.[0] || sp.product.imageUrl,
            orderCount: sp.orderCount || 0,
          }));
      }
    }

    return response;
  }
}
