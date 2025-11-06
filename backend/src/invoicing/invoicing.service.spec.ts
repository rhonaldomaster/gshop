import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoicingService } from './invoicing.service';
import { Invoice } from '../database/entities/invoice.entity';
import { Order } from '../database/entities/order.entity';
import { ConfigService } from '../config/config.service';

describe('InvoicingService', () => {
  let service: InvoicingService;
  let invoiceRepository: Repository<Invoice>;
  let orderRepository: Repository<Order>;
  let configService: ConfigService;

  const mockInvoiceRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockOrderRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockConfigService = {
    getNextInvoiceNumber: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicingService,
        {
          provide: getRepositoryToken(Invoice),
          useValue: mockInvoiceRepository,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<InvoicingService>(InvoicingService);
    invoiceRepository = module.get<Repository<Invoice>>(
      getRepositoryToken(Invoice),
    );
    orderRepository = module.get<Repository<Order>>(
      getRepositoryToken(Order),
    );
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateBuyerFeeInvoice', () => {
    it('should generate buyer fee invoice with correct amounts', async () => {
      const mockOrder = {
        id: 'order-123',
        buyerId: 'buyer-456',
        buyerName: 'John Doe',
        platformFeeAmount: 2850,
        shippingAddress: 'Calle 123, Bogotá',
        customerDocument: { type: 'CC', number: '12345678' },
      };

      mockConfigService.getNextInvoiceNumber.mockResolvedValue('GSHOP-FEE-00000123');
      mockInvoiceRepository.create.mockImplementation((data) => data);
      mockInvoiceRepository.save.mockImplementation((invoice) => ({
        ...invoice,
        id: 'invoice-789',
      }));
      mockOrderRepository.save.mockImplementation((order) => order);

      const result = await service.generateBuyerFeeInvoice(mockOrder as any);

      expect(result.invoiceNumber).toBe('GSHOP-FEE-00000123');
      expect(result.invoiceType).toBe('platform_to_buyer_fee');
      expect(result.subtotal).toBe(2850);
      expect(result.vatAmount).toBe(541.5); // 2850 * 0.19
      expect(result.totalAmount).toBe(3391.5); // 2850 + 541.5
      expect(result.status).toBe('issued');

      expect(mockInvoiceRepository.save).toHaveBeenCalled();
      expect(mockOrderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          feeInvoiceId: 'invoice-789',
        }),
      );
    });

    it('should handle zero platform fee', async () => {
      const mockOrder = {
        id: 'order-123',
        buyerId: 'buyer-456',
        buyerName: 'John Doe',
        platformFeeAmount: 0,
        shippingAddress: 'Calle 123, Bogotá',
        customerDocument: { type: 'CC', number: '12345678' },
      };

      mockConfigService.getNextInvoiceNumber.mockResolvedValue('GSHOP-FEE-00000124');
      mockInvoiceRepository.create.mockImplementation((data) => data);
      mockInvoiceRepository.save.mockImplementation((invoice) => ({
        ...invoice,
        id: 'invoice-790',
      }));
      mockOrderRepository.save.mockImplementation((order) => order);

      const result = await service.generateBuyerFeeInvoice(mockOrder as any);

      expect(result.subtotal).toBe(0);
      expect(result.vatAmount).toBe(0);
      expect(result.totalAmount).toBe(0);
    });

    it('should include GSHOP issuer information', async () => {
      const mockOrder = {
        id: 'order-123',
        buyerId: 'buyer-456',
        buyerName: 'John Doe',
        platformFeeAmount: 1000,
        shippingAddress: 'Calle 123, Bogotá',
        customerDocument: { type: 'CC', number: '12345678' },
      };

      mockConfigService.getNextInvoiceNumber.mockResolvedValue('GSHOP-FEE-00000125');
      mockInvoiceRepository.create.mockImplementation((data) => data);
      mockInvoiceRepository.save.mockImplementation((invoice) => ({
        ...invoice,
        id: 'invoice-791',
      }));
      mockOrderRepository.save.mockImplementation((order) => order);

      const result = await service.generateBuyerFeeInvoice(mockOrder as any);

      expect(result.issuerName).toBe('GSHOP SAS');
      expect(result.issuerDocument).toContain('NIT');
      expect(result.recipientName).toBe('John Doe');
      expect(result.recipientDocument).toBe('12345678');
    });
  });

  describe('generateSellerCommissionInvoice', () => {
    it('should generate seller commission invoice without VAT', async () => {
      const mockOrder = {
        id: 'order-123',
        sellerId: 'seller-456',
        seller: {
          businessName: 'Tienda ABC',
          document: 'NIT 900123456-7',
          address: 'Carrera 7, Bogotá',
        },
        sellerCommissionAmount: 6300,
      };

      mockConfigService.getNextInvoiceNumber.mockResolvedValue('GSHOP-COM-00000124');
      mockInvoiceRepository.create.mockImplementation((data) => data);
      mockInvoiceRepository.save.mockImplementation((invoice) => ({
        ...invoice,
        id: 'invoice-792',
      }));
      mockOrderRepository.save.mockImplementation((order) => order);

      const result = await service.generateSellerCommissionInvoice(mockOrder as any);

      expect(result.invoiceNumber).toBe('GSHOP-COM-00000124');
      expect(result.invoiceType).toBe('platform_to_seller_commission');
      expect(result.subtotal).toBe(6300);
      expect(result.vatAmount).toBe(0); // No VAT on B2B commission
      expect(result.totalAmount).toBe(6300);
      expect(result.status).toBe('issued');

      expect(mockOrderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          commissionInvoiceId: 'invoice-792',
          commissionStatus: 'invoiced',
        }),
      );
    });

    it('should include seller business information', async () => {
      const mockOrder = {
        id: 'order-123',
        sellerId: 'seller-456',
        seller: {
          businessName: 'Tienda XYZ',
          document: 'NIT 900555444-3',
          address: 'Calle 45 #12-34, Medellín',
        },
        sellerCommissionAmount: 5000,
      };

      mockConfigService.getNextInvoiceNumber.mockResolvedValue('GSHOP-COM-00000125');
      mockInvoiceRepository.create.mockImplementation((data) => data);
      mockInvoiceRepository.save.mockImplementation((invoice) => ({
        ...invoice,
        id: 'invoice-793',
      }));
      mockOrderRepository.save.mockImplementation((order) => order);

      const result = await service.generateSellerCommissionInvoice(mockOrder as any);

      expect(result.recipientName).toBe('Tienda XYZ');
      expect(result.recipientDocument).toBe('NIT 900555444-3');
      expect(result.recipientAddress).toBe('Calle 45 #12-34, Medellín');
    });

    it('should update order commission status to invoiced', async () => {
      const mockOrder = {
        id: 'order-123',
        sellerId: 'seller-456',
        seller: {
          businessName: 'Tienda ABC',
          document: 'NIT 900123456-7',
          address: 'Carrera 7, Bogotá',
        },
        sellerCommissionAmount: 6300,
        commissionStatus: 'calculated',
      };

      mockConfigService.getNextInvoiceNumber.mockResolvedValue('GSHOP-COM-00000126');
      mockInvoiceRepository.create.mockImplementation((data) => data);
      mockInvoiceRepository.save.mockImplementation((invoice) => ({
        ...invoice,
        id: 'invoice-794',
      }));
      mockOrderRepository.save.mockImplementation((order) => order);

      await service.generateSellerCommissionInvoice(mockOrder as any);

      expect(mockOrderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          commissionStatus: 'invoiced',
        }),
      );
    });
  });

  describe('getInvoiceById', () => {
    it('should return invoice by id', async () => {
      const mockInvoice = {
        id: 'invoice-123',
        invoiceNumber: 'GSHOP-FEE-00000100',
        invoiceType: 'platform_to_buyer_fee',
        totalAmount: 3000,
      };

      mockInvoiceRepository.findOne.mockResolvedValue(mockInvoice);

      const result = await service.getInvoiceById('invoice-123');

      expect(result).toEqual(mockInvoice);
      expect(mockInvoiceRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'invoice-123' },
        relations: ['order', 'seller', 'buyer'],
      });
    });

    it('should return null if invoice not found', async () => {
      mockInvoiceRepository.findOne.mockResolvedValue(null);

      const result = await service.getInvoiceById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getInvoicesByOrder', () => {
    it('should return all invoices for an order', async () => {
      const mockInvoices = [
        {
          id: 'invoice-1',
          invoiceType: 'platform_to_buyer_fee',
          orderId: 'order-123',
        },
        {
          id: 'invoice-2',
          invoiceType: 'platform_to_seller_commission',
          orderId: 'order-123',
        },
      ];

      mockInvoiceRepository.find.mockResolvedValue(mockInvoices);

      const result = await service.getInvoicesByOrder('order-123');

      expect(result).toHaveLength(2);
      expect(result[0].invoiceType).toBe('platform_to_buyer_fee');
      expect(result[1].invoiceType).toBe('platform_to_seller_commission');
    });
  });

  describe('Decimal Precision', () => {
    it('should handle decimal amounts correctly', async () => {
      const mockOrder = {
        id: 'order-123',
        buyerId: 'buyer-456',
        buyerName: 'John Doe',
        platformFeeAmount: 2549.99, // Odd decimal
        shippingAddress: 'Calle 123, Bogotá',
        customerDocument: { type: 'CC', number: '12345678' },
      };

      mockConfigService.getNextInvoiceNumber.mockResolvedValue('GSHOP-FEE-00000127');
      mockInvoiceRepository.create.mockImplementation((data) => data);
      mockInvoiceRepository.save.mockImplementation((invoice) => ({
        ...invoice,
        id: 'invoice-795',
      }));
      mockOrderRepository.save.mockImplementation((order) => order);

      const result = await service.generateBuyerFeeInvoice(mockOrder as any);

      // VAT = 2549.99 * 0.19 = 484.4981
      expect(result.vatAmount).toBeCloseTo(484.5, 2);
      // Total = 2549.99 + 484.50 = 3034.49
      expect(result.totalAmount).toBeCloseTo(3034.49, 2);
    });
  });
});
