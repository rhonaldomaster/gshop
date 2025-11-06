import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommissionFieldsToOrders1762201000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add commission and fee fields to orders table
    await queryRunner.query(`
      ALTER TABLE orders
      ADD COLUMN platform_fee_rate DECIMAL(5,2) DEFAULT 0,
      ADD COLUMN platform_fee_amount DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN seller_commission_rate DECIMAL(5,2) DEFAULT 0,
      ADD COLUMN seller_commission_amount DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN seller_net_amount DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN commission_status VARCHAR(20) DEFAULT 'pending',
      ADD COLUMN commission_invoice_id UUID,
      ADD COLUMN fee_invoice_id UUID
    `);

    // Create index for commission_status for faster queries
    await queryRunner.query(`
      CREATE INDEX idx_orders_commission_status ON orders(commission_status)
    `);

    // Create index for delivered_at for date range queries
    await queryRunner.query(`
      CREATE INDEX idx_orders_delivered_at ON orders(delivered_at)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_commission_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_delivered_at`);

    await queryRunner.query(`
      ALTER TABLE orders
      DROP COLUMN IF EXISTS platform_fee_rate,
      DROP COLUMN IF EXISTS platform_fee_amount,
      DROP COLUMN IF EXISTS seller_commission_rate,
      DROP COLUMN IF EXISTS seller_commission_amount,
      DROP COLUMN IF EXISTS seller_net_amount,
      DROP COLUMN IF EXISTS commission_status,
      DROP COLUMN IF EXISTS commission_invoice_id,
      DROP COLUMN IF EXISTS fee_invoice_id
    `);
  }
}
