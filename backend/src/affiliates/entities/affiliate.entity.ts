import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { AffiliateVideo } from './affiliate-video.entity'
import { AffiliateFollower } from './affiliate-follower.entity'
import { AffiliateProduct } from './affiliate-product.entity'
import { LiveStream } from '../../live/live.entity'
import { DocumentType } from '../../sellers/entities/seller.entity'

export enum AffiliateStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended'
}

@Entity('affiliates')
export class Affiliate {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  email: string

  @Column()
  passwordHash: string

  @Column()
  name: string

  @Column({ unique: true })
  username: string

  @Column({ nullable: true })
  phone: string

  @Column({
    type: 'enum',
    enum: DocumentType,
    nullable: true
  })
  documentType: DocumentType

  @Column({ nullable: true })
  documentNumber: string

  @Column({ nullable: true })
  website: string

  @Column({ nullable: true })
  socialMedia: string

  @Column({ unique: true })
  affiliateCode: string

  // Profile information
  @Column({ nullable: true })
  avatarUrl: string

  @Column({ nullable: true })
  coverImageUrl: string

  @Column({ type: 'text', nullable: true })
  bio: string

  @Column({ nullable: true })
  location: string

  @Column({ type: 'simple-array', nullable: true })
  categories: string[]

  // Social stats
  @Column({ type: 'int', default: 0 })
  followersCount: number

  @Column({ type: 'int', default: 0 })
  followingCount: number

  @Column({ type: 'int', default: 0 })
  totalViews: number

  @Column({ type: 'int', default: 0 })
  totalSales: number

  @Column({ type: 'int', default: 0 })
  productsPromoted: number

  @Column({ type: 'int', default: 0 })
  videosCount: number

  @Column({ type: 'int', default: 0 })
  liveStreamsCount: number

  // Verification
  @Column({ default: false })
  isVerified: boolean

  @Column({ default: false })
  isProfilePublic: boolean

  // Commercial information
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 5.0 })
  commissionRate: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalEarnings: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  availableBalance: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  pendingBalance: number

  @Column({ type: 'enum', enum: AffiliateStatus, default: AffiliateStatus.PENDING })
  status: AffiliateStatus

  @Column({ default: true })
  isActive: boolean

  @Column({ type: 'timestamp', nullable: true })
  lastActiveAt: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Relations
  @OneToMany(() => AffiliateVideo, video => video.affiliate)
  videos: AffiliateVideo[]

  @OneToMany(() => AffiliateFollower, follower => follower.following)
  followers: AffiliateFollower[]

  @OneToMany(() => AffiliateProduct, product => product.affiliate)
  affiliateProducts: AffiliateProduct[]

  @OneToMany(() => LiveStream, stream => stream.affiliate)
  liveStreams: LiveStream[]
}