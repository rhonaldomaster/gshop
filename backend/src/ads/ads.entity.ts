import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Seller } from '../sellers/seller.entity';

export enum CampaignType {
  DPA = 'dpa',
  RETARGETING = 'retargeting',
  CUSTOM = 'custom'
}

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed'
}

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: CampaignType })
  type: CampaignType;

  @Column({ type: 'enum', enum: CampaignStatus, default: CampaignStatus.DRAFT })
  status: CampaignStatus;

  @Column('text', { nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  budget: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  dailyBudget: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  spent: number;

  @Column('json', { nullable: true })
  targetAudience: any;

  @Column('json', { nullable: true })
  creative: any;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column('uuid')
  sellerId: string;

  @ManyToOne(() => Seller)
  @JoinColumn({ name: 'sellerId' })
  seller: Seller;

  @OneToMany(() => CampaignMetric, metric => metric.campaign)
  metrics: CampaignMetric[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('campaign_metrics')
export class CampaignMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  campaignId: string;

  @ManyToOne(() => Campaign, campaign => campaign.metrics)
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column('int', { default: 0 })
  impressions: number;

  @Column('int', { default: 0 })
  clicks: number;

  @Column('int', { default: 0 })
  conversions: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  spend: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  revenue: number;

  @Column('decimal', { precision: 5, scale: 4, default: 0 })
  ctr: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  cpa: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  roas: number;

  @Column({ type: 'date' })
  date: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}