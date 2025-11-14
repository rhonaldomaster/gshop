import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateCouponsTable1763155800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types for coupon_type and coupon_status
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE coupon_type_enum AS ENUM ('percentage', 'fixed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE coupon_status_enum AS ENUM ('active', 'inactive', 'expired');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create coupons table
    await queryRunner.createTable(
      new Table({
        name: 'coupons',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'code',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
            comment: 'Unique coupon code',
          },
          {
            name: 'description',
            type: 'varchar',
            isNullable: false,
            comment: 'Description of the coupon',
          },
          {
            name: 'type',
            type: 'coupon_type_enum',
            default: "'percentage'",
            isNullable: false,
            comment: 'Type of discount: percentage or fixed amount',
          },
          {
            name: 'value',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
            comment: 'Discount value (percentage or fixed amount)',
          },
          {
            name: 'minPurchaseAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: 'Minimum purchase amount required to use coupon',
          },
          {
            name: 'maxDiscountAmount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: 'Maximum discount amount for percentage coupons',
          },
          {
            name: 'usageLimit',
            type: 'int',
            isNullable: true,
            comment: 'Maximum number of times coupon can be used',
          },
          {
            name: 'usageCount',
            type: 'int',
            default: 0,
            isNullable: false,
            comment: 'Current usage count',
          },
          {
            name: 'validFrom',
            type: 'timestamp',
            isNullable: true,
            comment: 'Coupon valid from date',
          },
          {
            name: 'validUntil',
            type: 'timestamp',
            isNullable: true,
            comment: 'Coupon expiration date',
          },
          {
            name: 'status',
            type: 'coupon_status_enum',
            default: "'active'",
            isNullable: false,
            comment: 'Current status of the coupon',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updatedAt',
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
      'coupons',
      new TableIndex({
        name: 'IDX_coupons_code',
        columnNames: ['code'],
      }),
    );

    await queryRunner.createIndex(
      'coupons',
      new TableIndex({
        name: 'IDX_coupons_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'coupons',
      new TableIndex({
        name: 'IDX_coupons_valid_dates',
        columnNames: ['validFrom', 'validUntil'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indices
    await queryRunner.dropIndex('coupons', 'IDX_coupons_code');
    await queryRunner.dropIndex('coupons', 'IDX_coupons_status');
    await queryRunner.dropIndex('coupons', 'IDX_coupons_valid_dates');

    // Drop table
    await queryRunner.dropTable('coupons');

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS coupon_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS coupon_status_enum`);
  }
}
