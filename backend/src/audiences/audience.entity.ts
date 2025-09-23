import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Seller } from '../sellers/seller.entity';

export enum AudienceType {
  PIXEL_BASED = 'pixel_based',
  CUSTOMER_LIST = 'customer_list',
  LOOKALIKE = 'lookalike',
  CUSTOM = 'custom'
}

export enum PixelEvent {
  PAGE_VIEW = 'page_view',
  PRODUCT_VIEW = 'product_view',
  ADD_TO_CART = 'add_to_cart',
  PURCHASE = 'purchase',
  CUSTOM = 'custom'
}

@Entity('audiences')
export class Audience {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: AudienceType })
  type: AudienceType;

  @Column('text', { nullable: true })
  description: string;

  @Column('json')
  rules: any;

  @Column('int', { default: 0 })
  size: number;

  @Column({ default: true })
  isActive: boolean;

  @Column('uuid')
  sellerId: string;

  @ManyToOne(() => Seller)
  @JoinColumn({ name: 'sellerId' })
  seller: Seller;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('audience_users')
export class AudienceUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  audienceId: string;

  @ManyToOne(() => Audience)
  @JoinColumn({ name: 'audienceId' })
  audience: Audience;

  @Column()
  userId: string;

  @Column('json', { nullable: true })
  metadata: any;

  @CreateDateColumn()
  addedAt: Date;
}