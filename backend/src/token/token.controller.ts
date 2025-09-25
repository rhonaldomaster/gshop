import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TokenService } from './token.service';
import {
  CreateWalletDto,
  TransferTokensDto,
  RewardUserDto,
  TopupWalletDto,
  BurnTokensDto,
  MintTokensDto,
  TokenStatsQueryDto
} from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TokenTransactionStatus } from './token.entity';

@Controller('tokens')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  // Wallet Management
  @Post('wallet')
  @UseGuards(JwtAuthGuard)
  async createWallet(@Request() req, @Body() createWalletDto?: CreateWalletDto) {
    return this.tokenService.createWallet(req.user.id, createWalletDto);
  }

  @Get('wallet')
  @UseGuards(JwtAuthGuard)
  async getUserWallet(@Request() req) {
    return this.tokenService.getUserWallet(req.user.id);
  }

  @Get('wallet/transactions')
  @UseGuards(JwtAuthGuard)
  async getUserTransactions(@Request() req, @Query('limit') limit?: string) {
    const transactionLimit = limit ? parseInt(limit) : 50;
    return this.tokenService.getUserTransactions(req.user.id, transactionLimit);
  }

  @Get('wallet/rewards')
  @UseGuards(JwtAuthGuard)
  async getUserRewards(@Request() req, @Query('limit') limit?: string) {
    const rewardLimit = limit ? parseInt(limit) : 20;
    return this.tokenService.getUserRewards(req.user.id, rewardLimit);
  }

  // Token Transfer
  @Post('transfer')
  @UseGuards(JwtAuthGuard)
  async transferTokens(@Request() req, @Body() transferDto: Omit<TransferTokensDto, 'fromUserId'>) {
    const fullTransferDto: TransferTokensDto = {
      ...transferDto,
      fromUserId: req.user.id,
    };
    return this.tokenService.transferTokens(fullTransferDto);
  }

  // Rewards (Admin/System endpoints)
  @Post('rewards')
  @UseGuards(JwtAuthGuard)
  async processReward(@Body() rewardDto: RewardUserDto) {
    return this.tokenService.processReward(rewardDto);
  }

  @Post('rewards/cashback')
  @UseGuards(JwtAuthGuard)
  async processCashback(
    @Body() body: { userId: string; orderAmount: number; orderId: string }
  ) {
    return this.tokenService.processCashback(body.userId, body.orderAmount, body.orderId);
  }

  // Wallet Topup
  @Post('topup')
  @UseGuards(JwtAuthGuard)
  async createTopup(@Request() req, @Body() topupDto: TopupWalletDto) {
    return this.tokenService.createTopup(req.user.id, topupDto);
  }

  @Put('topup/:id/process')
  @UseGuards(JwtAuthGuard)
  async processTopup(
    @Param('id') topupId: string,
    @Body() body: { status: TokenTransactionStatus }
  ) {
    return this.tokenService.processTopup(topupId, body.status);
  }

  // Analytics & Stats
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getTokenStats(@Query() query: TokenStatsQueryDto) {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    return this.tokenService.getTokenStats({
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString()
    });
  }

  @Get('circulation')
  @UseGuards(JwtAuthGuard)
  async getCirculationData(@Query('days') days?: string) {
    const dataDays = days ? parseInt(days) : 30;
    return this.tokenService.getCirculationData(dataDays);
  }

  // Admin Management
  @Post('admin/burn')
  @UseGuards(JwtAuthGuard)
  async burnTokens(@Body() burnDto: BurnTokensDto) {
    return this.tokenService.burnTokens(burnDto.userId, burnDto.amount, burnDto.reason);
  }

  @Post('admin/mint')
  @UseGuards(JwtAuthGuard)
  async mintTokens(@Body() mintDto: MintTokensDto) {
    return this.tokenService.mintTokens(mintDto.userId, mintDto.amount, mintDto.reason);
  }

  // Public endpoints for wallet lookup (by wallet address or user ID)
  @Get('wallet/:userId')
  async getWalletByUserId(@Param('userId') userId: string) {
    const wallet = await this.tokenService.getUserWallet(userId);
    // Return limited public info
    return {
      id: wallet.id,
      balance: wallet.balance,
      totalEarned: wallet.totalEarned,
      isActive: wallet.isActive,
      createdAt: wallet.createdAt,
    };
  }

  // Exchange rate endpoint (if tokens are tradeable)
  @Get('exchange-rate')
  async getExchangeRate() {
    // Mock exchange rate - in reality this would come from an oracle or exchange
    return {
      pair: 'GSHOP/USD',
      rate: 0.01, // 1 GSHOP = $0.01
      timestamp: new Date(),
      source: 'internal',
    };
  }

  // Token metrics for dashboard
  @Get('metrics/dashboard')
  @UseGuards(JwtAuthGuard)
  async getDashboardMetrics() {
    const stats = await this.tokenService.getTokenStats();
    const circulation = await this.tokenService.getCirculationData(7);

    return {
      ...stats,
      weeklyCirculation: circulation,
      exchangeRate: 0.01,
      marketCap: stats.totalCirculation * 0.01,
    };
  }
}