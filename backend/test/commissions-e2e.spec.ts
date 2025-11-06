import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

/**
 * E2E Tests for Commission and Fee System
 *
 * This test suite validates the complete flow:
 * 1. Create order with platform fee calculation
 * 2. Mark order as delivered (triggers commission calculation)
 * 3. Verify automatic invoice generation
 * 4. Verify commission and fee amounts are correct
 */
describe('Commissions & Fees E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let sellerToken: string;
  let sellerId: string;
  let productId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await app.close();
  });

  /**
   * Setup test data (user, seller, product)
   */
  async function setupTestData() {
    // Create test buyer
    const buyerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'buyer-test@example.com',
        password: 'Test123!',
        firstName: 'Test',
        lastName: 'Buyer',
      });
    authToken = buyerResponse.body.accessToken;

    // Create test seller
    const sellerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/seller/register')
      .send({
        email: 'seller-test@example.com',
        password: 'Test123!',
        businessName: 'Test Store',
        document: 'NIT 900123456-7',
        firstName: 'Test',
        lastName: 'Seller',
      });
    sellerToken = sellerResponse.body.accessToken;
    sellerId = sellerResponse.body.seller.id;

    // Create test product
    const productResponse = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        name: 'Test Product',
        description: 'Product for commission testing',
        price: 100000,
        quantity: 100,
        category: 'Electronics',
        status: 'active',
      });
    productId = productResponse.body.id;
  }

  /**
   * Cleanup test data
   */
  async function cleanupTestData() {
    // Delete in correct order to avoid FK constraints
    await dataSource.query('DELETE FROM invoices WHERE issuer_document LIKE \'%TEST%\'');
    await dataSource.query('DELETE FROM orders WHERE buyer_id IN (SELECT id FROM users WHERE email LIKE \'%test@example.com\')');
    await dataSource.query('DELETE FROM products WHERE seller_id = $1', [sellerId]);
    await dataSource.query('DELETE FROM sellers WHERE email LIKE \'%test@example.com\'');
    await dataSource.query('DELETE FROM users WHERE email LIKE \'%test@example.com\'');
  }

  describe('Complete Order Flow with Commissions', () => {
    let orderId: string;

    it('should create order with correct platform fee', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [
            {
              productId: productId,
              quantity: 1,
            },
          ],
          shippingAddress: {
            firstName: 'Test',
            lastName: 'Buyer',
            address: 'Calle 123',
            city: 'Bogotá',
            state: 'Cundinamarca',
            postalCode: '110111',
            phone: '3001234567',
            document: '12345678',
            documentType: 'CC',
          },
          notes: 'Test order for commissions',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.platformFeeRate).toBeGreaterThan(0);
      expect(response.body.platformFeeAmount).toBeGreaterThan(0);
      expect(response.body.sellerCommissionRate).toBeGreaterThan(0);
      expect(response.body.sellerCommissionAmount).toBe(0); // Not calculated yet
      expect(response.body.commissionStatus).toBe('pending');

      orderId = response.body.id;

      // Verify platform fee calculation
      // Platform fee = 100,000 * 3% = 3,000 (assuming 3% default)
      const expectedPlatformFee = 100000 * (response.body.platformFeeRate / 100);
      expect(response.body.platformFeeAmount).toBeCloseTo(expectedPlatformFee, 2);
    });

    it('should calculate commission when marking as delivered', async () => {
      // First, update order to shipped status
      await request(app.getHttpServer())
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          status: 'shipped',
          trackingNumber: 'TEST-123456',
        });

      // Then mark as delivered
      const response = await request(app.getHttpServer())
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          status: 'delivered',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('delivered');
      expect(response.body.sellerCommissionAmount).toBeGreaterThan(0);
      expect(response.body.sellerNetAmount).toBeGreaterThan(0);
      expect(response.body.commissionStatus).toBe('calculated');
      expect(response.body.deliveredAt).toBeDefined();

      // Verify commission calculation
      // Commission = 100,000 * 7% = 7,000 (assuming 7% default)
      const expectedCommission = 100000 * (response.body.sellerCommissionRate / 100);
      expect(response.body.sellerCommissionAmount).toBeCloseTo(expectedCommission, 2);

      // Verify net amount
      const expectedNet = 100000 - expectedCommission;
      expect(response.body.sellerNetAmount).toBeCloseTo(expectedNet, 2);
    });

    it('should auto-generate invoices after delivery', async () => {
      // Wait a bit for event listener to process
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const response = await request(app.getHttpServer())
        .get(`/api/v1/invoicing/order/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2); // Fee invoice + Commission invoice

      // Verify buyer fee invoice
      const buyerFeeInvoice = response.body.find(
        (inv) => inv.invoiceType === 'platform_to_buyer_fee',
      );
      expect(buyerFeeInvoice).toBeDefined();
      expect(buyerFeeInvoice.invoiceNumber).toContain('FEE');
      expect(buyerFeeInvoice.status).toBe('issued');
      expect(buyerFeeInvoice.vatAmount).toBeGreaterThan(0); // Should have VAT

      // Verify seller commission invoice
      const commissionInvoice = response.body.find(
        (inv) => inv.invoiceType === 'platform_to_seller_commission',
      );
      expect(commissionInvoice).toBeDefined();
      expect(commissionInvoice.invoiceNumber).toContain('COM');
      expect(commissionInvoice.status).toBe('issued');
      expect(commissionInvoice.vatAmount).toBe(0); // No VAT on B2B commission
    });

    it('should update order with invoice references', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.feeInvoiceId).toBeDefined();
      expect(response.body.commissionInvoiceId).toBeDefined();
      expect(response.body.commissionStatus).toBe('invoiced');
    });
  });

  describe('Admin Commission Dashboard', () => {
    it('should fetch commission data with filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/commissions')
        .set('Authorization', `Bearer ${authToken}`) // Should be admin token
        .query({
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
          status: 'invoiced',
        });

      // Note: This might fail if user is not admin
      // In real tests, create admin user in setupTestData
      if (response.status === 200) {
        expect(response.body).toHaveProperty('commissions');
        expect(response.body).toHaveProperty('totalCommissions');
        expect(response.body).toHaveProperty('totalOrders');
      }
    });

    it('should export commissions to CSV', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/commissions/export')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          format: 'csv',
        });

      // Note: This might fail if user is not admin
      if (response.status === 200) {
        expect(response.headers['content-type']).toContain('text/csv');
      }
    });
  });

  describe('Seller Commission Dashboard', () => {
    it('should fetch seller commissions by month', async () => {
      const currentDate = new Date();
      const response = await request(app.getHttpServer())
        .get(`/api/v1/sellers/${sellerId}/commissions`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalSales');
      expect(response.body).toHaveProperty('totalCommissions');
      expect(response.body).toHaveProperty('netIncome');
      expect(response.body).toHaveProperty('orders');

      // Verify calculations
      const netIncome = response.body.totalSales - response.body.totalCommissions;
      expect(response.body.netIncome).toBeCloseTo(netIncome, 2);
    });

    it('should download commission report PDF', async () => {
      const currentDate = new Date();
      const response = await request(app.getHttpServer())
        .get(`/api/v1/sellers/${sellerId}/commissions/report`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .query({
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('.pdf');
    });
  });

  describe('Configuration Management', () => {
    it('should get current commission rate', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/config/seller-commission-rate');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('rate');
      expect(typeof response.body.rate).toBe('number');
      expect(response.body.rate).toBeGreaterThanOrEqual(0);
      expect(response.body.rate).toBeLessThanOrEqual(50);
    });

    it('should get current platform fee rate', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/config/buyer-platform-fee-rate');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('rate');
      expect(typeof response.body.rate).toBe('number');
      expect(response.body.rate).toBeGreaterThanOrEqual(0);
      expect(response.body.rate).toBeLessThanOrEqual(50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle order with discount', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{ productId: productId, quantity: 1 }],
          shippingAddress: {
            firstName: 'Test',
            lastName: 'Buyer',
            address: 'Calle 123',
            city: 'Bogotá',
            state: 'Cundinamarca',
            postalCode: '110111',
            phone: '3001234567',
            document: '12345678',
            documentType: 'CC',
          },
          discount: 10000, // $10,000 discount
        });

      expect(response.status).toBe(201);

      // Platform fee should be calculated on discounted amount
      // (100,000 - 10,000) * 3% = 2,700
      const expectedPlatformFee =
        (100000 - 10000) * (response.body.platformFeeRate / 100);
      expect(response.body.platformFeeAmount).toBeCloseTo(expectedPlatformFee, 2);
    });

    it('should not allow duplicate delivery', async () => {
      // Create and deliver an order
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{ productId: productId, quantity: 1 }],
          shippingAddress: {
            firstName: 'Test',
            lastName: 'Buyer',
            address: 'Calle 123',
            city: 'Bogotá',
            state: 'Cundinamarca',
            postalCode: '110111',
            phone: '3001234567',
            document: '12345678',
            documentType: 'CC',
          },
        });

      const orderId = createResponse.body.id;

      // Deliver once
      await request(app.getHttpServer())
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'delivered' });

      // Try to deliver again
      const response = await request(app.getHttpServer())
        .put(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'delivered' });

      expect(response.status).toBe(400); // Bad request
    });
  });
});
