import { ApiProperty } from '@nestjs/swagger';

export class OrderStatsDto {
  @ApiProperty({
    description: 'Total number of all orders',
    example: 1283,
  })
  totalOrders: number;

  @ApiProperty({
    description: 'Percentage change in orders from last period',
    example: 8.2,
  })
  ordersChange: number;

  @ApiProperty({
    description: 'Number of orders from last month for comparison',
    example: 1186,
  })
  lastMonthOrders: number;

  @ApiProperty({
    description: 'Number of orders awaiting processing',
    example: 45,
  })
  pendingOrders: number;

  @ApiProperty({
    description: 'Number of successfully delivered orders',
    example: 982,
  })
  deliveredOrders: number;

  @ApiProperty({
    description: 'Number of confirmed orders',
    example: 156,
  })
  confirmedOrders: number;

  @ApiProperty({
    description: 'Number of shipped orders',
    example: 89,
  })
  shippedOrders: number;

  @ApiProperty({
    description: 'Number of cancelled orders',
    example: 11,
  })
  cancelledOrders: number;
}
