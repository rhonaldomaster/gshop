import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserIdToAffiliates1768600000000 implements MigrationInterface {
  name = 'AddUserIdToAffiliates1768600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add userId column to affiliates table
    await queryRunner.addColumn(
      'affiliates',
      new TableColumn({
        name: 'userId',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Make passwordHash nullable (for users who convert, they don't need a separate password)
    await queryRunner.changeColumn(
      'affiliates',
      'passwordHash',
      new TableColumn({
        name: 'passwordHash',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Make passwordHash required again
    await queryRunner.changeColumn(
      'affiliates',
      'passwordHash',
      new TableColumn({
        name: 'passwordHash',
        type: 'varchar',
        isNullable: false,
      }),
    );

    // Remove userId column
    await queryRunner.dropColumn('affiliates', 'userId');
  }
}
