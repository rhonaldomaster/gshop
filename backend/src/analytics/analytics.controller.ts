import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { VatReportDto } from './dto/vat-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('vat-report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate VAT report for Colombian tax compliance' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'sellerId', required: false, description: 'Filter by seller ID (optional)' })
  async getVatReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('sellerId') sellerId?: string,
  ): Promise<VatReportDto> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return await this.analyticsService.generateVatReport(start, end, sellerId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get global platform statistics' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  async getGlobalStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return await this.analyticsService.getGlobalStats(start, end);
  }

  @Get('seller-performance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get top performing sellers' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of sellers to return (default: 10)' })
  async getSellerPerformance(@Query('limit') limit?: number) {
    return await this.analyticsService.getSellerPerformance(limit || 10);
  }
}
