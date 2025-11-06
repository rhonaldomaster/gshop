import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoicingService } from './invoicing.service';
import { InvoicingController } from './invoicing.controller';
import { InvoicingListener } from './invoicing.listener';
import { Invoice } from '../database/entities/invoice.entity';
import { Order } from '../database/entities/order.entity';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, Order]),
    ConfigModule, // Import ConfigModule to use ConfigService
  ],
  controllers: [InvoicingController],
  providers: [InvoicingService, InvoicingListener],
  exports: [InvoicingService], // Export for use in other modules
})
export class InvoicingModule {}
