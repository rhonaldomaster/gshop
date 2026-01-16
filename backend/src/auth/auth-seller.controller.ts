import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SellersService } from '../sellers/sellers.service';
import { CreateSellerDto } from '../sellers/dto/create-seller.dto';
import { SellerLoginDto } from '../sellers/dto/seller-login.dto';
import { rateLimitConfig } from '../common/config/rate-limit.config';

@ApiTags('auth')
@Controller('auth/seller')
export class AuthSellerController {
  constructor(private readonly sellersService: SellersService) {}

  @Post('register')
  @Throttle({ default: rateLimitConfig.endpoints.auth.register })
  @ApiOperation({ summary: 'Register a new seller' })
  @ApiResponse({ status: 429, description: 'Too many registration attempts' })
  async register(@Body() createSellerDto: CreateSellerDto) {
    return this.sellersService.register(createSellerDto);
  }

  @Post('login')
  @Throttle({ default: rateLimitConfig.endpoints.auth.login })
  @ApiOperation({ summary: 'Seller login' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  async login(@Body() sellerLoginDto: SellerLoginDto) {
    return this.sellersService.login(sellerLoginDto);
  }
}