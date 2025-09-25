import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketplaceSeller, MarketplaceProduct, Review, Inventory, Shipping, MarketplaceSellerStatus, ShippingStatus } from './marketplace.entity';
import { CreateSellerDto, UpdateSellerDto, CreateProductDto, UpdateProductDto, CreateReviewDto } from './dto';

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectRepository(MarketplaceSeller)
    private sellerRepository: Repository<MarketplaceSeller>,
    @InjectRepository(MarketplaceProduct)
    private productRepository: Repository<MarketplaceProduct>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRepository(Shipping)
    private shippingRepository: Repository<Shipping>,
  ) {}

  // Seller Management
  async createSeller(userId: string, createSellerDto: CreateSellerDto): Promise<MarketplaceSeller> {
    const existingSeller = await this.sellerRepository.findOne({ where: { userId } });
    if (existingSeller) {
      throw new BadRequestException('User is already a seller');
    }

    const seller = this.sellerRepository.create({
      ...createSellerDto,
      userId,
    });

    return this.sellerRepository.save(seller);
  }

  async getSellerByUserId(userId: string): Promise<MarketplaceSeller> {
    const seller = await this.sellerRepository.findOne({
      where: { userId },
      relations: ['products', 'reviews'],
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    return seller;
  }

  async updateSeller(sellerId: string, updateSellerDto: UpdateSellerDto): Promise<MarketplaceSeller> {
    const seller = await this.sellerRepository.findOne({ where: { id: sellerId } });
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    Object.assign(seller, updateSellerDto);
    return this.sellerRepository.save(seller);
  }

  async updateSellerStatus(sellerId: string, status: MarketplaceSellerStatus): Promise<MarketplaceSeller> {
    const seller = await this.sellerRepository.findOne({ where: { id: sellerId } });
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    seller.status = status;
    return this.sellerRepository.save(seller);
  }

  async getAllSellers(status?: MarketplaceSellerStatus): Promise<MarketplaceSeller[]> {
    const where = status ? { status } : {};
    return this.sellerRepository.find({
      where,
      relations: ['products', 'reviews'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSellerStats(sellerId: string): Promise<any> {
    const seller = await this.sellerRepository.findOne({
      where: { id: sellerId },
      relations: ['products', 'reviews'],
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    const totalProducts = seller.products.length;
    const activeProducts = seller.products.filter(p => p.isActive).length;
    const totalViews = seller.products.reduce((sum, p) => sum + p.viewCount, 0);
    const totalSold = seller.products.reduce((sum, p) => sum + p.soldCount, 0);

    return {
      seller,
      stats: {
        totalProducts,
        activeProducts,
        totalViews,
        totalSold,
        totalSales: seller.totalSales,
        totalRevenue: seller.totalRevenue,
        averageRating: seller.averageRating,
        totalReviews: seller.totalReviews,
      },
    };
  }

  // Product Management
  async createProduct(sellerId: string, createProductDto: CreateProductDto): Promise<MarketplaceProduct> {
    const seller = await this.sellerRepository.findOne({ where: { id: sellerId } });
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    const product = this.productRepository.create({
      ...createProductDto,
      sellerId,
    });

    const savedProduct = await this.productRepository.save(product);

    // Create initial inventory record
    await this.inventoryRepository.save({
      productId: savedProduct.id,
      quantity: createProductDto.stock,
    });

    return savedProduct;
  }

  async getProductsBySeller(sellerId: string): Promise<MarketplaceProduct[]> {
    return this.productRepository.find({
      where: { sellerId },
      relations: ['seller', 'reviews'],
      order: { createdAt: 'DESC' },
    });
  }

  async getProductById(productId: string): Promise<MarketplaceProduct> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['seller', 'reviews', 'reviews.user'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Increment view count
    await this.productRepository.update(productId, { viewCount: product.viewCount + 1 });

    return product;
  }

  async updateProduct(productId: string, sellerId: string, updateProductDto: UpdateProductDto): Promise<MarketplaceProduct> {
    const product = await this.productRepository.findOne({
      where: { id: productId, sellerId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async deleteProduct(productId: string, sellerId: string): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id: productId, sellerId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.productRepository.remove(product);
  }

  async searchProducts(query: string, filters?: any): Promise<MarketplaceProduct[]> {
    const queryBuilder = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.seller', 'seller')
      .where('product.isActive = :isActive', { isActive: true });

    if (query) {
      queryBuilder.andWhere(
        '(product.name ILIKE :query OR product.description ILIKE :query OR product.category ILIKE :query)',
        { query: `%${query}%` }
      );
    }

    if (filters?.category) {
      queryBuilder.andWhere('product.category = :category', { category: filters.category });
    }

    if (filters?.minPrice) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice: filters.minPrice });
    }

    if (filters?.maxPrice) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    if (filters?.rating) {
      queryBuilder.andWhere('product.averageRating >= :rating', { rating: filters.rating });
    }

    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'price_low':
          queryBuilder.orderBy('product.price', 'ASC');
          break;
        case 'price_high':
          queryBuilder.orderBy('product.price', 'DESC');
          break;
        case 'rating':
          queryBuilder.orderBy('product.averageRating', 'DESC');
          break;
        case 'popularity':
          queryBuilder.orderBy('product.soldCount', 'DESC');
          break;
        case 'newest':
          queryBuilder.orderBy('product.createdAt', 'DESC');
          break;
        default:
          queryBuilder.orderBy('product.viewCount', 'DESC');
      }
    }

    return queryBuilder.getMany();
  }

  // Review System
  async createReview(userId: string, createReviewDto: CreateReviewDto): Promise<Review> {
    // Check if user already reviewed this product
    if (createReviewDto.productId) {
      const existingReview = await this.reviewRepository.findOne({
        where: { userId, productId: createReviewDto.productId },
      });

      if (existingReview) {
        throw new BadRequestException('You have already reviewed this product');
      }
    }

    const review = this.reviewRepository.create({
      ...createReviewDto,
      userId,
    });

    const savedReview = await this.reviewRepository.save(review);

    // Update product/seller rating
    await this.updateRatings(createReviewDto.productId, createReviewDto.sellerId);

    return savedReview;
  }

  private async updateRatings(productId?: string, sellerId?: string): Promise<void> {
    if (productId) {
      const reviews = await this.reviewRepository.find({ where: { productId } });
      const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      await this.productRepository.update(productId, {
        averageRating: Number(averageRating.toFixed(2)),
        reviewCount: reviews.length,
      });
    }

    if (sellerId) {
      const reviews = await this.reviewRepository.find({ where: { sellerId } });
      const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      await this.sellerRepository.update(sellerId, {
        averageRating: Number(averageRating.toFixed(2)),
        totalReviews: reviews.length,
      });
    }
  }

  async getProductReviews(productId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { productId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSellerReviews(sellerId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { sellerId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  // Inventory Management
  async updateInventory(productId: string, quantity: number): Promise<void> {
    const inventory = await this.inventoryRepository.findOne({ where: { productId } });

    if (!inventory) {
      await this.inventoryRepository.save({
        productId,
        quantity,
      });
    } else {
      inventory.quantity = quantity;
      await this.inventoryRepository.save(inventory);
    }

    // Update product stock
    await this.productRepository.update(productId, { stock: quantity });
  }

  async getInventory(sellerId: string): Promise<any[]> {
    return this.inventoryRepository.find({
      relations: ['product'],
      where: { product: { sellerId } },
    });
  }

  // Shipping Management
  async createShipping(orderId: string, sellerId: string, shippingData: any): Promise<Shipping> {
    const shipping = this.shippingRepository.create({
      orderId,
      sellerId,
      ...shippingData,
    });

    const savedShipping = await this.shippingRepository.save(shipping);
    return Array.isArray(savedShipping) ? savedShipping[0] : savedShipping;
  }

  async updateShippingStatus(shippingId: string, status: ShippingStatus, trackingNumber?: string): Promise<Shipping> {
    const shipping = await this.shippingRepository.findOne({ where: { id: shippingId } });

    if (!shipping) {
      throw new NotFoundException('Shipping not found');
    }

    shipping.status = status;
    if (trackingNumber) {
      shipping.trackingNumber = trackingNumber;
    }

    if (status === ShippingStatus.SHIPPED) {
      shipping.shippedAt = new Date();
    } else if (status === ShippingStatus.DELIVERED) {
      shipping.deliveredAt = new Date();
    }

    return this.shippingRepository.save(shipping);
  }

  async getShippingBySeller(sellerId: string): Promise<Shipping[]> {
    return this.shippingRepository.find({
      where: { sellerId },
      relations: ['seller'],
      order: { createdAt: 'DESC' },
    });
  }
}