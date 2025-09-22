
import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from './entities/user.entity';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from './entities/payment.entity';
import { Commission } from './entities/commission.entity';

export const typeOrmConfig = (configService: ConfigService): DataSourceOptions => ({
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'gshop_user'),
  password: configService.get('DB_PASSWORD', 'gshop_password'),
  database: configService.get('DB_DATABASE', 'gshop_db'),
  entities: [User, Product, Category, Order, OrderItem, Payment, Commission],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: configService.get('NODE_ENV') !== 'production',
  logging: configService.get('NODE_ENV') === 'development',
  ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
});

const configService = new ConfigService();
export default new DataSource(typeOrmConfig(configService));
