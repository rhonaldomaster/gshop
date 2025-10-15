import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateInteractionProductIdType1736900000000 implements MigrationInterface {
  name = 'UpdateInteractionProductIdType1736900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update user_interactions table - change productId from UUID to VARCHAR
    await queryRunner.query(`
      ALTER TABLE "user_interactions"
      ALTER COLUMN "productId" TYPE VARCHAR(255)
    `);

    // Update recommendations table - change productId from UUID to VARCHAR
    await queryRunner.query(`
      ALTER TABLE "recommendations"
      ALTER COLUMN "productId" TYPE VARCHAR(255)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert back to UUID - Note: This may fail if non-UUID values exist
    await queryRunner.query(`
      ALTER TABLE "user_interactions"
      ALTER COLUMN "productId" TYPE UUID USING "productId"::UUID
    `);

    await queryRunner.query(`
      ALTER TABLE "recommendations"
      ALTER COLUMN "productId" TYPE UUID USING "productId"::UUID
    `);
  }
}
