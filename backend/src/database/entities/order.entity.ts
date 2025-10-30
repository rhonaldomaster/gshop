
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from './payment.entity';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  IN_TRANSIT = 'in_transit',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURN_REQUESTED = 'return_requested',
  REFUNDED = 'refunded',
}

@Entity('orders')
export class Order {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ unique: true })
  orderNumber: string;

  @ApiProperty({ enum: OrderStatus })
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  subtotalBase: number; // Sum of all basePrices (without VAT)

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalVatAmount: number; // Sum of all VAT included

  @ApiProperty()
  @Column('json', { nullable: true })
  vatBreakdown: {
    excluido: { base: number; vat: number; total: number };
    exento: { base: number; vat: number; total: number };
    reducido: { base: number; vat: number; total: number };
    general: { base: number; vat: number; total: number };
  };

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  shippingAmount: number;

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  // Alias for totalAmount (for compatibility)
  get total(): number {
    return this.totalAmount;
  }

  @ApiProperty()
  @Column('json')
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };

  @ApiProperty()
  @Column('json', { nullable: true })
  billingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };

  @ApiProperty()
  @Column('text', { nullable: true })
  notes: string;

  @ApiProperty()
  @Column({ nullable: true })
  trackingNumber: string;

  @ApiProperty()
  @Column({ nullable: true })
  shippingCarrier: string;

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  shippingCost: number;

  @ApiProperty()
  @Column({ nullable: true })
  courierService: string;

  @ApiProperty()
  @Column('json', { nullable: true })
  shippingOptions: {
    carrier: string;
    service: string;
    rate: number;
    deliveryTime: string;
    easypostRateId?: string;
  }[];

  @ApiProperty()
  @Column('json', { nullable: true })
  packageDimensions: {
    length: number;
    width: number;
    height: number;
    weight: number;
  };

  @ApiProperty()
  @Column('json', { nullable: true })
  customerDocument: {
    type: string;
    number: string;
  };

  @ApiProperty()
  @Column({ nullable: true })
  isGuestOrder: boolean;

  @ApiProperty()
  @Column({ nullable: true })
  easypostShipmentId: string;

  @ApiProperty()
  @Column({ nullable: true })
  returnReason: string;

  @ApiProperty()
  @Column({ nullable: true })
  shippingProof: string;

  @ApiProperty()
  @Column({ nullable: true })
  estimatedDeliveryDate: Date;

  @ApiProperty()
  @Column({ nullable: true })
  deliveredAt: Date;

  // Live Streaming Attribution
  @ApiProperty()
  @Column({ nullable: true })
  liveSessionId: string;

  @ApiProperty()
  @Column({ nullable: true })
  affiliateId: string;

  @ApiProperty()
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  commissionRate: number;

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  commissionAmount: number;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  items: OrderItem[];

  @OneToOne(() => Payment, (payment) => payment.order)
  payment: Payment;
}
