import { MigrationInterface, QueryRunner } from "typeorm";

export class CleanOldAddressFormat1763260000000 implements MigrationInterface {
    name = 'CleanOldAddressFormat1763260000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Clean addresses that use old format (have 'address1' or 'type' fields)
        // New format requires: id, fullName, phoneNumber, address, city, state, postalCode, documentType, documentNumber, isDefault

        await queryRunner.query(`
            UPDATE users
            SET addresses = '[]'::jsonb
            WHERE addresses IS NOT NULL
            AND addresses::text != '[]'
            AND (
                addresses::jsonb @> '[{"address1": ""}]'::jsonb
                OR addresses::jsonb @> '[{"type": ""}]'::jsonb
                OR addresses::jsonb @> '[{"country": ""}]'::jsonb
                OR NOT (
                    addresses::jsonb @> '[{"id": ""}]'::jsonb
                    AND addresses::jsonb @> '[{"fullName": ""}]'::jsonb
                    AND addresses::jsonb @> '[{"documentType": ""}]'::jsonb
                    AND addresses::jsonb @> '[{"documentNumber": ""}]'::jsonb
                )
            )
        `);

        console.log('✅ Old address format cleaned successfully');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No rollback needed - old addresses cannot be recovered
        console.log('⚠️  Cannot rollback address format migration');
    }
}
