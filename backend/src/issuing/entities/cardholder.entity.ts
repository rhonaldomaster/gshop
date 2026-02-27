import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../database/entities/user.entity';
import { VirtualCard } from './virtual-card.entity';

export enum CardholderStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  REJECTED = 'rejected',
}

@Entity('issuing_cardholders')
export class Cardholder {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @Column('uuid', { unique: true })
  @ApiProperty()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ unique: true })
  @ApiProperty({ description: 'Stripe Issuing cardholder ID (ich_xxxxx)' })
  stripeCardholderId: string;

  // Bridge v2 future fields
  @Column({ nullable: true })
  @ApiProperty({ description: 'Stripe Connected Account ID (acct_xxxxx) - Bridge v2', required: false })
  stripeConnectedAccountId: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Stripe Financial Account ID (fa_xxxxx) - Bridge v2', required: false })
  stripeFinancialAccountId: string;

  @Column({ type: 'enum', enum: CardholderStatus, default: CardholderStatus.PENDING })
  @ApiProperty({ enum: CardholderStatus })
  status: CardholderStatus;

  @Column({ nullable: true })
  @ApiProperty({ required: false })
  phoneNumber: string;

  @Column('json', { nullable: true })
  @ApiProperty({ required: false })
  billingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  @Column('json', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty()
  updatedAt: Date;

  @OneToMany(() => VirtualCard, (card) => card.cardholder)
  cards: VirtualCard[];
}
