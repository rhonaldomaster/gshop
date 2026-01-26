import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm'
import { Seller } from './seller.entity'
import { User } from '../../database/entities/user.entity'

@Entity('seller_followers')
@Unique(['followerId', 'sellerId'])
@Index(['sellerId', 'createdAt'])
@Index(['followerId', 'createdAt'])
export class SellerFollower {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  followerId: string

  @Column('uuid')
  sellerId: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followerId' })
  follower: User

  @ManyToOne(() => Seller, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sellerId' })
  seller: Seller

  @Column({ default: true })
  notificationsEnabled: boolean

  @Column({ default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date
}
