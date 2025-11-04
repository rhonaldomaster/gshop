import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShippingConfigToSellers1762200000000 implements MigrationInterface {
    name = 'AddShippingConfigToSellers1762200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add shipping configuration fields to sellers table
        await queryRunner.query(`
            ALTER TABLE "sellers"
            ADD COLUMN "shippingLocalPrice" decimal(10,2) DEFAULT 0,
            ADD COLUMN "shippingNationalPrice" decimal(10,2) DEFAULT 0,
            ADD COLUMN "shippingFreeEnabled" boolean DEFAULT false,
            ADD COLUMN "shippingFreeMinAmount" decimal(10,2)
        `);

        // Set default shipping prices for existing sellers (local $5.000, national $15.000 COP)
        await queryRunner.query(`
            UPDATE "sellers"
            SET "shippingLocalPrice" = 5000,
                "shippingNationalPrice" = 15000,
                "shippingFreeEnabled" = false
            WHERE "shippingLocalPrice" IS NULL
        `);

        // Migrate existing city and state to seller_locations if they exist
        await queryRunner.query(`
            INSERT INTO "seller_locations" ("sellerId", "city", "state", "isPrimary", "createdAt")
            SELECT id, city, state, true, now()
            FROM "sellers"
            WHERE city IS NOT NULL AND city != '' AND state IS NOT NULL AND state != ''
        `);

        // Remove old city and state columns from sellers (now in seller_locations)
        await queryRunner.query(`
            ALTER TABLE "sellers"
            DROP COLUMN IF EXISTS "city",
            DROP COLUMN IF EXISTS "state"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Restore city and state columns
        await queryRunner.query(`
            ALTER TABLE "sellers"
            ADD COLUMN "city" varchar(100),
            ADD COLUMN "state" varchar(100)
        `);

        // Restore primary location data back to sellers table
        await queryRunner.query(`
            UPDATE "sellers" s
            SET city = sl.city, state = sl.state
            FROM "seller_locations" sl
            WHERE s.id = sl."sellerId" AND sl."isPrimary" = true
        `);

        // Remove shipping configuration fields
        await queryRunner.query(`
            ALTER TABLE "sellers"
            DROP COLUMN "shippingFreeMinAmount",
            DROP COLUMN "shippingFreeEnabled",
            DROP COLUMN "shippingNationalPrice",
            DROP COLUMN "shippingLocalPrice"
        `);
    }
}
