import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { VatReportDto } from './dto/vat-report.dto';
import { SalesTrendsDto, TimePeriod } from './dto/sales-trends.dto';
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

  @Get('overview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get analytics overview for admin dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Analytics overview retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalRevenue: { type: 'number', example: 125000000 },
        totalOrders: { type: 'number', example: 1250 },
        totalUsers: { type: 'number', example: 3450 },
        totalProducts: { type: 'number', example: 567 },
        averageOrderValue: { type: 'number', example: 100000 },
        conversionRate: { type: 'number', example: 3.2 },
      },
    },
  })
  async getAnalyticsOverview() {
    return await this.analyticsService.getAnalyticsOverview();
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

  @Get('sales-trends')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get sales trends with time-series data for charts' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: TimePeriod,
    description: 'Time period for aggregation (default: monthly)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (YYYY-MM-DD) - defaults to start of current year',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (YYYY-MM-DD) - defaults to end of current year',
  })
  @ApiResponse({
    status: 200,
    description: 'Sales trends retrieved successfully',
    type: SalesTrendsDto,
  })
  async getSalesTrends(
    @Query('period') period?: TimePeriod,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<SalesTrendsDto> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return await this.analyticsService.generateSalesTrends(
      period || TimePeriod.MONTHLY,
      start,
      end,
    );
  }
}
