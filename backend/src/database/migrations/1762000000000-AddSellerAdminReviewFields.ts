import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSellerAdminReviewFields1762000000000 implements MigrationInterface {
    name = 'AddSellerAdminReviewFields1762000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add 'needs_update' value to verification status enum
        await queryRunner.query(`ALTER TYPE "public"."sellers_verificationstatus_enum" ADD VALUE 'needs_update'`);

        // Add admin review message fields
        await queryRunner.query(`ALTER TABLE "sellers" ADD "adminMessage" text`);
        await queryRunner.query(`ALTER TABLE "sellers" ADD "adminMessageDate" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "sellers" ADD "reviewedBy" varchar(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove admin review message fields
        await queryRunner.query(`ALTER TABLE "sellers" DROP COLUMN "reviewedBy"`);
        await queryRunner.query(`ALTER TABLE "sellers" DROP COLUMN "adminMessageDate"`);
        await queryRunner.query(`ALTER TABLE "sellers" DROP COLUMN "adminMessage"`);

        // Note: Cannot remove enum value without recreating the enum type
        // This would require migrating all existing data, so we leave it
    }
}
