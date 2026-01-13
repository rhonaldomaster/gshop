import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixDynamicCodeUniqueConstraint1767300000001 implements MigrationInterface {
  name = 'FixDynamicCodeUniqueConstraint1767300000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the unique constraint on dynamicCode
    // The same dynamicCode is shared across related transactions (TRANSFER_OUT, TRANSFER_IN, PLATFORM_FEE)
    // So it should NOT be unique per row, but per transfer group
    await queryRunner.query(`
      ALTER TABLE "gshop_transactions"
      DROP CONSTRAINT IF EXISTS "gshop_transactions_dynamicCode_key"
    `);

    // The index for fast lookups already exists and doesn't need to be unique
    // It was created as a regular index in the previous migration
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add unique constraint (this may fail if duplicates exist)
    await queryRunner.query(`
      ALTER TABLE "gshop_transactions"
      ADD CONSTRAINT "gshop_transactions_dynamicCode_key" UNIQUE ("dynamicCode")
    `);
  }
}
