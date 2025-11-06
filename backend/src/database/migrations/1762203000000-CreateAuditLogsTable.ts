import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateAuditLogsTable1762203000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create audit_logs table
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'entity',
            type: 'varchar',
            length: '100',
            isNullable: false,
            comment: 'Entity type that was modified (e.g., platform_config, invoice)',
          },
          {
            name: 'entity_id',
            type: 'uuid',
            isNullable: true,
            comment: 'ID of the modified entity (if applicable)',
          },
          {
            name: 'action',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'Action performed (create, update, delete)',
          },
          {
            name: 'changes',
            type: 'jsonb',
            isNullable: true,
            comment: 'JSON object with before/after values',
          },
          {
            name: 'performed_by',
            type: 'uuid',
            isNullable: true,
            comment: 'User ID who performed the action',
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'IP address of the user',
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
            comment: 'User agent string',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Additional metadata about the action',
          },
          {
            name: 'timestamp',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indices for fast queries
    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_entity',
        columnNames: ['entity'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_entity_id',
        columnNames: ['entity_id'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_performed_by',
        columnNames: ['performed_by'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_timestamp',
        columnNames: ['timestamp'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'IDX_audit_logs_action',
        columnNames: ['action'],
      }),
    );

    // Create foreign key to users table
    await queryRunner.createForeignKey(
      'audit_logs',
      new TableForeignKey({
        columnNames: ['performed_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    const table = await queryRunner.getTable('audit_logs');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('performed_by') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('audit_logs', foreignKey);
      }
    }

    // Drop indices
    await queryRunner.dropIndex('audit_logs', 'IDX_audit_logs_entity');
    await queryRunner.dropIndex('audit_logs', 'IDX_audit_logs_entity_id');
    await queryRunner.dropIndex('audit_logs', 'IDX_audit_logs_performed_by');
    await queryRunner.dropIndex('audit_logs', 'IDX_audit_logs_timestamp');
    await queryRunner.dropIndex('audit_logs', 'IDX_audit_logs_action');

    // Drop table
    await queryRunner.dropTable('audit_logs');
  }
}
