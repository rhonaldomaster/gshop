import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from './config.service';
import { PlatformConfig } from '../database/entities/platform-config.entity';
import { BadRequestException } from '@nestjs/common';

describe('ConfigService', () => {
  let service: ConfigService;
  let repository: Repository<PlatformConfig>;

  const mockConfigRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        {
          provide: getRepositoryToken(PlatformConfig),
          useValue: mockConfigRepository,
        },
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
    repository = module.get<Repository<PlatformConfig>>(
      getRepositoryToken(PlatformConfig),
    );

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSellerCommissionRate', () => {
    it('should return seller commission rate', async () => {
      const mockConfig = {
        id: '1',
        key: 'seller_commission_rate',
        value: { rate: 7, type: 'percentage' },
        category: 'commission',
        description: 'Seller commission rate',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockConfigRepository.findOne.mockResolvedValue(mockConfig);

      const result = await service.getSellerCommissionRate();

      expect(result).toBe(7);
      expect(mockConfigRepository.findOne).toHaveBeenCalledWith({
        where: { key: 'seller_commission_rate' },
      });
    });

    it('should return default rate if not found', async () => {
      mockConfigRepository.findOne.mockResolvedValue(null);

      const result = await service.getSellerCommissionRate();

      expect(result).toBe(7); // Default value
    });

    it('should use cache on subsequent calls', async () => {
      const mockConfig = {
        id: '1',
        key: 'seller_commission_rate',
        value: { rate: 7, type: 'percentage' },
        category: 'commission',
        description: 'Seller commission rate',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockConfigRepository.findOne.mockResolvedValue(mockConfig);

      // First call
      await service.getSellerCommissionRate();
      // Second call (should use cache)
      await service.getSellerCommissionRate();

      // Should only call repository once due to cache
      expect(mockConfigRepository.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('getBuyerPlatformFeeRate', () => {
    it('should return buyer platform fee rate', async () => {
      const mockConfig = {
        id: '2',
        key: 'buyer_platform_fee_rate',
        value: { rate: 3, type: 'percentage' },
        category: 'fee',
        description: 'Buyer platform fee rate',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockConfigRepository.findOne.mockResolvedValue(mockConfig);

      const result = await service.getBuyerPlatformFeeRate();

      expect(result).toBe(3);
      expect(mockConfigRepository.findOne).toHaveBeenCalledWith({
        where: { key: 'buyer_platform_fee_rate' },
      });
    });

    it('should return default rate if not found', async () => {
      mockConfigRepository.findOne.mockResolvedValue(null);

      const result = await service.getBuyerPlatformFeeRate();

      expect(result).toBe(3); // Default value
    });
  });

  describe('updateConfig', () => {
    it('should update config value successfully', async () => {
      const mockConfig = {
        id: '1',
        key: 'seller_commission_rate',
        value: { rate: 7, type: 'percentage' },
        category: 'commission',
        description: 'Seller commission rate',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedConfig = {
        ...mockConfig,
        value: { rate: 8, type: 'percentage' },
        updatedAt: new Date(),
      };

      mockConfigRepository.findOne.mockResolvedValue(mockConfig);
      mockConfigRepository.save.mockResolvedValue(updatedConfig);

      const result = await service.updateConfig(
        'seller_commission_rate',
        { rate: 8, type: 'percentage' },
        'admin-user-id',
      );

      expect(result.value.rate).toBe(8);
      expect(mockConfigRepository.save).toHaveBeenCalled();
    });

    it('should throw error if config not found', async () => {
      mockConfigRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateConfig('non_existent_key', { rate: 5 }, 'admin-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate rate is between 0 and 50', async () => {
      const mockConfig = {
        id: '1',
        key: 'seller_commission_rate',
        value: { rate: 7, type: 'percentage' },
        category: 'commission',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockConfigRepository.findOne.mockResolvedValue(mockConfig);

      // Test rate > 50
      await expect(
        service.updateConfig(
          'seller_commission_rate',
          { rate: 51, type: 'percentage' },
          'admin-id',
        ),
      ).rejects.toThrow(BadRequestException);

      // Test rate < 0
      await expect(
        service.updateConfig(
          'seller_commission_rate',
          { rate: -1, type: 'percentage' },
          'admin-id',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should clear cache after update', async () => {
      const mockConfig = {
        id: '1',
        key: 'seller_commission_rate',
        value: { rate: 7, type: 'percentage' },
        category: 'commission',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockConfigRepository.findOne.mockResolvedValue(mockConfig);
      mockConfigRepository.save.mockResolvedValue({
        ...mockConfig,
        value: { rate: 8, type: 'percentage' },
      });

      // Update config (should clear cache)
      await service.updateConfig(
        'seller_commission_rate',
        { rate: 8, type: 'percentage' },
        'admin-id',
      );

      // Get config again (should fetch from DB, not cache)
      await service.getSellerCommissionRate();

      // Should be called twice (once for update, once for get)
      expect(mockConfigRepository.findOne).toHaveBeenCalledTimes(2);
    });
  });

  describe('getAllConfigs', () => {
    it('should return all configs', async () => {
      const mockConfigs = [
        {
          id: '1',
          key: 'seller_commission_rate',
          value: { rate: 7 },
          category: 'commission',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          key: 'buyer_platform_fee_rate',
          value: { rate: 3 },
          category: 'fee',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockConfigRepository.find.mockResolvedValue(mockConfigs);

      const result = await service.getAllConfigs();

      expect(result).toHaveLength(2);
      expect(result[0].key).toBe('seller_commission_rate');
    });
  });
});
