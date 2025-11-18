
import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from './entities/user.entity';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from './entities/payment.entity';
import { Commission } from './entities/commission.entity';
import { WishlistItem } from './entities/wishlist.entity';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';

// Affiliates/Creator System Entities
import { Affiliate } from '../affiliates/entities/affiliate.entity';
import { AffiliateLink } from '../affiliates/entities/affiliate-link.entity';
import { AffiliateClick } from '../affiliates/entities/affiliate-click.entity';
import { AffiliateFollower } from '../affiliates/entities/affiliate-follower.entity';
import { AffiliateVideo, AffiliateVideoProduct, VideoInteraction } from '../affiliates/entities/affiliate-video.entity';
import { AffiliateProduct } from '../affiliates/entities/affiliate-product.entity';
import { AffiliateNotification } from '../affiliates/entities/affiliate-notification.entity';

// Live Streaming Entities
import {
  LiveStream,
  LiveStreamProduct,
  LiveStreamMessage,
  LiveStreamViewer,
  LiveStreamReaction,
  LiveStreamMetrics
} from '../live/live.entity';

// Pixel/Analytics Entities
import { PixelEvent } from '../pixel/entities/pixel-event.entity';

// Seller Entities
import { Seller } from '../sellers/entities/seller.entity';
import { SellerLocation } from '../sellers/entities/seller-location.entity';

// Settings Entity
import { Setting } from '../settings/entities/setting.entity';

// Payment V2 Entities
import { PaymentMethodEntity, PaymentV2, Invoice, CryptoTransaction } from '../payments/payments-v2.entity';

// Recommendation System Entities
import { UserInteraction, UserPreference, SimilarityMatrix, Recommendation, ProductFeature, UserCluster, RecommendationMetrics } from '../recsys/recsys.entity';

// Commission & Fee System Entities
import { PlatformConfig } from './entities/platform-config.entity';
import { Invoice as CommissionInvoice } from './entities/invoice.entity';
import { AuditLog } from './entities/audit-log.entity';

export const typeOrmConfig = (configService: ConfigService): DataSourceOptions => ({
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'gshop_user'),
  password: configService.get('DB_PASSWORD', 'gshop_password'),
  database: configService.get('DB_DATABASE', 'gshop_db'),
  entities: [
    // Core entities
    User, Product, Category, Order, OrderItem, Payment, Commission, WishlistItem, Cart, CartItem,
    // Seller entities
    Seller, SellerLocation,
    // Settings entity
    Setting,
    // Payment V2 entities
    PaymentMethodEntity, PaymentV2, Invoice, CryptoTransaction,
    // Commission & Fee System entities
    PlatformConfig, CommissionInvoice, AuditLog,
    // Live streaming entities
    LiveStream, LiveStreamProduct, LiveStreamMessage, LiveStreamViewer, LiveStreamReaction, LiveStreamMetrics,
    // Pixel/Analytics entities
    PixelEvent,
    // Affiliates/Creator system entities
    Affiliate, AffiliateLink, AffiliateClick, AffiliateFollower,
    AffiliateVideo, AffiliateVideoProduct, VideoInteraction,
    AffiliateProduct, AffiliateNotification,
    // Recommendation system entities
    UserInteraction, UserPreference, SimilarityMatrix, Recommendation, ProductFeature, UserCluster, RecommendationMetrics
  ],
  migrations: ['dist/src/database/migrations/*.js'],
  synchronize: false, // Disabled to prevent schema conflicts with manual migrations
  logging: configService.get('NODE_ENV') === 'development',
  ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
});

const configService = new ConfigService();
export default new DataSource(typeOrmConfig(configService));
