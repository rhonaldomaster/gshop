import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm'
import { Affiliate } from './affiliate.entity'
import { Product } from '../../products/product.entity'

export enum VideoStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  REPORTED = 'reported',
  REMOVED = 'removed'
}

export enum VideoType {
  ORGANIC = 'organic',
  PROMOTIONAL = 'promotional',
  REVIEW = 'review',
  UNBOXING = 'unboxing',
  TUTORIAL = 'tutorial'
}

@Entity('affiliate_videos')
export class AffiliateVideo {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  affiliateId: string

  @ManyToOne(() => Affiliate)
  @JoinColumn({ name: 'affiliateId' })
  affiliate: Affiliate

  @Column()
  title: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column()
  videoUrl: string

  @Column({ nullable: true })
  thumbnailUrl: string

  @Column({ type: 'int', default: 0 })
  duration: number // in seconds

  @Column({ type: 'enum', enum: VideoType, default: VideoType.ORGANIC })
  type: VideoType

  @Column({ type: 'enum', enum: VideoStatus, default: VideoStatus.DRAFT })
  status: VideoStatus

  @Column({ type: 'simple-array', nullable: true })
  tags: string[]

  @Column({ type: 'simple-array', nullable: true })
  hashtags: string[]

  // Engagement metrics
  @Column({ type: 'int', default: 0 })
  views: number

  @Column({ type: 'int', default: 0 })
  likes: number

  @Column({ type: 'int', default: 0 })
  comments: number

  @Column({ type: 'int', default: 0 })
  shares: number

  @Column({ type: 'int', default: 0 })
  clicks: number

  @Column({ type: 'int', default: 0 })
  purchases: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  revenue: number

  // Video settings
  @Column({ default: true })
  allowComments: boolean

  @Column({ default: true })
  allowSharing: boolean

  @Column({ default: true })
  isPublic: boolean

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Relations
  @OneToMany(() => AffiliateVideoProduct, product => product.video)
  taggedProducts: AffiliateVideoProduct[]

  @OneToMany(() => VideoInteraction, interaction => interaction.video)
  interactions: VideoInteraction[]
}

@Entity('affiliate_video_products')
export class AffiliateVideoProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  videoId: string

  @ManyToOne(() => AffiliateVideo, video => video.taggedProducts)
  @JoinColumn({ name: 'videoId' })
  video: AffiliateVideo

  @Column('uuid')
  productId: string

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  specialPrice: number

  @Column({ type: 'int', nullable: true })
  timestampStart: number // in seconds

  @Column({ type: 'int', nullable: true })
  timestampEnd: number

  @Column({ type: 'int', default: 0 })
  clicks: number

  @Column({ type: 'int', default: 0 })
  purchases: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  revenue: number

  @CreateDateColumn()
  taggedAt: Date
}

@Entity('video_interactions')
export class VideoInteraction {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  videoId: string

  @ManyToOne(() => AffiliateVideo, video => video.interactions)
  @JoinColumn({ name: 'videoId' })
  video: AffiliateVideo

  @Column('uuid', { nullable: true })
  userId: string

  @Column()
  sessionId: string

  @Column({ type: 'enum', enum: ['view', 'like', 'comment', 'share', 'product_click'], default: 'view' })
  type: string

  @Column({ type: 'text', nullable: true })
  content: string // for comments

  @Column({ type: 'int', nullable: true })
  watchDuration: number // how long they watched

  @Column({ nullable: true })
  ipAddress: string

  @Column({ nullable: true })
  userAgent: string

  @CreateDateColumn()
  createdAt: Date
}