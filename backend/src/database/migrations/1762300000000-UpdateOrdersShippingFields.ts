import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateOrdersShippingFields1762300000000 implements MigrationInterface {
    name = 'UpdateOrdersShippingFields1762300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum for shipping type
        await queryRunner.query(`
            CREATE TYPE "public"."orders_shippingtype_enum" AS ENUM('local', 'national')
        `);

        // Add new shipping fields
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD COLUMN "shippingType" "public"."orders_shippingtype_enum",
            ADD COLUMN "shippingTrackingUrl" varchar(500),
            ADD COLUMN "shippingTrackingNumber" varchar(100),
            ADD COLUMN "shippingCarrier" varchar(100),
            ADD COLUMN "shippingNotes" text,
            ADD COLUMN "buyerCity" varchar(100),
            ADD COLUMN "buyerState" varchar(100)
        `);

        // Migrate existing orders with shipping data
        await queryRunner.query(`
            UPDATE "orders"
            SET "shippingType" = 'national',
                "buyerCity" = COALESCE("buyerCity", 'Desconocida'),
                "buyerState" = COALESCE("buyerState", 'Desconocido')
            WHERE "shippingType" IS NULL AND "shippingCost" > 0
        `);

        // IMPORTANT: Remove EasyPost-specific fields
        await queryRunner.query(`
            ALTER TABLE "orders"
            DROP COLUMN IF EXISTS "easypostShipmentId",
            DROP COLUMN IF EXISTS "shippingOptions",
            DROP COLUMN IF EXISTS "packageDimensions",
            DROP COLUMN IF EXISTS "courierService"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Restore EasyPost fields (as nullable to avoid data loss)
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD COLUMN "easypostShipmentId" varchar(255),
            ADD COLUMN "shippingOptions" jsonb,
            ADD COLUMN "packageDimensions" jsonb,
            ADD COLUMN "courierService" varchar(100)
        `);

        // Remove new shipping fields
        await queryRunner.query(`
            ALTER TABLE "orders"
            DROP COLUMN "buyerState",
            DROP COLUMN "buyerCity",
            DROP COLUMN "shippingNotes",
            DROP COLUMN "shippingCarrier",
            DROP COLUMN "shippingTrackingNumber",
            DROP COLUMN "shippingTrackingUrl",
            DROP COLUMN "shippingType"
        `);

        // Drop shipping type enum
        await queryRunner.query(`
            DROP TYPE "public"."orders_shippingtype_enum"
        `);
    }
}
