import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlatformConfigTable1762200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create platform_config table
    await queryRunner.query(`
      CREATE TABLE platform_config (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        key VARCHAR(100) UNIQUE NOT NULL,
        value JSONB NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        updated_by UUID,
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_platform_config_key ON platform_config(key)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_platform_config_category ON platform_config(category)
    `);

    // Insert initial configurations
    await queryRunner.query(`
      INSERT INTO platform_config (key, value, description, category) VALUES
      ('seller_commission_rate', '{"rate": 7, "type": "percentage"}', 'Comisión cobrada a vendedores', 'commission'),
      ('buyer_platform_fee_rate', '{"rate": 3, "type": "percentage"}', 'Cargo por uso de plataforma a compradores', 'fee'),
      ('commission_calculation_trigger', '{"event": "delivered"}', 'Cuándo se calcula comisión final', 'commission'),
      ('invoice_numbering_sequence', '{"prefix": "GSHOP", "current": 1, "padding": 8}', 'Secuencia de numeración de facturas', 'invoicing')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS platform_config`);
  }
}
