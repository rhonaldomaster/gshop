
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
import { Order } from './order.entity';
import { Product, VatType } from './product.entity';

@Entity('order_items')
export class OrderItem {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column('int')
  quantity: number;

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice: number;

  @ApiProperty({ enum: VatType })
  @Column({
    type: 'enum',
    enum: VatType,
    default: VatType.GENERAL,
  })
  vatType: VatType;

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  basePrice: number; // Unit base price without VAT

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  vatAmountPerUnit: number; // VAT per unit

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalBasePrice: number; // basePrice * quantity

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalVatAmount: number; // vatAmountPerUnit * quantity

  @ApiProperty()
  @Column('json', { nullable: true })
  productSnapshot: {
    name: string;
    sku: string;
    image?: string;
    variant?: any;
  };

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  orderId: string;

  @ManyToOne(() => Product, (product) => product.orderItems)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: string;
}
