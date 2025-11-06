import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformConfig, ConfigCategory } from '../database/entities/platform-config.entity';

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);
  private configCache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute cache

  constructor(
    @InjectRepository(PlatformConfig)
    private readonly configRepo: Repository<PlatformConfig>,
  ) {}

  /**
   * Get seller commission rate (percentage)
   */
  async getSellerCommissionRate(): Promise<number> {
    const config = await this.getConfig('seller_commission_rate');
    return config.value.rate || 7; // Default 7%
  }

  /**
   * Get buyer platform fee rate (percentage)
   */
  async getBuyerPlatformFeeRate(): Promise<number> {
    const config = await this.getConfig('buyer_platform_fee_rate');
    return config.value.rate || 3; // Default 3%
  }

  /**
   * Get commission calculation trigger event
   */
  async getCommissionCalculationTrigger(): Promise<string> {
    const config = await this.getConfig('commission_calculation_trigger');
    return config.value.event || 'delivered';
  }

  /**
   * Get invoice numbering sequence
   */
  async getInvoiceNumberingSequence(): Promise<{
    prefix: string;
    current: number;
    padding: number;
  }> {
    const config = await this.getConfig('invoice_numbering_sequence');
    return {
      prefix: config.value.prefix || 'GSHOP',
      current: config.value.current || 1,
      padding: config.value.padding || 8,
    };
  }

  /**
   * Increment invoice numbering sequence
   */
  async incrementInvoiceSequence(): Promise<number> {
    const config = await this.configRepo.findOne({
      where: { key: 'invoice_numbering_sequence' },
    });

    if (!config) {
      throw new NotFoundException('Invoice numbering sequence not found');
    }

    const current = config.value.current || 1;
    config.value.current = current + 1;
    config.updatedAt = new Date();

    await this.configRepo.save(config);

    // Clear cache
    this.configCache.delete('invoice_numbering_sequence');

    return current;
  }

  /**
   * Get configuration by key with caching
   */
  async getConfig(key: string): Promise<PlatformConfig> {
    // Check cache first
    const cached = this.configCache.get(key);
    const cacheTime = this.cacheExpiry.get(key);

    if (cached && cacheTime && Date.now() < cacheTime) {
      return cached;
    }

    // Fetch from database
    const config = await this.configRepo.findOne({ where: { key } });

    if (!config) {
      throw new NotFoundException(`Configuration '${key}' not found`);
    }

    // Update cache
    this.configCache.set(key, config);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);

    return config;
  }

  /**
   * Update configuration (admin only)
   */
  async updateConfig(
    key: string,
    value: any,
    updatedBy?: string,
  ): Promise<PlatformConfig> {
    // Validate value based on key
    this.validateConfigValue(key, value);

    const config = await this.configRepo.findOne({ where: { key } });

    if (!config) {
      throw new NotFoundException(`Configuration '${key}' not found`);
    }

    const oldValue = config.value;
    config.value = value;
    config.updatedBy = updatedBy || null;
    config.updatedAt = new Date();

    const updated = await this.configRepo.save(config);

    // Clear cache
    this.configCache.delete(key);
    this.cacheExpiry.delete(key);

    // Log the change
    this.logger.log(
      `Config updated: ${key} | Old: ${JSON.stringify(oldValue)} | New: ${JSON.stringify(value)} | By: ${updatedBy || 'system'}`,
    );

    return updated;
  }

  /**
   * Get all configurations by category
   */
  async getConfigsByCategory(category: ConfigCategory): Promise<PlatformConfig[]> {
    return this.configRepo.find({ where: { category } });
  }

  /**
   * Get all configurations
   */
  async getAllConfigs(): Promise<PlatformConfig[]> {
    return this.configRepo.find();
  }

  /**
   * Create new configuration
   */
  async createConfig(
    key: string,
    value: any,
    description: string,
    category: ConfigCategory,
    createdBy?: string,
  ): Promise<PlatformConfig> {
    // Check if already exists
    const existing = await this.configRepo.findOne({ where: { key } });
    if (existing) {
      throw new BadRequestException(`Configuration '${key}' already exists`);
    }

    const config = this.configRepo.create({
      key,
      value,
      description,
      category,
      updatedBy: createdBy || null,
    });

    return this.configRepo.save(config);
  }

  /**
   * Delete configuration
   */
  async deleteConfig(key: string): Promise<void> {
    const config = await this.configRepo.findOne({ where: { key } });

    if (!config) {
      throw new NotFoundException(`Configuration '${key}' not found`);
    }

    await this.configRepo.remove(config);

    // Clear cache
    this.configCache.delete(key);
    this.cacheExpiry.delete(key);

    this.logger.log(`Config deleted: ${key}`);
  }

  /**
   * Validate configuration values
   */
  private validateConfigValue(key: string, value: any): void {
    switch (key) {
      case 'seller_commission_rate':
      case 'buyer_platform_fee_rate':
        if (!value.rate || typeof value.rate !== 'number') {
          throw new BadRequestException('Rate must be a number');
        }
        if (value.rate < 0 || value.rate > 50) {
          throw new BadRequestException('Rate must be between 0 and 50');
        }
        break;

      case 'invoice_numbering_sequence':
        if (!value.prefix || typeof value.prefix !== 'string') {
          throw new BadRequestException('Prefix must be a string');
        }
        if (!value.current || typeof value.current !== 'number') {
          throw new BadRequestException('Current must be a number');
        }
        if (!value.padding || typeof value.padding !== 'number') {
          throw new BadRequestException('Padding must be a number');
        }
        break;

      default:
        // Generic validation
        if (!value || typeof value !== 'object') {
          throw new BadRequestException('Value must be an object');
        }
    }
  }

  /**
   * Clear configuration cache
   */
  clearCache(key?: string): void {
    if (key) {
      this.configCache.delete(key);
      this.cacheExpiry.delete(key);
    } else {
      this.configCache.clear();
      this.cacheExpiry.clear();
    }
    this.logger.log(`Cache cleared for: ${key || 'all configs'}`);
  }
}
