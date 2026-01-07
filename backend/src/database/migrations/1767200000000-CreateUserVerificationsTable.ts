import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateUserVerificationsTable1767200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "verification_level_enum" AS ENUM ('none', 'level_1', 'level_2')
    `);

    await queryRunner.query(`
      CREATE TYPE "document_type_enum" AS ENUM ('CC', 'CE', 'PA', 'TI', 'NIT')
    `);

    await queryRunner.query(`
      CREATE TYPE "verification_status_enum" AS ENUM ('not_started', 'pending', 'under_review', 'approved', 'rejected', 'needs_update')
    `);

    // Create user_verifications table
    await queryRunner.createTable(
      new Table({
        name: 'user_verifications',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'level',
            type: 'verification_level_enum',
            default: "'none'",
          },
          {
            name: 'verificationStatus',
            type: 'verification_status_enum',
            default: "'not_started'",
          },
          // Level 1 fields: Basic Identity
          {
            name: 'fullLegalName',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'documentType',
            type: 'document_type_enum',
            isNullable: true,
          },
          {
            name: 'documentNumber',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'documentFrontUrl',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'documentBackUrl',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'selfieUrl',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'selfieVerified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'dateOfBirth',
            type: 'date',
            isNullable: true,
          },
          // Level 2 fields: Extended verification
          {
            name: 'address',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'city',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'state',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'postalCode',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'country',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'sourceOfFunds',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'occupation',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'monthlyIncome',
            type: 'varchar',
            isNullable: true,
          },
          // Verification metadata
          {
            name: 'rejectionReason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'verifiedBy',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'verifiedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'level1SubmittedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'level1ApprovedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'level2SubmittedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'level2ApprovedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'adminNotes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'reviewAttempts',
            type: 'int',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'user_verifications',
      new TableIndex({
        name: 'IDX_user_verifications_userId',
        columnNames: ['userId'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'user_verifications',
      new TableIndex({
        name: 'IDX_user_verifications_status',
        columnNames: ['verificationStatus'],
      }),
    );

    await queryRunner.createIndex(
      'user_verifications',
      new TableIndex({
        name: 'IDX_user_verifications_level',
        columnNames: ['level'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('user_verifications');
    await queryRunner.query(`DROP TYPE "verification_status_enum"`);
    await queryRunner.query(`DROP TYPE "document_type_enum"`);
    await queryRunner.query(`DROP TYPE "verification_level_enum"`);
  }
}
