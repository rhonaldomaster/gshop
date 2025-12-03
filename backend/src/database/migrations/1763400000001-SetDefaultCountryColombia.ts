import { MigrationInterface, QueryRunner } from 'typeorm'

export class SetDefaultCountryColombia1763400000001 implements MigrationInterface {
  name = 'SetDefaultCountryColombia1763400000001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Primero actualizar todos los registros con country NULL a 'Colombia'
    await queryRunner.query(`
      UPDATE sellers
      SET country = 'Colombia'
      WHERE country IS NULL
    `)

    // Luego establecer el default y quitar la restricción NOT NULL temporal
    await queryRunner.query(`
      ALTER TABLE sellers
      ALTER COLUMN country SET DEFAULT 'Colombia'
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir el default
    await queryRunner.query(`
      ALTER TABLE sellers
      ALTER COLUMN country DROP DEFAULT
    `)
  }
}
