
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Product, ProductStatus } from '../database/entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UserRole } from '../database/entities/user.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto, sellerId: string): Promise<Product> {
    const slug = this.generateSlug(createProductDto.name);

    const product = this.productRepository.create({
      ...createProductDto,
      slug,
      sellerId,
    });

    // Calculate VAT-inclusive pricing
    product.calculatePrices(createProductDto.price);

    return this.productRepository.save(product);
  }

  async findAll(query: ProductQueryDto) {
    const queryBuilder = this.createBaseQuery();

    // Apply filters
    this.applyFilters(queryBuilder, query);

    // Apply search
    if (query.search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.tags ILIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    // Apply sorting
    this.applySorting(queryBuilder, query.sortBy, query.sortOrder);

    // Apply pagination
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    const [products, total] = await queryBuilder.getManyAndCount();

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.createBaseQuery()
      .where('product.id = :id', { id })
      .getOne();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Increment view count
    await this.productRepository.increment({ id }, 'viewsCount', 1);

    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.createBaseQuery()
      .where('product.slug = :slug', { slug })
      .getOne();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Increment view count
    await this.productRepository.increment({ id: product.id }, 'viewsCount', 1);

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    userId: string,
    userRole: UserRole,
  ): Promise<Product> {
    const product = await this.findOne(id);

    // Check permissions
    if (userRole !== UserRole.ADMIN && product.sellerId !== userId) {
      throw new ForbiddenException('You can only update your own products');
    }

    // Update slug if name changed
    if (updateProductDto.name && updateProductDto.name !== product.name) {
      updateProductDto.slug = this.generateSlug(updateProductDto.name);
    }

    // Recalculate VAT-inclusive pricing if price or vatType changed
    if (updateProductDto.price !== undefined || updateProductDto.vatType !== undefined) {
      const finalPrice = updateProductDto.price ?? product.price;
      const finalVatType = updateProductDto.vatType ?? product.vatType;

      // Temporarily assign vatType to calculate prices correctly
      product.vatType = finalVatType;
      product.calculatePrices(finalPrice);

      // Add calculated values to DTO
      updateProductDto.basePrice = product.basePrice;
      updateProductDto.vatAmount = product.vatAmount;
    }

    await this.productRepository.update(id, updateProductDto);
    return this.findOne(id);
  }

  async remove(id: string, userId: string, userRole: UserRole): Promise<void> {
    const product = await this.findOne(id);

    // Check permissions
    if (userRole !== UserRole.ADMIN && product.sellerId !== userId) {
      throw new ForbiddenException('You can only delete your own products');
    }

    await this.productRepository.remove(product);
  }

  async updateStatus(id: string, status: ProductStatus): Promise<Product> {
    await this.productRepository.update(id, { status });
    return this.findOne(id);
  }

  async getProductsByCategory(categoryId: string, query: ProductQueryDto) {
    const queryBuilder = this.createBaseQuery()
      .where('product.categoryId = :categoryId', { categoryId });

    this.applyFilters(queryBuilder, query);
    this.applySorting(queryBuilder, query.sortBy, query.sortOrder);

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    const [products, total] = await queryBuilder.getManyAndCount();

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProductsBySeller(sellerId: string, query: ProductQueryDto) {
    const queryBuilder = this.createBaseQuery()
      .where('product.sellerId = :sellerId', { sellerId });

    this.applyFilters(queryBuilder, query);
    this.applySorting(queryBuilder, query.sortBy, query.sortOrder);

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    const [products, total] = await queryBuilder.getManyAndCount();

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProductStats() {
    const [
      totalProducts,
      activeProducts,
      outOfStockProducts,
      draftProducts,
    ] = await Promise.all([
      this.productRepository.count(),
      this.productRepository.count({ where: { status: ProductStatus.ACTIVE } }),
      this.productRepository.count({ where: { status: ProductStatus.OUT_OF_STOCK } }),
      this.productRepository.count({ where: { status: ProductStatus.DRAFT } }),
    ]);

    return {
      totalProducts,
      activeProducts,
      outOfStockProducts,
      draftProducts,
    };
  }

  private createBaseQuery(): SelectQueryBuilder<Product> {
    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.seller', 'seller')
      .leftJoinAndSelect('product.category', 'category')
      .select([
        'product',
        'seller.id',
        'seller.firstName',
        'seller.lastName',
        'seller.avatar',
        'category.id',
        'category.name',
        'category.slug',
      ]);
  }

  private applyFilters(queryBuilder: SelectQueryBuilder<Product>, query: ProductQueryDto) {
    if (query.categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (query.sellerId) {
      queryBuilder.andWhere('product.sellerId = :sellerId', {
        sellerId: query.sellerId,
      });
    }

    if (query.status) {
      queryBuilder.andWhere('product.status = :status', { status: query.status });
    }

    if (query.minPrice) {
      queryBuilder.andWhere('product.price >= :minPrice', {
        minPrice: query.minPrice,
      });
    }

    if (query.maxPrice) {
      queryBuilder.andWhere('product.price <= :maxPrice', {
        maxPrice: query.maxPrice,
      });
    }

    if (query.inStock !== undefined) {
      if (query.inStock) {
        queryBuilder.andWhere('product.quantity > 0');
      } else {
        queryBuilder.andWhere('product.quantity = 0');
      }
    }
  }

  private applySorting(
    queryBuilder: SelectQueryBuilder<Product>,
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
  ) {
    const order = sortOrder || 'DESC';
    
    switch (sortBy) {
      case 'name':
        queryBuilder.orderBy('product.name', order);
        break;
      case 'price':
        queryBuilder.orderBy('product.price', order);
        break;
      case 'views':
        queryBuilder.orderBy('product.viewsCount', order);
        break;
      case 'rating':
        queryBuilder.orderBy('product.rating', order);
        break;
      default:
        queryBuilder.orderBy('product.createdAt', order);
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
}
