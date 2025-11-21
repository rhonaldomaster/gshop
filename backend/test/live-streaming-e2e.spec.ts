import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { HostType } from '../src/live/live.entity';

/**
 * E2E Tests for Live Streaming System
 *
 * This test suite validates the complete live streaming flow:
 * 1. Create live stream
 * 2. Add products to stream
 * 3. Start stream
 * 4. Send messages and reactions
 * 5. Join/leave stream as viewer
 * 6. End stream with analytics
 */
describe('Live Streaming E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let sellerToken: string;
  let buyerToken: string;
  let sellerId: string;
  let buyerId: string;
  let productId: string;
  let streamId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  /**
   * Setup test data (seller, buyer, product)
   */
  async function setupTestData() {
    // Create test seller
    const sellerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/seller/register')
      .send({
        email: `seller-live-${Date.now()}@example.com`,
        password: 'Test123!',
        businessName: 'Live Test Store',
        document: `NIT ${Date.now()}`,
        firstName: 'Test',
        lastName: 'Seller',
      });
    sellerToken = sellerResponse.body.accessToken;
    sellerId = sellerResponse.body.seller.id;

    // Create test buyer
    const buyerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `buyer-live-${Date.now()}@example.com`,
        password: 'Test123!',
        firstName: 'Test',
        lastName: 'Buyer',
      });
    buyerToken = buyerResponse.body.accessToken;
    buyerId = buyerResponse.body.user.id;

    // Create test product
    const productResponse = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        name: 'Live Test Product',
        description: 'Product for live streaming testing',
        price: 50000,
        stock: 100,
        category: 'Electronics',
        vatType: 'general',
      });
    productId = productResponse.body.id;
  }

  /**
   * Cleanup test data
   */
  async function cleanupTestData() {
    if (streamId) {
      await dataSource.query('DELETE FROM live_stream_reactions WHERE "streamId" = $1', [streamId]);
      await dataSource.query('DELETE FROM live_stream_messages WHERE "streamId" = $1', [streamId]);
      await dataSource.query('DELETE FROM live_stream_viewers WHERE "streamId" = $1', [streamId]);
      await dataSource.query('DELETE FROM live_stream_products WHERE "streamId" = $1', [streamId]);
      await dataSource.query('DELETE FROM live_stream_metrics WHERE "streamId" = $1', [streamId]);
      await dataSource.query('DELETE FROM live_streams WHERE id = $1', [streamId]);
    }
    if (productId) {
      await dataSource.query('DELETE FROM products WHERE id = $1', [productId]);
    }
    if (sellerId) {
      await dataSource.query('DELETE FROM sellers WHERE id = $1', [sellerId]);
    }
    if (buyerId) {
      await dataSource.query('DELETE FROM users WHERE id = $1', [buyerId]);
    }
  }

  describe('POST /api/v1/live/streams - Create Live Stream', () => {
    it('should create a new live stream', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/live/streams')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          title: 'Test Live Stream',
          description: 'E2E test stream description',
          category: 'Electronics',
          tags: ['test', 'e2e'],
          scheduledAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Live Stream');
      expect(response.body.status).toBe('scheduled');
      expect(response.body.hostType).toBe('seller');
      expect(response.body).toHaveProperty('rtmpUrl');
      expect(response.body).toHaveProperty('playbackUrl');

      streamId = response.body.id;
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/live/streams')
        .send({
          title: 'Test Stream',
          description: 'Test',
        })
        .expect(401);
    });

    it('should fail with invalid data', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/live/streams')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          title: '', // Empty title
        })
        .expect(400);
    });
  });

  describe('POST /api/v1/live/streams/:id/products - Add Products', () => {
    it('should add product to stream', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/live/streams/${streamId}/products`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          productId: productId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.product.id).toBe(productId);
      expect(response.body.isHighlighted).toBe(false);
    });

    it('should fail to add product from another seller', async () => {
      // Create another seller
      const otherSellerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/seller/register')
        .send({
          email: `other-seller-${Date.now()}@example.com`,
          password: 'Test123!',
          businessName: 'Other Store',
          document: `NIT ${Date.now()}`,
          firstName: 'Other',
          lastName: 'Seller',
        });

      const otherProductResponse = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${otherSellerResponse.body.accessToken}`)
        .send({
          name: 'Other Product',
          price: 30000,
          stock: 50,
          category: 'Fashion',
          vatType: 'general',
        });

      await request(app.getHttpServer())
        .post(`/api/v1/live/streams/${streamId}/products`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          productId: otherProductResponse.body.id,
        })
        .expect(403);
    });
  });

  describe('PUT /api/v1/live/streams/:id/products/:productId/highlight - Highlight Product', () => {
    it('should highlight a product during stream', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/v1/live/streams/${streamId}/products/${productId}/highlight`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.isHighlighted).toBe(true);
      expect(response.body).toHaveProperty('highlightedAt');
    });
  });

  describe('POST /api/v1/live/streams/:id/start - Start Stream', () => {
    it('should start a scheduled stream', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/live/streams/${streamId}/start`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.status).toBe('live');
      expect(response.body).toHaveProperty('startedAt');
    });

    it('should fail to start already live stream', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/live/streams/${streamId}/start`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(400);
    });

    it('should fail when not owner', async () => {
      // Create another stream
      const newStreamResponse = await request(app.getHttpServer())
        .post('/api/v1/live/streams')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          title: 'Another Stream',
          description: 'Test',
        });

      const newStreamId = newStreamResponse.body.id;

      // Create another seller and try to start first seller's stream
      const otherSellerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/seller/register')
        .send({
          email: `unauthorized-seller-${Date.now()}@example.com`,
          password: 'Test123!',
          businessName: 'Unauthorized Store',
          document: `NIT ${Date.now()}`,
          firstName: 'Unauthorized',
          lastName: 'Seller',
        });

      await request(app.getHttpServer())
        .post(`/api/v1/live/streams/${newStreamId}/start`)
        .set('Authorization', `Bearer ${otherSellerResponse.body.accessToken}`)
        .expect(403);

      // Cleanup
      await dataSource.query('DELETE FROM live_streams WHERE id = $1', [newStreamId]);
    });
  });

  describe('GET /api/v1/live/discover - Discover Active Streams', () => {
    it('should return list of active streams', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/live/discover')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');

      const ourStream = response.body.data.find((s: any) => s.id === streamId);
      expect(ourStream).toBeDefined();
      expect(ourStream.status).toBe('live');
    });

    it('should filter by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/live/discover')
        .query({ category: 'Electronics' })
        .expect(200);

      response.body.data.forEach((stream: any) => {
        expect(stream.category).toBe('Electronics');
      });
    });
  });

  describe('POST /api/v1/live/streams/:id/join - Join Stream', () => {
    it('should allow buyer to join stream', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/live/streams/${streamId}/join`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.userId).toBe(buyerId);
    });
  });

  describe('POST /api/v1/live/streams/:id/messages - Send Message', () => {
    it('should send a chat message', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/live/streams/${streamId}/messages`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          content: 'Hello from E2E test!',
        })
        .expect(201);

      expect(response.body.content).toBe('Hello from E2E test!');
      expect(response.body.userId).toBe(buyerId);
    });

    it('should fail with empty message', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/live/streams/${streamId}/messages`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          content: '',
        })
        .expect(400);
    });

    it('should fail with too long message', async () => {
      const longMessage = 'a'.repeat(501); // Max is 500 chars
      await request(app.getHttpServer())
        .post(`/api/v1/live/streams/${streamId}/messages`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          content: longMessage,
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/live/streams/:id/messages - Get Messages', () => {
    it('should get stream messages', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/live/streams/${streamId}/messages`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      const ourMessage = response.body.find((m: any) => m.content === 'Hello from E2E test!');
      expect(ourMessage).toBeDefined();
    });
  });

  describe('GET /api/v1/live/streams/:id/stats - Get Stream Stats', () => {
    it('should return stream statistics', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/live/streams/${streamId}/stats`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('viewerCount');
      expect(response.body).toHaveProperty('messageCount');
      expect(response.body).toHaveProperty('likesCount');
      expect(response.body).toHaveProperty('products');
      expect(response.body.viewerCount).toBeGreaterThanOrEqual(1);
    });

    it('should fail when not stream owner', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/live/streams/${streamId}/stats`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(403);
    });
  });

  describe('POST /api/v1/live/streams/:id/end - End Stream', () => {
    it('should end a live stream', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/live/streams/${streamId}/end`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.status).toBe('ended');
      expect(response.body).toHaveProperty('endedAt');
      expect(response.body).toHaveProperty('duration');
      expect(response.body.peakViewerCount).toBeGreaterThanOrEqual(1);
    });

    it('should fail to end already ended stream', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/live/streams/${streamId}/end`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(400);
    });
  });

  describe('GET /api/v1/live/streams/:id/analytics - Get Analytics', () => {
    it('should return detailed analytics', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/live/streams/${streamId}/analytics`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('stream');
      expect(response.body).toHaveProperty('analytics');
      expect(response.body.analytics).toHaveProperty('totalViewers');
      expect(response.body.analytics).toHaveProperty('peakViewers');
      expect(response.body.analytics).toHaveProperty('averageWatchTime');
      expect(response.body.analytics).toHaveProperty('totalMessages');
      expect(response.body.analytics).toHaveProperty('engagement');
    });
  });

  describe('GET /api/v1/live/dashboard - Dashboard Stats', () => {
    it('should return seller dashboard statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/live/dashboard')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalStreams');
      expect(response.body).toHaveProperty('liveStreams');
      expect(response.body).toHaveProperty('totalViewers');
      expect(response.body).toHaveProperty('totalRevenue');
      expect(response.body).toHaveProperty('averageViewers');
      expect(response.body).toHaveProperty('conversionRate');
      expect(response.body).toHaveProperty('recentStreams');
    });
  });

  describe('Search and Trending', () => {
    it('should search streams by keyword', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/live/search')
        .query({ query: 'Test', page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get trending streams', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/live/trending')
        .query({ limit: 10 })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get categories', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/live/categories')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toContain('Electronics');
    });
  });
});
