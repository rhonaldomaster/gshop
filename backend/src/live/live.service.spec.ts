import { Test, TestingModule } from '@nestjs/testing';
import { LiveService } from './live.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LiveStream, StreamStatus, HostType } from './live.entity';
import { LiveStreamProduct } from './live.entity';
import { LiveStreamMessage } from './live.entity';
import { LiveStreamViewer } from './live.entity';
import { LiveStreamReaction, ReactionType } from './live.entity';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';
import { Seller } from '../sellers/entities/seller.entity';
import { Affiliate } from '../affiliates/entities/affiliate.entity';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { AwsIvsMockService } from './aws-ivs-mock.service';
import { CacheMockService } from '../common/cache/cache-mock.service';
import { LiveMetricsService } from './live-metrics.service';

describe('LiveService', () => {
  let service: LiveService;
  let liveStreamRepository: Repository<LiveStream>;
  let liveStreamProductRepository: Repository<LiveStreamProduct>;
  let liveStreamMessageRepository: Repository<LiveStreamMessage>;
  let liveStreamViewerRepository: Repository<LiveStreamViewer>;
  let liveStreamReactionRepository: Repository<LiveStreamReaction>;
  let productRepository: Repository<Product>;
  let userRepository: Repository<User>;
  let sellerRepository: Repository<Seller>;
  let affiliateRepository: Repository<Affiliate>;
  let awsIvsMockService: AwsIvsMockService;
  let cacheService: CacheMockService;

  // Mock data
  const mockSeller = {
    id: 'seller-123',
    businessName: 'Test Store',
    user: { id: 'user-123', email: 'seller@test.com' },
  };

  const mockProduct = {
    id: 'product-123',
    name: 'Test Product',
    price: 100,
    seller: mockSeller,
  };

  const mockLiveStream = {
    id: 'stream-123',
    title: 'Test Stream',
    description: 'Test Description',
    status: StreamStatus.SCHEDULED,
    hostType: HostType.SELLER,
    sellerId: 'seller-123',
    seller: mockSeller,
    viewerCount: 0,
    likesCount: 0,
    products: [],
    messages: [],
    viewers: [],
    reactions: [],
    save: jest.fn().mockResolvedValue(this),
  };

  const mockIvsChannel = {
    channelArn: 'arn:aws:ivs:us-east-1:123456789:channel/abcd1234',
    streamKey: 'sk_us-east-1_abcd1234',
    ingestEndpoint: 'rtmp://test.ivs.amazonaws.com/app',
    playbackUrl: 'https://test.cloudfront.net/stream.m3u8',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiveService,
        {
          provide: getRepositoryToken(LiveStream),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
              getOne: jest.fn(),
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              groupBy: jest.fn().mockReturnThis(),
              getRawMany: jest.fn(),
            })),
          },
        },
        {
          provide: getRepositoryToken(LiveStreamProduct),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(LiveStreamMessage),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            })),
          },
        },
        {
          provide: getRepositoryToken(LiveStreamViewer),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            count: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getOne: jest.fn(),
              getCount: jest.fn(),
            })),
          },
        },
        {
          provide: getRepositoryToken(LiveStreamReaction),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            })),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Seller),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Affiliate),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: AwsIvsMockService,
          useValue: {
            createChannel: jest.fn().mockResolvedValue(mockIvsChannel),
            deleteChannel: jest.fn().mockResolvedValue(undefined),
            getStreamHealth: jest.fn().mockResolvedValue({ isHealthy: true }),
          },
        },
        {
          provide: CacheMockService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            incr: jest.fn(),
            decr: jest.fn(),
          },
        },
        {
          provide: LiveMetricsService,
          useValue: {
            captureMetrics: jest.fn(),
            getMetricsHistory: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LiveService>(LiveService);
    liveStreamRepository = module.get<Repository<LiveStream>>(getRepositoryToken(LiveStream));
    liveStreamProductRepository = module.get<Repository<LiveStreamProduct>>(getRepositoryToken(LiveStreamProduct));
    liveStreamMessageRepository = module.get<Repository<LiveStreamMessage>>(getRepositoryToken(LiveStreamMessage));
    liveStreamViewerRepository = module.get<Repository<LiveStreamViewer>>(getRepositoryToken(LiveStreamViewer));
    liveStreamReactionRepository = module.get<Repository<LiveStreamReaction>>(getRepositoryToken(LiveStreamReaction));
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    sellerRepository = module.get<Repository<Seller>>(getRepositoryToken(Seller));
    affiliateRepository = module.get<Repository<Affiliate>>(getRepositoryToken(Affiliate));
    awsIvsMockService = module.get<AwsIvsMockService>(AwsIvsMockService);
    cacheService = module.get<CacheMockService>(CacheMockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLiveStream', () => {
    it('should create a live stream for seller', async () => {
      const createDto = {
        title: 'Test Stream',
        description: 'Test Description',
        scheduledAt: new Date().toISOString(),
      };

      jest.spyOn(sellerRepository, 'findOne').mockResolvedValue(mockSeller as any);
      jest.spyOn(liveStreamRepository, 'create').mockReturnValue(mockLiveStream as any);
      jest.spyOn(liveStreamRepository, 'save').mockResolvedValue({ ...mockLiveStream, ivsChannelArn: mockIvsChannel.channelArn } as any);

      const result = await service.createLiveStream('seller-123', createDto as any, HostType.SELLER);

      expect(result).toBeDefined();
      expect(sellerRepository.findOne).toHaveBeenCalledWith({ where: { id: 'seller-123' }, relations: ['user'] });
      expect(awsIvsMockService.createChannel).toHaveBeenCalled();
      expect(liveStreamRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if seller not found', async () => {
      jest.spyOn(sellerRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.createLiveStream('invalid-seller', { title: 'Test', description: 'Test' }, HostType.SELLER)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('startLiveStream', () => {
    it('should start a scheduled stream', async () => {
      const stream = { ...mockLiveStream, status: StreamStatus.SCHEDULED };
      jest.spyOn(liveStreamRepository, 'findOne').mockResolvedValue(stream as any);
      jest.spyOn(liveStreamRepository, 'save').mockResolvedValue({ ...stream, status: StreamStatus.LIVE } as any);

      const result = await service.startLiveStream('stream-123', 'seller-123', HostType.SELLER);

      expect(result.status).toBe(StreamStatus.LIVE);
      expect(result.startedAt).toBeDefined();
    });

    it('should throw BadRequestException if stream already live', async () => {
      const stream = { ...mockLiveStream, status: StreamStatus.LIVE };
      jest.spyOn(liveStreamRepository, 'findOne').mockResolvedValue(stream as any);

      await expect(
        service.startLiveStream('stream-123', 'seller-123', HostType.SELLER)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if not owner', async () => {
      jest.spyOn(liveStreamRepository, 'findOne').mockResolvedValue(mockLiveStream as any);

      await expect(
        service.startLiveStream('stream-123', 'wrong-seller', HostType.SELLER)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('endLiveStream', () => {
    it('should end a live stream', async () => {
      const stream = { ...mockLiveStream, status: StreamStatus.LIVE, startedAt: new Date() };
      jest.spyOn(liveStreamRepository, 'findOne').mockResolvedValue(stream as any);
      jest.spyOn(liveStreamRepository, 'save').mockResolvedValue({ ...stream, status: StreamStatus.ENDED } as any);
      jest.spyOn(liveStreamViewerRepository, 'count').mockResolvedValue(100);

      const result = await service.endLiveStream('stream-123', 'seller-123', HostType.SELLER);

      expect(result.status).toBe(StreamStatus.ENDED);
      expect(result.endedAt).toBeDefined();
    });
  });

  describe('addProductToStream', () => {
    it('should add product to stream', async () => {
      jest.spyOn(liveStreamRepository, 'findOne').mockResolvedValue(mockLiveStream as any);
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockProduct as any);

      const streamProduct = { id: 'sp-123', stream: mockLiveStream, product: mockProduct };
      jest.spyOn(liveStreamProductRepository, 'create').mockReturnValue(streamProduct as any);
      jest.spyOn(liveStreamProductRepository, 'save').mockResolvedValue(streamProduct as any);

      const result = await service.addProductToStream('stream-123', 'seller-123', { productId: 'product-123' });

      expect(result).toBeDefined();
      expect(productRepository.findOne).toHaveBeenCalled();
      expect(liveStreamProductRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if product not found', async () => {
      jest.spyOn(liveStreamRepository, 'findOne').mockResolvedValue(mockLiveStream as any);
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.addProductToStream('stream-123', 'seller-123', { productId: 'invalid-product' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('sendMessage', () => {
    it('should send a message to stream', async () => {
      const stream = { ...mockLiveStream, status: StreamStatus.LIVE };
      const user = { id: 'user-123', firstName: 'Test', lastName: 'User' };

      jest.spyOn(liveStreamRepository, 'findOne').mockResolvedValue(stream as any);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as any);
      jest.spyOn(service, 'isUserBanned').mockResolvedValue(false);
      jest.spyOn(service, 'isUserTimedOut').mockResolvedValue(false);
      jest.spyOn(service, 'checkRateLimit').mockResolvedValue(true);

      const message = { id: 'msg-123', message: 'Hello!', user };
      jest.spyOn(liveStreamMessageRepository, 'create').mockReturnValue(message as any);
      jest.spyOn(liveStreamMessageRepository, 'save').mockResolvedValue(message as any);

      const result = await service.sendMessage('stream-123', { message: 'Hello!', userId: 'user-123' } as any);

      expect(result).toBeDefined();
      expect(result.message).toBe('Hello!');
      expect(liveStreamMessageRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is banned', async () => {
      const stream = { ...mockLiveStream, status: StreamStatus.LIVE };
      jest.spyOn(liveStreamRepository, 'findOne').mockResolvedValue(stream as any);
      jest.spyOn(service, 'isUserBanned').mockResolvedValue(true);

      await expect(
        service.sendMessage('stream-123', { message: 'Hello!', userId: 'user-123' } as any)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('joinStream', () => {
    it('should allow user to join stream', async () => {
      const stream = { ...mockLiveStream, status: StreamStatus.LIVE, viewerCount: 0 };
      jest.spyOn(liveStreamRepository, 'findOne').mockResolvedValue(stream as any);
      jest.spyOn(liveStreamViewerRepository, 'findOne').mockResolvedValue(null);

      const viewer = { id: 'viewer-123', stream, userId: 'user-123' };
      jest.spyOn(liveStreamViewerRepository, 'create').mockReturnValue(viewer as any);
      jest.spyOn(liveStreamViewerRepository, 'save').mockResolvedValue(viewer as any);
      jest.spyOn(liveStreamRepository, 'save').mockResolvedValue({ ...stream, viewerCount: 1 } as any);

      const result = await service.joinStream('stream-123', 'user-123', 'session-123', '127.0.0.1', 'test-agent');

      expect(result).toBeDefined();
      expect(liveStreamViewerRepository.save).toHaveBeenCalled();
    });
  });

  describe('sendReaction', () => {
    it('should send a reaction', async () => {
      const stream = { ...mockLiveStream, status: StreamStatus.LIVE, likesCount: 0 };
      jest.spyOn(liveStreamRepository, 'findOne').mockResolvedValue(stream as any);

      const reaction = { id: 'reaction-123', type: ReactionType.HEART, stream };
      jest.spyOn(liveStreamReactionRepository, 'create').mockReturnValue(reaction as any);
      jest.spyOn(liveStreamReactionRepository, 'save').mockResolvedValue(reaction as any);
      jest.spyOn(liveStreamRepository, 'save').mockResolvedValue({ ...stream, likesCount: 1 } as any);

      const result = await service.sendReaction('stream-123', 'user-123', null, ReactionType.HEART);

      expect(result).toBeDefined();
      expect(result.type).toBe(ReactionType.HEART);
    });
  });

  describe('banUser', () => {
    it('should ban a user from stream', async () => {
      const stream = { ...mockLiveStream, status: StreamStatus.LIVE };
      jest.spyOn(liveStreamRepository, 'findOne').mockResolvedValue(stream as any);

      const viewer = { id: 'viewer-123', isBanned: false, save: jest.fn().mockResolvedValue(this) };
      const qb = liveStreamViewerRepository.createQueryBuilder();
      jest.spyOn(qb, 'getOne').mockResolvedValue(viewer as any);

      await service.banUser('stream-123', 'user-123', 'moderator-123', 'Spam');

      expect(qb.getOne).toHaveBeenCalled();
    });
  });

  describe('getUserBadge', () => {
    it('should return seller badge for seller', async () => {
      const stream = { ...mockLiveStream, sellerId: 'user-123' };
      jest.spyOn(liveStreamRepository, 'findOne').mockResolvedValue(stream as any);

      const badge = await service.getUserBadge('stream-123', 'user-123');

      expect(badge).toBe('seller');
    });

    it('should return null for regular viewer', async () => {
      jest.spyOn(liveStreamRepository, 'findOne').mockResolvedValue(mockLiveStream as any);

      const badge = await service.getUserBadge('stream-123', 'other-user');

      expect(badge).toBeNull();
    });
  });

  describe('checkRateLimit', () => {
    it('should allow messages within rate limit', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(null);
      jest.spyOn(cacheService, 'set').mockResolvedValue(undefined);

      const result = await service.checkRateLimit('user-123', 5, 10);

      expect(result).toBe(true);
    });

    it('should block messages exceeding rate limit', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue('[1,2,3,4,5,6]');

      const result = await service.checkRateLimit('user-123', 5, 10);

      expect(result).toBe(false);
    });
  });
});
