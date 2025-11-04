import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSellerLocationsTable1762100000000 implements MigrationInterface {
    name = 'CreateSellerLocationsTable1762100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create seller_locations table
        await queryRunner.query(`
            CREATE TABLE "seller_locations" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "sellerId" uuid NOT NULL,
                "city" varchar(100) NOT NULL,
                "state" varchar(100) NOT NULL,
                "isPrimary" boolean DEFAULT false,
                "address" text,
                "createdAt" TIMESTAMP DEFAULT now(),
                CONSTRAINT "fk_seller_location" FOREIGN KEY ("sellerId")
                    REFERENCES "sellers"("id") ON DELETE CASCADE
            )
        `);

        // Create indexes for better performance
        await queryRunner.query(`
            CREATE INDEX "idx_seller_locations_seller_id"
            ON "seller_locations"("sellerId")
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_seller_locations_city_state"
            ON "seller_locations"("city", "state")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_seller_locations_city_state"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_seller_locations_seller_id"`);

        // Drop table
        await queryRunner.query(`DROP TABLE "seller_locations"`);
    }
}
