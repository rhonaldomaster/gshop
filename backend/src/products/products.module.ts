
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { Product } from '../database/entities/product.entity';
import { Category } from '../database/entities/category.entity';
import { OrderItem } from '../database/entities/order-item.entity';
import { PixelEvent } from '../pixel/entities/pixel-event.entity';
import { Review } from '../marketplace/marketplace.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category, OrderItem, PixelEvent, Review])],
  controllers: [ProductsController, CategoriesController],
  providers: [ProductsService, CategoriesService],
  exports: [ProductsService, CategoriesService],
})
export class ProductsModule {}
