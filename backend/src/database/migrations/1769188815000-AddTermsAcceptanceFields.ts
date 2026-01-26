import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTermsAcceptanceFields1769188815000 implements MigrationInterface {
  name = 'AddTermsAcceptanceFields1769188815000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add terms acceptance fields to users table
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "privacyAcceptedAt" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "acceptedTermsVersion" VARCHAR(20)
    `);

    // Add terms acceptance fields to sellers table
    await queryRunner.query(`
      ALTER TABLE "sellers"
      ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "privacyAcceptedAt" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "acceptedTermsVersion" VARCHAR(20)
    `);

    // Set default values for existing users (mark them as having accepted current terms)
    const now = new Date();
    const termsVersion = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    await queryRunner.query(`
      UPDATE "users"
      SET "termsAcceptedAt" = "createdAt",
          "privacyAcceptedAt" = "createdAt",
          "acceptedTermsVersion" = $1
      WHERE "termsAcceptedAt" IS NULL
    `, [termsVersion]);

    await queryRunner.query(`
      UPDATE "sellers"
      SET "termsAcceptedAt" = "createdAt",
          "privacyAcceptedAt" = "createdAt",
          "acceptedTermsVersion" = $1
      WHERE "termsAcceptedAt" IS NULL
    `, [termsVersion]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "termsAcceptedAt",
      DROP COLUMN IF EXISTS "privacyAcceptedAt",
      DROP COLUMN IF EXISTS "acceptedTermsVersion"
    `);

    await queryRunner.query(`
      ALTER TABLE "sellers"
      DROP COLUMN IF EXISTS "termsAcceptedAt",
      DROP COLUMN IF EXISTS "privacyAcceptedAt",
      DROP COLUMN IF EXISTS "acceptedTermsVersion"
    `);
  }
}
