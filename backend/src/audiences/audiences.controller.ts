import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request
} from '@nestjs/common';
import { AudiencesService } from './audiences.service';
import { CreateAudienceDto, UpdateAudienceDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('audiences')
@UseGuards(JwtAuthGuard)
export class AudiencesController {
  constructor(private readonly audiencesService: AudiencesService) {}

  @Post()
  async createAudience(@Request() req, @Body() createAudienceDto: CreateAudienceDto) {
    return this.audiencesService.createAudience(req.user.sellerId, createAudienceDto);
  }

  @Get()
  async getAudiences(@Request() req) {
    return this.audiencesService.findAudiencesBySeller(req.user.sellerId);
  }

  @Get(':id')
  async getAudience(@Request() req, @Param('id') id: string) {
    return this.audiencesService.findAudienceById(id, req.user.sellerId);
  }

  @Put(':id')
  async updateAudience(
    @Request() req,
    @Param('id') id: string,
    @Body() updateAudienceDto: UpdateAudienceDto,
  ) {
    return this.audiencesService.updateAudience(id, req.user.sellerId, updateAudienceDto);
  }

  @Delete(':id')
  async deleteAudience(@Request() req, @Param('id') id: string) {
    await this.audiencesService.deleteAudience(id, req.user.sellerId);
    return { message: 'Audience deleted successfully' };
  }

  @Post(':id/rebuild')
  async rebuildAudience(@Request() req, @Param('id') id: string) {
    await this.audiencesService.buildAudience(id);
    const audience = await this.audiencesService.findAudienceById(id, req.user.sellerId);
    return { message: 'Audience rebuilt successfully', size: audience.size };
  }

  @Get(':id/users')
  async getAudienceUsers(@Request() req, @Param('id') id: string) {
    return this.audiencesService.getAudienceUsers(id, req.user.sellerId);
  }

  @Post(':id/users/:userId')
  async addUserToAudience(
    @Param('id') audienceId: string,
    @Param('userId') userId: string,
    @Body() metadata?: any,
  ) {
    await this.audiencesService.addUserToAudience(audienceId, userId, metadata);
    return { message: 'User added to audience successfully' };
  }

  @Delete(':id/users/:userId')
  async removeUserFromAudience(
    @Param('id') audienceId: string,
    @Param('userId') userId: string,
  ) {
    await this.audiencesService.removeUserFromAudience(audienceId, userId);
    return { message: 'User removed from audience successfully' };
  }
}