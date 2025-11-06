import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInvoicesTable1762202000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create invoices table
    await queryRunner.query(`
      CREATE TABLE invoices (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        invoice_type VARCHAR(30) NOT NULL,

        -- Relations
        order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        seller_id UUID REFERENCES sellers(id) ON DELETE SET NULL,
        buyer_id UUID,

        -- Issuer data (platform)
        issuer_name VARCHAR(255) NOT NULL,
        issuer_document VARCHAR(50) NOT NULL,
        issuer_address TEXT,

        -- Recipient data
        recipient_name VARCHAR(255) NOT NULL,
        recipient_document VARCHAR(50) NOT NULL,
        recipient_address TEXT,

        -- Amounts
        subtotal DECIMAL(10,2) NOT NULL,
        vat_amount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL,

        -- Metadata
        issued_at TIMESTAMP DEFAULT NOW(),
        due_date TIMESTAMP,
        status VARCHAR(20) DEFAULT 'issued',
        payment_method VARCHAR(50),

        -- DIAN integration (optional)
        cufe VARCHAR(255),
        dian_response JSONB,

        -- Audit
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX idx_invoices_order_id ON invoices(order_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_invoices_seller_id ON invoices(seller_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_invoices_buyer_id ON invoices(buyer_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_invoices_status ON invoices(status)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_invoices_issued_at ON invoices(issued_at)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_invoices_invoice_type ON invoices(invoice_type)
    `);

    // Add foreign key constraints for invoice references in orders
    await queryRunner.query(`
      ALTER TABLE orders
      ADD CONSTRAINT fk_orders_commission_invoice
      FOREIGN KEY (commission_invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE orders
      ADD CONSTRAINT fk_orders_fee_invoice
      FOREIGN KEY (fee_invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    await queryRunner.query(`
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_commission_invoice
    `);
    await queryRunner.query(`
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_fee_invoice
    `);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_invoices_order_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_invoices_seller_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_invoices_buyer_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_invoices_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_invoices_issued_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_invoices_invoice_type`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS invoices`);
  }
}
