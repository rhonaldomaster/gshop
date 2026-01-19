import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

/**
 * StreamerFollow Entity
 *
 * Tracks users following sellers/affiliates for live stream notifications.
 * When a followed streamer goes live, followers receive push notifications.
 */
@Entity('streamer_follows')
@Unique(['followerId', 'streamerId'])
@Index(['streamerId', 'createdAt'])
@Index(['followerId', 'createdAt'])
export class StreamerFollow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  followerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followerId' })
  follower: User;

  @Column('uuid')
  streamerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'streamerId' })
  streamer: User;

  @Column({ default: true })
  notificationsEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
