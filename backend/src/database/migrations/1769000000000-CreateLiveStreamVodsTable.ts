import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLiveStreamVodsTable1769000000000 implements MigrationInterface {
  name = 'CreateLiveStreamVodsTable1769000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types for VOD
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "vod_status_enum" AS ENUM ('processing', 'available', 'failed', 'deleted');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "storage_provider_enum" AS ENUM ('r2', 's3', 'cloudflare_stream');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create live_stream_vods table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "live_stream_vods" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "streamId" uuid NOT NULL,
        "storageProvider" "storage_provider_enum" NOT NULL DEFAULT 'r2',
        "videoUrl" varchar,
        "thumbnailUrl" varchar,
        "hlsManifestUrl" varchar,
        "duration" integer NOT NULL DEFAULT 0,
        "fileSize" bigint NOT NULL DEFAULT 0,
        "viewCount" integer NOT NULL DEFAULT 0,
        "status" "vod_status_enum" NOT NULL DEFAULT 'processing',
        "s3Bucket" varchar,
        "s3Key" varchar,
        "r2Key" varchar,
        "qualities" text,
        "errorMessage" varchar,
        "processedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_live_stream_vods" PRIMARY KEY ("id"),
        CONSTRAINT "FK_live_stream_vods_stream" FOREIGN KEY ("streamId") REFERENCES "live_streams"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_live_stream_vods_streamId" ON "live_stream_vods" ("streamId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_live_stream_vods_status" ON "live_stream_vods" ("status");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_live_stream_vods_createdAt" ON "live_stream_vods" ("createdAt");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_live_stream_vods_viewCount" ON "live_stream_vods" ("viewCount");
    `);

    // Create composite index for common queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_live_stream_vods_status_createdAt" ON "live_stream_vods" ("status", "createdAt" DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_stream_vods_status_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_stream_vods_viewCount"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_stream_vods_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_stream_vods_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_stream_vods_streamId"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "live_stream_vods"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "storage_provider_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "vod_status_enum"`);
  }
}
