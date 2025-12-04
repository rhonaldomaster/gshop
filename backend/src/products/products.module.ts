
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { ProductsUploadService } from './products-upload.service';
import { Product } from '../database/entities/product.entity';
import { Category } from '../database/entities/category.entity';
import { OrderItem } from '../database/entities/order-item.entity';
import { PixelEvent } from '../pixel/entities/pixel-event.entity';

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category, OrderItem, PixelEvent]),
    MulterModule.register({
      storage: diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          const sanitizedName = file.originalname
            .replace(ext, '')
            .replace(/[^a-zA-Z0-9]/g, '-')
            .toLowerCase();
          cb(null, `product-${sanitizedName}-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  ],
  controllers: [ProductsController, CategoriesController],
  providers: [ProductsService, CategoriesService, ProductsUploadService],
  exports: [ProductsService, CategoriesService, ProductsUploadService],
})
export class ProductsModule {}
