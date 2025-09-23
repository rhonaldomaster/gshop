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
import { AdsService } from './ads.service';
import { CreateCampaignDto, UpdateCampaignDto, CampaignMetricsDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CampaignStatus } from './ads.entity';

@Controller('ads')
@UseGuards(JwtAuthGuard)
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Post('campaigns')
  async createCampaign(@Request() req, @Body() createCampaignDto: CreateCampaignDto) {
    return this.adsService.createCampaign(req.user.sellerId, createCampaignDto);
  }

  @Get('campaigns')
  async getCampaigns(@Request() req) {
    return this.adsService.findCampaignsBySeller(req.user.sellerId);
  }

  @Get('campaigns/:id')
  async getCampaign(@Request() req, @Param('id') id: string) {
    return this.adsService.findCampaignById(id, req.user.sellerId);
  }

  @Put('campaigns/:id')
  async updateCampaign(
    @Request() req,
    @Param('id') id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
  ) {
    return this.adsService.updateCampaign(id, req.user.sellerId, updateCampaignDto);
  }

  @Put('campaigns/:id/status')
  async updateCampaignStatus(
    @Request() req,
    @Param('id') id: string,
    @Body('status') status: CampaignStatus,
  ) {
    return this.adsService.updateCampaignStatus(id, req.user.sellerId, status);
  }

  @Delete('campaigns/:id')
  async deleteCampaign(@Request() req, @Param('id') id: string) {
    await this.adsService.deleteCampaign(id, req.user.sellerId);
    return { message: 'Campaign deleted successfully' };
  }

  @Post('campaigns/:id/metrics')
  async recordMetrics(
    @Param('id') campaignId: string,
    @Body() metricsDto: CampaignMetricsDto,
  ) {
    return this.adsService.recordMetrics(campaignId, metricsDto);
  }

  @Get('campaigns/:id/metrics')
  async getCampaignMetrics(
    @Param('id') campaignId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.adsService.getCampaignMetrics(campaignId, start, end);
  }

  @Get('dashboard')
  async getDashboard(@Request() req) {
    return this.adsService.getDashboardStats(req.user.sellerId);
  }
}