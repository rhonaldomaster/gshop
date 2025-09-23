import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { AffiliateLink } from './affiliate-link.entity'

@Entity('affiliate_clicks')
export class AffiliateClick {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  affiliateLinkId: string

  @Column()
  ipAddress: string

  @Column({ nullable: true })
  userAgent: string

  @Column({ nullable: true })
  referer: string

  @Column({ nullable: true })
  country: string

  @Column({ nullable: true })
  city: string

  @Column({ default: false })
  converted: boolean

  @Column({ nullable: true })
  orderId: string

  @CreateDateColumn()
  createdAt: Date

  @ManyToOne(() => AffiliateLink)
  @JoinColumn({ name: 'affiliateLinkId' })
  affiliateLink: AffiliateLink
}