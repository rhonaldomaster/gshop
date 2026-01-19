import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FollowersService } from './followers.service';

@ApiTags('followers')
@Controller('followers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FollowersController {
  constructor(private readonly followersService: FollowersService) {}

  /**
   * Follow a streamer
   */
  @Post(':streamerId/follow')
  @ApiOperation({ summary: 'Follow a streamer' })
  async followStreamer(@Request() req, @Param('streamerId') streamerId: string) {
    const follow = await this.followersService.followStreamer(req.user.id, streamerId);
    return {
      success: true,
      message: 'Now following streamer',
      followId: follow.id,
    };
  }

  /**
   * Unfollow a streamer
   */
  @Delete(':streamerId/follow')
  @ApiOperation({ summary: 'Unfollow a streamer' })
  async unfollowStreamer(@Request() req, @Param('streamerId') streamerId: string) {
    await this.followersService.unfollowStreamer(req.user.id, streamerId);
    return {
      success: true,
      message: 'Unfollowed streamer',
    };
  }

  /**
   * Check if following a streamer
   */
  @Get(':streamerId/is-following')
  @ApiOperation({ summary: 'Check if following a streamer' })
  async isFollowing(@Request() req, @Param('streamerId') streamerId: string) {
    const isFollowing = await this.followersService.isFollowing(req.user.id, streamerId);
    return { isFollowing };
  }

  /**
   * Toggle notifications for a followed streamer
   */
  @Put(':streamerId/notifications')
  @ApiOperation({ summary: 'Toggle notifications for a followed streamer' })
  async toggleNotifications(
    @Request() req,
    @Param('streamerId') streamerId: string,
    @Body('enabled') enabled: boolean,
  ) {
    const follow = await this.followersService.toggleNotifications(
      req.user.id,
      streamerId,
      enabled,
    );
    return {
      success: true,
      notificationsEnabled: follow.notificationsEnabled,
    };
  }

  /**
   * Get streamers the current user is following
   */
  @Get('following')
  @ApiOperation({ summary: 'Get streamers you are following' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getFollowing(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.followersService.getFollowing(
      req.user.id,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  /**
   * Get followers of a streamer (your own followers if you're a streamer)
   */
  @Get(':streamerId')
  @ApiOperation({ summary: 'Get followers of a streamer' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getFollowers(
    @Param('streamerId') streamerId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.followersService.getFollowers(
      streamerId,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  /**
   * Get follower/following stats for a user
   */
  @Get(':userId/stats')
  @ApiOperation({ summary: 'Get follower/following stats' })
  async getStats(@Param('userId') userId: string) {
    return this.followersService.getStats(userId);
  }

  /**
   * Get my own follower/following stats
   */
  @Get('my/stats')
  @ApiOperation({ summary: 'Get my follower/following stats' })
  async getMyStats(@Request() req) {
    return this.followersService.getStats(req.user.id);
  }
}
