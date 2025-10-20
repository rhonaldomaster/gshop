import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentsV2Service } from './payments-v2.service';

@Injectable()
export class PaymentSchedulerService {
  private readonly logger = new Logger(PaymentSchedulerService.name);

  constructor(private readonly paymentsV2Service: PaymentsV2Service) {}

  // Run every 5 minutes to check for expired payments
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpiredPayments() {
    this.logger.log('Starting expired payments cleanup...');

    try {
      const result = await this.paymentsV2Service.cancelExpiredPayments();

      if (result.cancelledPayments > 0 || result.cancelledOrders > 0) {
        this.logger.log(
          `Expired payments cleanup completed: ${result.cancelledPayments} payments cancelled, ${result.cancelledOrders} orders cancelled`
        );
      } else {
        this.logger.debug('No expired payments found');
      }
    } catch (error) {
      this.logger.error('Failed to cancel expired payments:', error);
    }
  }
}
