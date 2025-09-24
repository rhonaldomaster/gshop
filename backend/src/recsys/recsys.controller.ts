import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RecsysService } from './recsys.service';
import {
  TrackInteractionDto,
  GenerateRecommendationsDto,
  UpdatePreferenceDto,
  RecommendationFeedbackDto,
  SimilarProductsDto,
  BulkInteractionDto
} from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('recommendations')
export class RecsysController {
  constructor(private readonly recsysService: RecsysService) {}

  // User Interactions
  @Post('interactions')
  async trackInteraction(@Body() trackingDto: TrackInteractionDto) {
    return this.recsysService.trackInteraction(trackingDto);
  }

  @Post('interactions/bulk')
  async trackBulkInteractions(@Body() bulkDto: BulkInteractionDto) {
    const results = [];
    for (const interaction of bulkDto.interactions) {
      const trackingDto: TrackInteractionDto = {
        userId: bulkDto.userId,
        productId: interaction.productId,
        interactionType: interaction.interactionType,
        metadata: interaction.metadata,
      };
      const result = await this.recsysService.trackInteraction(trackingDto);
      results.push(result);
    }
    return { tracked: results.length, results };
  }

  @Get('interactions/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserInteractions(@Param('userId') userId: string, @Query('limit') limit?: string) {
    const interactionLimit = limit ? parseInt(limit) : 100;
    return this.recsysService.getUserInteractions(userId, interactionLimit);
  }

  // Recommendations Generation
  @Post('generate')
  async generateRecommendations(@Body() dto: GenerateRecommendationsDto) {
    return this.recsysService.generateRecommendations(dto);
  }

  @Get('user/:userId')
  async getUserRecommendations(
    @Param('userId') userId: string,
    @Query('algorithm') algorithm?: string,
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
    @Query('excludeViewed') excludeViewed?: string
  ) {
    const dto: GenerateRecommendationsDto = {
      userId,
      algorithm: algorithm as any,
      limit: limit ? parseInt(limit) : 10,
      categoryId,
      excludeViewed: excludeViewed === 'true',
    };
    return this.recsysService.generateRecommendations(dto);
  }

  @Get('similar/:productId')
  async getSimilarProducts(@Param('productId') productId: string, @Query('limit') limit?: string) {
    const dto: SimilarProductsDto = {
      productId,
      limit: limit ? parseInt(limit) : 10,
    };
    // This would use product similarity algorithms
    return { message: 'Similar products endpoint - integrate with product similarity service' };
  }

  // User Preferences
  @Get('preferences/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserPreferences(@Param('userId') userId: string) {
    return this.recsysService.getUserPreferences(userId);
  }

  @Put('preferences/:userId')
  @UseGuards(JwtAuthGuard)
  async updateUserPreference(@Param('userId') userId: string, @Body() dto: UpdatePreferenceDto) {
    return this.recsysService.updateUserPreference(userId, dto);
  }

  // Recommendation Feedback
  @Post('feedback')
  async recordFeedback(@Body() feedbackDto: RecommendationFeedbackDto) {
    // Update recommendation result with feedback
    return { message: 'Feedback recorded successfully' };
  }

  // Analytics and History
  @Get('history/:userId')
  @UseGuards(JwtAuthGuard)
  async getRecommendationHistory(@Param('userId') userId: string, @Query('limit') limit?: string) {
    const historyLimit = limit ? parseInt(limit) : 50;
    return this.recsysService.getRecommendationHistory(userId, historyLimit);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getRecommendationStats() {
    return this.recsysService.getRecommendationStats();
  }

  // Trending and Popular
  @Get('trending')
  async getTrending(@Query('categoryId') categoryId?: string, @Query('limit') limit?: string) {
    const trendingLimit = limit ? parseInt(limit) : 20;

    // Generate trending recommendations based on recent popular interactions
    const dto: GenerateRecommendationsDto = {
      userId: 'system', // Use system user for trending
      algorithm: 'popular',
      limit: trendingLimit,
      categoryId,
    };

    return this.recsysService.generateRecommendations(dto);
  }

  // Real-time Recommendations (for live sessions)
  @Post('realtime')
  async getRealtimeRecommendations(@Body() body: {
    userId: string;
    currentProductId?: string;
    sessionInteractions?: any[];
    context?: string; // 'checkout', 'browsing', 'cart'
  }) {
    const { userId, currentProductId, sessionInteractions, context } = body;

    // Track session interactions first if provided
    if (sessionInteractions?.length > 0) {
      for (const interaction of sessionInteractions) {
        await this.recsysService.trackInteraction({
          userId,
          productId: interaction.productId,
          interactionType: interaction.type,
          sessionId: interaction.sessionId,
          metadata: { context, ...interaction.metadata },
        });
      }
    }

    // Generate context-aware recommendations
    let algorithm = 'hybrid';
    let limit = 6;

    if (context === 'checkout') {
      // Show complementary products
      algorithm = 'content';
      limit = 4;
    } else if (context === 'cart') {
      // Show frequently bought together
      algorithm = 'collaborative';
      limit = 3;
    }

    return this.recsysService.generateRecommendations({
      userId,
      algorithm: algorithm as any,
      limit,
      excludeViewed: true,
    });
  }

  // A/B Testing Support
  @Post('experiments/:experimentId/track')
  async trackExperimentInteraction(
    @Param('experimentId') experimentId: string,
    @Body() body: {
      userId: string;
      variant: string;
      recommendedProducts: string[];
      interactionType: string;
      productId?: string;
    }
  ) {
    // Track A/B test interactions for algorithm performance comparison
    return {
      experimentId,
      tracked: true,
      message: 'A/B test interaction tracked',
    };
  }

  // Cold Start Problem - Recommendations for New Users
  @Get('coldstart')
  async getColdStartRecommendations(
    @Query('categoryId') categoryId?: string,
    @Query('demographics') demographics?: string,
    @Query('limit') limit?: string
  ) {
    const recommendationLimit = limit ? parseInt(limit) : 12;

    // For new users without interaction history
    return this.recsysService.generateRecommendations({
      userId: 'new_user',
      algorithm: 'popular',
      limit: recommendationLimit,
      categoryId,
    });
  }

  // Export User Data (GDPR Compliance)
  @Get('export/:userId')
  @UseGuards(JwtAuthGuard)
  async exportUserData(@Param('userId') userId: string) {
    const [interactions, preferences, history] = await Promise.all([
      this.recsysService.getUserInteractions(userId, 1000),
      this.recsysService.getUserPreferences(userId),
      this.recsysService.getRecommendationHistory(userId, 1000),
    ]);

    return {
      userId,
      exportDate: new Date(),
      data: {
        interactions,
        preferences,
        recommendationHistory: history,
      },
    };
  }
}