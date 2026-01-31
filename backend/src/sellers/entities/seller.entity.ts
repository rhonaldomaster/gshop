import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { Product } from '../../products/entities/product.entity'
import { SellerLocation } from './seller-location.entity'
import { SellerFollower } from './seller-follower.entity'

export enum ShippingType {
  LOCAL = 'local',
  NATIONAL = 'national',
}

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
  NEEDS_UPDATE = 'needs_update',
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
  state: string

  @Column({ default: 'Colombia' })
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

  // Mensajes del admin al vendedor
  @Column({ type: 'text', nullable: true })
  adminMessage: string

  @Column({ type: 'timestamp', nullable: true })
  adminMessageDate: Date

  @Column({ nullable: true })
  reviewedBy: string

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

  // NUEVOS CAMPOS DE ENVÍO
  @Column({
    name: 'shippingLocalPrice',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0
  })
  shippingLocalPrice: number

  @Column({
    name: 'shippingNationalPrice',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0
  })
  shippingNationalPrice: number

  @Column({
    name: 'shippingFreeEnabled',
    default: false
  })
  shippingFreeEnabled: boolean

  @Column({
    name: 'shippingFreeMinAmount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true
  })
  shippingFreeMinAmount?: number

  @Column({ type: 'timestamp', nullable: true })
  termsAcceptedAt: Date

  @Column({ type: 'timestamp', nullable: true })
  privacyAcceptedAt: Date

  @Column({ nullable: true })
  acceptedTermsVersion: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToMany(() => Product, product => product.seller)
  products: Product[]

  @OneToMany(() => SellerLocation, location => location.seller)
  locations: SellerLocation[]

  // Social/Follow fields
  @Column({ type: 'int', default: 0 })
  followersCount: number

  @Column({ default: true })
  isProfilePublic: boolean

  @Column({ type: 'text', nullable: true })
  profileDescription: string

  @Column({ nullable: true })
  logoUrl: string

  @OneToMany(() => SellerFollower, follower => follower.seller)
  followers: SellerFollower[]
}