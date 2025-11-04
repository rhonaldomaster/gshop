import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColombianKYCFieldsToSellers1730000000000 implements MigrationInterface {
    name = 'AddColombianKYCFieldsToSellers1730000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create new enum types
        await queryRunner.query(`CREATE TYPE "public"."sellers_sellertype_enum" AS ENUM('natural', 'juridica')`);
        await queryRunner.query(`CREATE TYPE "public"."sellers_documenttype_enum" AS ENUM('CC', 'CE', 'NIT', 'PASSPORT')`);
        await queryRunner.query(`CREATE TYPE "public"."sellers_bankaccounttype_enum" AS ENUM('ahorros', 'corriente')`);
        await queryRunner.query(`CREATE TYPE "public"."sellers_verificationstatus_enum" AS ENUM('pending', 'documents_uploaded', 'under_review', 'approved', 'rejected')`);

        // Add seller type column
        await queryRunner.query(`ALTER TABLE "sellers" ADD "sellerType" "public"."sellers_sellertype_enum" NOT NULL DEFAULT 'natural'`);

        // Update document type to use new enum
        await queryRunner.query(`ALTER TABLE "sellers" ALTER COLUMN "documentType" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "sellers" ALTER COLUMN "documentType" TYPE "public"."sellers_documenttype_enum" USING "documentType"::"text"::"public"."sellers_documenttype_enum"`);

        // Add RUT DIAN fields
        await queryRunner.query(`ALTER TABLE "sellers" ADD "rutFileUrl" varchar(500)`);
        await queryRunner.query(`ALTER TABLE "sellers" ADD "rutVerified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "sellers" ADD "rutVerificationDate" TIMESTAMP`);

        // Add Cámara de Comercio fields
        await queryRunner.query(`ALTER TABLE "sellers" ADD "comercioFileUrl" varchar(500)`);
        await queryRunner.query(`ALTER TABLE "sellers" ADD "comercioExpirationDate" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "sellers" ADD "comercioVerified" boolean NOT NULL DEFAULT false`);

        // Add bank account fields
        await queryRunner.query(`ALTER TABLE "sellers" ADD "bankName" varchar(100)`);
        await queryRunner.query(`ALTER TABLE "sellers" ADD "bankAccountType" "public"."sellers_bankaccounttype_enum"`);
        await queryRunner.query(`ALTER TABLE "sellers" ADD "bankAccountNumber" varchar(50)`);
        await queryRunner.query(`ALTER TABLE "sellers" ADD "bankAccountHolder" varchar(200)`);

        // Add verification fields
        await queryRunner.query(`ALTER TABLE "sellers" ADD "verificationStatus" "public"."sellers_verificationstatus_enum" NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "sellers" ADD "verificationNotes" text`);
        await queryRunner.query(`ALTER TABLE "sellers" ADD "verifiedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "sellers" ADD "verifiedBy" varchar(255)`);

        // Make some existing fields nullable (for backward compatibility)
        await queryRunner.query(`ALTER TABLE "sellers" ALTER COLUMN "address" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sellers" ALTER COLUMN "city" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sellers" ALTER COLUMN "country" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sellers" ALTER COLUMN "businessCategory" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove verification fields
        await queryRunner.query(`ALTER TABLE "sellers" DROP COLUMN "verifiedBy"`);
        await queryRunner.query(`ALTER TABLE "sellers" DROP COLUMN "verifiedAt"`);
        await queryRunner.query(`ALTER TABLE "sellers" DROP COLUMN "verificationNotes"`);
        await queryRunner.query(`ALTER TABLE "sellers" DROP COLUMN "verificationStatus"`);

        // Remove bank account fields
        await queryRunner.query(`ALTER TABLE "sellers" DROP COLUMN "bankAccountHolder"`);
        await queryRunner.query(`ALTER TABLE "sellers" DROP COLUMN "bankAccountNumber"`);
        await queryRunner.query(`ALTER TABLE "sellers" DROP COLUMN "bankAccountType"`);
        await queryRunner.query(`ALTER TABLE "sellers" DROP COLUMN "bankName"`);

        // Remove Cámara de Comercio fields
        await queryRunner.query(`ALTER TABLE "sellers" DROP COLUMN "comercioVerified"`);
        await queryRunner.query(`ALTER TABLE "sellers" DROP COLUMN "comercioExpirationDate"`);
        await queryRunner.query(`ALTER TABLE "sellers" DROP COLUMN "comercioFileUrl"`);

        // Remove RUT DIAN fields
        await queryRunner.query(`ALTER TABLE "sellers" DROP COLUMN "rutVerificationDate"`);
        await queryRunner.query(`ALTER TABLE "sellers" DROP COLUMN "rutVerified"`);
        await queryRunner.query(`ALTER TABLE "sellers" DROP COLUMN "rutFileUrl"`);

        // Revert documentType to old enum
        await queryRunner.query(`ALTER TABLE "sellers" ALTER COLUMN "documentType" TYPE varchar`);

        // Remove seller type
        await queryRunner.query(`ALTER TABLE "sellers" DROP COLUMN "sellerType"`);

        // Drop new enum types
        await queryRunner.query(`DROP TYPE "public"."sellers_verificationstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."sellers_bankaccounttype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."sellers_documenttype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."sellers_sellertype_enum"`);

        // Restore NOT NULL constraints
        await queryRunner.query(`ALTER TABLE "sellers" ALTER COLUMN "businessCategory" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sellers" ALTER COLUMN "country" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sellers" ALTER COLUMN "city" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sellers" ALTER COLUMN "address" SET NOT NULL`);
    }
}
