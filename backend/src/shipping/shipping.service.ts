import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../database/entities/order.entity';
import { EasyPostService } from './easypost.service';
import { GetShippingRatesDto, ConfirmShippingDto, ShippingOptionDto } from './dto';

@Injectable()
export class ShippingService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private easyPostService: EasyPostService,
  ) {}

  async getShippingOptions(orderId: string, ratesDto: GetShippingRatesDto): Promise<ShippingOptionDto[]> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Calculate total weight and dimensions based on products
    const totalWeight = order.items.reduce((total, item) => {
      // Assuming each product has weight in grams, convert to ounces for EasyPost
      const weightInOunces = (item.product?.weight || 0.1) * 0.035274;
      return total + (weightInOunces * item.quantity);
    }, 0);

    // Use provided dimensions or calculate default based on items
    const parcel = {
      length: ratesDto.packageDimensions?.length || 10,
      width: ratesDto.packageDimensions?.width || 8,
      height: ratesDto.packageDimensions?.height || 6,
      weight: Math.max(totalWeight, 0.1), // Minimum weight
    };

    // Default from address (seller's warehouse)
    const fromAddress = {
      name: 'GSHOP Fulfillment Center',
      street1: 'Calle 72 #10-07',
      city: 'Bogotá',
      state: 'Cundinamarca',
      zip: '110111',
      country: 'CO',
      phone: '+57 1 234 5678',
    };

    const toAddress = {
      name: `${ratesDto.shippingAddress.firstName} ${ratesDto.shippingAddress.lastName}`,
      street1: ratesDto.shippingAddress.address1,
      street2: ratesDto.shippingAddress.address2,
      city: ratesDto.shippingAddress.city,
      state: ratesDto.shippingAddress.state,
      zip: ratesDto.shippingAddress.postalCode,
      country: ratesDto.shippingAddress.country,
      phone: ratesDto.shippingAddress.phone,
    };

    const rates = await this.easyPostService.getShippingRates(fromAddress, toAddress, parcel);

    // Store shipping options and package dimensions in the order
    await this.orderRepository.update(orderId, {
      shippingOptions: rates,
      packageDimensions: ratesDto.packageDimensions,
    });

    return rates;
  }

  async confirmShipping(orderId: string, confirmDto: ConfirmShippingDto): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.CONFIRMED && order.status !== OrderStatus.PROCESSING) {
      throw new BadRequestException('Order must be confirmed before shipping can be set up');
    }

    // Create shipment if EasyPost rate ID is provided
    let trackingNumber = null;
    let easypostShipmentId = null;

    if (confirmDto.easypostRateId) {
      try {
        const shipment = await this.easyPostService.createShipment(confirmDto.easypostRateId);
        trackingNumber = shipment.trackingCode;
        easypostShipmentId = shipment.easypostShipmentId;
      } catch (error) {
        // Continue with manual tracking if EasyPost fails
        trackingNumber = `MANUAL_${Date.now()}`;
      }
    }

    // Update order with shipping information
    const updatedOrder = await this.orderRepository.save({
      ...order,
      status: OrderStatus.IN_TRANSIT,
      shippingCarrier: confirmDto.selectedCarrier,
      courierService: confirmDto.selectedService,
      shippingCost: confirmDto.selectedRate,
      trackingNumber: trackingNumber || `${confirmDto.selectedCarrier.toUpperCase()}_${Date.now()}`,
      easypostShipmentId,
      customerDocument: confirmDto.customerDocument,
      estimatedDeliveryDate: this.calculateEstimatedDelivery(confirmDto.selectedService),
    });

    return updatedOrder;
  }

  async updateShippingStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updatedOrder = await this.orderRepository.save({
      ...order,
      status,
      deliveredAt: status === OrderStatus.DELIVERED ? new Date() : null,
    });

    return updatedOrder;
  }

  async getTrackingInfo(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!order.trackingNumber) {
      return {
        status: order.status,
        message: 'Tracking information not available yet',
      };
    }

    // Get tracking info from EasyPost if available
    let trackingInfo = null;
    if (order.easypostShipmentId) {
      trackingInfo = await this.easyPostService.getTrackingInfo(order.trackingNumber);
    }

    return {
      orderId: order.id,
      trackingNumber: order.trackingNumber,
      carrier: order.shippingCarrier,
      service: order.courierService,
      status: order.status,
      estimatedDelivery: order.estimatedDeliveryDate,
      deliveredAt: order.deliveredAt,
      trackingInfo,
    };
  }

  private calculateEstimatedDelivery(service: string): Date {
    const today = new Date();
    let daysToAdd = 5; // Default 5 days

    if (service.toLowerCase().includes('express') || service.toLowerCase().includes('1 day')) {
      daysToAdd = 1;
    } else if (service.toLowerCase().includes('2 day') || service.toLowerCase().includes('overnight')) {
      daysToAdd = 2;
    } else if (service.toLowerCase().includes('3 day')) {
      daysToAdd = 3;
    }

    today.setDate(today.getDate() + daysToAdd);
    return today;
  }
}