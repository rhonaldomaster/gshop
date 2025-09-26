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
  Request,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MarketplaceService } from './marketplace.service';
import { CreateSellerDto, UpdateSellerDto, CreateMarketplaceProductDto, UpdateMarketplaceProductDto, CreateReviewDto, ProductSearchDto, UpdateSellerStatusDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MarketplaceSellerStatus, ShippingStatus } from './marketplace.entity';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  // Seller Management
  @Post('sellers')
  @UseGuards(JwtAuthGuard)
  async createSeller(@Request() req, @Body() createSellerDto: CreateSellerDto) {
    return this.marketplaceService.createSeller(req.user.id, createSellerDto);
  }

  @Get('sellers/profile')
  @UseGuards(JwtAuthGuard)
  async getSellerProfile(@Request() req) {
    return this.marketplaceService.getSellerByUserId(req.user.id);
  }

  @Put('sellers/profile')
  @UseGuards(JwtAuthGuard)
  async updateSellerProfile(@Request() req, @Body() updateSellerDto: UpdateSellerDto) {
    const seller = await this.marketplaceService.getSellerByUserId(req.user.id);
    return this.marketplaceService.updateSeller(seller.id, updateSellerDto);
  }

  @Get('sellers/:id/stats')
  async getSellerStats(@Param('id') sellerId: string) {
    return this.marketplaceService.getSellerStats(sellerId);
  }

  @Get('sellers')
  async getAllSellers(@Query('status') status?: MarketplaceSellerStatus) {
    return this.marketplaceService.getAllSellers(status);
  }

  @Put('sellers/:id/status')
  @UseGuards(JwtAuthGuard)
  async updateSellerStatus(@Param('id') sellerId: string, @Body() updateStatusDto: UpdateSellerStatusDto) {
    return this.marketplaceService.updateSellerStatus(sellerId, updateStatusDto.status);
  }

  // Product Management
  @Post('products')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 10))
  async createProduct(
    @Request() req,
    @Body() createProductDto: CreateMarketplaceProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const seller = await this.marketplaceService.getSellerByUserId(req.user.id);

    // Handle file uploads here (save to cloud storage)
    if (files && files.length > 0) {
      const imageUrls = files.map(file => `${process.env.APP_URL}/uploads/${file.filename}`);
      createProductDto.images = imageUrls;
    }

    return this.marketplaceService.createProduct(seller.id, createProductDto);
  }

  @Get('products')
  async getProducts(
    @Query('sellerId') sellerId?: string,
    @Query() searchDto?: ProductSearchDto,
  ) {
    if (sellerId) {
      return this.marketplaceService.getProductsBySeller(sellerId);
    }

    return this.marketplaceService.searchProducts(searchDto?.query, {
      category: searchDto?.category,
      minPrice: searchDto?.minPrice,
      maxPrice: searchDto?.maxPrice,
      rating: searchDto?.rating,
      sortBy: searchDto?.sortBy,
    });
  }

  @Get('products/:id')
  async getProduct(@Param('id') productId: string) {
    return this.marketplaceService.getProductById(productId);
  }

  @Put('products/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 10))
  async updateProduct(
    @Request() req,
    @Param('id') productId: string,
    @Body() updateProductDto: UpdateMarketplaceProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const seller = await this.marketplaceService.getSellerByUserId(req.user.id);

    // Handle file uploads
    if (files && files.length > 0) {
      const imageUrls = files.map(file => `${process.env.APP_URL}/uploads/${file.filename}`);
      updateProductDto.images = imageUrls;
    }

    return this.marketplaceService.updateProduct(productId, seller.id, updateProductDto);
  }

  @Delete('products/:id')
  @UseGuards(JwtAuthGuard)
  async deleteProduct(@Request() req, @Param('id') productId: string) {
    const seller = await this.marketplaceService.getSellerByUserId(req.user.id);
    await this.marketplaceService.deleteProduct(productId, seller.id);
    return { message: 'Product deleted successfully' };
  }

  @Post('products/search')
  async searchProducts(@Body() searchDto: ProductSearchDto) {
    return this.marketplaceService.searchProducts(searchDto.query, {
      category: searchDto.category,
      minPrice: searchDto.minPrice,
      maxPrice: searchDto.maxPrice,
      rating: searchDto.rating,
      sortBy: searchDto.sortBy,
    });
  }

  // Reviews
  @Post('reviews')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 5))
  async createReview(
    @Request() req,
    @Body() createReviewDto: CreateReviewDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    // Handle file uploads
    if (files && files.length > 0) {
      const imageUrls = files.map(file => `${process.env.APP_URL}/uploads/${file.filename}`);
      createReviewDto.images = imageUrls;
    }

    return this.marketplaceService.createReview(req.user.id, createReviewDto);
  }

  @Get('products/:id/reviews')
  async getProductReviews(@Param('id') productId: string) {
    return this.marketplaceService.getProductReviews(productId);
  }

  @Get('sellers/:id/reviews')
  async getSellerReviews(@Param('id') sellerId: string) {
    return this.marketplaceService.getSellerReviews(sellerId);
  }

  // Inventory Management
  @Put('products/:id/inventory')
  @UseGuards(JwtAuthGuard)
  async updateInventory(
    @Request() req,
    @Param('id') productId: string,
    @Body('quantity') quantity: number,
  ) {
    // Verify seller ownership
    const seller = await this.marketplaceService.getSellerByUserId(req.user.id);
    const product = await this.marketplaceService.getProductById(productId);

    if (product.sellerId !== seller.id) {
      throw new Error('Unauthorized');
    }

    await this.marketplaceService.updateInventory(productId, quantity);
    return { message: 'Inventory updated successfully' };
  }

  @Get('inventory')
  @UseGuards(JwtAuthGuard)
  async getInventory(@Request() req) {
    const seller = await this.marketplaceService.getSellerByUserId(req.user.id);
    return this.marketplaceService.getInventory(seller.id);
  }

  // Shipping Management
  @Post('shipping')
  @UseGuards(JwtAuthGuard)
  async createShipping(@Request() req, @Body() shippingData: any) {
    const seller = await this.marketplaceService.getSellerByUserId(req.user.id);
    return this.marketplaceService.createShipping(
      shippingData.orderId,
      seller.id,
      shippingData,
    );
  }

  @Put('shipping/:id/status')
  @UseGuards(JwtAuthGuard)
  async updateShippingStatus(
    @Param('id') shippingId: string,
    @Body() statusData: { status: ShippingStatus; trackingNumber?: string },
  ) {
    return this.marketplaceService.updateShippingStatus(
      shippingId,
      statusData.status,
      statusData.trackingNumber,
    );
  }

  @Get('shipping')
  @UseGuards(JwtAuthGuard)
  async getShipping(@Request() req) {
    const seller = await this.marketplaceService.getSellerByUserId(req.user.id);
    return this.marketplaceService.getShippingBySeller(seller.id);
  }

  // Categories
  @Get('categories')
  async getCategories() {
    // This could be a separate service/entity, but for now return static categories
    return [
      'Electronics',
      'Clothing & Fashion',
      'Home & Garden',
      'Sports & Outdoors',
      'Beauty & Health',
      'Toys & Games',
      'Books & Media',
      'Automotive',
      'Food & Beverages',
      'Art & Crafts',
      'Jewelry & Accessories',
      'Pet Supplies',
    ];
  }

  // Featured Products
  @Get('featured')
  async getFeaturedProducts() {
    return this.marketplaceService.searchProducts('', {
      sortBy: 'popularity',
    });
  }
}