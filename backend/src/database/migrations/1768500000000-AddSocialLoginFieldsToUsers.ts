import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSocialLoginFieldsToUsers1768500000000 implements MigrationInterface {
    name = 'AddSocialLoginFieldsToUsers1768500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add social login fields to users table
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN IF NOT EXISTS "googleId" character varying,
            ADD COLUMN IF NOT EXISTS "facebookId" character varying,
            ADD COLUMN IF NOT EXISTS "socialProvider" character varying,
            ADD COLUMN IF NOT EXISTS "socialAvatarUrl" character varying,
            ADD COLUMN IF NOT EXISTS "isSocialAccount" boolean DEFAULT false
        `);

        // Add indexes for faster lookups by social IDs
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_users_googleId" ON "users" ("googleId")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_users_facebookId" ON "users" ("facebookId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_facebookId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_googleId"`);

        // Drop columns
        await queryRunner.query(`
            ALTER TABLE "users"
            DROP COLUMN IF EXISTS "isSocialAccount",
            DROP COLUMN IF EXISTS "socialAvatarUrl",
            DROP COLUMN IF EXISTS "socialProvider",
            DROP COLUMN IF EXISTS "facebookId",
            DROP COLUMN IF EXISTS "googleId"
        `);
    }
}
