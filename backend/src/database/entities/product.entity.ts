
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import { Category } from './category.entity';
import { OrderItem } from './order-item.entity';

export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
}

export enum VatType {
  EXCLUIDO = 'excluido',    // 0% - No tax deduction rights
  EXENTO = 'exento',        // 0% - With tax deduction rights
  REDUCIDO = 'reducido',    // 5%
  GENERAL = 'general',      // 19%
}

export const VAT_RATES = {
  [VatType.EXCLUIDO]: 0,
  [VatType.EXENTO]: 0,
  [VatType.REDUCIDO]: 0.05,
  [VatType.GENERAL]: 0.19,
};

@Entity('products')
export class Product {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column({ unique: true })
  slug: string;

  @ApiProperty()
  @Column('text')
  description: string;

  @ApiProperty()
  @Column('text', { nullable: true })
  shortDescription: string;

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @ApiProperty({ enum: VatType })
  @Column({
    type: 'enum',
    enum: VatType,
    default: VatType.GENERAL,
  })
  vatType: VatType;

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  basePrice: number; // Price without VAT

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  vatAmount: number; // VAT amount included

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  comparePrice: number;

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  costPerItem: number;

  @ApiProperty()
  @Column()
  sku: string;

  @ApiProperty()
  @Column('int', { default: 0 })
  quantity: number;

  // Alias for quantity (for compatibility)
  get stock(): number {
    return this.quantity;
  }

  set stock(value: number) {
    this.quantity = value;
  }

  @ApiProperty()
  @Column({ default: true })
  trackQuantity: boolean;

  @ApiProperty()
  @Column({ nullable: true })
  barcode: string;

  @ApiProperty()
  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  weight: number;

  @ApiProperty()
  @Column('json', { nullable: true })
  images: string[];

  @ApiProperty()
  @Column('json', { nullable: true })
  variants: any[];

  @ApiProperty()
  @Column('simple-array', { nullable: true })
  tags: string[];

  @ApiProperty({ enum: ProductStatus })
  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  status: ProductStatus;

  @ApiProperty()
  @Column({ default: true })
  isVisible: boolean;

  // Alias for status === 'active' (for compatibility)
  get isActive(): boolean {
    return this.status === ProductStatus.ACTIVE;
  }

  @ApiProperty()
  @Column('json', { nullable: true })
  seoData: any;

  @ApiProperty()
  @Column('int', { default: 0 })
  viewsCount: number;

  @ApiProperty()
  @Column('int', { default: 0 })
  ordersCount: number;

  @ApiProperty()
  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  rating: number;

  @ApiProperty()
  @Column('int', { default: 0 })
  reviewsCount: number;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.products)
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @Column()
  sellerId: string;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  categoryId: string;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems: OrderItem[];

  /**
   * Calculate prices automatically based on vatType
   * @param priceWithVat - Final price including VAT
   */
  calculatePrices(priceWithVat: number): void {
    const vatRate = VAT_RATES[this.vatType];
    // Price with VAT / (1 + VAT rate) = Base price
    this.basePrice = priceWithVat / (1 + vatRate);
    this.vatAmount = priceWithVat - this.basePrice;
    this.price = priceWithVat;
  }

  /**
   * Get VAT information for this product
   */
  getVatInfo(): {
    type: VatType;
    rate: number;
    basePrice: number;
    vatAmount: number;
    finalPrice: number;
  } {
    return {
      type: this.vatType,
      rate: VAT_RATES[this.vatType],
      basePrice: this.basePrice,
      vatAmount: this.vatAmount,
      finalPrice: this.price,
    };
  }
}
