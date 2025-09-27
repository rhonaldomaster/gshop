
import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from './entities/user.entity';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from './entities/payment.entity';
import { Commission } from './entities/commission.entity';

// Affiliates/Creator System Entities
import { Affiliate } from '../affiliates/entities/affiliate.entity';
import { AffiliateLink } from '../affiliates/entities/affiliate-link.entity';
import { AffiliateClick } from '../affiliates/entities/affiliate-click.entity';
import { AffiliateFollower } from '../affiliates/entities/affiliate-follower.entity';
import { AffiliateVideo, AffiliateVideoProduct, VideoInteraction } from '../affiliates/entities/affiliate-video.entity';
import { AffiliateProduct } from '../affiliates/entities/affiliate-product.entity';
import { AffiliateNotification } from '../affiliates/entities/affiliate-notification.entity';

// Live Streaming Entities
import { LiveStream, LiveStreamProduct, LiveStreamMessage, LiveStreamViewer } from '../live/live.entity';

// Seller Entities
import { Seller } from '../sellers/entities/seller.entity';

export const typeOrmConfig = (configService: ConfigService): DataSourceOptions => ({
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'gshop_user'),
  password: configService.get('DB_PASSWORD', 'gshop_password'),
  database: configService.get('DB_DATABASE', 'gshop_db'),
  entities: [
    // Core entities
    User, Product, Category, Order, OrderItem, Payment, Commission,
    // Seller entities
    Seller,
    // Live streaming entities
    LiveStream, LiveStreamProduct, LiveStreamMessage, LiveStreamViewer,
    // Affiliates/Creator system entities
    Affiliate, AffiliateLink, AffiliateClick, AffiliateFollower,
    AffiliateVideo, AffiliateVideoProduct, VideoInteraction,
    AffiliateProduct, AffiliateNotification
  ],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: configService.get('NODE_ENV') !== 'production',
  logging: configService.get('NODE_ENV') === 'development',
  ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
});

const configService = new ConfigService();
export default new DataSource(typeOrmConfig(configService));
