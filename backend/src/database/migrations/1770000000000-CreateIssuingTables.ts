import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateIssuingTables1770000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new values to existing gshop_transactions_type_enum
    await queryRunner.query(`ALTER TYPE "gshop_transactions_type_enum" ADD VALUE IF NOT EXISTS 'card_funding'`);
    await queryRunner.query(`ALTER TYPE "gshop_transactions_type_enum" ADD VALUE IF NOT EXISTS 'card_withdrawal'`);

    // Create enums for issuing system
    await queryRunner.query(`
      CREATE TYPE "issuing_cardholder_status_enum" AS ENUM ('pending', 'active', 'inactive', 'rejected')
    `);

    await queryRunner.query(`
      CREATE TYPE "issuing_card_status_enum" AS ENUM ('active', 'inactive', 'canceled', 'pending')
    `);

    await queryRunner.query(`
      CREATE TYPE "issuing_card_type_enum" AS ENUM ('virtual', 'physical')
    `);

    await queryRunner.query(`
      CREATE TYPE "issuing_card_transaction_status_enum" AS ENUM ('pending', 'approved', 'declined', 'reversed', 'settled')
    `);

    await queryRunner.query(`
      CREATE TYPE "issuing_card_transaction_type_enum" AS ENUM ('authorization', 'capture', 'refund', 'funding', 'withdrawal')
    `);

    // Create issuing_cardholders table
    await queryRunner.createTable(
      new Table({
        name: 'issuing_cardholders',
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
            name: 'stripeCardholderId',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'stripeConnectedAccountId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'stripeFinancialAccountId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'issuing_cardholder_status_enum',
            default: "'pending'",
          },
          {
            name: 'phoneNumber',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'billingAddress',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'json',
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

    // FK: issuing_cardholders -> users
    await queryRunner.createForeignKey(
      'issuing_cardholders',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create issuing_virtual_cards table
    await queryRunner.createTable(
      new Table({
        name: 'issuing_virtual_cards',
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
            name: 'cardholderId',
            type: 'uuid',
          },
          {
            name: 'stripeCardId',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'status',
            type: 'issuing_card_status_enum',
            default: "'pending'",
          },
          {
            name: 'type',
            type: 'issuing_card_type_enum',
            default: "'virtual'",
          },
          {
            name: 'last4',
            type: 'varchar',
            length: '4',
          },
          {
            name: 'expMonth',
            type: 'varchar',
            length: '2',
          },
          {
            name: 'expYear',
            type: 'varchar',
            length: '4',
          },
          {
            name: 'brand',
            type: 'varchar',
            default: "'visa'",
          },
          {
            name: 'currency',
            type: 'varchar',
            default: "'usd'",
          },
          {
            name: 'spendingControls',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'canceledAt',
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
      }),
      true,
    );

    // FKs for issuing_virtual_cards
    await queryRunner.createForeignKey(
      'issuing_virtual_cards',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'issuing_virtual_cards',
      new TableForeignKey({
        columnNames: ['cardholderId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'issuing_cardholders',
        onDelete: 'CASCADE',
      }),
    );

    // Create issuing_card_transactions table
    await queryRunner.createTable(
      new Table({
        name: 'issuing_card_transactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'cardId',
            type: 'uuid',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'stripeAuthorizationId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'stripeTransactionId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'issuing_card_transaction_type_enum',
          },
          {
            name: 'status',
            type: 'issuing_card_transaction_status_enum',
            default: "'pending'",
          },
          {
            name: 'amountCents',
            type: 'int',
          },
          {
            name: 'currency',
            type: 'varchar',
            default: "'usd'",
          },
          {
            name: 'merchantName',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'merchantCategory',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'merchantCategoryCode',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'merchantCity',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'merchantCountry',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'declineReason',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'walletTransactionId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'json',
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

    // FKs for issuing_card_transactions
    await queryRunner.createForeignKey(
      'issuing_card_transactions',
      new TableForeignKey({
        columnNames: ['cardId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'issuing_virtual_cards',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'issuing_card_transactions',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Indexes
    await queryRunner.createIndex(
      'issuing_virtual_cards',
      new TableIndex({ name: 'IDX_issuing_cards_userId', columnNames: ['userId'] }),
    );

    await queryRunner.createIndex(
      'issuing_card_transactions',
      new TableIndex({ name: 'IDX_issuing_tx_cardId', columnNames: ['cardId'] }),
    );

    await queryRunner.createIndex(
      'issuing_card_transactions',
      new TableIndex({ name: 'IDX_issuing_tx_userId', columnNames: ['userId'] }),
    );

    await queryRunner.createIndex(
      'issuing_card_transactions',
      new TableIndex({ name: 'IDX_issuing_tx_createdAt', columnNames: ['createdAt'] }),
    );

    await queryRunner.createIndex(
      'issuing_card_transactions',
      new TableIndex({ name: 'IDX_issuing_tx_stripeAuthId', columnNames: ['stripeAuthorizationId'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('issuing_card_transactions', 'IDX_issuing_tx_stripeAuthId');
    await queryRunner.dropIndex('issuing_card_transactions', 'IDX_issuing_tx_createdAt');
    await queryRunner.dropIndex('issuing_card_transactions', 'IDX_issuing_tx_userId');
    await queryRunner.dropIndex('issuing_card_transactions', 'IDX_issuing_tx_cardId');
    await queryRunner.dropIndex('issuing_virtual_cards', 'IDX_issuing_cards_userId');

    // Drop tables
    await queryRunner.dropTable('issuing_card_transactions');
    await queryRunner.dropTable('issuing_virtual_cards');
    await queryRunner.dropTable('issuing_cardholders');

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "issuing_card_transaction_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "issuing_card_transaction_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "issuing_card_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "issuing_card_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "issuing_cardholder_status_enum"`);

    // Note: Cannot remove values from PostgreSQL enum type.
    // The 'card_funding' and 'card_withdrawal' values added to gshop_transactions_type_enum
    // will remain. This is safe as they are unused if no card transactions exist.
  }
}
