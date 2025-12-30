import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAffiliateDocumentFields1767134100000 implements MigrationInterface {
    name = 'AddAffiliateDocumentFields1767134100000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum for document type (matching DocumentType from sellers)
        await queryRunner.query(`
            CREATE TYPE "public"."affiliates_documenttype_enum" AS ENUM('CC', 'CE', 'NIT', 'PASSPORT')
        `);

        // Add documentType column to affiliates table
        await queryRunner.query(`
            ALTER TABLE "affiliates" ADD "documentType" "public"."affiliates_documenttype_enum"
        `);

        // Add documentNumber column to affiliates table
        await queryRunner.query(`
            ALTER TABLE "affiliates" ADD "documentNumber" character varying
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove documentNumber column
        await queryRunner.query(`
            ALTER TABLE "affiliates" DROP COLUMN "documentNumber"
        `);

        // Remove documentType column
        await queryRunner.query(`
            ALTER TABLE "affiliates" DROP COLUMN "documentType"
        `);

        // Drop enum type
        await queryRunner.query(`
            DROP TYPE "public"."affiliates_documenttype_enum"
        `);
    }
}
