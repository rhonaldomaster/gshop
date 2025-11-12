import { ApiProperty } from '@nestjs/swagger';

export class PaymentStatsDto {
  @ApiProperty({
    description: 'Total revenue from all successful payments',
    example: 142350.50,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Percentage change in revenue from last period',
    example: 12.5,
  })
  revenueChange: number;

  @ApiProperty({
    description: 'Revenue from last month for comparison',
    example: 126400.00,
  })
  lastMonthRevenue: number;

  @ApiProperty({
    description: 'Total amount refunded',
    example: 5200.00,
  })
  totalRefunds: number;

  @ApiProperty({
    description: 'Total number of completed payments',
    example: 1283,
  })
  completedPayments: number;

  @ApiProperty({
    description: 'Total number of pending payments',
    example: 45,
  })
  pendingPayments: number;

  @ApiProperty({
    description: 'Total number of failed payments',
    example: 127,
  })
  failedPayments: number;
}
