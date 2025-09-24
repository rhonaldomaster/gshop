import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Product } from '../products/product.entity';

export enum MarketplaceSellerStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  SUSPENDED = 'suspended',
  BANNED = 'banned'
}

export enum ShippingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

@Entity('marketplace_sellers')
export class MarketplaceSeller {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  storeName: string;

  @Column('text', { nullable: true })
  storeDescription: string;

  @Column({ nullable: true })
  storeLogoUrl: string;

  @Column({ nullable: true })
  storeBannerUrl: string;

  @Column()
  businessName: string;

  @Column()
  businessAddress: string;

  @Column()
  taxId: string;

  @Column()
  phoneNumber: string;

  @Column({ type: 'enum', enum: MarketplaceSellerStatus, default: MarketplaceSellerStatus.PENDING })
  status: MarketplaceSellerStatus;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  averageRating: number;

  @Column('int', { default: 0 })
  totalReviews: number;

  @Column('int', { default: 0 })
  totalSales: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalRevenue: number;

  @Column('json', { nullable: true })
  shippingSettings: any;

  @Column('json', { nullable: true })
  paymentSettings: any;

  @OneToMany(() => MarketplaceProduct, product => product.seller)
  products: MarketplaceProduct[];

  @OneToMany(() => Review, review => review.seller)
  reviews: Review[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('marketplace_products')
export class MarketplaceProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  sellerId: string;

  @ManyToOne(() => MarketplaceSeller, seller => seller.products)
  @JoinColumn({ name: 'sellerId' })
  seller: MarketplaceSeller;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  comparePrice: number;

  @Column()
  category: string;

  @Column('json')
  images: string[];

  @Column('json', { nullable: true })
  specifications: any;

  @Column('int', { default: 0 })
  stock: number;

  @Column('int', { default: 0 })
  soldCount: number;

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column('int', { default: 0 })
  reviewCount: number;

  @Column('int', { default: 0 })
  viewCount: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  weight: number;

  @Column('json', { nullable: true })
  dimensions: any;

  @Column('varchar', { length: 50, nullable: true })
  sku: string;

  @Column('varchar', { length: 50, nullable: true })
  barcode: string;

  @OneToMany(() => Review, review => review.product)
  reviews: Review[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid', { nullable: true })
  productId: string;

  @ManyToOne(() => MarketplaceProduct, product => product.reviews, { nullable: true })
  @JoinColumn({ name: 'productId' })
  product: MarketplaceProduct;

  @Column('uuid', { nullable: true })
  sellerId: string;

  @ManyToOne(() => MarketplaceSeller, seller => seller.reviews, { nullable: true })
  @JoinColumn({ name: 'sellerId' })
  seller: MarketplaceSeller;

  @Column('int', { comment: 'Rating from 1 to 5' })
  rating: number;

  @Column('text', { nullable: true })
  comment: string;

  @Column('json', { nullable: true })
  images: string[];

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isHelpful: boolean;

  @Column('int', { default: 0 })
  helpfulCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  productId: string;

  @ManyToOne(() => MarketplaceProduct)
  @JoinColumn({ name: 'productId' })
  product: MarketplaceProduct;

  @Column('int')
  quantity: number;

  @Column('int', { default: 0 })
  reserved: number;

  @Column('int', { default: 10 })
  lowStockThreshold: number;

  @Column('varchar', { length: 100, nullable: true })
  warehouse: string;

  @Column('varchar', { length: 50, nullable: true })
  location: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('shipping')
export class Shipping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  orderId: string;

  @Column('uuid')
  sellerId: string;

  @ManyToOne(() => MarketplaceSeller)
  @JoinColumn({ name: 'sellerId' })
  seller: MarketplaceSeller;

  @Column({ type: 'enum', enum: ShippingStatus, default: ShippingStatus.PENDING })
  status: ShippingStatus;

  @Column({ nullable: true })
  trackingNumber: string;

  @Column({ nullable: true })
  carrier: string;

  @Column('json')
  shippingAddress: any;

  @Column('decimal', { precision: 8, scale: 2 })
  shippingCost: number;

  @Column({ type: 'timestamp', nullable: true })
  shippedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  estimatedDelivery: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}