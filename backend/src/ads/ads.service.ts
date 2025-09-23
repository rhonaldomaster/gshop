import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Campaign, CampaignMetric, CampaignStatus } from './ads.entity';
import { CreateCampaignDto, UpdateCampaignDto, CampaignMetricsDto } from './dto';

@Injectable()
export class AdsService {
  constructor(
    @InjectRepository(Campaign)
    private campaignRepository: Repository<Campaign>,
    @InjectRepository(CampaignMetric)
    private metricsRepository: Repository<CampaignMetric>,
  ) {}

  async createCampaign(sellerId: string, createCampaignDto: CreateCampaignDto): Promise<Campaign> {
    const campaign = this.campaignRepository.create({
      ...createCampaignDto,
      sellerId,
    });

    return this.campaignRepository.save(campaign);
  }

  async findCampaignsBySeller(sellerId: string): Promise<Campaign[]> {
    return this.campaignRepository.find({
      where: { sellerId },
      relations: ['metrics'],
      order: { createdAt: 'DESC' },
    });
  }

  async findCampaignById(id: string, sellerId: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id, sellerId },
      relations: ['metrics'],
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  async updateCampaign(id: string, sellerId: string, updateCampaignDto: UpdateCampaignDto): Promise<Campaign> {
    const campaign = await this.findCampaignById(id, sellerId);

    Object.assign(campaign, updateCampaignDto);
    return this.campaignRepository.save(campaign);
  }

  async deleteCampaign(id: string, sellerId: string): Promise<void> {
    const campaign = await this.findCampaignById(id, sellerId);
    await this.campaignRepository.remove(campaign);
  }

  async updateCampaignStatus(id: string, sellerId: string, status: CampaignStatus): Promise<Campaign> {
    const campaign = await this.findCampaignById(id, sellerId);
    campaign.status = status;

    if (status === CampaignStatus.ACTIVE && !campaign.startDate) {
      campaign.startDate = new Date();
    }

    if (status === CampaignStatus.COMPLETED && !campaign.endDate) {
      campaign.endDate = new Date();
    }

    return this.campaignRepository.save(campaign);
  }

  async recordMetrics(campaignId: string, metricsDto: CampaignMetricsDto): Promise<CampaignMetric> {
    const metric = this.metricsRepository.create({
      campaignId,
      ...metricsDto,
      ctr: metricsDto.impressions > 0 ? metricsDto.clicks / metricsDto.impressions : 0,
      cpa: metricsDto.conversions > 0 ? metricsDto.spend / metricsDto.conversions : 0,
      roas: metricsDto.spend > 0 ? metricsDto.revenue / metricsDto.spend : 0,
    });

    return this.metricsRepository.save(metric);
  }

  async getCampaignMetrics(campaignId: string, startDate?: Date, endDate?: Date): Promise<CampaignMetric[]> {
    const where: any = { campaignId };

    if (startDate && endDate) {
      where.date = Between(startDate, endDate);
    }

    return this.metricsRepository.find({
      where,
      order: { date: 'DESC' },
    });
  }

  async getDashboardStats(sellerId: string): Promise<any> {
    const campaigns = await this.campaignRepository.find({
      where: { sellerId },
      relations: ['metrics'],
    });

    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === CampaignStatus.ACTIVE).length;
    const totalSpent = campaigns.reduce((sum, c) => sum + Number(c.spent), 0);

    const totalMetrics = campaigns.reduce((acc, campaign) => {
      campaign.metrics.forEach(metric => {
        acc.impressions += metric.impressions;
        acc.clicks += metric.clicks;
        acc.conversions += metric.conversions;
        acc.revenue += Number(metric.revenue);
      });
      return acc;
    }, { impressions: 0, clicks: 0, conversions: 0, revenue: 0 });

    const avgCTR = totalMetrics.impressions > 0 ? totalMetrics.clicks / totalMetrics.impressions : 0;
    const avgCPA = totalMetrics.conversions > 0 ? totalSpent / totalMetrics.conversions : 0;
    const avgROAS = totalSpent > 0 ? totalMetrics.revenue / totalSpent : 0;

    return {
      totalCampaigns,
      activeCampaigns,
      totalSpent,
      totalRevenue: totalMetrics.revenue,
      avgCTR: Number(avgCTR.toFixed(4)),
      avgCPA: Number(avgCPA.toFixed(2)),
      avgROAS: Number(avgROAS.toFixed(2)),
      ...totalMetrics,
    };
  }
}