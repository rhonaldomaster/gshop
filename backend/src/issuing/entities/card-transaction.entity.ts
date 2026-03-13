import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { VirtualCard } from './virtual-card.entity';
import { User } from '../../database/entities/user.entity';

export enum CardTransactionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DECLINED = 'declined',
  REVERSED = 'reversed',
  SETTLED = 'settled',
}

export enum CardTransactionType {
  AUTHORIZATION = 'authorization',
  CAPTURE = 'capture',
  REFUND = 'refund',
  FUNDING = 'funding',
  WITHDRAWAL = 'withdrawal',
}

@Entity('issuing_card_transactions')
export class CardTransaction {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @Column('uuid')
  @ApiProperty()
  cardId: string;

  @ManyToOne(() => VirtualCard)
  @JoinColumn({ name: 'cardId' })
  card: VirtualCard;

  @Column('uuid')
  @ApiProperty()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Stripe authorization ID (iauth_xxxxx)', required: false })
  stripeAuthorizationId: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Stripe transaction ID (ipi_xxxxx)', required: false })
  stripeTransactionId: string;

  @Column({ type: 'enum', enum: CardTransactionType })
  @ApiProperty({ enum: CardTransactionType })
  type: CardTransactionType;

  @Column({ type: 'enum', enum: CardTransactionStatus, default: CardTransactionStatus.PENDING })
  @ApiProperty({ enum: CardTransactionStatus })
  status: CardTransactionStatus;

  @Column('int')
  @ApiProperty({ description: 'Amount in USD cents' })
  amountCents: number;

  @Column({ default: 'usd' })
  @ApiProperty()
  currency: string;

  @Column({ nullable: true })
  @ApiProperty({ required: false })
  merchantName: string;

  @Column({ nullable: true })
  @ApiProperty({ required: false })
  merchantCategory: string;

  @Column({ nullable: true })
  @ApiProperty({ required: false })
  merchantCategoryCode: string;

  @Column({ nullable: true })
  @ApiProperty({ required: false })
  merchantCity: string;

  @Column({ nullable: true })
  @ApiProperty({ required: false })
  merchantCountry: string;

  @Column({ nullable: true })
  @ApiProperty({ required: false })
  declineReason: string;

  @Column('uuid', { nullable: true })
  @ApiProperty({ description: 'Link to GshopTransaction when funding from wallet', required: false })
  walletTransactionId: string;

  @Column('json', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty()
  updatedAt: Date;
}
