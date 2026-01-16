import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from '../../database/entities/audit-log.entity';

export interface CreateAuditLogDto {
  entity: string;
  entityId?: string;
  action: AuditAction;
  changes?: {
    before?: any;
    after?: any;
    fields?: string[];
  };
  performedBy?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Create audit log entry
   */
  async log(data: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      entity: data.entity,
      entityId: data.entityId,
      action: data.action,
      changes: data.changes,
      performedBy: data.performedBy,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      metadata: data.metadata,
    });

    return this.auditLogRepository.save(auditLog);
  }

  /**
   * Log config change
   */
  async logConfigChange(
    configKey: string,
    oldValue: any,
    newValue: any,
    userId: string,
    ipAddress?: string,
  ): Promise<AuditLog> {
    return this.log({
      entity: 'platform_config',
      entityId: configKey,
      action: AuditAction.UPDATE,
      changes: {
        before: oldValue,
        after: newValue,
        fields: ['value'],
      },
      performedBy: userId,
      ipAddress,
      metadata: {
        configKey,
        description: `Updated ${configKey} from ${JSON.stringify(oldValue)} to ${JSON.stringify(newValue)}`,
      },
    });
  }

  /**
   * Log invoice generation
   */
  async logInvoiceGeneration(
    invoiceId: string,
    invoiceType: string,
    orderId: string,
    metadata?: Record<string, any>,
  ): Promise<AuditLog> {
    return this.log({
      entity: 'invoice',
      entityId: invoiceId,
      action: AuditAction.CREATE,
      metadata: {
        invoiceType,
        orderId,
        ...metadata,
      },
    });
  }

  /**
   * Get audit logs by entity
   */
  async getByEntity(
    entity: string,
    entityId?: string,
    limit: number = 100,
  ): Promise<AuditLog[]> {
    const query = this.auditLogRepository
      .createQueryBuilder('audit_log')
      .where('audit_log.entity = :entity', { entity })
      .orderBy('audit_log.timestamp', 'DESC')
      .limit(limit);

    if (entityId) {
      query.andWhere('audit_log.entityId = :entityId', { entityId });
    }

    return query.getMany();
  }

  /**
   * Get audit logs by user
   */
  async getByUser(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100,
  ): Promise<AuditLog[]> {
    const query = this.auditLogRepository
      .createQueryBuilder('audit_log')
      .where('audit_log.performedBy = :userId', { userId })
      .orderBy('audit_log.timestamp', 'DESC')
      .limit(limit);

    if (startDate) {
      query.andWhere('audit_log.timestamp >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('audit_log.timestamp <= :endDate', { endDate });
    }

    return query.getMany();
  }

  /**
   * Get recent audit logs (all entities)
   */
  async getRecent(limit: number = 50): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      order: { timestamp: 'DESC' },
      take: limit,
      relations: ['user'],
    });
  }

  /**
   * Search audit logs
   */
  async search(filters: {
    entity?: string;
    action?: AuditAction;
    performedBy?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLog[]> {
    const query = this.auditLogRepository
      .createQueryBuilder('audit_log')
      .leftJoinAndSelect('audit_log.user', 'user')
      .orderBy('audit_log.timestamp', 'DESC');

    if (filters.entity) {
      query.andWhere('audit_log.entity = :entity', { entity: filters.entity });
    }

    if (filters.action) {
      query.andWhere('audit_log.action = :action', { action: filters.action });
    }

    if (filters.performedBy) {
      query.andWhere('audit_log.performedBy = :performedBy', {
        performedBy: filters.performedBy,
      });
    }

    if (filters.startDate) {
      query.andWhere('audit_log.timestamp >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      query.andWhere('audit_log.timestamp <= :endDate', {
        endDate: filters.endDate,
      });
    }

    query.limit(filters.limit || 100);

    return query.getMany();
  }

  /**
   * Get config change history
   */
  async getConfigHistory(
    configKey: string,
    limit: number = 50,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository
      .createQueryBuilder('audit_log')
      .where('audit_log.entity = :entity', { entity: 'platform_config' })
      .andWhere('audit_log.entityId = :configKey', { configKey })
      .orderBy('audit_log.timestamp', 'DESC')
      .limit(limit)
      .leftJoinAndSelect('audit_log.user', 'user')
      .getMany();
  }

  /**
   * Log rate limit exceeded event
   */
  async logRateLimitExceeded(
    endpoint: string,
    method: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>,
  ): Promise<AuditLog> {
    return this.log({
      entity: 'rate_limit',
      action: AuditAction.RATE_LIMIT_EXCEEDED,
      performedBy: userId,
      ipAddress,
      userAgent,
      metadata: {
        endpoint,
        method,
        ...metadata,
      },
    });
  }

  /**
   * Get rate limit violations by IP
   */
  async getRateLimitViolationsByIp(
    ipAddress: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100,
  ): Promise<AuditLog[]> {
    const query = this.auditLogRepository
      .createQueryBuilder('audit_log')
      .where('audit_log.entity = :entity', { entity: 'rate_limit' })
      .andWhere('audit_log.action = :action', {
        action: AuditAction.RATE_LIMIT_EXCEEDED,
      })
      .andWhere('audit_log.ipAddress = :ipAddress', { ipAddress })
      .orderBy('audit_log.timestamp', 'DESC')
      .limit(limit);

    if (startDate) {
      query.andWhere('audit_log.timestamp >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('audit_log.timestamp <= :endDate', { endDate });
    }

    return query.getMany();
  }

  /**
   * Get rate limit statistics
   */
  async getRateLimitStats(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalViolations: number;
    uniqueIps: number;
    uniqueUsers: number;
    topEndpoints: Array<{ endpoint: string; count: number }>;
  }> {
    const query = this.auditLogRepository
      .createQueryBuilder('audit_log')
      .where('audit_log.entity = :entity', { entity: 'rate_limit' })
      .andWhere('audit_log.action = :action', {
        action: AuditAction.RATE_LIMIT_EXCEEDED,
      });

    if (startDate) {
      query.andWhere('audit_log.timestamp >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('audit_log.timestamp <= :endDate', { endDate });
    }

    const logs = await query.getMany();

    const uniqueIps = new Set(logs.map((log) => log.ipAddress).filter(Boolean));
    const uniqueUsers = new Set(
      logs.map((log) => log.performedBy).filter(Boolean),
    );

    const endpointCounts = new Map<string, number>();
    logs.forEach((log) => {
      const endpoint = log.metadata?.endpoint || 'unknown';
      endpointCounts.set(endpoint, (endpointCounts.get(endpoint) || 0) + 1);
    });

    const topEndpoints = Array.from(endpointCounts.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalViolations: logs.length,
      uniqueIps: uniqueIps.size,
      uniqueUsers: uniqueUsers.size,
      topEndpoints,
    };
  }
}
