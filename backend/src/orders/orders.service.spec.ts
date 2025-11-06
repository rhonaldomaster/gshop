import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from '../database/entities/order.entity';
import { ConfigService } from '../config/config.service';
import { BadRequestException } from '@nestjs/common';

describe('OrdersService - Commission Calculation', () => {
  let service: OrdersService;
  let orderRepository: Repository<Order>;
  let configService: ConfigService;
  let eventEmitter: EventEmitter2;

  const mockOrderRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockConfigService = {
    getSellerCommissionRate: jest.fn(),
    getBuyerPlatformFeeRate: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    orderRepository = module.get<Repository<Order>>(getRepositoryToken(Order));
    configService = module.get<ConfigService>(ConfigService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrder - Platform Fee Calculation', () => {
    it('should calculate platform fee correctly', async () => {
      const mockOrder = {
        items: [
          { productId: 'prod-1', quantity: 1, price: 100000 },
        ],
        shippingAddress: {},
        discount: 0,
        shippingCost: 5000,
      };

      mockConfigService.getSellerCommissionRate.mockResolvedValue(7);
      mockConfigService.getBuyerPlatformFeeRate.mockResolvedValue(3);

      mockOrderRepository.create.mockImplementation((data) => data);
      mockOrderRepository.save.mockImplementation((order) => ({
        ...order,
        id: 'order-123',
      }));

      const result = await service.create(mockOrder as any, 'user-123');

      // Subtotal = 100,000
      // Platform fee = 100,000 * 3% = 3,000
      // Total = 100,000 + 5,000 + 3,000 = 108,000
      expect(result.platformFeeRate).toBe(3);
      expect(result.platformFeeAmount).toBe(3000);
      expect(result.sellerCommissionRate).toBe(7);
      expect(result.totalAmount).toBe(108000);
    });

    it('should apply platform fee after discount', async () => {
      const mockOrder = {
        items: [
          { productId: 'prod-1', quantity: 1, price: 100000 },
        ],
        shippingAddress: {},
        discount: 10000,
        shippingCost: 5000,
      };

      mockConfigService.getSellerCommissionRate.mockResolvedValue(7);
      mockConfigService.getBuyerPlatformFeeRate.mockResolvedValue(3);

      mockOrderRepository.create.mockImplementation((data) => data);
      mockOrderRepository.save.mockImplementation((order) => ({
        ...order,
        id: 'order-123',
      }));

      const result = await service.create(mockOrder as any, 'user-123');

      // Subtotal = 100,000 - 10,000 = 90,000
      // Platform fee = 90,000 * 3% = 2,700
      // Total = 90,000 + 5,000 + 2,700 = 97,700
      expect(result.platformFeeAmount).toBe(2700);
      expect(result.totalAmount).toBe(97700);
    });

    it('should handle zero platform fee rate', async () => {
      const mockOrder = {
        items: [
          { productId: 'prod-1', quantity: 1, price: 100000 },
        ],
        shippingAddress: {},
        discount: 0,
        shippingCost: 5000,
      };

      mockConfigService.getSellerCommissionRate.mockResolvedValue(7);
      mockConfigService.getBuyerPlatformFeeRate.mockResolvedValue(0);

      mockOrderRepository.create.mockImplementation((data) => data);
      mockOrderRepository.save.mockImplementation((order) => ({
        ...order,
        id: 'order-123',
      }));

      const result = await service.create(mockOrder as any, 'user-123');

      expect(result.platformFeeAmount).toBe(0);
      expect(result.totalAmount).toBe(105000); // 100k + 5k shipping
    });
  });

  describe('updateStatus - Commission Calculation on Delivery', () => {
    it('should calculate seller commission when marking as delivered', async () => {
      const mockOrder = {
        id: 'order-123',
        sellerId: 'seller-456',
        status: 'shipped',
        items: [
          { productId: 'prod-1', quantity: 2, price: 50000 }, // 100,000 total
        ],
        discount: 10000,
        platformFeeRate: 3,
        platformFeeAmount: 2700,
        sellerCommissionRate: 7,
        sellerCommissionAmount: 0,
        sellerNetAmount: 0,
        commissionStatus: 'pending',
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockImplementation((order) => ({
        ...order,
        deliveredAt: new Date(),
      }));

      const result = await service.updateStatus('order-123', OrderStatus.DELIVERED);

      // Subtotal after discount = 100,000 - 10,000 = 90,000
      // Commission = 90,000 * 7% = 6,300
      // Net = 90,000 - 6,300 = 83,700
      expect(result.status).toBe(OrderStatus.DELIVERED);
      expect(result.sellerCommissionAmount).toBe(6300);
      expect(result.sellerNetAmount).toBe(83700);
      expect(result.commissionStatus).toBe('calculated');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'order.delivered',
        expect.objectContaining({ order: result }),
      );
    });

    it('should not recalculate if already delivered', async () => {
      const mockOrder = {
        id: 'order-123',
        sellerId: 'seller-456',
        status: OrderStatus.DELIVERED,
        sellerCommissionAmount: 6300,
        commissionStatus: 'calculated',
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);

      await expect(
        service.updateStatus('order-123', OrderStatus.DELIVERED),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle zero discount correctly', async () => {
      const mockOrder = {
        id: 'order-123',
        sellerId: 'seller-456',
        status: 'shipped',
        items: [
          { productId: 'prod-1', quantity: 1, price: 100000 },
        ],
        discount: 0,
        platformFeeRate: 3,
        platformFeeAmount: 3000,
        sellerCommissionRate: 7,
        sellerCommissionAmount: 0,
        sellerNetAmount: 0,
        commissionStatus: 'pending',
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockImplementation((order) => ({
        ...order,
        deliveredAt: new Date(),
      }));

      const result = await service.updateStatus('order-123', OrderStatus.DELIVERED);

      // Commission = 100,000 * 7% = 7,000
      // Net = 100,000 - 7,000 = 93,000
      expect(result.sellerCommissionAmount).toBe(7000);
      expect(result.sellerNetAmount).toBe(93000);
    });

    it('should emit order.delivered event', async () => {
      const mockOrder = {
        id: 'order-123',
        sellerId: 'seller-456',
        status: 'shipped',
        items: [
          { productId: 'prod-1', quantity: 1, price: 100000 },
        ],
        discount: 0,
        sellerCommissionRate: 7,
        commissionStatus: 'pending',
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockImplementation((order) => order);

      await service.updateStatus('order-123', OrderStatus.DELIVERED);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'order.delivered',
        expect.objectContaining({
          order: expect.objectContaining({
            status: OrderStatus.DELIVERED,
            commissionStatus: 'calculated',
          }),
        }),
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small amounts correctly', async () => {
      const mockOrder = {
        id: 'order-123',
        sellerId: 'seller-456',
        status: 'shipped',
        items: [
          { productId: 'prod-1', quantity: 1, price: 100 }, // $1.00
        ],
        discount: 0,
        sellerCommissionRate: 7,
        commissionStatus: 'pending',
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockImplementation((order) => order);

      const result = await service.updateStatus('order-123', OrderStatus.DELIVERED);

      // Commission = 100 * 7% = 7
      expect(result.sellerCommissionAmount).toBe(7);
      expect(result.sellerNetAmount).toBe(93);
    });

    it('should handle large amounts correctly', async () => {
      const mockOrder = {
        id: 'order-123',
        sellerId: 'seller-456',
        status: 'shipped',
        items: [
          { productId: 'prod-1', quantity: 10, price: 1000000 }, // 10M
        ],
        discount: 0,
        sellerCommissionRate: 7,
        commissionStatus: 'pending',
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockImplementation((order) => order);

      const result = await service.updateStatus('order-123', OrderStatus.DELIVERED);

      // Commission = 10,000,000 * 7% = 700,000
      expect(result.sellerCommissionAmount).toBe(700000);
      expect(result.sellerNetAmount).toBe(9300000);
    });

    it('should handle 100% discount edge case', async () => {
      const mockOrder = {
        id: 'order-123',
        sellerId: 'seller-456',
        status: 'shipped',
        items: [
          { productId: 'prod-1', quantity: 1, price: 100000 },
        ],
        discount: 100000, // Full discount
        sellerCommissionRate: 7,
        commissionStatus: 'pending',
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockImplementation((order) => order);

      const result = await service.updateStatus('order-123', OrderStatus.DELIVERED);

      // Commission = 0 * 7% = 0
      expect(result.sellerCommissionAmount).toBe(0);
      expect(result.sellerNetAmount).toBe(0);
    });
  });
});
