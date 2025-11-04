import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { Product } from '../../products/entities/product.entity'

export enum SellerType {
  NATURAL = 'natural',
  JURIDICA = 'juridica',
}

export enum DocumentType {
  CC = 'CC', // Cédula de Ciudadanía
  CE = 'CE', // Cédula de Extranjería
  NIT = 'NIT', // Número de Identificación Tributaria
  PASSPORT = 'PASSPORT', // Pasaporte
}

export enum BankAccountType {
  AHORROS = 'ahorros',
  CORRIENTE = 'corriente',
}

export enum VerificationStatus {
  PENDING = 'pending',
  DOCUMENTS_UPLOADED = 'documents_uploaded',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('sellers')
export class Seller {
  @PrimaryGeneratedColumn('uuid')
  id: string

  // Tipo de vendedor
  @Column({
    type: 'enum',
    enum: SellerType,
    default: SellerType.NATURAL,
  })
  sellerType: SellerType

  @Column({ unique: true })
  email: string

  @Column()
  passwordHash: string

  @Column()
  businessName: string

  @Column()
  ownerName: string

  // Identificación
  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  documentType: DocumentType

  @Column()
  documentNumber: string

  @Column()
  phone: string

  @Column({ nullable: true })
  address: string

  @Column({ nullable: true })
  city: string

  @Column({ nullable: true })
  country: string

  @Column({ nullable: true })
  businessCategory: string

  // RUT DIAN
  @Column({ nullable: true })
  rutFileUrl: string

  @Column({ default: false })
  rutVerified: boolean

  @Column({ type: 'timestamp', nullable: true })
  rutVerificationDate: Date

  // Cámara de Comercio
  @Column({ nullable: true })
  comercioFileUrl: string

  @Column({ type: 'timestamp', nullable: true })
  comercioExpirationDate: Date

  @Column({ default: false })
  comercioVerified: boolean

  // Datos bancarios
  @Column({ nullable: true })
  bankName: string

  @Column({
    type: 'enum',
    enum: BankAccountType,
    nullable: true,
  })
  bankAccountType: BankAccountType

  @Column({ nullable: true })
  bankAccountNumber: string

  @Column({ nullable: true })
  bankAccountHolder: string

  // Verificación
  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  verificationStatus: VerificationStatus

  @Column({ type: 'text', nullable: true })
  verificationNotes: string

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date

  @Column({ nullable: true })
  verifiedBy: string

  // Estado del vendedor (legacy)
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