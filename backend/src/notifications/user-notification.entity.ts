import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../database/entities/user.entity';

export enum NotificationType {
  ORDER = 'order',
  PROMOTION = 'promotion',
  SYSTEM = 'system',
  LIVE = 'live',
  PRICE_DROP = 'price_drop',
}

@Entity('user_notifications')
@Index(['userId', 'isRead'])
@Index(['userId', 'createdAt'])
export class UserNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM,
  })
  type: NotificationType;

  @Column({ default: false })
  isRead: boolean;

  @Column('jsonb', { nullable: true })
  data: Record<string, any>;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  actionUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
