import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

export enum PaymentMethod {
  STRIPE_CARD = 'stripe_card',
  STRIPE_BANK = 'stripe_bank',
  USDC_POLYGON = 'usdc_polygon',
  MERCADOPAGO = 'mercadopago',
  GSHOP_TOKENS = 'gshop_tokens'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled'
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

@Entity('payments_v2')
export class PaymentV2 {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  orderId: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 15, scale: 8, nullable: true })
  cryptoAmount: number;

  @Column('varchar', { length: 10, default: 'USD' })
  currency: string;

  @Column('varchar', { length: 10, nullable: true })
  cryptoCurrency: string;

  @Column({ nullable: true })
  stripePaymentIntentId: string;

  @Column({ nullable: true })
  polygonTxHash: string;

  @Column({ nullable: true })
  polygonFromAddress: string;

  @Column({ nullable: true })
  polygonToAddress: string;

  @Column('json', { nullable: true })
  paymentMetadata: any;

  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  processingFee: number;

  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  platformFee: number;

  @Column({ nullable: true })
  failureReason: string;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  refundedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  invoiceNumber: string;

  @Column('uuid')
  orderId: string;

  @Column('uuid')
  sellerId: string;

  @Column('uuid')
  buyerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'buyerId' })
  buyer: User;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @Column('decimal', { precision: 15, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  taxAmount: number;

  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  shippingCost: number;

  @Column('decimal', { precision: 15, scale: 2 })
  totalAmount: number;

  @Column('varchar', { length: 10, default: 'USD' })
  currency: string;

  @Column('json')
  billingAddress: any;

  @Column('json')
  items: any[];

  @Column({ nullable: true })
  pdfUrl: string;

  @Column({ type: 'date' })
  issueDate: Date;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ type: 'date', nullable: true })
  paidDate: Date;

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('payment_methods')
export class PaymentMethodEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: PaymentMethod })
  type: PaymentMethod;

  @Column()
  displayName: string;

  @Column({ nullable: true })
  stripePaymentMethodId: string;

  @Column({ nullable: true })
  polygonAddress: string;

  @Column({ nullable: true })
  lastFourDigits: string;

  @Column({ nullable: true })
  brand: string;

  @Column({ nullable: true })
  expiryMonth: number;

  @Column({ nullable: true })
  expiryYear: number;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('crypto_transactions')
export class CryptoTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  paymentId: string;

  @ManyToOne(() => PaymentV2)
  @JoinColumn({ name: 'paymentId' })
  payment: PaymentV2;

  @Column()
  txHash: string;

  @Column()
  fromAddress: string;

  @Column()
  toAddress: string;

  @Column('decimal', { precision: 15, scale: 8 })
  amount: number;

  @Column('varchar', { length: 10 })
  currency: string;

  @Column('int', { default: 0 })
  blockNumber: number;

  @Column('int', { default: 0 })
  confirmations: number;

  @Column('decimal', { precision: 15, scale: 8, default: 0 })
  gasFee: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}