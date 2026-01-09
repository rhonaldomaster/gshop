import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { VerificationLevel } from '../constants/transfer-limits';

export enum DocumentType {
  CC = 'CC',     // Cedula de Ciudadania
  CE = 'CE',     // Cedula de Extranjeria
  PA = 'PA',     // Pasaporte
  TI = 'TI',     // Tarjeta de Identidad
  NIT = 'NIT',   // NIT (for businesses)
}

export enum VerificationStatus {
  NOT_STARTED = 'not_started',
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NEEDS_UPDATE = 'needs_update',
}

@Entity('user_verifications')
@Index(['userId'], { unique: true })
@Index(['verificationStatus'])
@Index(['level'])
export class UserVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: VerificationLevel,
    default: VerificationLevel.NONE,
  })
  level: VerificationLevel;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.NOT_STARTED,
  })
  verificationStatus: VerificationStatus;

  // Level 1 fields: Basic Identity
  @Column({ nullable: true })
  fullLegalName: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
    nullable: true,
  })
  documentType: DocumentType;

  @Column({ nullable: true })
  documentNumber: string;

  @Column({ nullable: true })
  documentFrontUrl: string;

  @Column({ nullable: true })
  documentBackUrl: string;

  @Column({ nullable: true })
  selfieUrl: string;

  @Column({ default: false })
  selfieVerified: boolean;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  // Level 2 fields: Extended verification
  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  postalCode: string;

  @Column({ nullable: true })
  country: string;

  @Column({ type: 'text', nullable: true })
  sourceOfFunds: string;

  @Column({ nullable: true })
  occupation: string;

  @Column({ nullable: true })
  monthlyIncome: string;

  // Verification metadata
  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  verifiedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  level1SubmittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  level1ApprovedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  level2SubmittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  level2ApprovedAt: Date;

  // Admin notes (internal use only)
  @Column({ type: 'text', nullable: true })
  adminNotes: string;

  // Track review attempts
  @Column({ default: 0 })
  reviewAttempts: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper method to check if user can upgrade to Level 1
  canSubmitLevel1(): boolean {
    return (
      this.level === VerificationLevel.NONE &&
      this.verificationStatus !== VerificationStatus.PENDING &&
      this.verificationStatus !== VerificationStatus.UNDER_REVIEW
    );
  }

  // Helper method to check if user can upgrade to Level 2
  canSubmitLevel2(): boolean {
    return (
      this.level === VerificationLevel.LEVEL_1 &&
      this.verificationStatus !== VerificationStatus.PENDING &&
      this.verificationStatus !== VerificationStatus.UNDER_REVIEW
    );
  }

  // Helper to check if Level 1 requirements are complete
  hasLevel1Requirements(): boolean {
    return !!(
      this.fullLegalName &&
      this.documentType &&
      this.documentNumber &&
      this.documentFrontUrl &&
      this.selfieUrl
    );
  }

  // Helper to check if Level 2 requirements are complete
  hasLevel2Requirements(): boolean {
    return !!(
      this.hasLevel1Requirements() &&
      this.address &&
      this.city &&
      this.sourceOfFunds
    );
  }
}
