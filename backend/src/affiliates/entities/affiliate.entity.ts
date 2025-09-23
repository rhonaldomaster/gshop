import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'

@Entity('affiliates')
export class Affiliate {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  email: string

  @Column()
  passwordHash: string

  @Column()
  name: string

  @Column({ nullable: true })
  phone: string

  @Column({ nullable: true })
  website: string

  @Column({ nullable: true })
  socialMedia: string

  @Column({ unique: true })
  affiliateCode: string

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 5.0 })
  commissionRate: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalEarnings: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  availableBalance: number

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  pendingBalance: number

  @Column({ type: 'enum', enum: ['pending', 'approved', 'rejected', 'suspended'], default: 'pending' })
  status: string

  @Column({ default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}