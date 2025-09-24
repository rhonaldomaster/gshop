import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../database/entities/order.entity';
import { PaymentsService } from '../payments/payments.service';
import { RequestReturnDto, ProcessReturnDto } from './dto';

@Injectable()
export class ReturnsService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private paymentsService: PaymentsService,
  ) {}

  async requestReturn(orderId: string, returnDto: RequestReturnDto, userId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, userId },
      relations: ['payment'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (![OrderStatus.DELIVERED, OrderStatus.SHIPPED].includes(order.status)) {
      throw new BadRequestException('Returns can only be requested for delivered or shipped orders');
    }

    // Check if return window is still open (e.g., 30 days)
    const deliveryDate = order.deliveredAt || order.estimatedDeliveryDate;
    if (deliveryDate) {
      const daysSinceDelivery = Math.floor(
        (new Date().getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceDelivery > 30) {
        throw new BadRequestException('Return window has expired (30 days)');
      }
    }

    const updatedOrder = await this.orderRepository.save({
      ...order,
      status: OrderStatus.RETURN_REQUESTED,
      returnReason: `${returnDto.reason}${returnDto.description ? ': ' + returnDto.description : ''}`,
    });

    return updatedOrder;
  }

  async processReturn(orderId: string, processDto: ProcessReturnDto): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['payment'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.RETURN_REQUESTED) {
      throw new BadRequestException('No return request found for this order');
    }

    if (processDto.approved) {
      // Process refund through payment service
      if (order.payment) {
        try {
          await this.paymentsService.refundPayment(order.payment.id, order.totalAmount);
        } catch (error) {
          throw new BadRequestException('Failed to process refund. Please try again later.');
        }
      }

      // Update order status to refunded
      const updatedOrder = await this.orderRepository.save({
        ...order,
        status: OrderStatus.REFUNDED,
        notes: processDto.sellerNotes
          ? `${order.notes || ''}\nSeller return notes: ${processDto.sellerNotes}`.trim()
          : order.notes,
      });

      return updatedOrder;
    } else {
      // Reject return request - restore previous status
      const previousStatus = order.deliveredAt
        ? OrderStatus.DELIVERED
        : OrderStatus.SHIPPED;

      const updatedOrder = await this.orderRepository.save({
        ...order,
        status: previousStatus,
        returnReason: null,
        notes: processDto.sellerNotes
          ? `${order.notes || ''}\nReturn rejected: ${processDto.sellerNotes}`.trim()
          : order.notes,
      });

      return updatedOrder;
    }
  }

  async getReturns(sellerId?: string): Promise<Order[]> {
    const query = this.orderRepository.createQueryBuilder('order')
      .where('order.status = :status', { status: OrderStatus.RETURN_REQUESTED })
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.user', 'user')
      .orderBy('order.createdAt', 'DESC');

    if (sellerId) {
      query.andWhere('product.sellerId = :sellerId', { sellerId });
    }

    return query.getMany();
  }

  async getOrderReturns(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product', 'payment', 'user'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async getReturnStats(sellerId?: string) {
    const query = this.orderRepository.createQueryBuilder('order');

    if (sellerId) {
      query.leftJoin('order.items', 'items')
           .leftJoin('items.product', 'product')
           .where('product.sellerId = :sellerId', { sellerId });
    }

    const totalOrders = await query.getCount();

    const returnRequestedOrders = await query.clone()
      .andWhere('order.status = :status', { status: OrderStatus.RETURN_REQUESTED })
      .getCount();

    const refundedOrders = await query.clone()
      .andWhere('order.status = :status', { status: OrderStatus.REFUNDED })
      .getCount();

    const returnRate = totalOrders > 0 ? ((returnRequestedOrders + refundedOrders) / totalOrders) * 100 : 0;

    return {
      totalOrders,
      returnRequested: returnRequestedOrders,
      refunded: refundedOrders,
      returnRate: Math.round(returnRate * 100) / 100, // Round to 2 decimal places
    };
  }
}