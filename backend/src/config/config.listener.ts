import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditLogService } from '../common/services/audit-log.service';

export interface ConfigUpdatedEvent {
  key: string;
  oldValue: any;
  newValue: any;
  userId: string;
  ipAddress?: string;
}

@Injectable()
export class ConfigListener {
  constructor(private auditLogService: AuditLogService) {}

  @OnEvent('config.updated')
  async handleConfigUpdated(event: ConfigUpdatedEvent) {
    try {
      await this.auditLogService.logConfigChange(
        event.key,
        event.oldValue,
        event.newValue,
        event.userId,
        event.ipAddress,
      );

      console.log(`[AuditLog] Config updated: ${event.key}`);
    } catch (error) {
      console.error('[AuditLog] Failed to log config change:', error);
      // Don't throw - audit log failure shouldn't block the operation
    }
  }

  @OnEvent('invoice.generated')
  async handleInvoiceGenerated(event: {
    invoiceId: string;
    invoiceType: string;
    orderId: string;
  }) {
    try {
      await this.auditLogService.logInvoiceGeneration(
        event.invoiceId,
        event.invoiceType,
        event.orderId,
      );

      console.log(`[AuditLog] Invoice generated: ${event.invoiceId}`);
    } catch (error) {
      console.error('[AuditLog] Failed to log invoice generation:', error);
    }
  }
}
