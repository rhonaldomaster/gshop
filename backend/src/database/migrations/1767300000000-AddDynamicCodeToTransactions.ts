import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDynamicCodeToTransactions1767300000000 implements MigrationInterface {
  name = 'AddDynamicCodeToTransactions1767300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add dynamic_code column (unique, for transfer verification)
    await queryRunner.query(`
      ALTER TABLE "gshop_transactions"
      ADD COLUMN "dynamic_code" VARCHAR(10) UNIQUE
    `);

    // Add executed_at column (exact timestamp of execution)
    await queryRunner.query(`
      ALTER TABLE "gshop_transactions"
      ADD COLUMN "executed_at" TIMESTAMP
    `);

    // Create index for fast lookups by dynamic_code
    await queryRunner.query(`
      CREATE INDEX "idx_transactions_dynamic_code"
      ON "gshop_transactions"("dynamic_code")
    `);

    // Generate dynamic codes for existing transfer transactions
    // Using a combination of random characters (excluding confusing ones like 0/O, 1/I/L)
    await queryRunner.query(`
      UPDATE "gshop_transactions"
      SET
        "dynamic_code" = CONCAT('GS-',
          UPPER(
            TRANSLATE(
              SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT), 1, 6),
              '01ilo',
              'ahjkm'
            )
          )
        ),
        "executed_at" = "created_at"
      WHERE "type" IN ('transfer_out', 'transfer_in', 'platform_fee')
        AND "dynamic_code" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_transactions_dynamic_code"`);
    await queryRunner.query(`ALTER TABLE "gshop_transactions" DROP COLUMN IF EXISTS "executed_at"`);
    await queryRunner.query(`ALTER TABLE "gshop_transactions" DROP COLUMN IF EXISTS "dynamic_code"`);
  }
}
