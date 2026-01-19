/**
 * Support Service
 *
 * Handles support tickets and FAQs from the backend.
 */

import { apiClient } from './api';

export type TicketCategory =
  | 'order'
  | 'payment'
  | 'shipping'
  | 'return'
  | 'product'
  | 'account'
  | 'technical'
  | 'other';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SupportTicket {
  id: string;
  userId?: string;
  subject: string;
  message: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  email?: string;
  orderId?: string;
  adminResponse?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  isActive: boolean;
  order: number;
  viewCount: number;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketDto {
  subject: string;
  message: string;
  category?: TicketCategory;
  email?: string;
  orderId?: string;
}

export interface GetTicketsOptions {
  status?: TicketStatus;
  limit?: number;
  offset?: number;
}

export interface TicketsResponse {
  tickets: SupportTicket[];
  total: number;
}

class SupportService {
  private baseUrl = '/support';

  /**
   * Get all active FAQs
   */
  async getFAQs(category?: string): Promise<FAQ[]> {
    try {
      const url = category
        ? `${this.baseUrl}/faqs?category=${encodeURIComponent(category)}`
        : `${this.baseUrl}/faqs`;

      const response = await apiClient.get<FAQ[]>(url);
      return response.data;
    } catch (error) {
      console.error('[Support] Failed to get FAQs:', error);
      throw error;
    }
  }

  /**
   * Get FAQ categories
   */
  async getFAQCategories(): Promise<string[]> {
    try {
      const response = await apiClient.get<string[]>(`${this.baseUrl}/faqs/categories`);
      return response.data;
    } catch (error) {
      console.error('[Support] Failed to get FAQ categories:', error);
      throw error;
    }
  }

  /**
   * Mark a FAQ as helpful
   */
  async markFAQHelpful(id: string): Promise<FAQ> {
    try {
      const response = await apiClient.post<FAQ>(`${this.baseUrl}/faqs/${id}/helpful`);
      return response.data;
    } catch (error) {
      console.error('[Support] Failed to mark FAQ as helpful:', error);
      throw error;
    }
  }

  /**
   * Increment FAQ view count
   */
  async incrementFAQView(id: string): Promise<void> {
    try {
      await apiClient.post<{ success: boolean }>(`${this.baseUrl}/faqs/${id}/view`);
    } catch (error) {
      console.error('[Support] Failed to increment FAQ view:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Create a support ticket (authenticated user)
   */
  async createTicket(dto: CreateTicketDto): Promise<SupportTicket> {
    try {
      const response = await apiClient.post<SupportTicket>(`${this.baseUrl}/tickets`, dto);
      return response.data;
    } catch (error) {
      console.error('[Support] Failed to create ticket:', error);
      throw error;
    }
  }

  /**
   * Create a support ticket as guest
   */
  async createGuestTicket(dto: CreateTicketDto): Promise<SupportTicket> {
    try {
      if (!dto.email) {
        throw new Error('Email is required for guest tickets');
      }
      const response = await apiClient.post<SupportTicket>(`${this.baseUrl}/tickets/guest`, dto);
      return response.data;
    } catch (error) {
      console.error('[Support] Failed to create guest ticket:', error);
      throw error;
    }
  }

  /**
   * Get user's tickets
   */
  async getUserTickets(options?: GetTicketsOptions): Promise<TicketsResponse> {
    try {
      const params = new URLSearchParams();

      if (options?.status) {
        params.append('status', options.status);
      }
      if (options?.limit) {
        params.append('limit', options.limit.toString());
      }
      if (options?.offset) {
        params.append('offset', options.offset.toString());
      }

      const url = params.toString()
        ? `${this.baseUrl}/tickets?${params.toString()}`
        : `${this.baseUrl}/tickets`;

      const response = await apiClient.get<TicketsResponse>(url);
      return response.data;
    } catch (error) {
      console.error('[Support] Failed to get user tickets:', error);
      throw error;
    }
  }

  /**
   * Get a single ticket
   */
  async getTicket(id: string): Promise<SupportTicket> {
    try {
      const response = await apiClient.get<SupportTicket>(`${this.baseUrl}/tickets/${id}`);
      return response.data;
    } catch (error) {
      console.error('[Support] Failed to get ticket:', error);
      throw error;
    }
  }
}

export const supportService = new SupportService();
export default supportService;
