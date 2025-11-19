import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, MoreThanOrEqual } from 'typeorm';
import { LiveStream, LiveStreamMetrics, StreamStatus, LiveStreamMessage, LiveStreamReaction } from './live.entity';
import { Order } from '../database/entities/order.entity';
import { LiveGateway } from './live.gateway';

@Injectable()
export class LiveMetricsService {
  private readonly logger = new Logger(LiveMetricsService.name);

  constructor(
    @InjectRepository(LiveStream)
    private liveStreamRepository: Repository<LiveStream>,
    @InjectRepository(LiveStreamMetrics)
    private metricsRepository: Repository<LiveStreamMetrics>,
    @InjectRepository(LiveStreamMessage)
    private messageRepository: Repository<LiveStreamMessage>,
    @InjectRepository(LiveStreamReaction)
    private reactionRepository: Repository<LiveStreamReaction>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private liveGateway: LiveGateway,
  ) {}

  /**
   * Collect metrics every 60 seconds for all active live streams
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async collectMetricsForActiveStreams() {
    this.logger.debug('📊 Collecting metrics for active live streams...');

    try {
      // Get all active live streams
      const activeStreams = await this.liveStreamRepository.find({
        where: { status: StreamStatus.LIVE },
      });

      if (activeStreams.length === 0) {
        this.logger.debug('No active streams found');
        return;
      }

      this.logger.log(`Found ${activeStreams.length} active stream(s)`);

      // Collect metrics for each stream
      for (const stream of activeStreams) {
        await this.collectStreamMetrics(stream.id);
      }

      this.logger.debug('✅ Metrics collection completed');
    } catch (error) {
      this.logger.error(`Failed to collect metrics: ${error.message}`, error.stack);
    }
  }

  /**
   * Collect metrics for a specific stream
   */
  async collectStreamMetrics(streamId: string): Promise<LiveStreamMetrics> {
    const stream = await this.liveStreamRepository.findOne({
      where: { id: streamId },
    });

    if (!stream) {
      throw new Error(`Stream ${streamId} not found`);
    }

    // Get current viewer count from gateway
    const viewerCount = this.liveGateway.getCurrentViewerCount(streamId);

    // Calculate messages per minute (last 60 seconds)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const messagesPerMinute = await this.messageRepository.count({
      where: {
        streamId,
        sentAt: MoreThanOrEqual(oneMinuteAgo),
      },
    });

    // Count reactions in the last minute
    const reactionsCount = await this.reactionRepository.count({
      where: {
        streamId,
        createdAt: MoreThanOrEqual(oneMinuteAgo),
      },
    });

    // Count purchases during this stream
    const purchasesCount = await this.orderRepository.count({
      where: { liveSessionId: streamId },
    });

    // Calculate revenue
    const orders = await this.orderRepository.find({
      where: { liveSessionId: streamId },
    });
    const revenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount.toString()), 0);

    // Calculate conversion rate (purchases / viewers)
    const totalViewers = stream.peakViewers || 1; // Avoid division by zero
    const conversionRate = (purchasesCount / totalViewers) * 100;

    // Create metrics record
    const metrics = this.metricsRepository.create({
      streamId,
      viewerCount,
      messagesPerMinute,
      reactionsCount,
      purchasesCount,
      revenue,
      conversionRate,
      avgWatchTimeSeconds: null, // Can be calculated with more detailed tracking
    });

    const saved = await this.metricsRepository.save(metrics);

    // Broadcast real-time metrics to stream viewers and seller dashboard
    this.liveGateway.notifyStreamViewers(streamId, 'metricsUpdate', {
      viewerCount,
      messagesPerMinute,
      reactionsCount,
      purchasesCount,
      revenue,
      conversionRate,
      timestamp: saved.recordedAt,
    });

    this.logger.debug(
      `Metrics collected for stream ${streamId}: ${viewerCount} viewers, ${messagesPerMinute} msgs/min, ${purchasesCount} purchases`,
    );

    return saved;
  }

  /**
   * Get metrics history for a stream
   */
  async getStreamMetricsHistory(
    streamId: string,
    limit: number = 60, // Last 60 minutes by default
  ): Promise<LiveStreamMetrics[]> {
    return this.metricsRepository.find({
      where: { streamId },
      order: { recordedAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get aggregated metrics for a stream
   */
  async getStreamMetricsSummary(streamId: string): Promise<{
    avgViewers: number;
    peakViewers: number;
    totalMessages: number;
    totalReactions: number;
    totalPurchases: number;
    totalRevenue: number;
    avgConversionRate: number;
  }> {
    const metrics = await this.metricsRepository.find({
      where: { streamId },
    });

    if (metrics.length === 0) {
      return {
        avgViewers: 0,
        peakViewers: 0,
        totalMessages: 0,
        totalReactions: 0,
        totalPurchases: 0,
        totalRevenue: 0,
        avgConversionRate: 0,
      };
    }

    const avgViewers = metrics.reduce((sum, m) => sum + m.viewerCount, 0) / metrics.length;
    const peakViewers = Math.max(...metrics.map(m => m.viewerCount));
    const totalMessages = metrics.reduce((sum, m) => sum + m.messagesPerMinute, 0);
    const totalReactions = metrics.reduce((sum, m) => sum + m.reactionsCount, 0);
    const totalPurchases = metrics.reduce((sum, m) => sum + m.purchasesCount, 0);
    const totalRevenue = metrics.reduce((sum, m) => sum + parseFloat(m.revenue.toString()), 0);
    const avgConversionRate = metrics.reduce((sum, m) => sum + (m.conversionRate || 0), 0) / metrics.length;

    return {
      avgViewers: Math.round(avgViewers),
      peakViewers,
      totalMessages,
      totalReactions,
      totalPurchases,
      totalRevenue,
      avgConversionRate: parseFloat(avgConversionRate.toFixed(2)),
    };
  }

  /**
   * Clean up old metrics (keep last 7 days)
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldMetrics() {
    this.logger.log('🧹 Cleaning up old metrics...');

    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const result = await this.metricsRepository
        .createQueryBuilder()
        .delete()
        .where('recordedAt < :sevenDaysAgo', { sevenDaysAgo })
        .execute();

      this.logger.log(`✅ Deleted ${result.affected} old metric records`);
    } catch (error) {
      this.logger.error(`Failed to cleanup old metrics: ${error.message}`, error.stack);
    }
  }
}
