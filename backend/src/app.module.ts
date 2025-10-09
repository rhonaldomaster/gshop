
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { PaymentsV2Module } from './payments/payments-v2.module';
import { SellersModule } from './sellers/sellers.module';
import { AffiliatesModule } from './affiliates/affiliates.module';
import { PixelModule } from './pixel/pixel.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdsModule } from './ads/ads.module';
import { AudiencesModule } from './audiences/audiences.module';
import { LiveModule } from './live/live.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { TokenModule } from './token/token.module';
import { RecsysModule } from './recsys/recsys.module';
import { ShippingModule } from './shipping/shipping.module';
import { ReturnsModule } from './returns/returns.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    PaymentsV2Module,
    SellersModule,
    AffiliatesModule,
    PixelModule,
    AnalyticsModule,
    AdsModule,
    AudiencesModule,
    LiveModule,
    MarketplaceModule,
    TokenModule,
    RecsysModule,
    ShippingModule,
    ReturnsModule,
    WishlistModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
