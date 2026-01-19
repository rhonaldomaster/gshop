import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SupportTicket,
  FAQ,
  TicketStatus,
  TicketPriority,
  TicketCategory,
} from './support.entity';

export interface CreateTicketDto {
  subject: string;
  message: string;
  category?: TicketCategory;
  email?: string;
  orderId?: string;
}

export interface UpdateTicketDto {
  status?: TicketStatus;
  priority?: TicketPriority;
  adminResponse?: string;
  assignedToId?: string;
}

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private readonly ticketRepository: Repository<SupportTicket>,
    @InjectRepository(FAQ)
    private readonly faqRepository: Repository<FAQ>,
  ) {}

  // ==================== TICKETS ====================

  /**
   * Create a new support ticket
   */
  async createTicket(
    userId: string | null,
    dto: CreateTicketDto,
  ): Promise<SupportTicket> {
    const ticket = this.ticketRepository.create({
      userId,
      subject: dto.subject,
      message: dto.message,
      category: dto.category || TicketCategory.OTHER,
      email: dto.email,
      orderId: dto.orderId,
      status: TicketStatus.OPEN,
      priority: TicketPriority.MEDIUM,
    });

    return this.ticketRepository.save(ticket);
  }

  /**
   * Get tickets for a user
   */
  async getUserTickets(
    userId: string,
    options?: {
      status?: TicketStatus;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ tickets: SupportTicket[]; total: number }> {
    const queryBuilder = this.ticketRepository
      .createQueryBuilder('ticket')
      .where('ticket.userId = :userId', { userId })
      .orderBy('ticket.createdAt', 'DESC');

    if (options?.status) {
      queryBuilder.andWhere('ticket.status = :status', { status: options.status });
    }

    const total = await queryBuilder.getCount();

    if (options?.limit) {
      queryBuilder.take(options.limit);
    }

    if (options?.offset) {
      queryBuilder.skip(options.offset);
    }

    const tickets = await queryBuilder.getMany();

    return { tickets, total };
  }

  /**
   * Get a single ticket
   */
  async getTicket(id: string, userId?: string): Promise<SupportTicket> {
    const whereCondition: any = { id };
    if (userId) {
      whereCondition.userId = userId;
    }

    const ticket = await this.ticketRepository.findOne({
      where: whereCondition,
      relations: ['user'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  /**
   * Update a ticket (admin)
   */
  async updateTicket(id: string, dto: UpdateTicketDto): Promise<SupportTicket> {
    const ticket = await this.getTicket(id);

    if (dto.status) {
      ticket.status = dto.status;
      if (dto.status === TicketStatus.RESOLVED) {
        ticket.resolvedAt = new Date();
      }
    }

    if (dto.priority) {
      ticket.priority = dto.priority;
    }

    if (dto.adminResponse !== undefined) {
      ticket.adminResponse = dto.adminResponse;
    }

    if (dto.assignedToId !== undefined) {
      ticket.assignedToId = dto.assignedToId;
    }

    return this.ticketRepository.save(ticket);
  }

  /**
   * Get all tickets (admin)
   */
  async getAllTickets(options?: {
    status?: TicketStatus;
    category?: TicketCategory;
    priority?: TicketPriority;
    limit?: number;
    offset?: number;
  }): Promise<{ tickets: SupportTicket[]; total: number }> {
    const queryBuilder = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.user', 'user')
      .orderBy('ticket.createdAt', 'DESC');

    if (options?.status) {
      queryBuilder.andWhere('ticket.status = :status', { status: options.status });
    }

    if (options?.category) {
      queryBuilder.andWhere('ticket.category = :category', {
        category: options.category,
      });
    }

    if (options?.priority) {
      queryBuilder.andWhere('ticket.priority = :priority', {
        priority: options.priority,
      });
    }

    const total = await queryBuilder.getCount();

    if (options?.limit) {
      queryBuilder.take(options.limit);
    }

    if (options?.offset) {
      queryBuilder.skip(options.offset);
    }

    const tickets = await queryBuilder.getMany();

    return { tickets, total };
  }

  // ==================== FAQs ====================

  /**
   * Get all active FAQs
   */
  async getFAQs(category?: string): Promise<FAQ[]> {
    const queryBuilder = this.faqRepository
      .createQueryBuilder('faq')
      .where('faq.isActive = :isActive', { isActive: true })
      .orderBy('faq.order', 'ASC')
      .addOrderBy('faq.createdAt', 'ASC');

    if (category) {
      queryBuilder.andWhere('faq.category = :category', { category });
    }

    return queryBuilder.getMany();
  }

  /**
   * Get FAQ categories
   */
  async getFAQCategories(): Promise<string[]> {
    const result = await this.faqRepository
      .createQueryBuilder('faq')
      .select('DISTINCT faq.category', 'category')
      .where('faq.isActive = :isActive', { isActive: true })
      .andWhere('faq.category IS NOT NULL')
      .getRawMany();

    return result.map((r) => r.category);
  }

  /**
   * Mark FAQ as helpful
   */
  async markFAQHelpful(id: string): Promise<FAQ> {
    const faq = await this.faqRepository.findOne({ where: { id } });

    if (!faq) {
      throw new NotFoundException('FAQ not found');
    }

    faq.helpfulCount += 1;
    return this.faqRepository.save(faq);
  }

  /**
   * Increment FAQ view count
   */
  async incrementFAQView(id: string): Promise<void> {
    await this.faqRepository.increment({ id }, 'viewCount', 1);
  }

  /**
   * Create FAQ (admin)
   */
  async createFAQ(dto: {
    question: string;
    answer: string;
    category?: string;
    order?: number;
  }): Promise<FAQ> {
    const faq = this.faqRepository.create({
      question: dto.question,
      answer: dto.answer,
      category: dto.category,
      order: dto.order || 0,
      isActive: true,
    });

    return this.faqRepository.save(faq);
  }

  /**
   * Update FAQ (admin)
   */
  async updateFAQ(
    id: string,
    dto: {
      question?: string;
      answer?: string;
      category?: string;
      order?: number;
      isActive?: boolean;
    },
  ): Promise<FAQ> {
    const faq = await this.faqRepository.findOne({ where: { id } });

    if (!faq) {
      throw new NotFoundException('FAQ not found');
    }

    Object.assign(faq, dto);
    return this.faqRepository.save(faq);
  }

  /**
   * Delete FAQ (admin)
   */
  async deleteFAQ(id: string): Promise<void> {
    const faq = await this.faqRepository.findOne({ where: { id } });

    if (!faq) {
      throw new NotFoundException('FAQ not found');
    }

    await this.faqRepository.remove(faq);
  }

  /**
   * Seed default FAQs
   */
  async seedDefaultFAQs(): Promise<void> {
    const existingCount = await this.faqRepository.count();

    if (existingCount > 0) {
      return;
    }

    const defaultFAQs = [
      {
        question: 'How do I track my order?',
        answer:
          'You can track your order by going to "My Orders" in your profile. Click on any order to see its current status and tracking information. You will also receive email updates as your order progresses.',
        category: 'Orders',
        order: 1,
      },
      {
        question: 'What is your return policy?',
        answer:
          'We accept returns within 30 days of delivery for most items. Products must be unused and in their original packaging. To initiate a return, go to "My Orders", select the order, and click "Request Return".',
        category: 'Returns',
        order: 2,
      },
      {
        question: 'How long does shipping take?',
        answer:
          'Standard shipping takes 5-7 business days. Express shipping takes 2-3 business days. Same-day delivery is available in select areas. Shipping times may vary based on your location and the seller.',
        category: 'Shipping',
        order: 3,
      },
      {
        question: 'What payment methods do you accept?',
        answer:
          'We accept credit cards (Visa, Mastercard, American Express), debit cards, MercadoPago, bank transfers, and digital wallets. All payments are processed securely.',
        category: 'Payments',
        order: 4,
      },
      {
        question: 'How do I change my shipping address?',
        answer:
          'You can manage your addresses in "Profile" > "Addresses". You can add, edit, or delete addresses anytime. Note that you cannot change the address of an order that has already been shipped.',
        category: 'Account',
        order: 5,
      },
      {
        question: 'How do I contact a seller?',
        answer:
          'You can contact sellers through the product page by clicking "Contact Seller" or through your order details. Sellers typically respond within 24-48 hours.',
        category: 'Sellers',
        order: 6,
      },
      {
        question: 'How do I cancel an order?',
        answer:
          'You can cancel an order before it ships by going to "My Orders" and clicking "Cancel Order". If the order has already shipped, you will need to wait for delivery and then request a return.',
        category: 'Orders',
        order: 7,
      },
      {
        question: 'How do refunds work?',
        answer:
          'Refunds are processed within 5-10 business days after we receive your returned item. The refund will be credited to your original payment method. You will receive an email confirmation when your refund is processed.',
        category: 'Returns',
        order: 8,
      },
    ];

    for (const faqData of defaultFAQs) {
      await this.createFAQ(faqData);
    }
  }
}
