import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from './config.service';
import { ConfigCategory } from '../database/entities/platform-config.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateConfigDto, CreateConfigDto } from './dto/config.dto';
import { UserRole } from '../database/entities/user.entity';

@ApiTags('Config')
@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Get seller commission rate (public endpoint for checkout calculations)
   */
  @Get('seller-commission-rate')
  @ApiOperation({ summary: 'Get seller commission rate' })
  @ApiResponse({ status: 200, description: 'Returns commission rate' })
  async getSellerCommissionRate() {
    const rate = await this.configService.getSellerCommissionRate();
    return { rate };
  }

  /**
   * Get buyer platform fee rate (public endpoint for checkout)
   */
  @Get('buyer-platform-fee-rate')
  @ApiOperation({ summary: 'Get buyer platform fee rate' })
  @ApiResponse({ status: 200, description: 'Returns platform fee rate' })
  async getBuyerPlatformFeeRate() {
    const rate = await this.configService.getBuyerPlatformFeeRate();
    return { rate };
  }

  /**
   * Get all configurations (admin only)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all configurations (admin only)' })
  @ApiResponse({ status: 200, description: 'Returns all configurations' })
  async getAllConfigs() {
    return this.configService.getAllConfigs();
  }

  /**
   * Get configurations by category (admin only)
   */
  @Get('category/:category')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get configurations by category (admin only)' })
  @ApiResponse({ status: 200, description: 'Returns configurations by category' })
  async getConfigsByCategory(@Param('category') category: ConfigCategory) {
    return this.configService.getConfigsByCategory(category);
  }

  /**
   * Get configuration by key (admin only)
   */
  @Get(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get configuration by key (admin only)' })
  @ApiResponse({ status: 200, description: 'Returns configuration' })
  async getConfig(@Param('key') key: string) {
    return this.configService.getConfig(key);
  }

  /**
   * Update configuration (admin only)
   */
  @Put(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update configuration (admin only)' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  async updateConfig(
    @Param('key') key: string,
    @Body() updateConfigDto: UpdateConfigDto,
    @Request() req,
  ) {
    const updatedBy = req.user?.id;
    return this.configService.updateConfig(key, updateConfigDto.value, updatedBy);
  }

  /**
   * Create new configuration (admin only)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new configuration (admin only)' })
  @ApiResponse({ status: 201, description: 'Configuration created successfully' })
  async createConfig(@Body() createConfigDto: CreateConfigDto, @Request() req) {
    const createdBy = req.user?.id;
    return this.configService.createConfig(
      createConfigDto.key,
      createConfigDto.value,
      createConfigDto.description,
      createConfigDto.category,
      createdBy,
    );
  }

  /**
   * Delete configuration (admin only)
   */
  @Delete(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete configuration (admin only)' })
  @ApiResponse({ status: 200, description: 'Configuration deleted successfully' })
  async deleteConfig(@Param('key') key: string) {
    await this.configService.deleteConfig(key);
    return { message: 'Configuration deleted successfully' };
  }

  /**
   * Clear configuration cache (admin only)
   */
  @Post('cache/clear')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear configuration cache (admin only)' })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  async clearCache(@Query('key') key?: string) {
    this.configService.clearCache(key);
    return { message: 'Cache cleared successfully', key: key || 'all' };
  }
}
