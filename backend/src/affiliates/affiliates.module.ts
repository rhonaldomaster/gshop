import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtModule } from '@nestjs/jwt'
import { AffiliatesService } from './affiliates.service'
import { CreatorProfileService } from './services/creator-profile.service'
import { CreatorContentService } from './services/creator-content.service'
import { CreatorLiveService } from './services/creator-live.service'
import { CreatorDashboardService } from './services/creator-dashboard.service'
import { AdminCreatorService } from './services/admin-creator.service'
import { CreatorsController } from './creators.controller'
import { CreatorDashboardController } from './dashboard.controller'
import { AdminCreatorController } from './admin.controller'

// Entities
import { Affiliate } from './entities/affiliate.entity'
import { AffiliateLink } from './entities/affiliate-link.entity'
import { AffiliateClick } from './entities/affiliate-click.entity'
import { AffiliateFollower } from './entities/affiliate-follower.entity'
import { AffiliateVideo, AffiliateVideoProduct, VideoInteraction } from './entities/affiliate-video.entity'
import { AffiliateProduct } from './entities/affiliate-product.entity'
import { AffiliateNotification } from './entities/affiliate-notification.entity'

// External entities
import { User } from '../users/user.entity'
import { Product } from '../products/product.entity'
import { Seller } from '../sellers/entities/seller.entity'
import { LiveStream } from '../live/live.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Original entities
      Affiliate,
      AffiliateLink,
      AffiliateClick,
      // New creator system entities
      AffiliateFollower,
      AffiliateVideo,
      AffiliateVideoProduct,
      VideoInteraction,
      AffiliateProduct,
      AffiliateNotification,
      // External entities
      User,
      Product,
      Seller,
      LiveStream,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [CreatorsController, CreatorDashboardController, AdminCreatorController],
  providers: [
    AffiliatesService,
    CreatorProfileService,
    CreatorContentService,
    CreatorLiveService,
    CreatorDashboardService,
    AdminCreatorService,
  ],
  exports: [
    AffiliatesService,
    CreatorProfileService,
    CreatorContentService,
    CreatorLiveService,
    CreatorDashboardService,
    AdminCreatorService,
  ],
})
export class AffiliatesModule {}