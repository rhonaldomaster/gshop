import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { LiveStream, StreamStatus } from './live.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LiveSchedulerService {
  private readonly logger = new Logger(LiveSchedulerService.name);
  private notifiedStreams = new Set<string>();

  constructor(
    @InjectRepository(LiveStream)
    private liveStreamRepository: Repository<LiveStream>,
    private notificationsService: NotificationsService,
  ) {}

  // Run every minute to check for upcoming scheduled streams
  @Cron(CronExpression.EVERY_MINUTE)
  async checkUpcomingStreams() {
    try {
      const now = new Date();
      const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);
      const sixteenMinutesLater = new Date(now.getTime() + 16 * 60 * 1000);

      // Find streams scheduled to start in 15-16 minutes
      // (Using a 1-minute window to avoid duplicate notifications)
      const upcomingStreams = await this.liveStreamRepository.find({
        where: {
          status: StreamStatus.SCHEDULED,
          scheduledAt: Between(fifteenMinutesLater, sixteenMinutesLater),
        },
        relations: ['seller', 'affiliate'],
      });

      for (const stream of upcomingStreams) {
        // Skip if we already notified about this stream
        if (this.notifiedStreams.has(stream.id)) {
          continue;
        }

        const sellerId = stream.sellerId || stream.affiliateId;
        if (!sellerId) {
          this.logger.warn(`Stream ${stream.id} has no seller or affiliate`);
          continue;
        }

        this.logger.log(`Sending reminder for stream: ${stream.title} (${stream.id})`);

        try {
          await this.notificationsService.notifyScheduledStreamReminder(
            sellerId,
            stream.title,
            stream.id,
            stream.scheduledAt,
            stream.thumbnailUrl,
          );

          // Mark as notified to prevent duplicates
          this.notifiedStreams.add(stream.id);

          this.logger.log(`Successfully sent reminder for stream ${stream.id}`);
        } catch (error) {
          this.logger.error(`Failed to send reminder for stream ${stream.id}: ${error.message}`);
        }
      }

      // Clean up old notified streams (older than 1 hour)
      this.cleanupNotifiedStreams();
    } catch (error) {
      this.logger.error(`Error checking upcoming streams: ${error.message}`);
    }
  }

  // Clean up notified streams set to prevent memory leak
  private async cleanupNotifiedStreams() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const oldStreams = await this.liveStreamRepository.find({
      where: {
        scheduledAt: Between(new Date(0), oneHourAgo),
      },
      select: ['id'],
    });

    for (const stream of oldStreams) {
      this.notifiedStreams.delete(stream.id);
    }
  }

  // Manual method to trigger reminder (for testing)
  async sendManualReminder(streamId: string) {
    const stream = await this.liveStreamRepository.findOne({
      where: { id: streamId },
      relations: ['seller', 'affiliate'],
    });

    if (!stream) {
      throw new Error('Stream not found');
    }

    const sellerId = stream.sellerId || stream.affiliateId;
    if (!sellerId) {
      throw new Error('Stream has no seller or affiliate');
    }

    await this.notificationsService.notifyScheduledStreamReminder(
      sellerId,
      stream.title,
      stream.id,
      stream.scheduledAt,
      stream.thumbnailUrl,
    );

    return { success: true, message: 'Reminder sent' };
  }
}
