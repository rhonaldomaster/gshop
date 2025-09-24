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
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReturnsService } from './returns.service';
import { RequestReturnDto, ProcessReturnDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Returns')
@Controller('api/v1')
export class ReturnsController {
  constructor(private returnsService: ReturnsService) {}

  @Post('orders/:id/return')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request return for an order' })
  @ApiResponse({
    status: 200,
    description: 'Return request submitted successfully',
  })
  async requestReturn(
    @Param('id') orderId: string,
    @Body() returnDto: RequestReturnDto,
    @Request() req: any,
  ) {
    return this.returnsService.requestReturn(orderId, returnDto, req.user.id);
  }

  @Put('orders/:id/process-return')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process return request (approve/reject) - Seller/Admin only' })
  @ApiResponse({
    status: 200,
    description: 'Return request processed successfully',
  })
  async processReturn(
    @Param('id') orderId: string,
    @Body() processDto: ProcessReturnDto,
  ) {
    return this.returnsService.processReturn(orderId, processDto);
  }

  @Get('returns')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all return requests (Admin) or seller returns' })
  @ApiQuery({ name: 'sellerId', required: false, description: 'Filter by seller ID' })
  @ApiResponse({
    status: 200,
    description: 'Return requests retrieved successfully',
  })
  async getReturns(@Query('sellerId') sellerId?: string) {
    return this.returnsService.getReturns(sellerId);
  }

  @Get('orders/:id/return-details')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get return details for a specific order' })
  @ApiResponse({
    status: 200,
    description: 'Order return details retrieved successfully',
  })
  async getOrderReturns(@Param('id') orderId: string) {
    return this.returnsService.getOrderReturns(orderId);
  }

  @Get('returns/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get return statistics' })
  @ApiQuery({ name: 'sellerId', required: false, description: 'Filter by seller ID' })
  @ApiResponse({
    status: 200,
    description: 'Return statistics retrieved successfully',
  })
  async getReturnStats(@Query('sellerId') sellerId?: string) {
    return this.returnsService.getReturnStats(sellerId);
  }
}