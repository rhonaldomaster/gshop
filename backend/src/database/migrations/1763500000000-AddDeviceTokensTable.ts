import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class AddDeviceTokensTable1763500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create device_tokens table
    await queryRunner.createTable(
      new Table({
        name: 'device_tokens',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'token',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'platform',
            type: 'enum',
            enum: ['ios', 'android', 'web'],
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create index on user_id for faster lookups
    await queryRunner.createIndex(
      'device_tokens',
      new TableIndex({
        name: 'IDX_DEVICE_TOKENS_USER_ID',
        columnNames: ['user_id'],
      }),
    );

    // Create unique index on token
    await queryRunner.createIndex(
      'device_tokens',
      new TableIndex({
        name: 'IDX_DEVICE_TOKENS_TOKEN',
        columnNames: ['token'],
        isUnique: true,
      }),
    );

    // Create foreign key to users table
    await queryRunner.createForeignKey(
      'device_tokens',
      new TableForeignKey({
        name: 'FK_DEVICE_TOKENS_USER',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('device_tokens', 'FK_DEVICE_TOKENS_USER');

    // Drop indexes
    await queryRunner.dropIndex('device_tokens', 'IDX_DEVICE_TOKENS_TOKEN');
    await queryRunner.dropIndex('device_tokens', 'IDX_DEVICE_TOKENS_USER_ID');

    // Drop table
    await queryRunner.dropTable('device_tokens');
  }
}
