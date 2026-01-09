import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateTransferLimitsTable1767200000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'transfer_limits',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'verificationLevel',
            type: 'verification_level_enum',
            default: "'none'",
          },
          // Daily tracking
          {
            name: 'dailyTransferred',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
          },
          {
            name: 'lastDailyReset',
            type: 'date',
            default: 'CURRENT_DATE',
          },
          // Monthly tracking
          {
            name: 'monthlyTransferred',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
          },
          {
            name: 'lastMonthlyReset',
            type: 'date',
            default: 'CURRENT_DATE',
          },
          // Lifetime tracking (analytics)
          {
            name: 'totalLifetimeTransferred',
            type: 'decimal',
            precision: 18,
            scale: 2,
            default: 0,
          },
          // Transfer count
          {
            name: 'dailyTransferCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'monthlyTransferCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'totalTransferCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create unique index on userId (one limit record per user)
    await queryRunner.createIndex(
      'transfer_limits',
      new TableIndex({
        name: 'IDX_transfer_limits_userId',
        columnNames: ['userId'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('transfer_limits');
  }
}
