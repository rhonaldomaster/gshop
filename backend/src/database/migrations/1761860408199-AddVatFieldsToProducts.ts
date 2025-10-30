import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVatFieldsToProducts1761860408199 implements MigrationInterface {
    name = 'AddVatFieldsToProducts1761860408199'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."products_vattype_enum" AS ENUM('excluido', 'exento', 'reducido', 'general')`);
        await queryRunner.query(`ALTER TABLE "products" ADD "vatType" "public"."products_vattype_enum" NOT NULL DEFAULT 'general'`);
        await queryRunner.query(`ALTER TABLE "products" ADD "basePrice" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "products" ADD "vatAmount" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`CREATE TYPE "public"."order_items_vattype_enum" AS ENUM('excluido', 'exento', 'reducido', 'general')`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD "vatType" "public"."order_items_vattype_enum" NOT NULL DEFAULT 'general'`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD "basePrice" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD "vatAmountPerUnit" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD "totalBasePrice" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD "totalVatAmount" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "subtotalBase" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "totalVatAmount" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "vatBreakdown" json`);
        await queryRunner.query(`ALTER TABLE "user_preferences" ALTER COLUMN "strength" SET DEFAULT '0.5'`);
        await queryRunner.query(`ALTER TABLE "user_preferences" ALTER COLUMN "exploreExploitRatio" SET DEFAULT '0.5'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_preferences" ALTER COLUMN "exploreExploitRatio" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "user_preferences" ALTER COLUMN "strength" SET DEFAULT 0.5`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "vatBreakdown"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "totalVatAmount"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "subtotalBase"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "totalVatAmount"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "totalBasePrice"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "vatAmountPerUnit"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "basePrice"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "vatType"`);
        await queryRunner.query(`DROP TYPE "public"."order_items_vattype_enum"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "vatAmount"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "basePrice"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "vatType"`);
        await queryRunner.query(`DROP TYPE "public"."products_vattype_enum"`);
    }

}
