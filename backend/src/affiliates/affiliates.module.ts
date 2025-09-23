import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AffiliatesService } from './affiliates.service'
import { Affiliate } from './entities/affiliate.entity'
import { AffiliateLink } from './entities/affiliate-link.entity'
import { AffiliateClick } from './entities/affiliate-click.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Affiliate, AffiliateLink, AffiliateClick]),
  ],
  providers: [AffiliatesService],
  exports: [AffiliatesService],
})
export class AffiliatesModule {}