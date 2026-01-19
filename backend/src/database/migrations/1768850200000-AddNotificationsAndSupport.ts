import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationsAndSupport1768850200000 implements MigrationInterface {
  name = 'AddNotificationsAndSupport1768850200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create notification type enum
    await queryRunner.query(`
      CREATE TYPE "public"."user_notifications_type_enum" AS ENUM('order', 'promotion', 'system', 'live', 'price_drop')
    `);

    // Create user_notifications table
    await queryRunner.query(`
      CREATE TABLE "user_notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "title" character varying NOT NULL,
        "message" text NOT NULL,
        "type" "public"."user_notifications_type_enum" NOT NULL DEFAULT 'system',
        "isRead" boolean NOT NULL DEFAULT false,
        "data" jsonb,
        "imageUrl" character varying,
        "actionUrl" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_notifications" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for user_notifications
    await queryRunner.query(`
      CREATE INDEX "IDX_user_notifications_userId_createdAt" ON "user_notifications" ("userId", "createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_notifications_userId_isRead" ON "user_notifications" ("userId", "isRead")
    `);

    // Create foreign key for user_notifications
    await queryRunner.query(`
      ALTER TABLE "user_notifications"
      ADD CONSTRAINT "FK_user_notifications_userId"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Create support ticket enums
    await queryRunner.query(`
      CREATE TYPE "public"."support_tickets_category_enum" AS ENUM('order', 'payment', 'shipping', 'return', 'product', 'account', 'technical', 'other')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."support_tickets_status_enum" AS ENUM('open', 'in_progress', 'resolved', 'closed')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."support_tickets_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent')
    `);

    // Create support_tickets table
    await queryRunner.query(`
      CREATE TABLE "support_tickets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid,
        "subject" character varying NOT NULL,
        "message" text NOT NULL,
        "category" "public"."support_tickets_category_enum" NOT NULL DEFAULT 'other',
        "status" "public"."support_tickets_status_enum" NOT NULL DEFAULT 'open',
        "priority" "public"."support_tickets_priority_enum" NOT NULL DEFAULT 'medium',
        "email" character varying,
        "orderId" character varying,
        "adminResponse" text,
        "assignedToId" uuid,
        "resolvedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_support_tickets" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for support_tickets
    await queryRunner.query(`
      CREATE INDEX "IDX_support_tickets_status_createdAt" ON "support_tickets" ("status", "createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_support_tickets_userId_status" ON "support_tickets" ("userId", "status")
    `);

    // Create foreign key for support_tickets
    await queryRunner.query(`
      ALTER TABLE "support_tickets"
      ADD CONSTRAINT "FK_support_tickets_userId"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Create faqs table
    await queryRunner.query(`
      CREATE TABLE "faqs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "question" character varying NOT NULL,
        "answer" text NOT NULL,
        "category" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "order" integer NOT NULL DEFAULT 0,
        "viewCount" integer NOT NULL DEFAULT 0,
        "helpfulCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_faqs" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for faqs
    await queryRunner.query(`
      CREATE INDEX "IDX_faqs_order" ON "faqs" ("order")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_faqs_category_isActive" ON "faqs" ("category", "isActive")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop faqs table and indexes
    await queryRunner.query(`DROP INDEX "public"."IDX_faqs_category_isActive"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_faqs_order"`);
    await queryRunner.query(`DROP TABLE "faqs"`);

    // Drop support_tickets table, indexes and foreign key
    await queryRunner.query(`ALTER TABLE "support_tickets" DROP CONSTRAINT "FK_support_tickets_userId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_support_tickets_userId_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_support_tickets_status_createdAt"`);
    await queryRunner.query(`DROP TABLE "support_tickets"`);
    await queryRunner.query(`DROP TYPE "public"."support_tickets_priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."support_tickets_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."support_tickets_category_enum"`);

    // Drop user_notifications table, indexes and foreign key
    await queryRunner.query(`ALTER TABLE "user_notifications" DROP CONSTRAINT "FK_user_notifications_userId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_user_notifications_userId_isRead"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_user_notifications_userId_createdAt"`);
    await queryRunner.query(`DROP TABLE "user_notifications"`);
    await queryRunner.query(`DROP TYPE "public"."user_notifications_type_enum"`);
  }
}
