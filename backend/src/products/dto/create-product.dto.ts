
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';
import { ProductStatus, VatType } from '../../database/entities/product.entity';

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 15 Pro Max' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'The latest iPhone with advanced features and stunning design.' })
  @IsString()
  description: string;

  @ApiProperty({ 
    example: 'Premium smartphone with cutting-edge technology.',
    required: false 
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription?: string;

  @ApiProperty({ example: 999.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({
    enum: VatType,
    example: VatType.GENERAL,
    description: 'VAT type: excluido (0%), exento (0%), reducido (5%), general (19%)',
    default: VatType.GENERAL
  })
  @IsOptional()
  @IsEnum(VatType)
  vatType?: VatType;

  @ApiProperty({ example: 1199.99, required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  comparePrice?: number;

  @ApiProperty({ example: 500.00, required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costPerItem?: number;

  @ApiProperty({ example: 'IPH15PM-128-BLK' })
  @IsString()
  sku: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  trackQuantity: boolean;

  @ApiProperty({ example: 0.240, required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  weight?: number;

  @ApiProperty({
    example: [
      'https://i.pinimg.com/736x/12/6c/ea/126cea1de6c952d7c913e125c80e75d2.jpg',
      'https://i.pinimg.com/564x/fe/86/ef/fe86ef07ea9afa5939fa5cc401a2a15c.jpg'
    ],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({
    example: [
      {
        name: 'Color',
        options: ['Black', 'White', 'Blue'],
        required: true
      },
      {
        name: 'Storage',
        options: ['128GB', '256GB', '512GB'],
        required: true
      }
    ],
    required: false
  })
  @IsOptional()
  @IsArray()
  variants?: any[];

  @ApiProperty({
    example: ['smartphone', 'apple', 'iphone', 'premium'],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ enum: ProductStatus, example: ProductStatus.DRAFT })
  @IsEnum(ProductStatus)
  status: ProductStatus;

  @ApiProperty({ example: true })
  @IsBoolean()
  isVisible: boolean;

  @ApiProperty({
    example: {
      title: 'iPhone 15 Pro Max - Premium Smartphone',
      description: 'Buy the latest iPhone 15 Pro Max with advanced features.',
      keywords: ['iphone', 'smartphone', 'apple', 'premium']
    },
    required: false
  })
  @IsOptional()
  seoData?: any;

  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Seller ID (Admin only - if not provided, uses authenticated user ID)',
    required: false
  })
  @IsOptional()
  @IsUUID()
  sellerId?: string;
}
