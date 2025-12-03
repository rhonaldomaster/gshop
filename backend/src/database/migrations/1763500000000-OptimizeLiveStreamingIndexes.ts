import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Optimize Live Streaming Indexes
 *
 * Adds performance-optimized indexes for live streaming queries
 * - Composite indexes for common query patterns
 * - Partial indexes for active streams
 * - Full-text search indexes
 */
export class OptimizeLiveStreamingIndexes1763500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing single-column indexes if they exist
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_streams_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_streams_seller"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_streams_affiliate"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_streams_category"`);

    // Composite index for discovery queries (status + sorting)
    // Used by: discover, search, trending endpoints
    await queryRunner.query(`
      CREATE INDEX "IDX_live_streams_discovery"
      ON "live_streams" ("status", "viewerCount" DESC, "likesCount" DESC, "startedAt" DESC)
      WHERE "status" = 'live'
    `);

    // Composite index for seller's streams
    await queryRunner.query(`
      CREATE INDEX "IDX_live_streams_seller_status"
      ON "live_streams" ("sellerId", "status", "createdAt" DESC)
    `);

    // Composite index for affiliate's streams
    await queryRunner.query(`
      CREATE INDEX "IDX_live_streams_affiliate_status"
      ON "live_streams" ("affiliateId", "status", "createdAt" DESC)
      WHERE "affiliateId" IS NOT NULL
    `);

    // Index for category filtering
    await queryRunner.query(`
      CREATE INDEX "IDX_live_streams_category_status"
      ON "live_streams" ("category", "status", "viewerCount" DESC)
      WHERE "status" = 'live'
    `);

    // Full-text search index for title and description
    await queryRunner.query(`
      CREATE INDEX "IDX_live_streams_search"
      ON "live_streams" USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')))
    `);

    // Index for scheduled streams (notifications)
    await queryRunner.query(`
      CREATE INDEX "IDX_live_streams_scheduled"
      ON "live_streams" ("scheduledAt", "status")
      WHERE "status" = 'scheduled' AND "scheduledAt" IS NOT NULL
    `);

    // LiveStreamMessages indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_live_stream_messages_stream_time"
      ON "live_stream_messages" ("streamId", "sentAt" DESC)
      WHERE "isDeleted" = false
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_live_stream_messages_user"
      ON "live_stream_messages" ("userId", "sentAt" DESC)
      WHERE "userId" IS NOT NULL
    `);

    // LiveStreamViewers indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_live_stream_viewers_stream_active"
      ON "live_stream_viewers" ("streamId", "joinedAt" DESC)
      WHERE "leftAt" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_live_stream_viewers_user_history"
      ON "live_stream_viewers" ("userId", "joinedAt" DESC)
      WHERE "userId" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_live_stream_viewers_session"
      ON "live_stream_viewers" ("sessionId", "streamId")
    `);

    // LiveStreamReactions indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_live_stream_reactions_stream_time"
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_live_stream_reactions_stream_time"
      ON "live_stream_reactions" ("streamId", "createdAt" DESC)
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_live_stream_reactions_type"
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_live_stream_reactions_type"
      ON "live_stream_reactions" ("streamId", "type", "createdAt" DESC)
    `);

    // LiveStreamProducts indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_live_stream_products_highlighted"
      ON "live_stream_products" ("streamId", "isHighlighted", "position")
      WHERE "isActive" = true
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_live_stream_products_product"
      ON "live_stream_products" ("productId", "streamId")
    `);

    // LiveStreamMetrics indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_live_stream_metrics_stream_time"
      ON "live_stream_metrics" ("streamId", "capturedAt" DESC)
    `);

    // Orders index for live stream attribution
    await queryRunner.query(`
      CREATE INDEX "IDX_orders_live_session"
      ON "orders" ("liveSessionId", "status")
      WHERE "liveSessionId" IS NOT NULL
    `);

    console.log('✅ Live streaming indexes optimized');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all indexes created in up()
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_streams_discovery"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_streams_seller_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_streams_affiliate_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_streams_category_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_streams_search"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_streams_scheduled"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_stream_messages_stream_time"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_stream_messages_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_stream_viewers_stream_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_stream_viewers_user_history"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_stream_viewers_session"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_stream_reactions_stream_time"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_stream_reactions_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_stream_products_highlighted"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_stream_products_product"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_live_stream_metrics_stream_time"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_live_session"`);

    console.log('❌ Live streaming indexes removed');
  }
}
