import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeOrderUserIdNullable1763400000000 implements MigrationInterface {
    name = 'MakeOrderUserIdNullable1763400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Make userId nullable to support guest checkout
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "userId" DROP NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert userId to NOT NULL (this might fail if there are guest orders)
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "userId" SET NOT NULL
        `);
    }
}
