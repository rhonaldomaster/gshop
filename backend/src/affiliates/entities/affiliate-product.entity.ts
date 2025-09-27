import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm'
import { Affiliate } from './affiliate.entity'
import { Product } from '../../products/product.entity'
import { Seller } from '../../sellers/entities/seller.entity'

export enum AffiliateProductStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  EXPIRED = 'expired',
  REJECTED = 'rejected'
}

@Entity('affiliate_products')
@Unique(['affiliateId', 'productId'])
export class AffiliateProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  affiliateId: string

  @ManyToOne(() => Affiliate)
  @JoinColumn({ name: 'affiliateId' })
  affiliate: Affiliate

  @Column('uuid')
  productId: string

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product

  @Column('uuid')
  sellerId: string

  @ManyToOne(() => Seller)
  @JoinColumn({ name: 'sellerId' })
  seller: Seller

  @Column({ type: 'enum', enum: AffiliateProductStatus, default: AffiliateProductStatus.ACTIVE })
  status: AffiliateProductStatus

  // Custom commission rate for this specific product (overrides affiliate's default)
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  customCommissionRate: number

  // Promotional details
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  specialPrice: number

  @Column({ type: 'text', nullable: true })
  promotionalText: string

  @Column({ type: 'timestamp', nullable: true })
  promoStartDate: Date

  @Column({ type: 'timestamp', nullable: true })
  promoEndDate: Date

  // Performance metrics
  @Column({ type: 'int', default: 0 })
  totalClicks: number

  @Column({ type: 'int', default: 0 })
  totalSales: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalRevenue: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalCommissions: number

  // Approval workflow
  @Column({ default: false })
  requiresApproval: boolean

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date

  @Column('uuid', { nullable: true })
  approvedBy: string

  @Column({ type: 'text', nullable: true })
  rejectionReason: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}