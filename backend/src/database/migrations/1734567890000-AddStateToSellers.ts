import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddStateToSellers1734567890000 implements MigrationInterface {
  name = 'AddStateToSellers1734567890000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE sellers
      ADD COLUMN state varchar NULL
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE sellers
      DROP COLUMN state
    `)
  }
}
