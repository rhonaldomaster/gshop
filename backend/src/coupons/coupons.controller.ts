import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CouponsService } from './coupons.service';
import {
  CouponType,
  CouponStatus,
} from '../database/entities/coupon.entity';

@ApiTags('coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new coupon (admin only)' })
  async create(
    @Body()
    body: {
      code: string;
      description: string;
      type: CouponType;
      value: number;
      minPurchaseAmount?: number;
      maxDiscountAmount?: number;
      usageLimit?: number;
      validFrom?: Date;
      validUntil?: Date;
    },
  ) {
    return this.couponsService.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'Get all coupons' })
  async findAll() {
    return this.couponsService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active coupons' })
  async findActive() {
    return this.couponsService.findActive();
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update coupon status (admin only)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: CouponStatus },
  ) {
    return this.couponsService.updateStatus(id, body.status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete coupon (admin only)' })
  async delete(@Param('id') id: string) {
    await this.couponsService.delete(id);
    return { message: 'Coupon deleted successfully' };
  }
}
