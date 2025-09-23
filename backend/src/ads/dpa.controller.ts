import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request
} from '@nestjs/common';
import { DPAService } from './dpa.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('dpa')
export class DPAController {
  constructor(private readonly dpaService: DPAService) {}

  @Get('feed/:sellerId')
  async getProductFeed(@Param('sellerId') sellerId: string) {
    return this.dpaService.generateProductFeed(sellerId);
  }

  @Get('recommendations/:userId')
  async getPersonalizedRecommendations(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
  ) {
    const limitNum = limit ? parseInt(limit.toString()) : 10;
    return this.dpaService.getPersonalizedRecommendations(userId, limitNum);
  }

  @Get('retargeting/:audienceId')
  @UseGuards(JwtAuthGuard)
  async getRetargetingAds(
    @Param('audienceId') audienceId: string,
    @Query('limit') limit?: number,
  ) {
    const limitNum = limit ? parseInt(limit.toString()) : 20;
    return this.dpaService.getRetargetingAds(audienceId, limitNum);
  }

  @Get('creative/:productId')
  async getCreativeAssets(@Param('productId') productId: string) {
    return this.dpaService.generateCreativeAssets(productId);
  }

  @Post('track/impression/:productId')
  async trackImpression(
    @Param('productId') productId: string,
    @Request() req,
  ) {
    // Track DPA impression - could integrate with pixel tracking
    return { message: 'Impression tracked', productId, timestamp: new Date() };
  }

  @Post('track/click/:productId')
  async trackClick(
    @Param('productId') productId: string,
    @Request() req,
  ) {
    // Track DPA click - could integrate with pixel tracking
    return { message: 'Click tracked', productId, timestamp: new Date() };
  }
}