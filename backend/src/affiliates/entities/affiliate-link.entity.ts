import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { Affiliate } from './affiliate.entity'

@Entity('affiliate_links')
export class AffiliateLink {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  affiliateId: string

  @Column({ nullable: true })
  productId: string

  @Column({ nullable: true })
  sellerId: string

  @Column()
  originalUrl: string

  @Column({ unique: true })
  shortCode: string

  @Column()
  fullUrl: string

  @Column({ default: 0 })
  clicks: number

  @Column({ default: 0 })
  conversions: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  revenue: number

  @Column({ default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @ManyToOne(() => Affiliate)
  @JoinColumn({ name: 'affiliateId' })
  affiliate: Affiliate
}