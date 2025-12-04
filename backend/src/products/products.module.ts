
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { ProductsUploadService } from './products-upload.service';
import { Product } from '../database/entities/product.entity';
import { Category } from '../database/entities/category.entity';
import { OrderItem } from '../database/entities/order-item.entity';
import { PixelEvent } from '../pixel/entities/pixel-event.entity';
import { StorageModule } from '../common/storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category, OrderItem, PixelEvent]),
    StorageModule,
    MulterModule.register({
      storage: memoryStorage(), // Store in memory, will be handled by StorageService
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
      },
    }),
  ],
  controllers: [ProductsController, CategoriesController],
  providers: [ProductsService, CategoriesService, ProductsUploadService],
  exports: [ProductsService, CategoriesService, ProductsUploadService],
})
export class ProductsModule {}
