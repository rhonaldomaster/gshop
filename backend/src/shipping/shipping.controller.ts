import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';
import { GetShippingRatesDto, ConfirmShippingDto, ShippingOptionDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrderStatus } from '../database/entities/order.entity';

@ApiTags('Shipping')
@Controller('api/v1')
export class ShippingController {
  constructor(private shippingService: ShippingService) {}

  // Calculates shipping rates before order creation
  @Post('shipping/calculate-rates')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate shipping rates without creating order' })
  @ApiResponse({
    status: 200,
    description: 'Shipping rates calculated successfully',
    type: [ShippingOptionDto],
  })
  async calculateShippingRates(
    @Body() ratesDto: GetShippingRatesDto,
  ): Promise<ShippingOptionDto[]> {
    return this.shippingService.calculateRates(ratesDto);
  }

  @Post('orders/:id/shipping-options')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get shipping options for an order' })
  @ApiResponse({
    status: 200,
    description: 'Shipping options retrieved successfully',
    type: [ShippingOptionDto],
  })
  async getShippingOptions(
    @Param('id') orderId: string,
    @Body() ratesDto: GetShippingRatesDto,
  ): Promise<ShippingOptionDto[]> {
    return this.shippingService.getShippingOptions(orderId, ratesDto);
  }

  @Post(':id/confirm-shipping')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm shipping method for an order' })
  @ApiResponse({
    status: 200,
    description: 'Shipping confirmed successfully',
  })
  async confirmShipping(
    @Param('id') orderId: string,
    @Body() confirmDto: ConfirmShippingDto,
  ) {
    return this.shippingService.confirmShipping(orderId, confirmDto);
  }

  @Get(':id/tracking')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tracking information for an order' })
  @ApiResponse({
    status: 200,
    description: 'Tracking information retrieved successfully',
  })
  async getTrackingInfo(@Param('id') orderId: string) {
    return this.shippingService.getTrackingInfo(orderId);
  }

  @Put(':id/shipping-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update shipping status (seller/admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Shipping status updated successfully',
  })
  async updateShippingStatus(
    @Param('id') orderId: string,
    @Body('status') status: OrderStatus,
  ) {
    return this.shippingService.updateShippingStatus(orderId, status);
  }
}