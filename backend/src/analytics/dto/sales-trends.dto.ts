import { ApiProperty } from '@nestjs/swagger';

export enum TimePeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export class SalesTrendDataPoint {
  @ApiProperty({
    description: 'Date or period label (e.g., "2024-01-15", "Ene", "2024")',
    example: 'Ene',
  })
  date: string;

  @ApiProperty({
    description: 'Total sales amount for the period',
    example: 12000.50,
  })
  sales: number;

  @ApiProperty({
    description: 'Number of orders in the period',
    example: 45,
  })
  orders: number;

  @ApiProperty({
    description: 'Total VAT amount collected in the period',
    example: 2280.09,
  })
  vatAmount: number;
}

export class SalesTrendsDto {
  @ApiProperty({
    description: 'Time period type for aggregation',
    enum: TimePeriod,
    example: TimePeriod.MONTHLY,
  })
  period: TimePeriod;

  @ApiProperty({
    description: 'Time-series data points',
    type: [SalesTrendDataPoint],
  })
  data: SalesTrendDataPoint[];

  @ApiProperty({
    description: 'Start date of the report',
    example: '2024-01-01T00:00:00.000Z',
  })
  startDate: Date;

  @ApiProperty({
    description: 'End date of the report',
    example: '2024-12-31T23:59:59.999Z',
  })
  endDate: Date;

  @ApiProperty({
    description: 'Total sales across all periods',
    example: 144006.00,
  })
  totalSales: number;

  @ApiProperty({
    description: 'Total orders across all periods',
    example: 540,
  })
  totalOrders: number;

  @ApiProperty({
    description: 'Total VAT across all periods',
    example: 27360.54,
  })
  totalVat: number;
}
