import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../database/entities/audit-log.entity';
import { Order } from '../database/entities/order.entity';
import { Invoice } from '../database/entities/invoice.entity';
import { AuditLogService } from './services/audit-log.service';
import { MonitoringService } from './services/monitoring.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, Order, Invoice])],
  providers: [AuditLogService, MonitoringService],
  exports: [AuditLogService, MonitoringService],
})
export class CommonModule {}
