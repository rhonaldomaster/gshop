import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixProductSellerFK1764946500000 implements MigrationInterface {
  name = 'FixProductSellerFK1764946500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the old foreign key constraint that points to users table
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "FK_e40a1dd2909378f0da1f34f7bd6"`);

    // Add the new foreign key constraint that points to sellers table
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD CONSTRAINT "FK_e40a1dd2909378f0da1f34f7bd6"
      FOREIGN KEY ("sellerId") REFERENCES "sellers"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the constraint that points to sellers table
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "FK_e40a1dd2909378f0da1f34f7bd6"`);

    // Restore the old constraint that points to users table
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD CONSTRAINT "FK_e40a1dd2909378f0da1f34f7bd6"
      FOREIGN KEY ("sellerId") REFERENCES "users"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }
}
