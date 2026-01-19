import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserNotificationsService } from './user-notifications.service';
import { NotificationType } from './user-notification.entity';

@ApiTags('user-notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserNotificationsController {
  constructor(
    private readonly userNotificationsService: UserNotificationsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for the current user' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getNotifications(
    @Request() req,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('type') type?: NotificationType,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.userNotificationsService.findByUser(req.user.id, {
      unreadOnly: unreadOnly === 'true',
      type,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  async getUnreadCount(@Request() req) {
    const count = await this.userNotificationsService.getUnreadCount(req.user.id);
    return { count };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single notification' })
  async getNotification(@Request() req, @Param('id') id: string) {
    return this.userNotificationsService.findOne(id, req.user.id);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(@Request() req, @Param('id') id: string) {
    return this.userNotificationsService.markAsRead(id, req.user.id);
  }

  @Put('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Request() req) {
    await this.userNotificationsService.markAllAsRead(req.user.id);
    return { success: true, message: 'All notifications marked as read' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  async deleteNotification(@Request() req, @Param('id') id: string) {
    await this.userNotificationsService.delete(id, req.user.id);
    return { success: true, message: 'Notification deleted' };
  }

  @Delete('bulk')
  @ApiOperation({ summary: 'Delete multiple notifications' })
  async deleteMultiple(@Request() req, @Body() body: { ids: string[] }) {
    await this.userNotificationsService.deleteMultiple(body.ids, req.user.id);
    return { success: true, message: `${body.ids.length} notifications deleted` };
  }
}
