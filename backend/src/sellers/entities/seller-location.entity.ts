import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Seller } from './seller.entity';

@Entity('seller_locations')
export class SellerLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sellerId' })
  sellerId: string;

  @Column({ length: 100 })
  city: string;

  @Column({ length: 100 })
  state: string;

  @Column({ name: 'isPrimary', default: false })
  isPrimary: boolean;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @ManyToOne(() => Seller, (seller) => seller.locations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sellerId' })
  seller: Seller;
}
