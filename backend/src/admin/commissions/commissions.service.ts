import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { Order } from '../../database/entities/order.entity';
import { CommissionFiltersDto, CommissionStatus } from './dto/commission-filters.dto';

@Injectable()
export class CommissionsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  /**
   * Get commissions with filters and pagination
   */
  async getCommissions(filters: CommissionFiltersDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const query = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.commissionInvoice', 'commissionInvoice')
      .where('order.commissionStatus != :status', { status: 'pending' })
      .andWhere('order.deliveredAt IS NOT NULL');

    // Apply filters
    if (filters.startDate) {
      query.andWhere('order.deliveredAt >= :startDate', {
        startDate: new Date(filters.startDate),
      });
    }

    if (filters.endDate) {
      query.andWhere('order.deliveredAt <= :endDate', {
        endDate: new Date(filters.endDate),
      });
    }

    // Note: sellerId filter disabled until seller relation added to Order entity
    // if (filters.sellerId) {
    //   query.andWhere('order.sellerId = :sellerId', {
    //     sellerId: filters.sellerId,
    //   });
    // }

    if (filters.status && filters.status !== CommissionStatus.ALL) {
      query.andWhere('order.commissionStatus = :status', {
        status: filters.status,
      });
    }

    if (filters.search) {
      query.andWhere(
        'order.orderNumber LIKE :search',
        { search: `%${filters.search}%` },
      );
    }

    // Get total count before pagination
    const totalCount = await query.getCount();

    // Apply pagination and order
    query.orderBy('order.deliveredAt', 'DESC').skip(skip).take(limit);

    const orders = await query.getMany();

    // Calculate summary metrics
    const allOrders = await this.orderRepo
      .createQueryBuilder('order')
      .where('order.commissionStatus != :status', { status: 'pending' })
      .andWhere('order.deliveredAt IS NOT NULL')
      .getMany();

    const totalCommissions = allOrders.reduce(
      (sum, o) => sum + (o.sellerCommissionAmount || 0),
      0,
    );
    const invoicedCommissions = allOrders
      .filter((o) => o.commissionStatus === 'invoiced')
      .reduce((sum, o) => sum + (o.sellerCommissionAmount || 0), 0);
    const pendingCommissions = allOrders
      .filter((o) => o.commissionStatus === 'calculated')
      .reduce((sum, o) => sum + (o.sellerCommissionAmount || 0), 0);

    // Map orders to commission data
    const commissions = orders.map((o) => {
      // Calculate subtotal from items (already includes all prices)
      const itemsTotal = o.items.reduce((sum, i) => sum + Number(i.totalPrice), 0);
      const subtotal = itemsTotal - (Number(o.discountAmount) || 0);

      return {
        orderId: o.id,
        orderNumber: o.orderNumber,
        sellerName: 'N/A', // TODO: Add seller relation to Order entity
        deliveredAt: o.deliveredAt,
        subtotal,
        commissionRate: o.sellerCommissionRate || 0,
        commissionAmount: o.sellerCommissionAmount || 0,
        netAmount: o.sellerNetAmount || 0,
        status: o.commissionStatus,
        invoiceId: o.commissionInvoiceId,
        invoiceNumber: o.commissionInvoice?.invoiceNumber || null,
      };
    });

    return {
      commissions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary: {
        totalCommissions,
        invoicedCommissions,
        pendingCommissions,
        totalOrders: allOrders.length,
      },
    };
  }

  /**
   * Generate CSV export
   */
  generateCSV(commissions: any[]): string {
    const headers = [
      'Order Number',
      'Seller',
      'Delivered At',
      'Subtotal',
      'Commission Rate (%)',
      'Commission Amount',
      'Net Amount',
      'Status',
      'Invoice Number',
    ];

    const rows = commissions.map((c) => [
      c.orderNumber,
      c.sellerName,
      new Date(c.deliveredAt).toISOString(),
      c.subtotal.toFixed(2),
      c.commissionRate.toFixed(2),
      c.commissionAmount.toFixed(2),
      c.netAmount.toFixed(2),
      c.status,
      c.invoiceNumber || '-',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Generate Excel export (simple implementation)
   */
  generateExcel(commissions: any[]): string {
    // For a production app, use a library like exceljs
    // This is a simple TSV (Tab-Separated Values) that Excel can open
    const headers = [
      'Order Number',
      'Seller',
      'Delivered At',
      'Subtotal',
      'Commission Rate (%)',
      'Commission Amount',
      'Net Amount',
      'Status',
      'Invoice Number',
    ];

    const rows = commissions.map((c) => [
      c.orderNumber,
      c.sellerName,
      new Date(c.deliveredAt).toISOString(),
      c.subtotal.toFixed(2),
      c.commissionRate.toFixed(2),
      c.commissionAmount.toFixed(2),
      c.netAmount.toFixed(2),
      c.status,
      c.invoiceNumber || '-',
    ]);

    const tsvContent = [headers, ...rows].map((row) => row.join('\t')).join('\n');

    return tsvContent;
  }
}
