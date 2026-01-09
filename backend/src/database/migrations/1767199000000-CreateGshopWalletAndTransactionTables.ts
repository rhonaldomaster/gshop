import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateGshopWalletAndTransactionTables1767199000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums for token system
    await queryRunner.query(`
      CREATE TYPE "gshop_wallets_tier_enum" AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond', 'cashback')
    `);

    await queryRunner.query(`
      CREATE TYPE "gshop_transactions_type_enum" AS ENUM (
        'reward', 'cashback', 'referral', 'purchase', 'withdrawal',
        'transfer', 'transfer_out', 'transfer_in', 'platform_fee',
        'bonus', 'penalty', 'topup', 'burn', 'mint'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "gshop_transactions_status_enum" AS ENUM ('pending', 'completed', 'failed', 'cancelled')
    `);

    // Create gshop_wallets table
    await queryRunner.createTable(
      new Table({
        name: 'gshop_wallets',
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
            isUnique: true,
          },
          {
            name: 'balance',
            type: 'decimal',
            precision: 18,
            scale: 8,
            default: 0,
          },
          {
            name: 'lockedBalance',
            type: 'decimal',
            precision: 18,
            scale: 8,
            default: 0,
          },
          {
            name: 'totalEarned',
            type: 'decimal',
            precision: 18,
            scale: 8,
            default: 0,
          },
          {
            name: 'totalSpent',
            type: 'decimal',
            precision: 18,
            scale: 8,
            default: 0,
          },
          {
            name: 'tier',
            type: 'gshop_wallets_tier_enum',
            default: "'bronze'",
          },
          {
            name: 'tierPoints',
            type: 'int',
            default: 0,
          },
          {
            name: 'cashbackRate',
            type: 'decimal',
            precision: 5,
            scale: 4,
            default: 0.05,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'lastTransactionAt',
            type: 'timestamp',
            isNullable: true,
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

    // Create gshop_transactions table
    await queryRunner.createTable(
      new Table({
        name: 'gshop_transactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'walletId',
            type: 'uuid',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'type',
            type: 'gshop_transactions_type_enum',
          },
          {
            name: 'status',
            type: 'gshop_transactions_status_enum',
            default: "'pending'",
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 18,
            scale: 8,
          },
          {
            name: 'fee',
            type: 'decimal',
            precision: 18,
            scale: 8,
            default: 0,
          },
          {
            name: 'reference',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'orderId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'fromUserId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'toUserId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'txHash',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'processedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'paymentMethod',
            type: 'varchar',
            isNullable: true,
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
            columnNames: ['walletId'],
            referencedTableName: 'gshop_wallets',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
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

    // Create indexes
    await queryRunner.createIndex(
      'gshop_transactions',
      new TableIndex({
        name: 'IDX_gshop_transactions_walletId',
        columnNames: ['walletId'],
      }),
    );

    await queryRunner.createIndex(
      'gshop_transactions',
      new TableIndex({
        name: 'IDX_gshop_transactions_userId',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'gshop_transactions',
      new TableIndex({
        name: 'IDX_gshop_transactions_type',
        columnNames: ['type'],
      }),
    );

    await queryRunner.createIndex(
      'gshop_transactions',
      new TableIndex({
        name: 'IDX_gshop_transactions_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'gshop_transactions',
      new TableIndex({
        name: 'IDX_gshop_transactions_createdAt',
        columnNames: ['createdAt'],
      }),
    );

    // Create reward_campaigns table
    await queryRunner.createTable(
      new Table({
        name: 'reward_campaigns',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'rewardType',
            type: 'gshop_transactions_type_enum',
          },
          {
            name: 'rewardAmount',
            type: 'decimal',
            precision: 18,
            scale: 8,
          },
          {
            name: 'rewardPercentage',
            type: 'decimal',
            precision: 5,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'minPurchaseAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'maxRewardAmount',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'conditions',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'startDate',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'endDate',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'usageCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'usageLimit',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'userId',
            type: 'varchar',
            isNullable: true,
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
      }),
      true,
    );

    // Create referral_rewards table
    await queryRunner.createTable(
      new Table({
        name: 'referral_rewards',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'referrerId',
            type: 'uuid',
          },
          {
            name: 'referredId',
            type: 'uuid',
          },
          {
            name: 'referralCode',
            type: 'varchar',
          },
          {
            name: 'referrerReward',
            type: 'decimal',
            precision: 18,
            scale: 8,
            default: 0,
          },
          {
            name: 'referredReward',
            type: 'decimal',
            precision: 18,
            scale: 8,
            default: 0,
          },
          {
            name: 'isFirstPurchaseCompleted',
            type: 'boolean',
            default: false,
          },
          {
            name: 'firstPurchaseAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'rewardsPaid',
            type: 'boolean',
            default: false,
          },
          {
            name: 'rewardsPaidAt',
            type: 'timestamp',
            isNullable: true,
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
            columnNames: ['referrerId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['referredId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create token_metrics table
    await queryRunner.createTable(
      new Table({
        name: 'token_metrics',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'date',
            type: 'date',
          },
          {
            name: 'totalSupply',
            type: 'decimal',
            precision: 18,
            scale: 8,
            default: 0,
          },
          {
            name: 'circulatingSupply',
            type: 'decimal',
            precision: 18,
            scale: 8,
            default: 0,
          },
          {
            name: 'totalRewardsDistributed',
            type: 'decimal',
            precision: 18,
            scale: 8,
            default: 0,
          },
          {
            name: 'totalCashbackPaid',
            type: 'decimal',
            precision: 18,
            scale: 8,
            default: 0,
          },
          {
            name: 'activeWallets',
            type: 'int',
            default: 0,
          },
          {
            name: 'dailyTransactions',
            type: 'int',
            default: 0,
          },
          {
            name: 'totalTransactions',
            type: 'int',
            default: 0,
          },
          {
            name: 'totalWallets',
            type: 'int',
            default: 0,
          },
          {
            name: 'dailyVolume',
            type: 'decimal',
            precision: 18,
            scale: 8,
            default: 0,
          },
          {
            name: 'tokenPrice',
            type: 'decimal',
            precision: 10,
            scale: 8,
            default: 1,
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
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('token_metrics');
    await queryRunner.dropTable('referral_rewards');
    await queryRunner.dropTable('reward_campaigns');
    await queryRunner.dropTable('gshop_transactions');
    await queryRunner.dropTable('gshop_wallets');
    await queryRunner.query(`DROP TYPE "gshop_transactions_status_enum"`);
    await queryRunner.query(`DROP TYPE "gshop_transactions_type_enum"`);
    await queryRunner.query(`DROP TYPE "gshop_wallets_tier_enum"`);
  }
}
