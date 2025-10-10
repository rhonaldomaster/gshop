import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CartService } from './cart.service';

@ApiTags('cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get user cart' })
  async getCart(@Request() req) {
    return this.cartService.getCart(req.user.id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  async addItem(
    @Request() req,
    @Body()
    body: {
      productId: string;
      quantity: number;
      variantId?: string;
    },
  ) {
    return this.cartService.addItem(req.user.id, body);
  }

  @Put('items/:itemId')
  @ApiOperation({ summary: 'Update item quantity' })
  async updateQuantity(
    @Request() req,
    @Param('itemId') itemId: string,
    @Body() body: { quantity: number },
  ) {
    return this.cartService.updateQuantity(req.user.id, itemId, body);
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeItem(@Request() req, @Param('itemId') itemId: string) {
    return this.cartService.removeItem(req.user.id, itemId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear cart' })
  async clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.id);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync local cart with server' })
  async syncCart(
    @Request() req,
    @Body()
    body: {
      items: {
        productId: string;
        quantity: number;
        variantId?: string;
      }[];
    },
  ) {
    return this.cartService.syncCart(req.user.id, body);
  }

  @Post('validate-stock')
  @ApiOperation({ summary: 'Validate cart stock before checkout' })
  async validateStock(@Request() req) {
    return this.cartService.validateStock(req.user.id);
  }

  @Post('coupon')
  @ApiOperation({ summary: 'Apply coupon code' })
  async applyCoupon(@Request() req, @Body() body: { code: string }) {
    return this.cartService.applyCoupon(req.user.id, body);
  }

  @Delete('coupon')
  @ApiOperation({ summary: 'Remove coupon' })
  async removeCoupon(@Request() req) {
    return this.cartService.removeCoupon(req.user.id);
  }

  @Post('save-for-later/:itemId')
  @ApiOperation({ summary: 'Save item for later' })
  async saveForLater(@Request() req, @Param('itemId') itemId: string) {
    return this.cartService.saveForLater(req.user.id, itemId);
  }

  @Post('move-to-cart/:itemId')
  @ApiOperation({ summary: 'Move saved item back to cart' })
  async moveToCart(@Request() req, @Param('itemId') itemId: string) {
    return this.cartService.moveToCart(req.user.id, itemId);
  }

  @Get('saved-items')
  @ApiOperation({ summary: 'Get saved items' })
  async getSavedItems(@Request() req) {
    return this.cartService.getSavedItems(req.user.id);
  }
}
