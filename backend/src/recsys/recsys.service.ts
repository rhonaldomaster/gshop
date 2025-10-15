import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  UserInteraction,
  UserPreference,
  SimilarityMatrix,
  Recommendation,
  InteractionType,
  PreferenceType
} from './recsys.entity';
import { TrackInteractionDto, GenerateRecommendationsDto, UpdatePreferenceDto } from './dto';

@Injectable()
export class RecsysService {
  constructor(
    @InjectRepository(UserInteraction)
    private interactionRepository: Repository<UserInteraction>,
    @InjectRepository(UserPreference)
    private preferenceRepository: Repository<UserPreference>,
    @InjectRepository(SimilarityMatrix)
    private similarityRepository: Repository<SimilarityMatrix>,
    @InjectRepository(Recommendation)
    private recommendationRepository: Repository<Recommendation>,
  ) {}

  // Interaction Tracking
  async trackInteraction(trackingDto: TrackInteractionDto): Promise<UserInteraction> {
    const { metadata, ...rest } = trackingDto;

    const interaction = this.interactionRepository.create({
      ...rest,
      context: metadata, // Map metadata to context field in entity
      timestamp: new Date(),
    });

    const savedInteraction = await this.interactionRepository.save(interaction);

    // Update user preferences based on interaction
    await this.updateUserPreferences(trackingDto.userId, trackingDto);

    return savedInteraction;
  }

  async getUserInteractions(userId: string, limit = 100): Promise<UserInteraction[]> {
    return this.interactionRepository.find({
      where: { userId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  // Recommendation Engine
  async generateRecommendations(dto: GenerateRecommendationsDto): Promise<any[]> {
    const { userId, algorithm = 'hybrid', limit = 10, categoryId, excludeViewed = true } = dto;

    let recommendations: any[] = [];

    try {
      switch (algorithm) {
        case 'collaborative':
          recommendations = await this.collaborativeFiltering(userId, limit, categoryId);
          break;
        case 'content':
          recommendations = await this.contentBasedFiltering(userId, limit, categoryId);
          break;
        case 'popular':
          recommendations = await this.popularityBasedRecommendations(limit, categoryId);
          break;
        case 'hybrid':
        default:
          recommendations = await this.hybridRecommendations(userId, limit, categoryId);
          break;
      }

      if (excludeViewed && recommendations.length > 0) {
        recommendations = await this.excludeViewedProducts(userId, recommendations);
      }

      // Store recommendation results only if we have recommendations
      if (recommendations.length > 0) {
        await this.storeRecommendationResults(userId, algorithm, recommendations);
      }

      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      // Return empty array instead of throwing error
      return [];
    }
  }

  // Collaborative Filtering Algorithm
  private async collaborativeFiltering(userId: string, limit: number, categoryId?: string): Promise<any[]> {
    try {
      // Find users with similar preferences
      const userPrefs = await this.getUserPreferences(userId);
      const similarUsers = await this.findSimilarUsers(userId, userPrefs);

      if (similarUsers.length === 0) {
        return this.popularityBasedRecommendations(limit, categoryId);
      }

      // Get products liked by similar users
      const recommendedProducts = await this.interactionRepository
        .createQueryBuilder('interaction')
        .select('interaction.productId, COUNT(*) as score')
        .where('interaction.userId IN (:...userIds)', { userIds: similarUsers.map(u => u.userId) })
        .andWhere('interaction.interactionType IN (:...types)', {
          types: [InteractionType.PURCHASE, InteractionType.ADD_TO_CART, InteractionType.LIKE]
        })
        .andWhere('interaction.userId != :userId', { userId })
        .groupBy('interaction.productId')
        .orderBy('score', 'DESC')
        .limit(limit)
        .getRawMany();

      return this.enrichProductRecommendations(recommendedProducts, 'collaborative');
    } catch (error) {
      console.error('Error in collaborativeFiltering:', error);
      return [];
    }
  }

  // Content-Based Filtering Algorithm
  private async contentBasedFiltering(userId: string, limit: number, categoryId?: string): Promise<any[]> {
    try {
      const userPrefs = await this.getUserPreferences(userId);

      if (userPrefs.length === 0) {
        return this.popularityBasedRecommendations(limit, categoryId);
      }

      // Find products similar to user's preferred categories/attributes
      const preferredCategories = userPrefs
        .filter(p => p.preferenceType === PreferenceType.CATEGORY)
        .map(p => p.preferenceValue);

      const preferredPriceRange = userPrefs.find(p => p.preferenceType === PreferenceType.PRICE_RANGE);

      // Query similar products (this would integrate with your product service)
      const recommendations = await this.findSimilarProductsByPreferences(
        preferredCategories,
        preferredPriceRange?.preferenceValue,
        limit,
        categoryId
      );

      return this.enrichProductRecommendations(recommendations, 'content');
    } catch (error) {
      console.error('Error in contentBasedFiltering:', error);
      return [];
    }
  }

  // Popularity-Based Recommendations
  private async popularityBasedRecommendations(limit: number, categoryId?: string): Promise<any[]> {
    try {
      const queryBuilder = this.interactionRepository
        .createQueryBuilder('interaction')
        .select(['interaction.productId', 'COUNT(*) as popularity'])
        .where('interaction.interactionType IN (:...types)', {
          types: [InteractionType.VIEW, InteractionType.PURCHASE, InteractionType.ADD_TO_CART]
        })
        .andWhere('interaction.timestamp > :date', {
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        });

      if (categoryId) {
        queryBuilder.andWhere('interaction.context->>\'categoryId\' = :categoryId', { categoryId });
      }

      const popularProducts = await queryBuilder
        .groupBy('interaction.productId')
        .orderBy('popularity', 'DESC')
        .limit(limit)
        .getRawMany();

      if (!popularProducts || popularProducts.length === 0) {
        console.log('No popular products found, returning empty array');
        return [];
      }

      return this.enrichProductRecommendations(popularProducts, 'popular');
    } catch (error) {
      console.error('Error in popularityBasedRecommendations:', error);
      return [];
    }
  }

  // Hybrid Algorithm (combines multiple approaches)
  private async hybridRecommendations(userId: string, limit: number, categoryId?: string): Promise<any[]> {
    try {
      const collaborativeLimit = Math.ceil(limit * 0.4); // 40% collaborative
      const contentLimit = Math.ceil(limit * 0.4);       // 40% content-based
      const popularLimit = Math.ceil(limit * 0.2);       // 20% popularity

      const [collaborative, content, popular] = await Promise.all([
        this.collaborativeFiltering(userId, collaborativeLimit, categoryId),
        this.contentBasedFiltering(userId, contentLimit, categoryId),
        this.popularityBasedRecommendations(popularLimit, categoryId),
      ]);

      // Combine and deduplicate results
      const combined = [...collaborative, ...content, ...popular];
      const unique = combined.reduce((acc, curr) => {
        if (!acc.find(item => item.productId === curr.productId)) {
          acc.push(curr);
        }
        return acc;
      }, []);

      return unique.slice(0, limit);
    } catch (error) {
      console.error('Error in hybridRecommendations:', error);
      return [];
    }
  }

  // Helper Methods
  private async updateUserPreferences(userId: string, interaction: TrackInteractionDto): Promise<void> {
    const { interactionType, metadata } = interaction;

    // Update category preference
    if (metadata?.categoryId) {
      await this.updatePreference(userId, PreferenceType.CATEGORY, metadata.categoryId, this.getInteractionWeight(interactionType));
    }

    // Update price range preference
    if (metadata?.price) {
      const priceRange = this.getPriceRange(metadata.price);
      await this.updatePreference(userId, PreferenceType.PRICE_RANGE, priceRange, this.getInteractionWeight(interactionType));
    }

    // Update brand preference
    if (metadata?.brand) {
      await this.updatePreference(userId, PreferenceType.BRAND, metadata.brand, this.getInteractionWeight(interactionType));
    }
  }

  private async updatePreference(userId: string, type: PreferenceType, value: string, weight: number): Promise<void> {
    let preference = await this.preferenceRepository.findOne({
      where: { userId, preferenceType: type, preferenceValue: value },
    });

    if (preference) {
      preference.strength = Math.min(1.0, preference.strength + weight);
      preference.updatedAt = new Date();
    } else {
      preference = this.preferenceRepository.create({
        userId,
        preferenceType: type,
        preferenceValue: value,
        strength: weight,
      });
    }

    await this.preferenceRepository.save(preference);
  }

  private getInteractionWeight(type: InteractionType): number {
    const weights = {
      [InteractionType.VIEW]: 0.1,
      [InteractionType.CLICK]: 0.2,
      [InteractionType.ADD_TO_CART]: 0.6,
      [InteractionType.PURCHASE]: 1.0,
      [InteractionType.LIKE]: 0.4,
      [InteractionType.SHARE]: 0.3,
      [InteractionType.WISHLIST_ADD]: 0.5,
    };
    return weights[type] || 0.1;
  }

  private getPriceRange(price: number): string {
    if (price < 50) return 'budget';
    if (price < 100) return 'mid';
    if (price < 500) return 'premium';
    return 'luxury';
  }

  private async findSimilarUsers(userId: string, userPrefs: UserPreference[]): Promise<{ userId: string; similarity: number }[]> {
    if (userPrefs.length === 0) return [];

    // Find users with similar preferences
    const similarUsers = await this.preferenceRepository
      .createQueryBuilder('pref')
      .select('pref.userId')
      .addSelect('SUM(pref.strength)', 'totalStrength')
      .where('pref.userId != :userId', { userId })
      .andWhere('pref.preferenceType IN (:...types)', {
        types: userPrefs.map(p => p.preferenceType)
      })
      .andWhere('pref.preferenceValue IN (:...values)', {
        values: userPrefs.map(p => p.preferenceValue)
      })
      .groupBy('pref.userId')
      .having('COUNT(pref.id) >= :minMatches', { minMatches: Math.max(1, userPrefs.length * 0.3) })
      .orderBy('totalStrength', 'DESC')
      .limit(10)
      .getRawMany();

    return similarUsers.map(u => ({ userId: u.userId, similarity: u.totalStrength }));
  }

  private async findSimilarProductsByPreferences(
    categories: string[],
    priceRange?: string,
    limit = 10,
    categoryId?: string
  ): Promise<any[]> {
    // This would integrate with your product service to find similar products
    // For now, return mock data structure
    return Array.from({ length: limit }, (_, i) => ({
      productId: `product_${i}`,
      score: Math.random(),
      reason: 'Similar to your preferences',
    }));
  }

  private async enrichProductRecommendations(products: any[], algorithm: string): Promise<any[]> {
    // This would fetch full product details from your product service
    return products.map(p => ({
      ...p,
      algorithm,
      recommendedAt: new Date(),
    }));
  }

  private async excludeViewedProducts(userId: string, recommendations: any[]): Promise<any[]> {
    const viewedProducts = await this.interactionRepository
      .createQueryBuilder('interaction')
      .select('DISTINCT(interaction.productId)', 'productId')
      .where('interaction.userId = :userId', { userId })
      .andWhere('interaction.interactionType = :type', { type: InteractionType.VIEW })
      .getRawMany();

    const viewedIds = viewedProducts.map(p => p.productId);

    return recommendations.filter(rec => !viewedIds.includes(rec.productId));
  }

  private async storeRecommendationResults(userId: string, algorithm: string, recommendations: any[]): Promise<void> {
    const results = recommendations.slice(0, 10).map((rec, index) =>
      this.recommendationRepository.create({
        userId,
        productId: rec.productId,
        algorithm,
        score: rec.score || (1 - index * 0.1), // Decreasing score by position
        position: index + 1,
        metadata: rec,
      })
    );

    await this.recommendationRepository.save(results);
  }

  // Public API Methods
  async getUserPreferences(userId: string): Promise<UserPreference[]> {
    return this.preferenceRepository.find({
      where: { userId },
      order: { strength: 'DESC' },
    });
  }

  async updateUserPreference(userId: string, dto: UpdatePreferenceDto): Promise<UserPreference> {
    await this.updatePreference(userId, dto.preferenceType, dto.preferenceValue, dto.strength);

    return this.preferenceRepository.findOne({
      where: {
        userId,
        preferenceType: dto.preferenceType,
        preferenceValue: dto.preferenceValue
      },
    });
  }

  async getRecommendationHistory(userId: string, limit = 50): Promise<Recommendation[]> {
    return this.recommendationRepository.find({
      where: { userId },
      order: { generatedAt: 'DESC' },
      take: limit,
    });
  }

  // Analytics
  async getRecommendationStats(): Promise<any> {
    const totalRecommendations = await this.recommendationRepository.count();
    const clickedRecommendations = await this.recommendationRepository.count({
      where: { wasClicked: true },
    });

    const algorithmStats = await this.recommendationRepository
      .createQueryBuilder('rec')
      .select(['rec.algorithm', 'COUNT(*) as count', 'AVG(CASE WHEN rec.wasClicked THEN 1 ELSE 0 END) as clickRate'])
      .groupBy('rec.algorithm')
      .getRawMany();

    return {
      totalRecommendations,
      clickedRecommendations,
      overallClickRate: clickedRecommendations / totalRecommendations,
      algorithmPerformance: algorithmStats,
    };
  }
}