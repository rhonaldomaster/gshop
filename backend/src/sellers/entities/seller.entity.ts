import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { Product } from '../../products/entities/product.entity'

@Entity('sellers')
export class Seller {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  email: string

  @Column()
  passwordHash: string

  @Column()
  businessName: string

  @Column()
  ownerName: string

  @Column({ type: 'enum', enum: ['CC', 'NIT', 'RUT', 'Passport'] })
  documentType: string

  @Column()
  documentNumber: string

  @Column()
  phone: string

  @Column()
  address: string

  @Column()
  city: string

  @Column()
  country: string

  @Column()
  businessCategory: string

  @Column({ type: 'enum', enum: ['pending', 'approved', 'rejected', 'suspended'], default: 'pending' })
  status: string

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalEarnings: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  availableBalance: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  pendingBalance: number

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 7.0 })
  commissionRate: number

  @Column({ nullable: true })
  mercadoPagoAccountId: string

  @Column({ default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToMany(() => Product, product => product.seller)
  products: Product[]
}