import { api } from './api';

export interface UserInteraction {
  userId?: string; // Optional for backward compatibility, but recommended to include
  productId: string;
  interactionType: 'view' | 'click' | 'purchase' | 'cart_add' | 'cart_remove' | 'like' | 'share';
  metadata?: any;
  sessionId?: string;
}

export interface Recommendation {
  productId: string;
  score: number;
  algorithm: string;
  product?: any; // Will be populated with product details
}

export interface UserPreference {
  userId: string;
  category: string;
  strength: number;
  lastUpdated: Date;
}

export interface GenerateRecommendationsParams {
  userId: string;
  algorithm?: 'collaborative' | 'content' | 'popular' | 'hybrid';
  limit?: number;
  categoryId?: string;
  excludeViewed?: boolean;
}

class RecommendationsService {
  // Track user interactions
  async trackInteraction(interaction: UserInteraction): Promise<any> {
    try {
      const response = await api.post('/recommendations/interactions', interaction);
      return response.data;
    } catch (error) {
      console.error('Error tracking interaction:', error);
      throw error;
    }
  }

  // Track bulk interactions
  async trackBulkInteractions(userId: string, interactions: Omit<UserInteraction, 'userId'>[]): Promise<any> {
    try {
      const response = await api.post('/recommendations/interactions/bulk', {
        userId,
        interactions
      });
      return response.data;
    } catch (error) {
      console.error('Error tracking bulk interactions:', error);
      throw error;
    }
  }

  // Get user interactions
  async getUserInteractions(userId: string, limit: number = 100): Promise<UserInteraction[]> {
    try {
      const response = await api.get(`/recommendations/interactions/${userId}?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user interactions:', error);
      throw error;
    }
  }

  // Generate recommendations
  async generateRecommendations(params: GenerateRecommendationsParams): Promise<Recommendation[]> {
    try {
      const response = await api.post('/recommendations/generate', params);
      return response.data;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  // Get user recommendations via GET endpoint
  async getUserRecommendations(
    userId: string,
    algorithm?: string,
    limit: number = 10,
    categoryId?: string,
    excludeViewed: boolean = true
  ): Promise<Recommendation[]> {
    try {
      const params = new URLSearchParams();
      if (algorithm) params.append('algorithm', algorithm);
      params.append('limit', limit.toString());
      if (categoryId) params.append('categoryId', categoryId);
      params.append('excludeViewed', excludeViewed.toString());

      const response = await api.get(`/recommendations/user/${userId}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user recommendations:', error);
      throw error;
    }
  }

  // Get similar products
  async getSimilarProducts(productId: string, limit: number = 10): Promise<any[]> {
    try {
      const response = await api.get(`/recommendations/similar/${productId}?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching similar products:', error);
      throw error;
    }
  }

  // Get user preferences
  async getUserPreferences(userId: string): Promise<UserPreference[]> {
    try {
      const response = await api.get(`/recommendations/preferences/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      throw error;
    }
  }

  // Update user preference
  async updateUserPreference(userId: string, category: string, strength: number): Promise<any> {
    try {
      const response = await api.put(`/recommendations/preferences/${userId}`, {
        category,
        strength
      });
      return response.data;
    } catch (error) {
      console.error('Error updating user preference:', error);
      throw error;
    }
  }

  // Record recommendation feedback
  async recordFeedback(recommendationId: string, feedback: 'positive' | 'negative'): Promise<any> {
    try {
      const response = await api.post('/recommendations/feedback', {
        recommendationId,
        feedback
      });
      return response.data;
    } catch (error) {
      console.error('Error recording feedback:', error);
      throw error;
    }
  }

  // Get recommendation history
  async getRecommendationHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const response = await api.get(`/recommendations/history/${userId}?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recommendation history:', error);
      throw error;
    }
  }

  // Get trending products
  async getTrending(categoryId?: string, limit: number = 20): Promise<Recommendation[]> {
    try {
      const params = new URLSearchParams();
      if (categoryId) params.append('categoryId', categoryId);
      params.append('limit', limit.toString());

      const response = await api.get(`/recommendations/trending?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trending products:', error);
      throw error;
    }
  }

  // Get real-time recommendations (context-aware)
  async getRealtimeRecommendations(params: {
    userId: string;
    currentProductId?: string;
    sessionInteractions?: any[];
    context?: 'checkout' | 'browsing' | 'cart';
  }): Promise<Recommendation[]> {
    try {
      const response = await api.post('/recommendations/realtime', params);
      return response.data;
    } catch (error) {
      console.error('Error fetching realtime recommendations:', error);
      throw error;
    }
  }

  // Get cold start recommendations for new users
  async getColdStartRecommendations(
    categoryId?: string,
    demographics?: string,
    limit: number = 12
  ): Promise<Recommendation[]> {
    try {
      const params = new URLSearchParams();
      if (categoryId) params.append('categoryId', categoryId);
      if (demographics) params.append('demographics', demographics);
      params.append('limit', limit.toString());

      const response = await api.get(`/recommendations/coldstart?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching cold start recommendations:', error);
      throw error;
    }
  }

  // Export user data (GDPR compliance)
  async exportUserData(userId: string): Promise<any> {
    try {
      const response = await api.get(`/recommendations/export/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  }
}

export const recommendationsService = new RecommendationsService();