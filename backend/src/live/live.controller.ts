import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request
} from '@nestjs/common';
import { LiveService } from './live.service';
import { CreateLiveStreamDto, UpdateLiveStreamDto, AddProductToStreamDto, SendMessageDto, JoinStreamDto } from './dto';
import { HostType } from './live.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('live')
export class LiveController {
  constructor(private readonly liveService: LiveService) {}

  // Seller endpoints
  @Post('streams')
  @UseGuards(JwtAuthGuard)
  async createLiveStream(@Request() req, @Body() createLiveStreamDto: CreateLiveStreamDto) {
    return this.liveService.createLiveStream(req.user.sellerId, createLiveStreamDto, HostType.SELLER);
  }

  // Affiliate endpoints
  @Post('affiliate/streams')
  @UseGuards(JwtAuthGuard)
  async createAffiliateLiveStream(@Request() req, @Body() createLiveStreamDto: CreateLiveStreamDto) {
    return this.liveService.createLiveStream(req.user.affiliateId, createLiveStreamDto, HostType.AFFILIATE);
  }

  @Get('streams')
  @UseGuards(JwtAuthGuard)
  async getLiveStreams(@Request() req) {
    return this.liveService.findLiveStreamsBySeller(req.user.sellerId);
  }

  @Get('affiliate/streams')
  @UseGuards(JwtAuthGuard)
  async getAffiliateLiveStreams(@Request() req) {
    return this.liveService.findLiveStreamsByAffiliate(req.user.affiliateId);
  }

  @Get('streams/active')
  async getActiveLiveStreams() {
    return this.liveService.findActiveLiveStreams();
  }

  @Get('streams/:id')
  async getLiveStream(@Param('id') id: string) {
    return this.liveService.findLiveStreamById(id);
  }

  @Put('streams/:id')
  @UseGuards(JwtAuthGuard)
  async updateLiveStream(
    @Request() req,
    @Param('id') id: string,
    @Body() updateLiveStreamDto: UpdateLiveStreamDto,
  ) {
    return this.liveService.updateLiveStream(id, req.user.sellerId, updateLiveStreamDto, HostType.SELLER);
  }

  @Put('affiliate/streams/:id')
  @UseGuards(JwtAuthGuard)
  async updateAffiliateLiveStream(
    @Request() req,
    @Param('id') id: string,
    @Body() updateLiveStreamDto: UpdateLiveStreamDto,
  ) {
    return this.liveService.updateLiveStream(id, req.user.affiliateId, updateLiveStreamDto, HostType.AFFILIATE);
  }

  @Delete('streams/:id')
  @UseGuards(JwtAuthGuard)
  async deleteLiveStream(@Request() req, @Param('id') id: string) {
    await this.liveService.deleteLiveStream(id, req.user.sellerId, HostType.SELLER);
    return { message: 'Live stream deleted successfully' };
  }

  @Delete('affiliate/streams/:id')
  @UseGuards(JwtAuthGuard)
  async deleteAffiliateLiveStream(@Request() req, @Param('id') id: string) {
    await this.liveService.deleteLiveStream(id, req.user.affiliateId, HostType.AFFILIATE);
    return { message: 'Live stream deleted successfully' };
  }

  @Post('streams/:id/start')
  @UseGuards(JwtAuthGuard)
  async startLiveStream(@Request() req, @Param('id') id: string) {
    return this.liveService.startLiveStream(id, req.user.sellerId, HostType.SELLER);
  }

  @Post('affiliate/streams/:id/start')
  @UseGuards(JwtAuthGuard)
  async startAffiliateLiveStream(@Request() req, @Param('id') id: string) {
    return this.liveService.startLiveStream(id, req.user.affiliateId, HostType.AFFILIATE);
  }

  @Post('streams/:id/end')
  @UseGuards(JwtAuthGuard)
  async endLiveStream(@Request() req, @Param('id') id: string) {
    return this.liveService.endLiveStream(id, req.user.sellerId, HostType.SELLER);
  }

  @Post('affiliate/streams/:id/end')
  @UseGuards(JwtAuthGuard)
  async endAffiliateLiveStream(@Request() req, @Param('id') id: string) {
    return this.liveService.endLiveStream(id, req.user.affiliateId, HostType.AFFILIATE);
  }

  @Post('streams/:id/products')
  @UseGuards(JwtAuthGuard)
  async addProductToStream(
    @Request() req,
    @Param('id') streamId: string,
    @Body() addProductDto: AddProductToStreamDto,
  ) {
    return this.liveService.addProductToStream(streamId, req.user.sellerId, addProductDto);
  }

  @Delete('streams/:id/products/:productId')
  @UseGuards(JwtAuthGuard)
  async removeProductFromStream(
    @Request() req,
    @Param('id') streamId: string,
    @Param('productId') productId: string,
  ) {
    await this.liveService.removeProductFromStream(streamId, productId, req.user.sellerId);
    return { message: 'Product removed from stream successfully' };
  }

  @Put('streams/:id/products/:productId')
  @UseGuards(JwtAuthGuard)
  async updateStreamProduct(
    @Request() req,
    @Param('id') streamId: string,
    @Param('productId') productId: string,
    @Body() updates: any,
  ) {
    return this.liveService.updateStreamProduct(streamId, productId, req.user.sellerId, updates);
  }

  @Post('streams/:id/messages')
  async sendMessage(
    @Param('id') streamId: string,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.liveService.sendMessage(streamId, sendMessageDto);
  }

  @Get('streams/:id/messages')
  async getStreamMessages(
    @Param('id') streamId: string,
    @Query('limit') limit?: number,
  ) {
    return this.liveService.getStreamMessages(streamId, limit ? parseInt(limit.toString()) : 50);
  }

  @Post('streams/:id/join')
  async joinStream(
    @Param('id') streamId: string,
    @Body() joinStreamDto: JoinStreamDto,
  ) {
    return this.liveService.joinStream(
      streamId,
      joinStreamDto.userId,
      joinStreamDto.sessionId,
      joinStreamDto.ipAddress,
      joinStreamDto.userAgent,
    );
  }

  @Post('streams/:id/leave')
  async leaveStream(
    @Param('id') streamId: string,
    @Body() body: { userId?: string; sessionId?: string },
  ) {
    await this.liveService.leaveStream(streamId, body.userId, body.sessionId);
    return { message: 'Left stream successfully' };
  }

  @Get('streams/:id/stats')
  @UseGuards(JwtAuthGuard)
  async getStreamStats(@Request() req, @Param('id') id: string) {
    return this.liveService.getStreamStats(id, req.user.sellerId);
  }
}