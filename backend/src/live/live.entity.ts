import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Seller } from '../sellers/seller.entity';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';

export enum StreamStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  ENDED = 'ended',
  CANCELLED = 'cancelled'
}

@Entity('live_streams')
export class LiveStream {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ type: 'enum', enum: StreamStatus, default: StreamStatus.SCHEDULED })
  status: StreamStatus;

  @Column({ nullable: true })
  streamKey: string;

  @Column({ nullable: true })
  rtmpUrl: string;

  @Column({ nullable: true })
  hlsUrl: string;

  @Column('int', { default: 0 })
  viewerCount: number;

  @Column('int', { default: 0 })
  peakViewers: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalSales: number;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date;

  @Column('uuid')
  sellerId: string;

  @ManyToOne(() => Seller)
  @JoinColumn({ name: 'sellerId' })
  seller: Seller;

  @OneToMany(() => LiveStreamProduct, product => product.stream)
  products: LiveStreamProduct[];

  @OneToMany(() => LiveStreamMessage, message => message.stream)
  messages: LiveStreamMessage[];

  @OneToMany(() => LiveStreamViewer, viewer => viewer.stream)
  viewers: LiveStreamViewer[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('live_stream_products')
export class LiveStreamProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  streamId: string;

  @ManyToOne(() => LiveStream, stream => stream.products)
  @JoinColumn({ name: 'streamId' })
  stream: LiveStream;

  @Column('uuid')
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  specialPrice: number;

  @Column('int', { default: 0 })
  orderCount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  revenue: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  addedAt: Date;
}

@Entity('live_stream_messages')
export class LiveStreamMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  streamId: string;

  @ManyToOne(() => LiveStream, stream => stream.messages)
  @JoinColumn({ name: 'streamId' })
  stream: LiveStream;

  @Column('uuid', { nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  username: string;

  @Column('text')
  message: string;

  @CreateDateColumn()
  sentAt: Date;
}

@Entity('live_stream_viewers')
export class LiveStreamViewer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  streamId: string;

  @ManyToOne(() => LiveStream, stream => stream.viewers)
  @JoinColumn({ name: 'streamId' })
  stream: LiveStream;

  @Column('uuid', { nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  sessionId: string;

  @Column()
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  joinedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  leftAt: Date;
}