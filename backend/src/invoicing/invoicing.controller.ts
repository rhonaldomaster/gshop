import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { InvoicingService } from './invoicing.service';
import { InvoiceStatus } from '../database/entities/invoice.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';

@ApiTags('Invoicing')
@Controller('api/v1/invoicing')
export class InvoicingController {
  constructor(private readonly invoicingService: InvoicingService) {}

  /**
   * Get invoice by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({ status: 200, description: 'Returns invoice' })
  async getInvoiceById(@Param('id') id: string) {
    return this.invoicingService.getInvoiceById(id);
  }

  /**
   * Get invoice by number
   */
  @Get('number/:invoiceNumber')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get invoice by number' })
  @ApiResponse({ status: 200, description: 'Returns invoice' })
  async getInvoiceByNumber(@Param('invoiceNumber') invoiceNumber: string) {
    return this.invoicingService.getInvoiceByNumber(invoiceNumber);
  }

  /**
   * Get invoices by order
   */
  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all invoices for an order' })
  @ApiResponse({ status: 200, description: 'Returns invoices' })
  async getInvoicesByOrder(@Param('orderId') orderId: string) {
    return this.invoicingService.getInvoicesByOrder(orderId);
  }

  /**
   * Get invoices by seller (for seller dashboard)
   */
  @Get('seller/:sellerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get invoices for a seller' })
  @ApiResponse({ status: 200, description: 'Returns seller invoices' })
  async getInvoicesBySeller(
    @Param('sellerId') sellerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: InvoiceStatus,
  ) {
    const options = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status,
    };

    return this.invoicingService.getInvoicesBySeller(sellerId, options);
  }

  /**
   * Download invoice PDF
   */
  @Get(':id/pdf')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download invoice PDF' })
  @ApiResponse({ status: 200, description: 'Returns PDF file' })
  async downloadInvoicePDF(@Param('id') id: string, @Res() res: Response) {
    const invoice = await this.invoicingService.getInvoiceById(id);
    const pdfBuffer = await this.invoicingService.generateInvoicePDF(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=factura_${invoice.invoiceNumber}.pdf`,
    );

    res.status(HttpStatus.OK).send(pdfBuffer);
  }

  /**
   * Mark invoice as paid (admin only)
   */
  @Put(':id/mark-paid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark invoice as paid (admin only)' })
  @ApiResponse({ status: 200, description: 'Invoice marked as paid' })
  async markInvoiceAsPaid(
    @Param('id') id: string,
    @Query('paymentMethod') paymentMethod: string,
  ) {
    return this.invoicingService.markInvoiceAsPaid(id, paymentMethod);
  }

  /**
   * Cancel invoice (admin only)
   */
  @Put(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel invoice (admin only)' })
  @ApiResponse({ status: 200, description: 'Invoice cancelled' })
  async cancelInvoice(@Param('id') id: string) {
    return this.invoicingService.cancelInvoice(id);
  }

  /**
   * Update invoice status (admin only)
   */
  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update invoice status (admin only)' })
  @ApiResponse({ status: 200, description: 'Invoice status updated' })
  async updateInvoiceStatus(
    @Param('id') id: string,
    @Query('status') status: InvoiceStatus,
  ) {
    return this.invoicingService.updateInvoiceStatus(id, status);
  }
}
