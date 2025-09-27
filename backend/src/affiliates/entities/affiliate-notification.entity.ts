import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { Affiliate } from './affiliate.entity'
import { User } from '../../users/user.entity'

export enum NotificationType {
  NEW_FOLLOWER = 'new_follower',
  NEW_VIDEO = 'new_video',
  LIVE_STARTING = 'live_starting',
  NEW_PRODUCT = 'new_product',
  COMMISSION_EARNED = 'commission_earned',
  PAYMENT_RECEIVED = 'payment_received',
  VIDEO_LIKED = 'video_liked',
  VIDEO_COMMENTED = 'video_commented',
  MILESTONE_REACHED = 'milestone_reached'
}

@Entity('affiliate_notifications')
export class AffiliateNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  recipientId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recipientId' })
  recipient: User

  @Column('uuid', { nullable: true })
  triggeredByAffiliateId: string

  @ManyToOne(() => Affiliate, { nullable: true })
  @JoinColumn({ name: 'triggeredByAffiliateId' })
  triggeredByAffiliate: Affiliate

  @Column('uuid', { nullable: true })
  triggeredByUserId: string

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'triggeredByUserId' })
  triggeredByUser: User

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType

  @Column()
  title: string

  @Column({ type: 'text' })
  message: string

  @Column({ type: 'json', nullable: true })
  data: any // Additional data like video ID, product ID, etc.

  @Column({ nullable: true })
  actionUrl: string

  @Column({ default: false })
  isRead: boolean

  @Column({ default: false })
  isEmailSent: boolean

  @Column({ default: false })
  isPushSent: boolean

  @CreateDateColumn()
  createdAt: Date
}