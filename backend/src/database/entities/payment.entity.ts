
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Order } from './order.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  WALLET = 'wallet',
  PIX = 'pix',
}

@Entity('payments')
export class Payment {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ unique: true })
  transactionId: string;

  @ApiProperty()
  @Column({ nullable: true })
  mercadoPagoPaymentId: string;

  @ApiProperty({ enum: PaymentStatus })
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @ApiProperty({ enum: PaymentMethod })
  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  method: PaymentMethod;

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  refundedAmount: number;

  @ApiProperty()
  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  feeAmount: number;

  @ApiProperty()
  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  commissionAmount: number;

  @ApiProperty()
  @Column({ length: 3, default: 'ARS' })
  currency: string;

  @ApiProperty()
  @Column('json', { nullable: true })
  gatewayResponse: any;

  @ApiProperty()
  @Column('json', { nullable: true })
  paymentDetails: {
    cardLastFour?: string;
    cardBrand?: string;
    installments?: number;
    payerEmail?: string;
    payerPhone?: string;
  };

  @ApiProperty()
  @Column({ nullable: true })
  failureReason: string;

  @ApiProperty()
  @Column({ nullable: true })
  processedAt: Date;

  @ApiProperty()
  @Column({ nullable: true })
  refundedAt: Date;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Order, (order) => order.payment)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  orderId: string;
}
