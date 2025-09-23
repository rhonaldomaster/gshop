import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Audience, AudienceUser, AudienceType, PixelEvent } from './audience.entity';
import { CreateAudienceDto, UpdateAudienceDto } from './dto';
import { PixelEvent as PixelEventEntity } from '../pixel/pixel.entity';

@Injectable()
export class AudiencesService {
  constructor(
    @InjectRepository(Audience)
    private audienceRepository: Repository<Audience>,
    @InjectRepository(AudienceUser)
    private audienceUserRepository: Repository<AudienceUser>,
    @InjectRepository(PixelEventEntity)
    private pixelEventRepository: Repository<PixelEventEntity>,
  ) {}

  async createAudience(sellerId: string, createAudienceDto: CreateAudienceDto): Promise<Audience> {
    const audience = this.audienceRepository.create({
      ...createAudienceDto,
      sellerId,
    });

    const savedAudience = await this.audienceRepository.save(audience);

    // Build audience based on rules
    await this.buildAudience(savedAudience.id);

    return savedAudience;
  }

  async findAudiencesBySeller(sellerId: string): Promise<Audience[]> {
    return this.audienceRepository.find({
      where: { sellerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAudienceById(id: string, sellerId: string): Promise<Audience> {
    const audience = await this.audienceRepository.findOne({
      where: { id, sellerId },
    });

    if (!audience) {
      throw new NotFoundException('Audience not found');
    }

    return audience;
  }

  async updateAudience(id: string, sellerId: string, updateAudienceDto: UpdateAudienceDto): Promise<Audience> {
    const audience = await this.findAudienceById(id, sellerId);

    Object.assign(audience, updateAudienceDto);
    const updatedAudience = await this.audienceRepository.save(audience);

    // Rebuild audience if rules changed
    if (updateAudienceDto.rules) {
      await this.buildAudience(id);
    }

    return updatedAudience;
  }

  async deleteAudience(id: string, sellerId: string): Promise<void> {
    const audience = await this.findAudienceById(id, sellerId);

    // Remove all audience users first
    await this.audienceUserRepository.delete({ audienceId: id });

    await this.audienceRepository.remove(audience);
  }

  async buildAudience(audienceId: string): Promise<void> {
    const audience = await this.audienceRepository.findOne({
      where: { id: audienceId },
    });

    if (!audience) {
      throw new NotFoundException('Audience not found');
    }

    // Clear existing audience users
    await this.audienceUserRepository.delete({ audienceId });

    let userIds: string[] = [];

    switch (audience.type) {
      case AudienceType.PIXEL_BASED:
        userIds = await this.buildPixelBasedAudience(audience.rules);
        break;
      case AudienceType.CUSTOMER_LIST:
        userIds = await this.buildCustomerListAudience(audience.rules);
        break;
      case AudienceType.LOOKALIKE:
        userIds = await this.buildLookalikeAudience(audience.rules);
        break;
      default:
        userIds = [];
    }

    // Add users to audience
    if (userIds.length > 0) {
      const audienceUsers = userIds.map(userId => ({
        audienceId,
        userId,
      }));

      await this.audienceUserRepository.save(audienceUsers);
    }

    // Update audience size
    audience.size = userIds.length;
    await this.audienceRepository.save(audience);
  }

  private async buildPixelBasedAudience(rules: any): Promise<string[]> {
    const { events, timeframe, conditions } = rules;

    const query = this.pixelEventRepository.createQueryBuilder('event');

    // Add event type filter
    if (events && events.length > 0) {
      query.andWhere('event.eventType IN (:...events)', { events });
    }

    // Add timeframe filter
    if (timeframe) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframe);
      query.andWhere('event.timestamp >= :startDate', { startDate });
    }

    // Add conditions
    if (conditions) {
      if (conditions.productViewed) {
        query.andWhere('event.eventType = :eventType', { eventType: 'product_view' });
        query.andWhere('JSON_EXTRACT(event.eventData, "$.productId") = :productId', {
          productId: conditions.productViewed
        });
      }

      if (conditions.minCartValue) {
        query.andWhere('event.eventType = :eventType', { eventType: 'add_to_cart' });
        query.andWhere('JSON_EXTRACT(event.eventData, "$.value") >= :minValue', {
          minValue: conditions.minCartValue
        });
      }

      if (conditions.purchaseCompleted === false) {
        // Users who haven't completed purchase
        const purchaseUserIds = await this.pixelEventRepository
          .createQueryBuilder('event')
          .select('DISTINCT event.userId')
          .where('event.eventType = :eventType', { eventType: 'purchase' })
          .getRawMany()
          .then(results => results.map(r => r.userId));

        if (purchaseUserIds.length > 0) {
          query.andWhere('event.userId NOT IN (:...purchaseUserIds)', { purchaseUserIds });
        }
      }
    }

    const events_result = await query.select('DISTINCT event.userId').getRawMany();
    return events_result.map(row => row.userId).filter(Boolean);
  }

  private async buildCustomerListAudience(rules: any): Promise<string[]> {
    const { userIds } = rules;
    return userIds || [];
  }

  private async buildLookalikeAudience(rules: any): Promise<string[]> {
    // Simplified lookalike - would need ML implementation
    const { sourceAudienceId, similarity } = rules;

    if (!sourceAudienceId) {
      return [];
    }

    const sourceUsers = await this.audienceUserRepository.find({
      where: { audienceId: sourceAudienceId },
    });

    // For now, return a subset of similar users (placeholder)
    return sourceUsers.slice(0, Math.floor(sourceUsers.length * (similarity || 0.1)))
      .map(user => user.userId);
  }

  async getAudienceUsers(audienceId: string, sellerId: string): Promise<AudienceUser[]> {
    const audience = await this.findAudienceById(audienceId, sellerId);

    return this.audienceUserRepository.find({
      where: { audienceId },
      relations: ['audience'],
    });
  }

  async addUserToAudience(audienceId: string, userId: string, metadata?: any): Promise<void> {
    const existing = await this.audienceUserRepository.findOne({
      where: { audienceId, userId },
    });

    if (!existing) {
      await this.audienceUserRepository.save({
        audienceId,
        userId,
        metadata,
      });

      // Update audience size
      const audience = await this.audienceRepository.findOne({
        where: { id: audienceId },
      });

      if (audience) {
        audience.size += 1;
        await this.audienceRepository.save(audience);
      }
    }
  }

  async removeUserFromAudience(audienceId: string, userId: string): Promise<void> {
    const deleted = await this.audienceUserRepository.delete({
      audienceId,
      userId,
    });

    if (deleted.affected && deleted.affected > 0) {
      // Update audience size
      const audience = await this.audienceRepository.findOne({
        where: { id: audienceId },
      });

      if (audience) {
        audience.size = Math.max(0, audience.size - 1);
        await this.audienceRepository.save(audience);
      }
    }
  }
}