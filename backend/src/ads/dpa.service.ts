import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { PixelEvent } from '../pixel/pixel.entity';
import { Audience } from '../audiences/audience.entity';

interface DPARecommendation {
  productId: string;
  product: Product;
  score: number;
  reason: string;
}

@Injectable()
export class DPAService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(PixelEvent)
    private pixelEventRepository: Repository<PixelEvent>,
  ) {}

  async generateProductFeed(sellerId: string): Promise<any> {
    const products = await this.productRepository.find({
      where: { sellerId, isActive: true },
      relations: ['seller'],
    });

    return {
      version: '2.1',
      feed: products.map(product => ({
        id: product.id,
        title: product.name,
        description: product.description,
        availability: product.stock > 0 ? 'in stock' : 'out of stock',
        condition: 'new',
        price: `${product.price} USD`,
        link: `${process.env.APP_URL}/products/${product.id}`,
        image_link: product.images?.[0] || '',
        brand: product.seller?.businessName || 'GSHOP',
        category: product.category,
        product_type: product.category,
        google_product_category: this.mapToGoogleCategory(product.category),
        custom_label_0: product.sellerId,
        mpn: product.id,
        gtin: product.barcode || '',
      })),
    };
  }

  async getPersonalizedRecommendations(userId: string, limit: number = 10): Promise<DPARecommendation[]> {
    const recommendations: DPARecommendation[] = [];

    // Get user's recent pixel events
    const recentEvents = await this.pixelEventRepository.find({
      where: { userId },
      order: { timestamp: 'DESC' },
      take: 100,
    });

    if (recentEvents.length === 0) {
      // Return popular products for new users
      return this.getPopularProducts(limit);
    }

    // Analyze user behavior
    const viewedProducts = recentEvents
      .filter(event => event.eventType === 'product_view')
      .map(event => event.eventData?.productId)
      .filter(Boolean);

    const cartProducts = recentEvents
      .filter(event => event.eventType === 'add_to_cart')
      .map(event => event.eventData?.productId)
      .filter(Boolean);

    const purchasedProducts = recentEvents
      .filter(event => event.eventType === 'purchase')
      .map(event => event.eventData?.productId)
      .filter(Boolean);

    // 1. Products viewed but not purchased (retargeting)
    const viewedNotPurchased = viewedProducts.filter(id => !purchasedProducts.includes(id));
    for (const productId of viewedNotPurchased.slice(0, Math.ceil(limit * 0.4))) {
      const product = await this.productRepository.findOne({
        where: { id: productId, isActive: true },
        relations: ['seller'],
      });

      if (product) {
        recommendations.push({
          productId,
          product,
          score: 0.9,
          reason: 'Previously viewed',
        });
      }
    }

    // 2. Products in cart but not purchased
    const cartNotPurchased = cartProducts.filter(id => !purchasedProducts.includes(id));
    for (const productId of cartNotPurchased.slice(0, Math.ceil(limit * 0.3))) {
      const product = await this.productRepository.findOne({
        where: { id: productId, isActive: true },
        relations: ['seller'],
      });

      if (product && !recommendations.find(r => r.productId === productId)) {
        recommendations.push({
          productId,
          product,
          score: 0.95,
          reason: 'In cart',
        });
      }
    }

    // 3. Similar products based on categories
    if (viewedProducts.length > 0) {
      const categories = await this.getViewedCategories(viewedProducts);
      const similarProducts = await this.productRepository
        .createQueryBuilder('product')
        .where('product.category IN (:...categories)', { categories })
        .andWhere('product.id NOT IN (:...excludeIds)', {
          excludeIds: [...viewedProducts, ...recommendations.map(r => r.productId)]
        })
        .andWhere('product.isActive = :isActive', { isActive: true })
        .leftJoinAndSelect('product.seller', 'seller')
        .orderBy('product.rating', 'DESC')
        .take(Math.ceil(limit * 0.3))
        .getMany();

      for (const product of similarProducts) {
        recommendations.push({
          productId: product.id,
          product,
          score: 0.7,
          reason: 'Similar to viewed',
        });
      }
    }

    // Fill remaining slots with popular products
    const remaining = limit - recommendations.length;
    if (remaining > 0) {
      const popularProducts = await this.getPopularProducts(remaining, recommendations.map(r => r.productId));
      recommendations.push(...popularProducts);
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async getRetargetingAds(audienceId: string, limit: number = 20): Promise<DPARecommendation[]> {
    // Get audience users and their behaviors
    const audienceUsers = await this.pixelEventRepository
      .createQueryBuilder('event')
      .select('event.userId')
      .addSelect('event.eventData')
      .where('event.userId IN (SELECT userId FROM audience_users WHERE audienceId = :audienceId)', { audienceId })
      .andWhere('event.eventType IN (:...events)', { events: ['product_view', 'add_to_cart'] })
      .getMany();

    // Aggregate most viewed/cart products
    const productInteractions = new Map<string, { views: number; carts: number; users: Set<string> }>();

    for (const event of audienceUsers) {
      const productId = event.eventData?.productId;
      if (!productId) continue;

      if (!productInteractions.has(productId)) {
        productInteractions.set(productId, { views: 0, carts: 0, users: new Set() });
      }

      const interaction = productInteractions.get(productId)!;
      interaction.users.add(event.userId);

      if (event.eventType === 'product_view') {
        interaction.views++;
      } else if (event.eventType === 'add_to_cart') {
        interaction.carts++;
      }
    }

    // Sort by engagement score
    const sortedProducts = Array.from(productInteractions.entries())
      .map(([productId, data]) => ({
        productId,
        score: (data.views * 0.5 + data.carts * 1.5) / data.users.size,
        userCount: data.users.size,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const recommendations: DPARecommendation[] = [];

    for (const item of sortedProducts) {
      const product = await this.productRepository.findOne({
        where: { id: item.productId, isActive: true },
        relations: ['seller'],
      });

      if (product) {
        recommendations.push({
          productId: item.productId,
          product,
          score: item.score,
          reason: `Popular with ${item.userCount} users in audience`,
        });
      }
    }

    return recommendations;
  }

  private async getViewedCategories(productIds: string[]): Promise<string[]> {
    const products = await this.productRepository.find({
      where: { id: In(productIds) },
      select: ['category'],
    });

    return [...new Set(products.map(p => p.category))];
  }

  private async getPopularProducts(limit: number, excludeIds: string[] = []): Promise<DPARecommendation[]> {
    const whereCondition = excludeIds.length > 0
      ? 'product.id NOT IN (:...excludeIds) AND product.isActive = :isActive'
      : 'product.isActive = :isActive';

    const products = await this.productRepository
      .createQueryBuilder('product')
      .where(whereCondition, { excludeIds, isActive: true })
      .leftJoinAndSelect('product.seller', 'seller')
      .orderBy('product.rating', 'DESC')
      .addOrderBy('product.viewCount', 'DESC')
      .take(limit)
      .getMany();

    return products.map(product => ({
      productId: product.id,
      product,
      score: 0.5,
      reason: 'Popular product',
    }));
  }

  private mapToGoogleCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      'Electronics': 'Electronics',
      'Clothing': 'Apparel & Accessories',
      'Home & Garden': 'Home & Garden',
      'Sports': 'Sporting Goods',
      'Beauty': 'Health & Beauty',
      'Toys': 'Toys & Games',
      'Books': 'Media',
      'Automotive': 'Vehicles & Parts',
    };

    return categoryMap[category] || 'Shopping';
  }

  async generateCreativeAssets(productId: string): Promise<any> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['seller'],
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return {
      productId,
      assets: {
        image: {
          url: product.images?.[0] || '',
          altText: product.name,
        },
        title: {
          text: product.name,
          maxLength: 40,
        },
        description: {
          text: product.description || '',
          maxLength: 90,
        },
        price: {
          value: product.price,
          currency: 'USD',
          formatted: `$${product.price}`,
        },
        cta: {
          text: 'Shop Now',
          url: `${process.env.APP_URL}/products/${productId}`,
        },
        brand: product.seller?.businessName || 'GSHOP',
        rating: product.rating || 0,
        availability: product.stock > 0 ? 'In Stock' : 'Out of Stock',
      },
      variations: [
        {
          format: 'square',
          dimensions: '1080x1080',
          recommended: true,
        },
        {
          format: 'landscape',
          dimensions: '1200x628',
          recommended: false,
        },
        {
          format: 'portrait',
          dimensions: '1080x1350',
          recommended: false,
        },
      ],
    };
  }
}