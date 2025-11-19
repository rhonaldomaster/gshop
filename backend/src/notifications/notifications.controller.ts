import { Controller, Post, Delete, Body, UseGuards, Request, Get } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

class RegisterTokenDto {
  token: string;
  platform: 'ios' | 'android' | 'web';
}

class RemoveTokenDto {
  token: string;
}

@ApiTags('notifications')
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register-token')
  @ApiOperation({ summary: 'Register device token for push notifications' })
  @ApiResponse({ status: 201, description: 'Token registered successfully' })
  async registerToken(
    @Body() dto: RegisterTokenDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;

    if (!userId) {
      return {
        success: false,
        message: 'User not authenticated',
      };
    }

    await this.notificationsService.registerDeviceToken(
      userId,
      dto.token,
      dto.platform,
    );

    return {
      success: true,
      message: 'Device token registered successfully',
    };
  }

  @Delete('remove-token')
  @ApiOperation({ summary: 'Remove device token' })
  @ApiResponse({ status: 200, description: 'Token removed successfully' })
  async removeToken(@Body() dto: RemoveTokenDto) {
    await this.notificationsService.removeDeviceToken(dto.token);

    return {
      success: true,
      message: 'Device token removed successfully',
    };
  }

  @Get('status')
  @ApiOperation({ summary: 'Check if push notifications are enabled' })
  @ApiResponse({ status: 200, description: 'Notification service status' })
  getStatus() {
    return {
      enabled: this.notificationsService.isFcmEnabled(),
      message: this.notificationsService.isFcmEnabled()
        ? 'Push notifications are enabled'
        : 'Push notifications are disabled - configure Firebase service account',
    };
  }
}
