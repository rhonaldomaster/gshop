import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { Cardholder, CardholderStatus } from './entities/cardholder.entity';
import { VirtualCard } from './entities/virtual-card.entity';
import { CardTransaction } from './entities/card-transaction.entity';
import { CardholdersService } from './services/cardholders.service';

@ApiTags('Admin - Issuing')
@Controller('admin/issuing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('access-token')
export class IssuingAdminController {
  constructor(
    @InjectRepository(Cardholder)
    private cardholderRepo: Repository<Cardholder>,
    @InjectRepository(VirtualCard)
    private cardRepo: Repository<VirtualCard>,
    @InjectRepository(CardTransaction)
    private txRepo: Repository<CardTransaction>,
    private cardholdersService: CardholdersService,
  ) {}

  // --- Cardholders ---

  @Get('cardholders')
  @ApiOperation({ summary: 'List all cardholders (admin)' })
  async listCardholders(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    const where: FindOptionsWhere<Cardholder> = {};
    if (status && status !== 'all') {
      where.status = status as CardholderStatus;
    }

    const [data, total] = await this.cardholderRepo.findAndCount({
      where,
      relations: ['user', 'cards'],
      order: { createdAt: 'DESC' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    return { data, total, page: pageNum, limit: limitNum };
  }

  @Get('cardholders/:id')
  @ApiOperation({ summary: 'Get cardholder detail (admin)' })
  async getCardholder(@Param('id', ParseUUIDPipe) id: string) {
    return this.cardholderRepo.findOne({
      where: { id },
      relations: ['user', 'cards'],
    });
  }

  @Patch('cardholders/:id/status')
  @ApiOperation({ summary: 'Update cardholder status (admin)' })
  async updateCardholderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: CardholderStatus },
  ) {
    const cardholder = await this.cardholderRepo.findOne({ where: { id } });
    if (!cardholder) {
      return { error: 'Cardholder not found' };
    }
    cardholder.status = body.status;
    return this.cardholderRepo.save(cardholder);
  }

  // --- Cards ---

  @Get('cards')
  @ApiOperation({ summary: 'List all virtual cards (admin)' })
  async listCards(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
  ) {
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    const where: FindOptionsWhere<VirtualCard> = {};
    if (status && status !== 'all') {
      where.status = status as any;
    }

    const [data, total] = await this.cardRepo.findAndCount({
      where,
      relations: ['user', 'cardholder'],
      order: { createdAt: 'DESC' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    return { data, total, page: pageNum, limit: limitNum };
  }

  @Get('cards/:id')
  @ApiOperation({ summary: 'Get card detail (admin)' })
  async getCard(@Param('id', ParseUUIDPipe) id: string) {
    return this.cardRepo.findOne({
      where: { id },
      relations: ['user', 'cardholder', 'transactions'],
    });
  }

  // --- Transactions ---

  @Get('transactions')
  @ApiOperation({ summary: 'List all card transactions (admin)' })
  async listTransactions(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);

    const where: FindOptionsWhere<CardTransaction> = {};
    if (status && status !== 'all') {
      where.status = status as any;
    }
    if (type && type !== 'all') {
      where.type = type as any;
    }

    const [data, total] = await this.txRepo.findAndCount({
      where,
      relations: ['card', 'user'],
      order: { createdAt: 'DESC' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    return { data, total, page: pageNum, limit: limitNum };
  }

  // --- Stats ---

  @Get('stats')
  @ApiOperation({ summary: 'Get issuing statistics (admin)' })
  async getStats() {
    const [totalCardholders, activeCardholders] = await Promise.all([
      this.cardholderRepo.count(),
      this.cardholderRepo.count({ where: { status: CardholderStatus.ACTIVE } }),
    ]);

    const [totalCards, activeCards] = await Promise.all([
      this.cardRepo.count(),
      this.cardRepo.count({ where: { status: 'active' as any } }),
    ]);

    const totalTransactions = await this.txRepo.count();

    return {
      cardholders: { total: totalCardholders, active: activeCardholders },
      cards: { total: totalCards, active: activeCards },
      transactions: { total: totalTransactions },
    };
  }
}
