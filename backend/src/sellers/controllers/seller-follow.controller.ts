import {
  Controller,
  Post,
  Delete,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { SellerFollowService } from '../services/seller-follow.service'
import {
  ToggleNotificationsDto,
  PaginationQueryDto,
  FollowResponseDto,
  FollowersListResponseDto,
  IsFollowingResponseDto,
} from '../dto/seller-follow.dto'

@ApiTags('Seller Follow')
@Controller('sellers')
export class SellerFollowController {
  constructor(private readonly sellerFollowService: SellerFollowService) {}

  @Post(':sellerId/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow a seller' })
  @ApiParam({ name: 'sellerId', description: 'Seller ID to follow' })
  @ApiResponse({ status: 201, description: 'Successfully followed seller', type: FollowResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot follow unverified seller' })
  @ApiResponse({ status: 404, description: 'Seller not found' })
  @ApiResponse({ status: 409, description: 'Already following this seller' })
  async followSeller(
    @Param('sellerId') sellerId: string,
    @Request() req,
  ): Promise<FollowResponseDto> {
    await this.sellerFollowService.followSeller(req.user.id, sellerId)
    return {
      success: true,
      message: 'Successfully followed seller',
      isFollowing: true,
      notificationsEnabled: true,
    }
  }

  @Delete(':sellerId/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unfollow a seller' })
  @ApiParam({ name: 'sellerId', description: 'Seller ID to unfollow' })
  @ApiResponse({ status: 200, description: 'Successfully unfollowed seller', type: FollowResponseDto })
  @ApiResponse({ status: 404, description: 'Not following this seller' })
  async unfollowSeller(
    @Param('sellerId') sellerId: string,
    @Request() req,
  ): Promise<FollowResponseDto> {
    await this.sellerFollowService.unfollowSeller(req.user.id, sellerId)
    return {
      success: true,
      message: 'Successfully unfollowed seller',
      isFollowing: false,
    }
  }

  @Get(':sellerId/is-following')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if user is following a seller' })
  @ApiParam({ name: 'sellerId', description: 'Seller ID to check' })
  @ApiResponse({ status: 200, description: 'Follow status', type: IsFollowingResponseDto })
  async isFollowing(
    @Param('sellerId') sellerId: string,
    @Request() req,
  ): Promise<IsFollowingResponseDto> {
    return this.sellerFollowService.isFollowing(req.user.id, sellerId)
  }

  @Put(':sellerId/follow/notifications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle notifications for a followed seller' })
  @ApiParam({ name: 'sellerId', description: 'Seller ID' })
  @ApiResponse({ status: 200, description: 'Notifications toggled', type: FollowResponseDto })
  @ApiResponse({ status: 404, description: 'Not following this seller' })
  async toggleNotifications(
    @Param('sellerId') sellerId: string,
    @Body() dto: ToggleNotificationsDto,
    @Request() req,
  ): Promise<FollowResponseDto> {
    const follow = await this.sellerFollowService.toggleNotifications(
      req.user.id,
      sellerId,
      dto.enabled,
    )
    return {
      success: true,
      message: `Notifications ${dto.enabled ? 'enabled' : 'disabled'}`,
      isFollowing: true,
      notificationsEnabled: follow.notificationsEnabled,
    }
  }

  @Get(':sellerId/followers')
  @ApiOperation({ summary: 'Get followers of a seller' })
  @ApiParam({ name: 'sellerId', description: 'Seller ID' })
  @ApiResponse({ status: 200, description: 'List of followers', type: FollowersListResponseDto })
  async getFollowers(
    @Param('sellerId') sellerId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<FollowersListResponseDto> {
    return this.sellerFollowService.getFollowers(sellerId, query.page, query.limit)
  }
}
