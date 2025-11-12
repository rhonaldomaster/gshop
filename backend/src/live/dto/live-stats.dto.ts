import { ApiProperty } from '@nestjs/swagger';

export class LiveDashboardStatsDto {
  @ApiProperty({
    description: 'Total number of streams (all time)',
    example: 12,
  })
  totalStreams: number;

  @ApiProperty({
    description: 'Number of currently live streams',
    example: 2,
  })
  liveStreams: number;

  @ApiProperty({
    description: 'Total viewers across all streams (all time)',
    example: 1420,
  })
  totalViewers: number;

  @ApiProperty({
    description: 'Total sales from live streams',
    example: 8950.00,
  })
  totalSales: number;

  @ApiProperty({
    description: 'Average view time in seconds',
    example: 850,
  })
  avgViewTime: number;

  @ApiProperty({
    description: 'Conversion rate (orders / viewers)',
    example: 0.035,
  })
  conversionRate: number;

  @ApiProperty({
    description: 'Total chat messages sent',
    example: 3456,
  })
  totalMessages: number;

  @ApiProperty({
    description: 'Engagement rate (messages / viewers)',
    example: 2.43,
  })
  engagementRate: number;
}

export class LiveStreamAnalyticsDto {
  @ApiProperty({
    description: 'Stream ID',
    example: 'stream_123',
  })
  streamId: string;

  @ApiProperty({
    description: 'Stream title',
    example: 'Fashion Sale Live',
  })
  title: string;

  @ApiProperty({
    description: 'Stream status',
    example: 'ended',
  })
  status: string;

  @ApiProperty({
    description: 'Host type',
    example: 'seller',
  })
  hostType: string;

  @ApiProperty({
    description: 'Stream metrics',
  })
  metrics: {
    peakViewers: number;
    totalViewers: number;
    avgWatchTime: number;
    totalSales: number;
    ordersCount: number;
    conversionRate: number;
    messages: number;
  };

  @ApiProperty({
    description: 'Viewer count over time',
    type: [Object],
  })
  viewersByTime: Array<{ timestamp: Date; viewers: number }>;

  @ApiProperty({
    description: 'Top products sold during stream',
    type: [Object],
  })
  topProducts: Array<{
    productId: string;
    name: string;
    units: number;
    revenue: number;
  }>;
}
