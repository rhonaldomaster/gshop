import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { OptionalJwtAuthGuard } from '../../auth/guards/optional-jwt-auth.guard'
import { SellerPublicProfileService } from '../services/seller-public-profile.service'
import { PaginationQueryDto, StreamsQueryDto } from '../dto/seller-follow.dto'
import { SellerPublicProfileDto, SellerPublicProfileResponseDto } from '../dto/seller-public-profile.dto'

@ApiTags('Seller Public Profile')
@Controller('sellers')
export class SellerPublicProfileController {
  constructor(
    private readonly publicProfileService: SellerPublicProfileService,
  ) {}

  @Get(':sellerId/public-profile')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get seller public profile' })
  @ApiParam({ name: 'sellerId', description: 'Seller ID' })
  @ApiResponse({
    status: 200,
    description: 'Seller public profile',
    type: SellerPublicProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Seller not found or profile is private' })
  async getPublicProfile(
    @Param('sellerId') sellerId: string,
    @Request() req,
  ): Promise<SellerPublicProfileResponseDto> {
    const viewerId = req.user?.id
    const profile = await this.publicProfileService.getPublicProfile(sellerId, viewerId)
    return {
      success: true,
      profile,
    }
  }

  @Get(':sellerId/products/public')
  @ApiOperation({ summary: 'Get seller public products' })
  @ApiParam({ name: 'sellerId', description: 'Seller ID' })
  @ApiResponse({ status: 200, description: 'List of seller products' })
  @ApiResponse({ status: 404, description: 'Seller not found or profile is private' })
  async getSellerProducts(
    @Param('sellerId') sellerId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.publicProfileService.getSellerProducts(sellerId, query.page, query.limit)
  }

  @Get(':sellerId/streams')
  @ApiOperation({ summary: 'Get seller live streams (live and past)' })
  @ApiParam({ name: 'sellerId', description: 'Seller ID' })
  @ApiResponse({ status: 200, description: 'List of seller streams' })
  @ApiResponse({ status: 404, description: 'Seller not found or profile is private' })
  async getSellerStreams(
    @Param('sellerId') sellerId: string,
    @Query() query: StreamsQueryDto,
  ) {
    return this.publicProfileService.getSellerStreams(
      sellerId,
      query.status,
      query.page || 1,
      query.limit || 20,
    )
  }
}
