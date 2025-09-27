import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm'
import { Affiliate } from './affiliate.entity'
import { User } from '../../users/user.entity'

@Entity('affiliate_followers')
@Unique(['followerId', 'followingId'])
export class AffiliateFollower {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  followerId: string

  @Column('uuid')
  followingId: string

  // The user who follows (can be regular user or another affiliate)
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'followerId' })
  followerUser: User

  // The affiliate being followed
  @ManyToOne(() => Affiliate)
  @JoinColumn({ name: 'followingId' })
  following: Affiliate

  @Column({ default: true })
  isActive: boolean

  @Column({ default: true })
  receiveNotifications: boolean

  @CreateDateColumn()
  createdAt: Date
}