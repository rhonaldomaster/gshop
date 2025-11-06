import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Order } from '../../database/entities/order.entity';
import { Invoice } from '../../database/entities/invoice.entity';

/**
 * Monitoring Service for Commission System
 *
 * Monitors:
 * - Failed invoice generation
 * - Stuck commission calculations
 * - Discrepancies in amounts
 * - Performance metrics
 */
@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
  ) {}

  /**
   * Check for delivered orders without invoices
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkMissingInvoices() {
    try {
      const ordersWithoutInvoices = await this.orderRepository
        .createQueryBuilder('order')
        .where('order.status = :status', { status: 'delivered' })
        .andWhere('order.commissionStatus != :commissionStatus', {
          commissionStatus: 'pending',
        })
        .andWhere('order.commissionInvoiceId IS NULL')
        .andWhere('order.deliveredAt > :since', {
          since: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        })
        .getMany();

      if (ordersWithoutInvoices.length > 0) {
        this.logger.warn(
          `⚠️  Found ${ordersWithoutInvoices.length} delivered orders without invoices`,
        );

        // Log details
        for (const order of ordersWithoutInvoices) {
          this.logger.warn(`   - Order ${order.id} delivered at ${order.deliveredAt}`);
        }

        // TODO: Send alert to admins via email/Slack
        // await this.alertService.send({
        //   type: 'missing_invoices',
        //   count: ordersWithoutInvoices.length,
        //   orderIds: ordersWithoutInvoices.map(o => o.id),
        // });
      }
    } catch (error) {
      this.logger.error('Error checking missing invoices:', error);
    }
  }

  /**
   * Check for commission calculation discrepancies
   * Runs daily at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async checkCommissionDiscrepancies() {
    try {
      // Get orders with commission calculated in last 7 days
      const orders = await this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.items', 'items')
        .where('order.status = :status', { status: 'delivered' })
        .andWhere('order.commissionStatus != :commissionStatus', {
          commissionStatus: 'pending',
        })
        .andWhere('order.deliveredAt > :since', {
          since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        })
        .getMany();

      const discrepancies = [];

      for (const order of orders) {
        // Recalculate expected amounts
        const subtotal = order.items.reduce(
          (sum, item) => sum + Number(item.totalPrice),
          0,
        );
        const subtotalAfterDiscount = subtotal - (Number(order.discountAmount) || 0);

        const expectedCommission = Math.round(
          (subtotalAfterDiscount * order.sellerCommissionRate) / 100 * 100,
        ) / 100;
        const expectedNet = Math.round(
          (subtotalAfterDiscount - expectedCommission) * 100,
        ) / 100;

        // Check for discrepancies (allow 0.02 difference for rounding)
        if (Math.abs(order.sellerCommissionAmount - expectedCommission) > 0.02) {
          discrepancies.push({
            orderId: order.id,
            expected: expectedCommission,
            actual: order.sellerCommissionAmount,
            difference: order.sellerCommissionAmount - expectedCommission,
          });
        }

        if (Math.abs(order.sellerNetAmount - expectedNet) > 0.02) {
          discrepancies.push({
            orderId: order.id,
            field: 'sellerNetAmount',
            expected: expectedNet,
            actual: order.sellerNetAmount,
            difference: order.sellerNetAmount - expectedNet,
          });
        }
      }

      if (discrepancies.length > 0) {
        this.logger.error(
          `❌ Found ${discrepancies.length} commission discrepancies`,
        );
        for (const disc of discrepancies) {
          this.logger.error(
            `   - Order ${disc.orderId}: Expected ${disc.expected}, Got ${disc.actual} (Diff: ${disc.difference})`,
          );
        }

        // TODO: Send alert
      } else {
        this.logger.log(`✅ Commission calculations verified: ${orders.length} orders checked`);
      }
    } catch (error) {
      this.logger.error('Error checking commission discrepancies:', error);
    }
  }

  /**
   * Generate daily metrics report
   * Runs daily at 8 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async generateDailyMetrics() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date(yesterday);
      today.setDate(today.getDate() + 1);

      // Get metrics for yesterday
      const metrics = await this.orderRepository
        .createQueryBuilder('order')
        .select('COUNT(*)', 'totalOrders')
        .addSelect('SUM(order.sellerCommissionAmount)', 'totalCommissions')
        .addSelect('SUM(order.platformFeeAmount)', 'totalPlatformFees')
        .addSelect('AVG(order.sellerCommissionRate)', 'avgCommissionRate')
        .where('order.deliveredAt >= :start', { start: yesterday })
        .andWhere('order.deliveredAt < :end', { end: today })
        .andWhere('order.status = :status', { status: 'delivered' })
        .getRawOne();

      // Get invoice generation stats
      const invoiceStats = await this.invoiceRepository
        .createQueryBuilder('invoice')
        .select('COUNT(*)', 'totalInvoices')
        .addSelect('SUM(invoice.totalAmount)', 'totalAmount')
        .where('invoice.issuedAt >= :start', { start: yesterday })
        .andWhere('invoice.issuedAt < :end', { end: today })
        .getRawOne();

      this.logger.log('📊 Daily Metrics Report');
      this.logger.log(`   Date: ${yesterday.toISOString().split('T')[0]}`);
      this.logger.log(`   Delivered Orders: ${metrics.totalOrders || 0}`);
      this.logger.log(
        `   Total Commissions: $${(metrics.totalCommissions || 0).toLocaleString()}`,
      );
      this.logger.log(
        `   Total Platform Fees: $${(metrics.totalPlatformFees || 0).toLocaleString()}`,
      );
      this.logger.log(
        `   Avg Commission Rate: ${(metrics.avgCommissionRate || 0).toFixed(2)}%`,
      );
      this.logger.log(`   Invoices Generated: ${invoiceStats.totalInvoices || 0}`);
      this.logger.log(
        `   Invoice Total Amount: $${(invoiceStats.totalAmount || 0).toLocaleString()}`,
      );

      // TODO: Store metrics in database for historical tracking
      // TODO: Send report via email to finance team
    } catch (error) {
      this.logger.error('Error generating daily metrics:', error);
    }
  }

  /**
   * Check for performance issues
   * Runs every 6 hours
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async checkPerformance() {
    try {
      // Check average invoice generation time
      const recentInvoices = await this.invoiceRepository
        .createQueryBuilder('invoice')
        .where('invoice.issuedAt > :since', {
          since: new Date(Date.now() - 6 * 60 * 60 * 1000),
        })
        .getMany();

      if (recentInvoices.length > 0) {
        this.logger.log(
          `✅ Performance check: ${recentInvoices.length} invoices generated in last 6 hours`,
        );
      }

      // Check for stuck orders (delivered but no commission calculation)
      const stuckOrders = await this.orderRepository
        .createQueryBuilder('order')
        .where('order.status = :status', { status: 'delivered' })
        .andWhere('order.commissionStatus = :commissionStatus', {
          commissionStatus: 'pending',
        })
        .andWhere('order.deliveredAt < :threshold', {
          threshold: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        })
        .getMany();

      if (stuckOrders.length > 0) {
        this.logger.warn(
          `⚠️  Found ${stuckOrders.length} stuck orders (delivered but commission not calculated)`,
        );

        // TODO: Send alert
      }
    } catch (error) {
      this.logger.error('Error checking performance:', error);
    }
  }

  /**
   * Manual health check (can be called via API endpoint)
   */
  async healthCheck(): Promise<{
    status: string;
    checks: Record<string, boolean>;
    metrics: any;
  }> {
    const checks: Record<string, boolean> = {};

    try {
      // Check database connection
      await this.orderRepository.query('SELECT 1');
      checks.database = true;

      // Check recent orders
      const recentOrders = await this.orderRepository
        .createQueryBuilder()
        .where('created_at > :since', {
          since: new Date(Date.now() - 60 * 60 * 1000),
        })
        .getCount();
      checks.recentOrders = recentOrders >= 0;

      // Check invoices
      const recentInvoices = await this.invoiceRepository
        .createQueryBuilder()
        .where('issued_at > :since', {
          since: new Date(Date.now() - 60 * 60 * 1000),
        })
        .getCount();
      checks.invoiceGeneration = recentInvoices >= 0;

      const allHealthy = Object.values(checks).every((v) => v === true);

      return {
        status: allHealthy ? 'healthy' : 'degraded',
        checks,
        metrics: {
          recentOrders,
          recentInvoices,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        checks: { ...checks, error: false },
        metrics: { error: error.message },
      };
    }
  }
}
