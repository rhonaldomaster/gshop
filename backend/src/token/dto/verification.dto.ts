import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VerificationLevel } from '../constants/transfer-limits';
import { VerificationStatus } from '../entities/user-verification.entity';

export class ReviewVerificationDto {
  @ApiProperty({
    enum: ['approve', 'reject', 'needs_update'],
    description: 'Action to take on the verification',
  })
  @IsEnum(['approve', 'reject', 'needs_update'])
  action: 'approve' | 'reject' | 'needs_update';

  @ApiPropertyOptional({
    description: 'Message/reason for rejection or update request',
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({
    description: 'Internal admin notes (not visible to user)',
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}

export class VerificationFilterDto {
  @ApiPropertyOptional({
    enum: VerificationStatus,
    description: 'Filter by verification status',
  })
  @IsOptional()
  @IsEnum(VerificationStatus)
  status?: VerificationStatus;

  @ApiPropertyOptional({
    enum: VerificationLevel,
    description: 'Filter by verification level',
  })
  @IsOptional()
  @IsEnum(VerificationLevel)
  level?: VerificationLevel;

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    default: 1,
  })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 20,
  })
  @IsOptional()
  limit?: number;
}

export class VerificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  level: VerificationLevel;

  @ApiProperty()
  verificationStatus: VerificationStatus;

  @ApiPropertyOptional()
  fullLegalName?: string;

  @ApiPropertyOptional()
  documentType?: string;

  @ApiPropertyOptional()
  documentNumber?: string;

  @ApiPropertyOptional()
  documentFrontUrl?: string;

  @ApiPropertyOptional()
  documentBackUrl?: string;

  @ApiPropertyOptional()
  selfieUrl?: string;

  @ApiProperty()
  selfieVerified: boolean;

  @ApiPropertyOptional()
  dateOfBirth?: Date;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  state?: string;

  @ApiPropertyOptional()
  postalCode?: string;

  @ApiPropertyOptional()
  country?: string;

  @ApiPropertyOptional()
  sourceOfFunds?: string;

  @ApiPropertyOptional()
  occupation?: string;

  @ApiPropertyOptional()
  monthlyIncome?: string;

  @ApiPropertyOptional()
  rejectionReason?: string;

  @ApiPropertyOptional()
  verifiedBy?: string;

  @ApiPropertyOptional()
  verifiedAt?: Date;

  @ApiPropertyOptional()
  level1SubmittedAt?: Date;

  @ApiPropertyOptional()
  level1ApprovedAt?: Date;

  @ApiPropertyOptional()
  level2SubmittedAt?: Date;

  @ApiPropertyOptional()
  level2ApprovedAt?: Date;

  @ApiProperty()
  reviewAttempts: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // User info
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export class VerificationStatsDto {
  @ApiProperty()
  totalPending: number;

  @ApiProperty()
  totalUnderReview: number;

  @ApiProperty()
  totalApproved: number;

  @ApiProperty()
  totalRejected: number;

  @ApiProperty()
  totalNeedsUpdate: number;

  @ApiProperty()
  pendingLevel1: number;

  @ApiProperty()
  pendingLevel2: number;

  @ApiProperty()
  avgReviewTimeHours: number;
}
