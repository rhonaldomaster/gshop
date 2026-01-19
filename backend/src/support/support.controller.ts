import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import {
  SupportService,
  CreateTicketDto,
  UpdateTicketDto,
} from './support.service';
import { TicketStatus, TicketCategory, TicketPriority } from './support.entity';
import { UserRole } from '../database/entities/user.entity';

@ApiTags('support')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // ==================== FAQs (Public) ====================

  @Get('faqs')
  @Public()
  @ApiOperation({ summary: 'Get all active FAQs' })
  @ApiQuery({ name: 'category', required: false, type: String })
  async getFAQs(@Query('category') category?: string) {
    return this.supportService.getFAQs(category);
  }

  @Get('faqs/categories')
  @Public()
  @ApiOperation({ summary: 'Get FAQ categories' })
  async getFAQCategories() {
    return this.supportService.getFAQCategories();
  }

  @Post('faqs/:id/helpful')
  @Public()
  @ApiOperation({ summary: 'Mark FAQ as helpful' })
  async markFAQHelpful(@Param('id') id: string) {
    return this.supportService.markFAQHelpful(id);
  }

  @Post('faqs/:id/view')
  @Public()
  @ApiOperation({ summary: 'Increment FAQ view count' })
  async incrementFAQView(@Param('id') id: string) {
    await this.supportService.incrementFAQView(id);
    return { success: true };
  }

  // ==================== Tickets (User) ====================

  @Post('tickets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a support ticket' })
  async createTicket(@Request() req, @Body() dto: CreateTicketDto) {
    return this.supportService.createTicket(req.user.id, dto);
  }

  @Post('tickets/guest')
  @Public()
  @ApiOperation({ summary: 'Create a support ticket as guest' })
  async createGuestTicket(@Body() dto: CreateTicketDto) {
    if (!dto.email) {
      throw new Error('Email is required for guest tickets');
    }
    return this.supportService.createTicket(null, dto);
  }

  @Get('tickets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user tickets' })
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getUserTickets(
    @Request() req,
    @Query('status') status?: TicketStatus,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.supportService.getUserTickets(req.user.id, {
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('tickets/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single ticket' })
  async getTicket(@Request() req, @Param('id') id: string) {
    return this.supportService.getTicket(id, req.user.id);
  }

  // ==================== Admin Endpoints ====================

  @Get('admin/tickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all tickets (admin)' })
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
  @ApiQuery({ name: 'category', required: false, enum: TicketCategory })
  @ApiQuery({ name: 'priority', required: false, enum: TicketPriority })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getAllTickets(
    @Query('status') status?: TicketStatus,
    @Query('category') category?: TicketCategory,
    @Query('priority') priority?: TicketPriority,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.supportService.getAllTickets({
      status,
      category,
      priority,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('admin/tickets/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single ticket (admin)' })
  async getTicketAdmin(@Param('id') id: string) {
    return this.supportService.getTicket(id);
  }

  @Put('admin/tickets/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a ticket (admin)' })
  async updateTicket(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.supportService.updateTicket(id, dto);
  }

  @Post('admin/faqs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a FAQ (admin)' })
  async createFAQ(
    @Body()
    dto: {
      question: string;
      answer: string;
      category?: string;
      order?: number;
    },
  ) {
    return this.supportService.createFAQ(dto);
  }

  @Put('admin/faqs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a FAQ (admin)' })
  async updateFAQ(
    @Param('id') id: string,
    @Body()
    dto: {
      question?: string;
      answer?: string;
      category?: string;
      order?: number;
      isActive?: boolean;
    },
  ) {
    return this.supportService.updateFAQ(id, dto);
  }

  @Post('admin/faqs/seed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seed default FAQs (admin)' })
  async seedFAQs() {
    await this.supportService.seedDefaultFAQs();
    return { success: true, message: 'Default FAQs seeded' };
  }
}
