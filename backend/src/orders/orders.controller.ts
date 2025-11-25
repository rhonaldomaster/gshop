
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { ShippingService } from './shipping.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { AddTrackingDto } from './dto/add-tracking.dto';
import { OrderStatsDto } from './dto/order-stats.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../database/entities/user.entity';
import { OrderStatus } from '../database/entities/order.entity';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly shippingService: ShippingService,
  ) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid order data or insufficient stock' })
  create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    // Prioritize authenticated user ID over guest order flag
    // If JWT token is present and valid, use that userId (even if isGuestOrder is true in request)
    const userId = req.user?.id || null;

    // Override isGuestOrder flag if user is authenticated
    if (userId && createOrderDto.isGuestOrder) {
      console.log(`[Orders Controller] User ${userId} authenticated - converting guest order to user order`);
      createOrderDto.isGuestOrder = false;
    }

    return this.ordersService.create(createOrderDto, userId);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all orders (Admin only)' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  findAll(@Query() query: OrderQueryDto) {
    return this.ordersService.findAll(query);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get order statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Order statistics retrieved successfully',
    type: OrderStatsDto,
  })
  getStats(): Promise<OrderStatsDto> {
    return this.ordersService.getOrderStats();
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Get current user orders' })
  @ApiResponse({ status: 200, description: 'User orders retrieved successfully' })
  getMyOrders(@Query() query: OrderQueryDto, @Request() req) {
    return this.ordersService.getOrdersByUser(req.user.id, query);
  }

  @Get('number/:orderNumber')
  @ApiOperation({ summary: 'Get order by order number' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findByOrderNumber(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({ summary: 'Update order (Admin/Seller only)' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({ summary: 'Update order status (Admin/Seller only)' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  updateStatus(@Param('id') id: string, @Body() body: { status: OrderStatus }) {
    return this.ordersService.updateStatus(id, body.status);
  }

  // Shipping Endpoints

  @Public()
  @Post('calculate-shipping')
  @ApiOperation({ summary: 'Calculate shipping cost for buyer location' })
  @ApiResponse({ status: 200, description: 'Shipping cost calculated successfully' })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  async calculateShipping(
    @Body() body: {
      sellerId: string;
      buyerCity: string;
      buyerState: string;
      orderTotal: number;
    },
  ) {
    const shippingInfo = await this.shippingService.calculateShippingCost(
      body.sellerId,
      body.buyerCity,
      body.buyerState,
      body.orderTotal,
    );
    return shippingInfo;
  }

  @Put(':id/tracking')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Add tracking information to order (Seller/Admin only)' })
  @ApiResponse({ status: 200, description: 'Tracking information added successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async addTracking(@Param('id') orderId: string, @Body() addTrackingDto: AddTrackingDto) {
    const order = await this.shippingService.addTracking(
      orderId,
      addTrackingDto.shippingTrackingUrl,
      addTrackingDto.shippingTrackingNumber,
      addTrackingDto.shippingCarrier,
      addTrackingDto.shippingNotes,
    );
    return {
      message: 'Información de rastreo agregada exitosamente',
      order,
    };
  }

  @Get(':id/tracking')
  @ApiOperation({ summary: 'Get tracking information for order' })
  @ApiResponse({ status: 200, description: 'Tracking information retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getTracking(@Param('id') orderId: string) {
    return this.shippingService.getTracking(orderId);
  }
}
