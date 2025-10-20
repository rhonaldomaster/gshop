import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddExpiresAtToPaymentsV21704067200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'payments_v2',
      new TableColumn({
        name: 'expiresAt',
        type: 'timestamp',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('payments_v2', 'expiresAt');
  }
}
