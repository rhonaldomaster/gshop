import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceLiveStreamingEntities1763400000000 implements MigrationInterface {
  name = 'EnhanceLiveStreamingEntities1763400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Extend live_streams table with new fields
    await queryRunner.query(`
      ALTER TABLE "live_streams"
      ADD COLUMN IF NOT EXISTS "thumbnailUrl" varchar,
      ADD COLUMN IF NOT EXISTS "ivsChannelArn" varchar,
      ADD COLUMN IF NOT EXISTS "category" varchar,
      ADD COLUMN IF NOT EXISTS "tags" text,
      ADD COLUMN IF NOT EXISTS "likesCount" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "sharesCount" integer NOT NULL DEFAULT 0
    `);

    // Extend live_stream_products table
    await queryRunner.query(`
      ALTER TABLE "live_stream_products"
      ADD COLUMN IF NOT EXISTS "isHighlighted" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "position" integer,
      ADD COLUMN IF NOT EXISTS "highlightedAt" timestamp
    `);

    // Extend live_stream_messages table for moderation
    await queryRunner.query(`
      ALTER TABLE "live_stream_messages"
      ADD COLUMN IF NOT EXISTS "isDeleted" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "deletedBy" varchar,
      ADD COLUMN IF NOT EXISTS "deletedAt" timestamp
    `);

    // Extend live_stream_viewers table for bans/timeouts
    await queryRunner.query(`
      ALTER TABLE "live_stream_viewers"
      ADD COLUMN IF NOT EXISTS "isBanned" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "timeoutUntil" timestamp,
      ADD COLUMN IF NOT EXISTS "bannedBy" varchar,
      ADD COLUMN IF NOT EXISTS "banReason" text
    `);

    // Create live_stream_reactions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "live_stream_reactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "streamId" uuid NOT NULL,
        "userId" uuid,
        "sessionId" varchar,
        "type" varchar NOT NULL CHECK ("type" IN ('like', 'heart', 'fire', 'clap', 'laugh', 'wow')),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_live_stream_reactions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_live_stream_reactions_stream" FOREIGN KEY ("streamId") REFERENCES "live_streams"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_live_stream_reactions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for reactions
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_live_stream_reactions_streamId" ON "live_stream_reactions" ("streamId");
      CREATE INDEX IF NOT EXISTS "IDX_live_stream_reactions_userId" ON "live_stream_reactions" ("userId");
      CREATE INDEX IF NOT EXISTS "IDX_live_stream_reactions_type" ON "live_stream_reactions" ("type");
      CREATE INDEX IF NOT EXISTS "IDX_live_stream_reactions_createdAt" ON "live_stream_reactions" ("createdAt");
    `);

    // Create live_stream_metrics table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "live_stream_metrics" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "streamId" uuid NOT NULL,
        "viewerCount" integer NOT NULL,
        "messagesPerMinute" integer NOT NULL,
        "reactionsCount" integer NOT NULL,
        "purchasesCount" integer NOT NULL,
        "revenue" decimal(10,2) NOT NULL,
        "conversionRate" decimal(5,2),
        "avgWatchTimeSeconds" integer,
        "recordedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_live_stream_metrics" PRIMARY KEY ("id"),
        CONSTRAINT "FK_live_stream_metrics_stream" FOREIGN KEY ("streamId") REFERENCES "live_streams"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for metrics
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_live_stream_metrics_streamId" ON "live_stream_metrics" ("streamId");
      CREATE INDEX IF NOT EXISTS "IDX_live_stream_metrics_recordedAt" ON "live_stream_metrics" ("recordedAt");
    `);

    // Create indexes for better performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_live_streams_category" ON "live_streams" ("category");
      CREATE INDEX IF NOT EXISTS "IDX_live_streams_status" ON "live_streams" ("status");
      CREATE INDEX IF NOT EXISTS "IDX_live_stream_products_isHighlighted" ON "live_stream_products" ("isHighlighted");
      CREATE INDEX IF NOT EXISTS "IDX_live_stream_messages_isDeleted" ON "live_stream_messages" ("isDeleted");
      CREATE INDEX IF NOT EXISTS "IDX_live_stream_viewers_isBanned" ON "live_stream_viewers" ("isBanned");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_stream_viewers_isBanned"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_stream_messages_isDeleted"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_stream_products_isHighlighted"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_streams_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_streams_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_stream_metrics_recordedAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_stream_metrics_streamId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_stream_reactions_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_stream_reactions_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_stream_reactions_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_stream_reactions_streamId"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "live_stream_metrics"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "live_stream_reactions"`);

    // Remove columns from live_stream_viewers
    await queryRunner.query(`
      ALTER TABLE "live_stream_viewers"
      DROP COLUMN IF EXISTS "banReason",
      DROP COLUMN IF EXISTS "bannedBy",
      DROP COLUMN IF EXISTS "timeoutUntil",
      DROP COLUMN IF EXISTS "isBanned"
    `);

    // Remove columns from live_stream_messages
    await queryRunner.query(`
      ALTER TABLE "live_stream_messages"
      DROP COLUMN IF EXISTS "deletedAt",
      DROP COLUMN IF EXISTS "deletedBy",
      DROP COLUMN IF EXISTS "isDeleted"
    `);

    // Remove columns from live_stream_products
    await queryRunner.query(`
      ALTER TABLE "live_stream_products"
      DROP COLUMN IF EXISTS "highlightedAt",
      DROP COLUMN IF EXISTS "position",
      DROP COLUMN IF EXISTS "isHighlighted"
    `);

    // Remove columns from live_streams
    await queryRunner.query(`
      ALTER TABLE "live_streams"
      DROP COLUMN IF EXISTS "sharesCount",
      DROP COLUMN IF EXISTS "likesCount",
      DROP COLUMN IF EXISTS "tags",
      DROP COLUMN IF EXISTS "category",
      DROP COLUMN IF EXISTS "ivsChannelArn",
      DROP COLUMN IF EXISTS "thumbnailUrl"
    `);
  }
}
