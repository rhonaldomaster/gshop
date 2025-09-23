import { Controller, Post, Get, Body, Param, UseGuards, Request, Patch } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { SellersService } from './sellers.service'
import { CreateSellerDto } from './dto/create-seller.dto'
import { SellerLoginDto } from './dto/seller-login.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@ApiTags('sellers')
@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new seller' })
  async register(@Body() createSellerDto: CreateSellerDto) {
    return this.sellersService.register(createSellerDto)
  }

  @Post('login')
  @ApiOperation({ summary: 'Seller login' })
  async login(@Body() sellerLoginDto: SellerLoginDto) {
    return this.sellersService.login(sellerLoginDto)
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get seller profile' })
  async getProfile(@Request() req) {
    return this.sellersService.findOne(req.user.sellerId)
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get seller statistics' })
  async getStats(@Request() req) {
    return this.sellersService.getSellerStats(req.user.sellerId)
  }

  @Post('withdrawal')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request withdrawal' })
  async requestWithdrawal(@Request() req, @Body() body: { amount: number }) {
    return this.sellersService.requestWithdrawal(req.user.sellerId, body.amount)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get seller by ID' })
  async findOne(@Param('id') id: string) {
    return this.sellersService.findOne(id)
  }
}