import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Seller } from '../sellers/entities/seller.entity';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';
import { Affiliate } from '../affiliates/entities/affiliate.entity';

export enum StreamStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  ENDED = 'ended',
  CANCELLED = 'cancelled'
}

export enum HostType {
  SELLER = 'seller',
  AFFILIATE = 'affiliate'
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

  @Column({ type: 'enum', enum: HostType, default: HostType.SELLER })
  hostType: HostType;

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

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ nullable: true })
  ivsChannelArn: string;

  @Column({ nullable: true })
  category: string;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column('int', { default: 0 })
  likesCount: number;

  @Column('int', { default: 0 })
  sharesCount: number;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date;

  @Column('uuid', { nullable: true })
  sellerId: string;

  @ManyToOne(() => Seller, { nullable: true })
  @JoinColumn({ name: 'sellerId' })
  seller: Seller;

  @Column('uuid', { nullable: true })
  affiliateId: string;

  @ManyToOne(() => Affiliate, { nullable: true })
  @JoinColumn({ name: 'affiliateId' })
  affiliate: Affiliate;

  @OneToMany(() => LiveStreamProduct, product => product.stream)
  products: LiveStreamProduct[];

  @OneToMany(() => LiveStreamMessage, message => message.stream)
  messages: LiveStreamMessage[];

  @OneToMany(() => LiveStreamViewer, viewer => viewer.stream)
  viewers: LiveStreamViewer[];

  @OneToMany('LiveStreamVod', 'stream')
  vods: any[];

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

  @Column({ default: false })
  isHighlighted: boolean;

  @Column('int', { nullable: true })
  position: number;

  @Column({ type: 'timestamp', nullable: true })
  highlightedAt: Date;

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

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ nullable: true })
  deletedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;

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

  @Column({ default: false })
  isBanned: boolean;

  @Column({ type: 'timestamp', nullable: true })
  timeoutUntil: Date;

  @Column({ nullable: true })
  bannedBy: string;

  @Column('text', { nullable: true })
  banReason: string;

  @CreateDateColumn()
  joinedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  leftAt: Date;
}

export enum ReactionType {
  LIKE = 'like',
  HEART = 'heart',
  FIRE = 'fire',
  CLAP = 'clap',
  LAUGH = 'laugh',
  WOW = 'wow',
}

@Entity('live_stream_reactions')
export class LiveStreamReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  streamId: string;

  @ManyToOne(() => LiveStream)
  @JoinColumn({ name: 'streamId' })
  stream: LiveStream;

  @Column('uuid', { nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  sessionId: string;

  @Column({ type: 'enum', enum: ReactionType })
  type: ReactionType;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('live_stream_metrics')
export class LiveStreamMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  streamId: string;

  @ManyToOne(() => LiveStream)
  @JoinColumn({ name: 'streamId' })
  stream: LiveStream;

  @Column('int')
  viewerCount: number;

  @Column('int')
  messagesPerMinute: number;

  @Column('int')
  reactionsCount: number;

  @Column('int')
  purchasesCount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  revenue: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  conversionRate: number;

  @Column('int', { nullable: true })
  avgWatchTimeSeconds: number;

  @CreateDateColumn()
  recordedAt: Date;
}