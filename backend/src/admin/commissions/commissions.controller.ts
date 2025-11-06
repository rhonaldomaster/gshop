import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { CommissionsService } from './commissions.service';
import { CommissionFiltersDto } from './dto/commission-filters.dto';

// Note: Implement AdminGuard based on your auth system
// For now, we'll comment it out
// import { AdminGuard } from '../../auth/guards/admin.guard';

@ApiTags('Admin - Commissions')
@Controller('api/v1/admin/commissions')
// @UseGuards(AdminGuard) // Uncomment when AdminGuard is implemented
@ApiBearerAuth()
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all commissions with filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns filtered commissions with summary',
  })
  async getCommissions(@Query() filters: CommissionFiltersDto) {
    return this.commissionsService.getCommissions(filters);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export commissions to CSV or Excel' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns file download',
  })
  async exportCommissions(
    @Query() filters: CommissionFiltersDto,
    @Query('format') format: 'csv' | 'excel',
    @Res() res: Response,
  ) {
    const data = await this.commissionsService.getCommissions(filters);

    if (format === 'csv') {
      const csv = this.commissionsService.generateCSV(data.commissions);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=comisiones_${Date.now()}.csv`,
      );
      return res.send(csv);
    } else {
      const excel = this.commissionsService.generateExcel(data.commissions);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=comisiones_${Date.now()}.xlsx`,
      );
      return res.send(excel);
    }
  }
}
