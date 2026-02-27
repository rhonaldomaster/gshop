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
import { Cardholder } from './cardholder.entity';
import { CardTransaction } from './card-transaction.entity';

export enum CardStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELED = 'canceled',
  PENDING = 'pending',
}

export enum CardType {
  VIRTUAL = 'virtual',
  PHYSICAL = 'physical',
}

@Entity('issuing_virtual_cards')
export class VirtualCard {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @Column('uuid')
  @ApiProperty()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('uuid')
  @ApiProperty()
  cardholderId: string;

  @ManyToOne(() => Cardholder)
  @JoinColumn({ name: 'cardholderId' })
  cardholder: Cardholder;

  @Column({ unique: true })
  @ApiProperty({ description: 'Stripe Issuing card ID (ic_xxxxx)' })
  stripeCardId: string;

  @Column({ type: 'enum', enum: CardStatus, default: CardStatus.PENDING })
  @ApiProperty({ enum: CardStatus })
  status: CardStatus;

  @Column({ type: 'enum', enum: CardType, default: CardType.VIRTUAL })
  @ApiProperty({ enum: CardType })
  type: CardType;

  @Column({ length: 4 })
  @ApiProperty({ description: 'Last 4 digits of card number' })
  last4: string;

  @Column({ length: 2 })
  @ApiProperty()
  expMonth: string;

  @Column({ length: 4 })
  @ApiProperty()
  expYear: string;

  @Column({ default: 'visa' })
  @ApiProperty()
  brand: string;

  @Column({ default: 'usd' })
  @ApiProperty()
  currency: string;

  @Column('json', { nullable: true })
  @ApiProperty({ required: false })
  spendingControls: {
    spendingLimits?: Array<{
      amount: number;
      interval: string;
      categories?: string[];
    }>;
    allowedCategories?: string[];
    blockedCategories?: string[];
  };

  @Column('json', { nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  canceledAt: Date;

  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty()
  updatedAt: Date;

  @OneToMany(() => CardTransaction, (tx) => tx.card)
  transactions: CardTransaction[];
}
