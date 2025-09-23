import { Controller, Post, Body } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { SellersService } from '../sellers/sellers.service'
import { CreateSellerDto } from '../sellers/dto/create-seller.dto'
import { SellerLoginDto } from '../sellers/dto/seller-login.dto'

@ApiTags('auth')
@Controller('auth/seller')
export class AuthSellerController {
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
}