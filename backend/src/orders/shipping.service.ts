import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../database/entities/order.entity';
import { Seller, ShippingType } from '../sellers/entities/seller.entity';
import { SellerLocation } from '../sellers/entities/seller-location.entity';

@Injectable()
export class ShippingService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Seller)
    private sellersRepository: Repository<Seller>,
    @InjectRepository(SellerLocation)
    private locationsRepository: Repository<SellerLocation>,
  ) {}

  /**
   * Calcula el costo de envío basado en la ubicación del comprador
   * y las ubicaciones del vendedor (múltiples ubicaciones soportadas)
   */
  async calculateShippingCost(
    sellerId: string,
    buyerCity: string,
    buyerState: string,
    orderTotal: number,
  ): Promise<{
    shippingType: ShippingType;
    shippingCost: number;
    isFree: boolean;
  }> {
    const seller = await this.sellersRepository.findOne({
      where: { id: sellerId }
    });

    if (!seller) {
      throw new NotFoundException('Vendedor no encontrado');
    }

    // Obtener todas las ubicaciones del vendedor
    const sellerLocations = await this.locationsRepository.find({
      where: { sellerId }
    });

    // Determinar si es envío local comparando con TODAS las ubicaciones del vendedor
    const isLocal = sellerLocations.some(
      location =>
        location.city?.toLowerCase().trim() === buyerCity?.toLowerCase().trim() &&
        location.state?.toLowerCase().trim() === buyerState?.toLowerCase().trim()
    );

    const shippingType = isLocal ? ShippingType.LOCAL : ShippingType.NATIONAL;
    let shippingCost = isLocal
      ? Number(seller.shippingLocalPrice)
      : Number(seller.shippingNationalPrice);

    // Verificar envío gratis
    let isFree = false;
    if (
      seller.shippingFreeEnabled &&
      seller.shippingFreeMinAmount &&
      orderTotal >= Number(seller.shippingFreeMinAmount)
    ) {
      shippingCost = 0;
      isFree = true;
    }

    return {
      shippingType,
      shippingCost,
      isFree,
    };
  }

  /**
   * Agrega información de tracking a una orden
   */
  async addTracking(
    orderId: string,
    trackingUrl: string,
    trackingNumber: string,
    carrier: string,
    notes?: string,
  ): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId }
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    order.shippingTrackingUrl = trackingUrl;
    order.shippingTrackingNumber = trackingNumber;
    order.shippingCarrier = carrier;
    order.shippingNotes = notes;

    // Actualizar estado de la orden
    if (order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.PROCESSING) {
      order.status = OrderStatus.SHIPPED;
    }

    return this.ordersRepository.save(order);
  }

  /**
   * Obtiene información de tracking de una orden
   */
  async getTracking(orderId: string): Promise<{
    trackingUrl?: string;
    trackingNumber?: string;
    carrier?: string;
    notes?: string;
    status: string;
  }> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId }
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    return {
      trackingUrl: order.shippingTrackingUrl,
      trackingNumber: order.shippingTrackingNumber,
      carrier: order.shippingCarrier,
      notes: order.shippingNotes,
      status: order.status,
    };
  }
}
