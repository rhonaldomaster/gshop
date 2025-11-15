import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateSettingsTable1763227614462 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'settings',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    // General Settings
                    {
                        name: 'site_name',
                        type: 'varchar',
                        default: "'GSHOP'",
                    },
                    {
                        name: 'site_description',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'contact_email',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'contact_phone',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'address',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'default_language',
                        type: 'varchar',
                        default: "'es'",
                    },
                    {
                        name: 'default_currency',
                        type: 'varchar',
                        default: "'COP'",
                    },
                    // Payment Settings
                    {
                        name: 'mercadopago_client_id',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'mercadopago_client_secret',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'mercadopago_access_token',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'default_commission_rate',
                        type: 'decimal',
                        precision: 5,
                        scale: 2,
                        default: 7.0,
                    },
                    {
                        name: 'min_withdrawal_amount',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        default: 100000,
                    },
                    {
                        name: 'withdrawal_frequency',
                        type: 'varchar',
                        default: "'weekly'",
                    },
                    // Email Settings
                    {
                        name: 'smtp_host',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'smtp_port',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'smtp_user',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'smtp_password',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'from_name',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'from_email',
                        type: 'varchar',
                        isNullable: true,
                    },
                    // Security Settings
                    {
                        name: 'two_factor_enabled',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'session_timeout',
                        type: 'int',
                        default: 60,
                    },
                    {
                        name: 'password_min_length',
                        type: 'int',
                        default: 8,
                    },
                    {
                        name: 'password_require_uppercase',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'password_require_numbers',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'password_require_symbols',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'max_login_attempts',
                        type: 'int',
                        default: 5,
                    },
                    {
                        name: 'lockout_duration',
                        type: 'int',
                        default: 30,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('settings');
    }
}
