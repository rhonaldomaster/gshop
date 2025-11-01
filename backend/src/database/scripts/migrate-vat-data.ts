import { DataSource } from 'typeorm';

/**
 * Script de migración para actualizar productos existentes con datos de IVA
 *
 * Este script:
 * 1. Encuentra todos los productos sin vatType
 * 2. Les asigna 'general' (19%) como valor por defecto
 * 3. Calcula basePrice y vatAmount basándose en el precio actual
 *
 * Asume que el precio actual YA INCLUYE IVA
 */

// Constantes locales para evitar dependencias circulares
const VAT_TYPE_GENERAL = 'general';
const VAT_RATE_GENERAL = 0.19;

async function migrateVatData() {
  console.log('🚀 Iniciando migración de datos de IVA...\n');

  // Crear conexión a la base de datos sin cargar todas las entidades
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL || 'postgresql://gshop_user:gshop_password@localhost:5432/gshop_db',
    entities: [], // No cargar entidades para evitar problemas de dependencias circulares
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conexión a base de datos establecida\n');

    // Usar query builder directo para mayor seguridad
    const queryRunner = dataSource.createQueryRunner();

    // Buscar productos sin vatType o con valores NULL
    const productsWithoutVat = await queryRunner.query(
      `SELECT id, name, price, "vatType", "basePrice", "vatAmount"
       FROM products
       WHERE "vatType" IS NULL OR "basePrice" = 0 OR "vatAmount" = 0`
    );

    console.log(`📦 Productos encontrados sin IVA: ${productsWithoutVat.length}\n`);

    if (productsWithoutVat.length === 0) {
      console.log('✨ No hay productos para migrar. Todos tienen IVA asignado.\n');
      await queryRunner.release();
      await dataSource.destroy();
      return;
    }

    let updatedCount = 0;
    let errorCount = 0;

    for (const product of productsWithoutVat) {
      try {
        // Por defecto asignamos 'general' (19%)
        const vatType = VAT_TYPE_GENERAL;
        const vatRate = VAT_RATE_GENERAL;

        // El precio actual incluye IVA, así que calculamos:
        // precio = basePrice + (basePrice * vatRate)
        // precio = basePrice * (1 + vatRate)
        // basePrice = precio / (1 + vatRate)
        const priceWithVat = parseFloat(product.price);
        const basePrice = priceWithVat / (1 + vatRate);
        const vatAmount = priceWithVat - basePrice;

        // Actualizar producto con SQL directo
        await queryRunner.query(
          `UPDATE products
           SET "vatType" = $1,
               "basePrice" = $2,
               "vatAmount" = $3
           WHERE id = $4`,
          [
            vatType, // 'general'
            Math.round(basePrice * 100) / 100,
            Math.round(vatAmount * 100) / 100,
            product.id
          ]
        );

        updatedCount++;
        console.log(`✅ Producto actualizado: ${product.name}`);
        console.log(`   - Precio final: $${priceWithVat.toFixed(2)}`);
        console.log(`   - Precio base: $${(Math.round(basePrice * 100) / 100).toFixed(2)}`);
        console.log(`   - IVA (19%): $${(Math.round(vatAmount * 100) / 100).toFixed(2)}`);
        console.log(`   - Tipo IVA: ${vatType}\n`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error al actualizar producto ${product.id}:`, error.message);
      }
    }

    console.log('\n📊 Resumen de migración:');
    console.log(`   - Total de productos: ${productsWithoutVat.length}`);
    console.log(`   - Actualizados exitosamente: ${updatedCount}`);
    console.log(`   - Errores: ${errorCount}\n`);

    if (errorCount === 0) {
      console.log('🎉 Migración completada exitosamente!\n');
    } else {
      console.log('⚠️  Migración completada con algunos errores. Revisa los logs.\n');
    }

    await queryRunner.release();
    await dataSource.destroy();
    console.log('✅ Conexión cerrada\n');
  } catch (error) {
    console.error('❌ Error fatal durante la migración:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

// Ejecutar migración
migrateVatData().catch((error) => {
  console.error('❌ Error no capturado:', error);
  process.exit(1);
});
