import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm'

@Entity('pixel_events')
@Index(['sellerId', 'eventType', 'createdAt'])
export class PixelEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  sellerId: string

  @Column({ nullable: true })
  userId: string

  @Column({ type: 'enum', enum: ['page_view', 'product_view', 'add_to_cart', 'purchase', 'custom'] })
  eventType: string

  @Column({ nullable: true })
  productId: string

  @Column({ nullable: true })
  orderId: string

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  value: number

  @Column({ nullable: true })
  currency: string

  @Column()
  sessionId: string

  @Column()
  ipAddress: string

  @Column({ nullable: true })
  userAgent: string

  @Column({ nullable: true })
  referer: string

  @Column({ nullable: true })
  url: string

  @Column({ type: 'json', nullable: true })
  customData: any

  @Column({ type: 'json', nullable: true })
  eventData: any

  @Column({ nullable: true })
  country: string

  @Column({ nullable: true })
  city: string

  @CreateDateColumn()
  createdAt: Date

  // Alias for createdAt (for compatibility)
  get timestamp(): Date {
    return this.createdAt;
  }
}