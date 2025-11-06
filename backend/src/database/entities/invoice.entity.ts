import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Seller } from '../../sellers/entities/seller.entity';
import { User } from './user.entity';

export enum InvoiceType {
  PLATFORM_TO_BUYER_FEE = 'platform_to_buyer_fee',
  PLATFORM_TO_SELLER_COMMISSION = 'platform_to_seller_commission',
}

export enum InvoiceStatus {
  ISSUED = 'issued',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  VOIDED = 'voided',
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true, name: 'invoice_number' })
  invoiceNumber: string;

  @Column({
    type: 'varchar',
    length: 30,
    enum: InvoiceType,
    name: 'invoice_type',
  })
  invoiceType: InvoiceType;

  // Relations
  @Column({ type: 'uuid', nullable: true, name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'uuid', nullable: true, name: 'seller_id' })
  sellerId: string;

  @ManyToOne(() => Seller, { nullable: true })
  @JoinColumn({ name: 'seller_id' })
  seller: Seller;

  @Column({ type: 'uuid', nullable: true, name: 'buyer_id' })
  buyerId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'buyer_id' })
  buyer: User;

  // Issuer data (platform)
  @Column({ type: 'varchar', length: 255, name: 'issuer_name' })
  issuerName: string;

  @Column({ type: 'varchar', length: 50, name: 'issuer_document' })
  issuerDocument: string;

  @Column({ type: 'text', nullable: true, name: 'issuer_address' })
  issuerAddress: string;

  // Recipient data
  @Column({ type: 'varchar', length: 255, name: 'recipient_name' })
  recipientName: string;

  @Column({ type: 'varchar', length: 50, name: 'recipient_document' })
  recipientDocument: string;

  @Column({ type: 'text', nullable: true, name: 'recipient_address' })
  recipientAddress: string;

  // Amounts
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'vat_amount' })
  vatAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_amount' })
  totalAmount: number;

  // Metadata
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'issued_at' })
  issuedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'due_date' })
  dueDate: Date;

  @Column({
    type: 'varchar',
    length: 20,
    enum: InvoiceStatus,
    default: InvoiceStatus.ISSUED,
  })
  status: InvoiceStatus;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'payment_method' })
  paymentMethod: string;

  // DIAN integration (optional)
  @Column({ type: 'varchar', length: 255, nullable: true })
  cufe: string;

  @Column({ type: 'jsonb', nullable: true, name: 'dian_response' })
  dianResponse: any;

  // Audit
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
