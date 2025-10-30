
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from '../database/entities/order.entity';
import { OrderItem } from '../database/entities/order-item.entity';
import { Product } from '../database/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { LiveStream } from '../live/live.entity';
import { Affiliate } from '../affiliates/entities/affiliate.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(LiveStream)
    private liveStreamRepository: Repository<LiveStream>,
    @InjectRepository(Affiliate)
    private affiliateRepository: Repository<Affiliate>,
    private dataSource: DataSource,
  ) {}

  async create(createOrderDto: CreateOrderDto, userId: string): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Generate unique order number
      const orderNumber = await this.generateOrderNumber();

      // Validate products and calculate totals with VAT breakdown
      const { items, subtotal, subtotalBase, totalVatAmount, vatBreakdown } = await this.validateAndCalculateOrder(
        createOrderDto.items,
        queryRunner.manager,
      );

      // Calculate final totals (prices already include VAT)
      const shippingAmount = createOrderDto.shippingAmount || 0;
      const discountAmount = createOrderDto.discountAmount || 0;
      const totalAmount = subtotal + shippingAmount - discountAmount;

      // Calculate commission if affiliate is involved
      let commissionRate = 0;
      let commissionAmount = 0;

      if (createOrderDto.affiliateId) {
        const affiliate = await queryRunner.manager.findOne(Affiliate, {
          where: { id: createOrderDto.affiliateId }
        });

        if (affiliate) {
          commissionRate = Number(affiliate.commissionRate);
          commissionAmount = (totalAmount * commissionRate) / 100;
        }
      }

      // Create order
      const order = queryRunner.manager.create(Order, {
        orderNumber,
        userId,
        status: OrderStatus.PENDING,
        subtotal,
        subtotalBase,
        totalVatAmount,
        vatBreakdown,
        shippingAmount,
        discountAmount,
        totalAmount,
        shippingAddress: createOrderDto.shippingAddress,
        billingAddress: createOrderDto.billingAddress,
        notes: createOrderDto.notes,
        liveSessionId: createOrderDto.liveSessionId,
        affiliateId: createOrderDto.affiliateId,
        commissionRate,
        commissionAmount,
      });

      const savedOrder = await queryRunner.manager.save(Order, order);

      // Create order items with VAT details
      const orderItems = items.map((item) =>
        queryRunner.manager.create(OrderItem, {
          orderId: savedOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          vatType: item.vatType,
          basePrice: item.basePrice,
          vatAmountPerUnit: item.vatAmountPerUnit,
          totalBasePrice: item.totalBasePrice,
          totalVatAmount: item.totalVatAmount,
          productSnapshot: item.productSnapshot,
        }),
      );

      await queryRunner.manager.save(OrderItem, orderItems);

      // Update product quantities
      for (const item of items) {
        await queryRunner.manager.decrement(
          Product,
          { id: item.productId },
          'quantity',
          item.quantity,
        );
        await queryRunner.manager.increment(
          Product,
          { id: item.productId },
          'ordersCount',
          1,
        );
      }

      // Update live stream stats if applicable
      if (createOrderDto.liveSessionId) {
        await queryRunner.manager.increment(
          LiveStream,
          { id: createOrderDto.liveSessionId },
          'totalSales',
          totalAmount,
        );

        // Update live stream product stats
        for (const item of orderItems) {
          await queryRunner.manager
            .createQueryBuilder()
            .update('live_stream_products')
            .set({
              orderCount: () => 'orderCount + 1',
              revenue: () => `revenue + ${item.totalPrice}`
            })
            .where('streamId = :streamId AND productId = :productId', {
              streamId: createOrderDto.liveSessionId,
              productId: item.productId
            })
            .execute();
        }
      }

      // Update affiliate earnings if applicable
      if (createOrderDto.affiliateId && commissionAmount > 0) {
        await queryRunner.manager.increment(
          Affiliate,
          { id: createOrderDto.affiliateId },
          'totalEarnings',
          commissionAmount,
        );
        await queryRunner.manager.increment(
          Affiliate,
          { id: createOrderDto.affiliateId },
          'pendingBalance',
          commissionAmount,
        );
      }

      await queryRunner.commitTransaction();

      return this.findOne(savedOrder.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: OrderQueryDto) {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .select([
        'order',
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.email',
        'items',
        'product.id',
        'product.name',
        'product.images',
      ]);

    // Apply filters
    if (query.status) {
      queryBuilder.andWhere('order.status = :status', { status: query.status });
    }

    if (query.userId) {
      queryBuilder.andWhere('order.userId = :userId', { userId: query.userId });
    }

    if (query.startDate) {
      queryBuilder.andWhere('order.createdAt >= :startDate', {
        startDate: query.startDate,
      });
    }

    if (query.endDate) {
      queryBuilder.andWhere('order.createdAt <= :endDate', {
        endDate: query.endDate,
      });
    }

    // Apply sorting
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'DESC';
    queryBuilder.orderBy(`order.${sortBy}`, sortOrder);

    // Apply pagination
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    const [orders, total] = await queryBuilder.getManyAndCount();

    return {
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.payment', 'payment')
      .where('order.id = :id', { id })
      .getOne();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order> {
    const order = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.payment', 'payment')
      .where('order.orderNumber = :orderNumber', { orderNumber })
      .getOne();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    // Update tracking information
    if (updateOrderDto.trackingNumber || updateOrderDto.shippingCarrier) {
      await this.orderRepository.update(id, {
        trackingNumber: updateOrderDto.trackingNumber,
        shippingCarrier: updateOrderDto.shippingCarrier,
        estimatedDeliveryDate: updateOrderDto.estimatedDeliveryDate,
      });
    }

    return this.findOne(id);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);

    // Update status-specific fields
    const updateData: any = { status };

    if (status === OrderStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
    }

    await this.orderRepository.update(id, updateData);

    return this.findOne(id);
  }

  async getOrdersByUser(userId: string, query: OrderQueryDto) {
    const queryWithUser = { ...query, userId };
    return this.findAll(queryWithUser);
  }

  async getOrderStats() {
    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
    ] = await Promise.all([
      this.orderRepository.count(),
      this.orderRepository.count({ where: { status: OrderStatus.PENDING } }),
      this.orderRepository.count({ where: { status: OrderStatus.CONFIRMED } }),
      this.orderRepository.count({ where: { status: OrderStatus.SHIPPED } }),
      this.orderRepository.count({ where: { status: OrderStatus.DELIVERED } }),
      this.orderRepository.count({ where: { status: OrderStatus.CANCELLED } }),
    ]);

    // Calculate total revenue
    const revenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.status IN (:...statuses)', {
        statuses: [OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED],
      })
      .getRawOne();

    const totalRevenue = parseFloat(revenueResult.total) || 0;

    return {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
    };
  }

  private async validateAndCalculateOrder(items: any[], manager: any) {
    const validatedItems = [];
    let subtotal = 0;
    let subtotalBase = 0;
    let totalVatAmount = 0;

    // Initialize VAT breakdown structure
    const vatBreakdown = {
      excluido: { base: 0, vat: 0, total: 0 },
      exento: { base: 0, vat: 0, total: 0 },
      reducido: { base: 0, vat: 0, total: 0 },
      general: { base: 0, vat: 0, total: 0 },
    };

    for (const item of items) {
      const product = await manager.findOne(Product, {
        where: { id: item.productId },
      });

      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found`);
      }

      if (product.quantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`,
        );
      }

      const unitPrice = product.price;
      const totalPrice = unitPrice * item.quantity;

      // VAT calculations for this item
      const basePrice = product.basePrice;
      const vatAmountPerUnit = product.vatAmount;
      const totalBasePrice = basePrice * item.quantity;
      const itemTotalVatAmount = vatAmountPerUnit * item.quantity;
      const vatType = product.vatType;

      // Update VAT breakdown
      vatBreakdown[vatType].base += totalBasePrice;
      vatBreakdown[vatType].vat += itemTotalVatAmount;
      vatBreakdown[vatType].total += totalPrice;

      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        vatType,
        basePrice,
        vatAmountPerUnit,
        totalBasePrice,
        totalVatAmount: itemTotalVatAmount,
        productSnapshot: {
          name: product.name,
          sku: product.sku,
          image: product.images?.[0],
          variant: item.variant,
        },
      });

      subtotal += totalPrice;
      subtotalBase += totalBasePrice;
      totalVatAmount += itemTotalVatAmount;
    }

    return {
      items: validatedItems,
      subtotal,
      subtotalBase,
      totalVatAmount,
      vatBreakdown,
    };
  }

  private async generateOrderNumber(): Promise<string> {
    const prefix = 'GSH';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }
}
