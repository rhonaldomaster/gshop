import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStreamerFollowsTable1769100000000 implements MigrationInterface {
  name = 'CreateStreamerFollowsTable1769100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create streamer_follows table
    await queryRunner.query(`
      CREATE TABLE "streamer_follows" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "followerId" uuid NOT NULL,
        "streamerId" uuid NOT NULL,
        "notificationsEnabled" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_streamer_follows" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_streamer_follows_follower_streamer" UNIQUE ("followerId", "streamerId")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_streamer_follows_streamerId_createdAt" ON "streamer_follows" ("streamerId", "createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_streamer_follows_followerId_createdAt" ON "streamer_follows" ("followerId", "createdAt")
    `);

    // Create foreign keys
    await queryRunner.query(`
      ALTER TABLE "streamer_follows"
      ADD CONSTRAINT "FK_streamer_follows_followerId"
      FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "streamer_follows"
      ADD CONSTRAINT "FK_streamer_follows_streamerId"
      FOREIGN KEY ("streamerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(`ALTER TABLE "streamer_follows" DROP CONSTRAINT "FK_streamer_follows_streamerId"`);
    await queryRunner.query(`ALTER TABLE "streamer_follows" DROP CONSTRAINT "FK_streamer_follows_followerId"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "public"."IDX_streamer_follows_followerId_createdAt"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_streamer_follows_streamerId_createdAt"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "streamer_follows"`);
  }
}
