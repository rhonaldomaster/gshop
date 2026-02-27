import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CardholdersService } from './services/cardholders.service';
import { CardsService } from './services/cards.service';
import { FundingService } from './services/funding.service';
import { CardTransactionsService } from './services/card-transactions.service';
import { CreateCardholderDto } from './dto/create-cardholder.dto';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { FundCardDto } from './dto/fund-card.dto';
import { CardTransactionQueryDto } from './dto/card-query.dto';
import { SENSITIVE_ENDPOINT_TTL, SENSITIVE_ENDPOINT_LIMIT } from './constants';

@ApiTags('Issuing - Virtual Cards')
@Controller('issuing')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class IssuingController {
  constructor(
    private cardholdersService: CardholdersService,
    private cardsService: CardsService,
    private fundingService: FundingService,
    private cardTransactionsService: CardTransactionsService,
  ) {}

  // --- Cardholder ---

  @Post('cardholders')
  @ApiOperation({ summary: 'Create cardholder profile for card issuing' })
  async createCardholder(@Request() req, @Body() dto: CreateCardholderDto) {
    return this.cardholdersService.createCardholder(req.user.id, dto);
  }

  @Get('cardholders/me')
  @ApiOperation({ summary: 'Get current user cardholder profile' })
  async getMyCardholder(@Request() req) {
    return this.cardholdersService.getCardholderByUserId(req.user.id);
  }

  // --- Cards ---

  @Post('cards')
  @ApiOperation({ summary: 'Issue a new virtual card' })
  async createCard(@Request() req, @Body() dto: CreateCardDto) {
    return this.cardsService.createCard(req.user.id, dto);
  }

  @Get('cards')
  @ApiOperation({ summary: 'List my virtual cards' })
  async getMyCards(@Request() req) {
    return this.cardsService.getUserCards(req.user.id);
  }

  @Get('cards/:id')
  @ApiOperation({ summary: 'Get card details' })
  async getCard(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.cardsService.getCardById(req.user.id, id);
  }

  @Get('cards/:id/sensitive')
  @ApiOperation({ summary: 'Get card number and CVC (rate-limited)' })
  @Throttle({ default: { ttl: SENSITIVE_ENDPOINT_TTL, limit: SENSITIVE_ENDPOINT_LIMIT } })
  async getCardSensitive(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.cardsService.getCardSensitiveDetails(req.user.id, id);
  }

  @Put('cards/:id')
  @ApiOperation({ summary: 'Update card (status, spending limits)' })
  async updateCard(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCardDto,
  ) {
    return this.cardsService.updateCard(req.user.id, id, dto);
  }

  @Delete('cards/:id')
  @ApiOperation({ summary: 'Cancel a virtual card' })
  async cancelCard(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.cardsService.cancelCard(req.user.id, id);
  }

  // --- Funding ---

  @Post('cards/:id/fund')
  @ApiOperation({ summary: 'Fund card from wallet balance' })
  async fundCard(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FundCardDto,
  ) {
    return this.fundingService.fundCardFromWallet(req.user.id, id, dto);
  }

  @Post('cards/:id/withdraw')
  @ApiOperation({ summary: 'Withdraw card balance back to wallet' })
  async withdrawFromCard(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FundCardDto,
  ) {
    return this.fundingService.withdrawToWallet(req.user.id, id, dto);
  }

  // --- Transactions ---

  @Get('cards/:id/transactions')
  @ApiOperation({ summary: 'Get transactions for a card' })
  async getCardTransactions(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CardTransactionQueryDto,
  ) {
    return this.cardTransactionsService.getCardTransactions(req.user.id, id, query);
  }
}
