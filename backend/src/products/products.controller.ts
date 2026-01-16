
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { rateLimitConfig } from '../common/config/rate-limit.config';
import { ApiRateLimit } from '../common/decorators/api-rate-limit.decorator';
import { ProductsService } from './products.service';
import { CategoriesService } from './categories.service';
import { ProductsUploadService } from './products-upload.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { ProductStatsDto } from './dto/product-stats.dto';
import { TopProductDto } from './dto/top-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';
import { ProductStatus } from '../database/entities/product.entity';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
    private readonly productsUploadService: ProductsUploadService,
  ) {}

  @Post('upload')
  @Throttle({ default: { ttl: rateLimitConfig.endpoints.api.upload.ttl, limit: rateLimitConfig.endpoints.api.upload.limit } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Upload product images (up to 10 images, max 20MB each)' })
  @ApiRateLimit('10 requests/minute')
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Images uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string' },
        },
        provider: {
          type: 'string',
          description: 'Storage provider used (Cloudflare R2 or Local Storage)',
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('images', 10))
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    // Validate files
    const maxSize = 20 * 1024 * 1024; // 20MB
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/gif',
      'image/webp',
    ];

    for (const file of files) {
      if (!allowedMimes.includes(file.mimetype)) {
        throw new BadRequestException(
          `Invalid file type: ${file.mimetype}. Only JPEG, PNG, JPG, GIF, and WEBP are allowed.`,
        );
      }
      if (file.size > maxSize) {
        throw new BadRequestException(
          `File too large: ${file.originalname}. Maximum size is 20MB.`,
        );
      }
    }

    // Upload files using the storage service
    const uploadPromises = files.map((file) =>
      this.productsUploadService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
      ),
    );

    const urls = await Promise.all(uploadPromises);

    return {
      urls,
      provider: this.productsUploadService.getProviderName(),
    };
  }

  @Delete('images/:filename')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a product image' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  deleteImage(@Param('filename') filename: string) {
    const fileUrl = this.productsUploadService.getFileUrl(filename);
    this.productsUploadService.deleteFile(fileUrl);
    return { message: 'Image deleted successfully' };
  }

  @Post()
  @Throttle({ default: { ttl: rateLimitConfig.endpoints.api.write.ttl, limit: rateLimitConfig.endpoints.api.write.limit } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiRateLimit('30 requests/minute')
  create(@Body() createProductDto: CreateProductDto, @Request() req) {
    // If admin provides sellerId, use it; otherwise use authenticated seller's ID
    const sellerId = req.user.role === UserRole.ADMIN && createProductDto.sellerId
      ? createProductDto.sellerId
      : req.user.sellerId || req.user.id; // Use sellerId for sellers, id for legacy users
    return this.productsService.create(createProductDto, sellerId);
  }

  @Get()
  @Throttle({ default: { ttl: rateLimitConfig.endpoints.api.read.ttl, limit: rateLimitConfig.endpoints.api.read.limit } })
  @ApiOperation({ summary: 'Get all products with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get('search')
  @Throttle({ default: { ttl: rateLimitConfig.endpoints.search.default.ttl, limit: rateLimitConfig.endpoints.search.default.limit } })
  @ApiOperation({ summary: 'Search products' })
  @ApiResponse({ status: 200, description: 'Products search results' })
  @ApiRateLimit('30 requests/minute')
  searchProducts(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all product categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  getCategories() {
    return this.categoriesService.findAll();
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Trending products retrieved successfully' })
  async getTrending(@Query('limit') limit?: number) {
    const queryLimit = limit || 20;
    const result = await this.productsService.findAll({
      limit: queryLimit,
      page: 1,
      sortBy: 'views',
      sortOrder: 'DESC',
    });

    // Return just the products array, not the paginated response
    return result.data;
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get product statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Product statistics retrieved successfully',
    type: ProductStatsDto,
  })
  getStats(): Promise<ProductStatsDto> {
    return this.productsService.getProductStats();
  }

  @Get('top')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get top performing products (Admin only)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of products to return (default: 5)',
    example: 5,
  })
  @ApiQuery({
    name: 'metric',
    required: false,
    description: 'Metric to sort by: orders, views, or revenue (default: orders)',
    example: 'orders',
  })
  @ApiResponse({
    status: 200,
    description: 'Top products retrieved successfully',
    type: [TopProductDto],
  })
  getTopProducts(
    @Query('limit') limit?: number,
    @Query('metric') metric?: 'orders' | 'views' | 'revenue',
  ): Promise<TopProductDto[]> {
    return this.productsService.getTopProducts(limit || 5, metric || 'orders');
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get products by category' })
  @ApiResponse({ status: 200, description: 'Category products retrieved successfully' })
  getProductsByCategory(
    @Param('categoryId') categoryId: string,
    @Query() query: ProductQueryDto,
  ) {
    return this.productsService.getProductsByCategory(categoryId, query);
  }

  @Get('seller')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get authenticated seller products' })
  @ApiResponse({ status: 200, description: 'Seller products retrieved successfully' })
  getMyProducts(
    @Request() req,
    @Query() query: ProductQueryDto,
  ) {
    const sellerId = req.user.sellerId || req.user.id; // Use sellerId for sellers, id for legacy users
    return this.productsService.getProductsBySeller(sellerId, query);
  }

  @Get('seller/:sellerId')
  @ApiOperation({ summary: 'Get products by seller' })
  @ApiResponse({ status: 200, description: 'Seller products retrieved successfully' })
  getProductsBySeller(
    @Param('sellerId') sellerId: string,
    @Query() query: ProductQueryDto,
  ) {
    return this.productsService.getProductsBySeller(sellerId, query);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get product by slug' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Request() req,
  ) {
    const sellerId = req.user.sellerId || req.user.id; // Use sellerId for sellers, id for legacy users
    return this.productsService.update(id, updateProductDto, sellerId, req.user.role);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update product status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Product status updated successfully' })
  updateStatus(@Param('id') id: string, @Body() body: { status: ProductStatus }) {
    return this.productsService.updateStatus(id, body.status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string, @Request() req) {
    const sellerId = req.user.sellerId || req.user.id; // Use sellerId for sellers, id for legacy users
    return this.productsService.remove(id, sellerId, req.user.role);
  }
}
