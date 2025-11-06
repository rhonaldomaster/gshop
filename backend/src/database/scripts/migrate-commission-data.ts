/**
 * Script de migración de datos existentes para el sistema de comisiones
 *
 * Este script:
 * 1. Actualiza órdenes existentes con tasas por defecto
 * 2. Calcula comisiones para órdenes entregadas sin comisión
 * 3. Genera facturas retroactivas (opcional)
 *
 * Uso:
 *   npm run migrate:commission-data
 *
 * O con ts-node:
 *   npx ts-node src/database/scripts/migrate-commission-data.ts
 */

import { DataSource } from 'typeorm';
import { Order } from '../entities/order.entity';
import { ConfigService } from '@nestjs/config';
import { typeOrmConfig } from '../typeorm.config';

// Default rates (will be replaced by config values if available)
const DEFAULT_SELLER_COMMISSION_RATE = 7;
const DEFAULT_BUYER_PLATFORM_FEE_RATE = 3;

interface MigrationStats {
  totalOrders: number;
  updatedOrders: number;
  skippedOrders: number;
  errors: string[];
}

async function migrateCommissionData() {
  const configService = new ConfigService();
  const dataSource = new DataSource(typeOrmConfig(configService) as any);

  console.log('🚀 Iniciando migración de datos de comisiones...\n');

  try {
    // Connect to database
    await dataSource.initialize();
    console.log('✅ Conectado a la base de datos\n');

    const orderRepository = dataSource.getRepository(Order);
    const stats: MigrationStats = {
      totalOrders: 0,
      updatedOrders: 0,
      skippedOrders: 0,
      errors: [],
    };

    // Get configuration values
    let sellerCommissionRate = DEFAULT_SELLER_COMMISSION_RATE;
    let buyerPlatformFeeRate = DEFAULT_BUYER_PLATFORM_FEE_RATE;

    try {
      const configResult = await dataSource.query(
        `SELECT key, value FROM platform_config WHERE key IN ($1, $2)`,
        ['seller_commission_rate', 'buyer_platform_fee_rate']
      );

      for (const config of configResult) {
        if (config.key === 'seller_commission_rate') {
          sellerCommissionRate = config.value.rate;
        } else if (config.key === 'buyer_platform_fee_rate') {
          buyerPlatformFeeRate = config.value.rate;
        }
      }

      console.log(`📊 Tasas configuradas:`);
      console.log(`   - Comisión vendedor: ${sellerCommissionRate}%`);
      console.log(`   - Cargo comprador: ${buyerPlatformFeeRate}%\n`);
    } catch (error) {
      console.log(`⚠️  No se pudo obtener configuración, usando valores por defecto\n`);
    }

    // Find orders without commission data
    const ordersToUpdate = await orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.sellerCommissionRate IS NULL OR order.sellerCommissionRate = 0')
      .orWhere('order.platformFeeRate IS NULL OR order.platformFeeRate = 0')
      .getMany();

    stats.totalOrders = ordersToUpdate.length;
    console.log(`📦 Encontradas ${stats.totalOrders} órdenes para actualizar\n`);

    if (stats.totalOrders === 0) {
      console.log('✅ No hay órdenes para actualizar');
      await dataSource.destroy();
      return;
    }

    // Update orders in batches
    let processedCount = 0;
    const batchSize = 100;

    for (let i = 0; i < ordersToUpdate.length; i += batchSize) {
      const batch = ordersToUpdate.slice(i, i + batchSize);

      for (const order of batch) {
        try {
          // Calculate subtotal
          const subtotal = order.items.reduce(
            (sum, item) => sum + Number(item.totalPrice),
            0
          );
          const subtotalAfterDiscount = subtotal - (Number(order.discountAmount) || 0);

          // Set rates if not present
          if (!order.sellerCommissionRate || order.sellerCommissionRate === 0) {
            order.sellerCommissionRate = sellerCommissionRate;
          }

          if (!order.platformFeeRate || order.platformFeeRate === 0) {
            order.platformFeeRate = buyerPlatformFeeRate;
            order.platformFeeAmount = Math.round(
              (subtotalAfterDiscount * buyerPlatformFeeRate) / 100 * 100
            ) / 100;
          }

          // Calculate commission for delivered orders
          if (order.status === 'delivered' && (!order.sellerCommissionAmount || order.sellerCommissionAmount === 0)) {
            order.sellerCommissionAmount = Math.round(
              (subtotalAfterDiscount * order.sellerCommissionRate) / 100 * 100
            ) / 100;
            order.sellerNetAmount = Math.round(
              (subtotalAfterDiscount - order.sellerCommissionAmount) * 100
            ) / 100;
            order.commissionStatus = 'calculated';
          } else if (order.status !== 'delivered') {
            order.commissionStatus = 'pending';
          }

          // Save updated order
          await orderRepository.save(order);
          stats.updatedOrders++;
          processedCount++;

          // Progress indicator
          if (processedCount % 10 === 0) {
            const percentage = Math.round((processedCount / stats.totalOrders) * 100);
            process.stdout.write(`\r⏳ Progreso: ${processedCount}/${stats.totalOrders} (${percentage}%)`);
          }

        } catch (error) {
          stats.errors.push(`Error en orden ${order.id}: ${error.message}`);
          stats.skippedOrders++;
        }
      }
    }

    console.log('\n');
    console.log('✅ Migración completada\n');
    console.log('📊 Estadísticas:');
    console.log(`   - Total órdenes procesadas: ${stats.totalOrders}`);
    console.log(`   - Órdenes actualizadas: ${stats.updatedOrders}`);
    console.log(`   - Órdenes omitidas: ${stats.skippedOrders}`);

    if (stats.errors.length > 0) {
      console.log('\n⚠️  Errores encontrados:');
      stats.errors.forEach(err => console.log(`   - ${err}`));
    }

    // Close connection
    await dataSource.destroy();
    console.log('\n🎉 Proceso finalizado exitosamente');

  } catch (error) {
    console.error('\n❌ Error en migración:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  migrateCommissionData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default migrateCommissionData;
