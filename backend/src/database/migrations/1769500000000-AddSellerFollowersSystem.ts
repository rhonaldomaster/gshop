import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddSellerFollowersSystem1769500000000 implements MigrationInterface {
  name = 'AddSellerFollowersSystem1769500000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create seller_followers table
    await queryRunner.query(`
      CREATE TABLE "seller_followers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "followerId" uuid NOT NULL,
        "sellerId" uuid NOT NULL,
        "notificationsEnabled" boolean NOT NULL DEFAULT true,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_seller_followers" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_seller_followers_follower_seller" UNIQUE ("followerId", "sellerId")
      )
    `)

    // Add indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_seller_followers_sellerId_createdAt"
      ON "seller_followers" ("sellerId", "createdAt")
    `)

    await queryRunner.query(`
      CREATE INDEX "IDX_seller_followers_followerId_createdAt"
      ON "seller_followers" ("followerId", "createdAt")
    `)

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE "seller_followers"
      ADD CONSTRAINT "FK_seller_followers_followerId"
      FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `)

    await queryRunner.query(`
      ALTER TABLE "seller_followers"
      ADD CONSTRAINT "FK_seller_followers_sellerId"
      FOREIGN KEY ("sellerId") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `)

    // Add new columns to sellers table
    await queryRunner.query(`
      ALTER TABLE "sellers"
      ADD COLUMN IF NOT EXISTS "followersCount" integer NOT NULL DEFAULT 0
    `)

    await queryRunner.query(`
      ALTER TABLE "sellers"
      ADD COLUMN IF NOT EXISTS "isProfilePublic" boolean NOT NULL DEFAULT true
    `)

    await queryRunner.query(`
      ALTER TABLE "sellers"
      ADD COLUMN IF NOT EXISTS "profileDescription" text
    `)

    await queryRunner.query(`
      ALTER TABLE "sellers"
      ADD COLUMN IF NOT EXISTS "logoUrl" character varying
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns from sellers table
    await queryRunner.query(`ALTER TABLE "sellers" DROP COLUMN IF EXISTS "logoUrl"`)
    await queryRunner.query(`ALTER TABLE "sellers" DROP COLUMN IF EXISTS "profileDescription"`)
    await queryRunner.query(`ALTER TABLE "sellers" DROP COLUMN IF EXISTS "isProfilePublic"`)
    await queryRunner.query(`ALTER TABLE "sellers" DROP COLUMN IF EXISTS "followersCount"`)

    // Drop seller_followers table
    await queryRunner.query(`DROP TABLE IF EXISTS "seller_followers"`)
  }
}
