import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserVerification, VerificationStatus, DocumentType } from './entities/user-verification.entity';
import { TransferLimit } from './entities/transfer-limit.entity';
import { VerificationLevel } from './constants/transfer-limits';
import { User } from '../users/user.entity';
import {
  ReviewVerificationDto,
  VerificationFilterDto,
  VerificationResponseDto,
  VerificationStatsDto,
  SubmitLevel1VerificationDto,
  SubmitLevel2VerificationDto,
} from './dto/verification.dto';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    @InjectRepository(UserVerification)
    private verificationRepository: Repository<UserVerification>,
    @InjectRepository(TransferLimit)
    private transferLimitRepository: Repository<TransferLimit>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Get all pending verifications for admin review
   */
  async getPendingVerifications(filter: VerificationFilterDto): Promise<{
    data: VerificationResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.verificationRepository
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.user', 'user');

    // Apply filters
    if (filter.status) {
      queryBuilder.andWhere('v.verificationStatus = :status', { status: filter.status });
    } else {
      // Default: show pending and under_review
      queryBuilder.andWhere('v.verificationStatus IN (:...statuses)', {
        statuses: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW],
      });
    }

    if (filter.level) {
      queryBuilder.andWhere('v.level = :level', { level: filter.level });
    }

    queryBuilder.orderBy('v.createdAt', 'ASC');
    queryBuilder.skip(skip).take(limit);

    const [verifications, total] = await queryBuilder.getManyAndCount();

    const data = verifications.map((v) => this.mapToResponseDto(v));

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Get all verifications with optional filtering (for admin panel)
   */
  async getAllVerifications(filter: VerificationFilterDto): Promise<{
    data: VerificationResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.verificationRepository
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.user', 'user');

    if (filter.status) {
      queryBuilder.andWhere('v.verificationStatus = :status', { status: filter.status });
    }

    if (filter.level) {
      queryBuilder.andWhere('v.level = :level', { level: filter.level });
    }

    queryBuilder.orderBy('v.updatedAt', 'DESC');
    queryBuilder.skip(skip).take(limit);

    const [verifications, total] = await queryBuilder.getManyAndCount();

    const data = verifications.map((v) => this.mapToResponseDto(v));

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Get a single verification by ID
   */
  async getVerificationById(id: string): Promise<VerificationResponseDto> {
    const verification = await this.verificationRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!verification) {
      throw new NotFoundException('Verificacion no encontrada');
    }

    return this.mapToResponseDto(verification);
  }

  /**
   * Get verification by user ID
   */
  async getVerificationByUserId(userId: string): Promise<VerificationResponseDto | null> {
    const verification = await this.verificationRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    return verification ? this.mapToResponseDto(verification) : null;
  }

  /**
   * Review a verification request (approve, reject, or request update)
   */
  async reviewVerification(
    id: string,
    reviewDto: ReviewVerificationDto,
    adminUserId: string,
  ): Promise<{ success: boolean; message: string; verification: VerificationResponseDto }> {
    const verification = await this.verificationRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!verification) {
      throw new NotFoundException('Verificacion no encontrada');
    }

    // Validate current status allows review
    if (
      verification.verificationStatus !== VerificationStatus.PENDING &&
      verification.verificationStatus !== VerificationStatus.UNDER_REVIEW &&
      verification.verificationStatus !== VerificationStatus.NEEDS_UPDATE
    ) {
      throw new BadRequestException(
        `No se puede revisar una verificacion con estado "${verification.verificationStatus}"`,
      );
    }

    const now = new Date();

    switch (reviewDto.action) {
      case 'approve':
        await this.approveVerification(verification, adminUserId, now, reviewDto.adminNotes);
        break;

      case 'reject':
        if (!reviewDto.message) {
          throw new BadRequestException('Se requiere una razon para rechazar la verificacion');
        }
        await this.rejectVerification(verification, reviewDto.message, adminUserId, now, reviewDto.adminNotes);
        break;

      case 'needs_update':
        if (!reviewDto.message) {
          throw new BadRequestException('Se requiere un mensaje indicando que debe actualizar');
        }
        await this.requestUpdate(verification, reviewDto.message, adminUserId, now, reviewDto.adminNotes);
        break;

      default:
        throw new BadRequestException('Accion no valida');
    }

    // Increment review attempts
    verification.reviewAttempts += 1;
    await this.verificationRepository.save(verification);

    // Reload to get updated data
    const updated = await this.verificationRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    const actionMessages = {
      approve: 'Verificacion aprobada exitosamente',
      reject: 'Verificacion rechazada',
      needs_update: 'Se ha solicitado actualizacion de documentos',
    };

    this.logger.log(
      `Verification ${id} ${reviewDto.action}ed by admin ${adminUserId} for user ${verification.userId}`,
    );

    return {
      success: true,
      message: actionMessages[reviewDto.action],
      verification: this.mapToResponseDto(updated),
    };
  }

  /**
   * Approve a verification
   */
  private async approveVerification(
    verification: UserVerification,
    adminUserId: string,
    timestamp: Date,
    adminNotes?: string,
  ): Promise<void> {
    // Determine which level to approve to
    const targetLevel = this.getTargetLevel(verification);

    verification.level = targetLevel;
    verification.verificationStatus = VerificationStatus.APPROVED;
    verification.verifiedBy = adminUserId;
    verification.verifiedAt = timestamp;
    verification.rejectionReason = null;

    if (adminNotes) {
      verification.adminNotes = (verification.adminNotes || '') + `\n[${timestamp.toISOString()}] ${adminNotes}`;
    }

    if (targetLevel === VerificationLevel.LEVEL_1) {
      verification.level1ApprovedAt = timestamp;
    } else if (targetLevel === VerificationLevel.LEVEL_2) {
      verification.level2ApprovedAt = timestamp;
    }

    await this.verificationRepository.save(verification);

    // Update transfer limits
    await this.updateTransferLimits(verification.userId, targetLevel);
  }

  /**
   * Reject a verification
   */
  private async rejectVerification(
    verification: UserVerification,
    reason: string,
    adminUserId: string,
    timestamp: Date,
    adminNotes?: string,
  ): Promise<void> {
    verification.verificationStatus = VerificationStatus.REJECTED;
    verification.rejectionReason = reason;
    verification.verifiedBy = adminUserId;
    verification.verifiedAt = timestamp;

    if (adminNotes) {
      verification.adminNotes = (verification.adminNotes || '') + `\n[${timestamp.toISOString()}] ${adminNotes}`;
    }

    await this.verificationRepository.save(verification);
  }

  /**
   * Request update from user
   */
  private async requestUpdate(
    verification: UserVerification,
    message: string,
    adminUserId: string,
    timestamp: Date,
    adminNotes?: string,
  ): Promise<void> {
    verification.verificationStatus = VerificationStatus.NEEDS_UPDATE;
    verification.rejectionReason = message;
    verification.verifiedBy = adminUserId;

    if (adminNotes) {
      verification.adminNotes = (verification.adminNotes || '') + `\n[${timestamp.toISOString()}] ${adminNotes}`;
    }

    await this.verificationRepository.save(verification);
  }

  /**
   * Determine target verification level based on submitted documents
   */
  private getTargetLevel(verification: UserVerification): VerificationLevel {
    // If has Level 2 requirements, approve to Level 2
    if (verification.hasLevel2Requirements()) {
      return VerificationLevel.LEVEL_2;
    }
    // If has Level 1 requirements, approve to Level 1
    if (verification.hasLevel1Requirements()) {
      return VerificationLevel.LEVEL_1;
    }
    // Should not happen, but default to NONE
    return VerificationLevel.NONE;
  }

  /**
   * Update user's transfer limits after verification approval
   */
  private async updateTransferLimits(userId: string, level: VerificationLevel): Promise<void> {
    let transferLimit = await this.transferLimitRepository.findOne({
      where: { userId },
    });

    if (!transferLimit) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      transferLimit = this.transferLimitRepository.create({
        userId,
        verificationLevel: level,
        dailyTransferred: 0,
        monthlyTransferred: 0,
        totalLifetimeTransferred: 0,
        dailyTransferCount: 0,
        monthlyTransferCount: 0,
        totalTransferCount: 0,
        lastDailyReset: today,
        lastMonthlyReset: today,
      });
    } else {
      transferLimit.verificationLevel = level;
    }

    await this.transferLimitRepository.save(transferLimit);
    this.logger.log(`Updated transfer limits for user ${userId} to level ${level}`);
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats(): Promise<VerificationStatsDto> {
    const [
      totalPending,
      totalUnderReview,
      totalApproved,
      totalRejected,
      totalNeedsUpdate,
      pendingLevel1,
      pendingLevel2,
    ] = await Promise.all([
      this.verificationRepository.count({ where: { verificationStatus: VerificationStatus.PENDING } }),
      this.verificationRepository.count({ where: { verificationStatus: VerificationStatus.UNDER_REVIEW } }),
      this.verificationRepository.count({ where: { verificationStatus: VerificationStatus.APPROVED } }),
      this.verificationRepository.count({ where: { verificationStatus: VerificationStatus.REJECTED } }),
      this.verificationRepository.count({ where: { verificationStatus: VerificationStatus.NEEDS_UPDATE } }),
      this.verificationRepository.count({
        where: {
          verificationStatus: In([VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW]),
          level: VerificationLevel.NONE,
        },
      }),
      this.verificationRepository.count({
        where: {
          verificationStatus: In([VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW]),
          level: VerificationLevel.LEVEL_1,
        },
      }),
    ]);

    // Calculate average review time
    const recentApproved = await this.verificationRepository
      .createQueryBuilder('v')
      .select([
        'AVG(EXTRACT(EPOCH FROM (v.verifiedAt - v.createdAt)) / 3600) as avgHours',
      ])
      .where('v.verificationStatus = :status', { status: VerificationStatus.APPROVED })
      .andWhere('v.verifiedAt IS NOT NULL')
      .getRawOne();

    return {
      totalPending,
      totalUnderReview,
      totalApproved,
      totalRejected,
      totalNeedsUpdate,
      pendingLevel1,
      pendingLevel2,
      avgReviewTimeHours: Number(recentApproved?.avgHours) || 0,
    };
  }

  /**
   * Submit Level 1 KYC verification (basic identity)
   * For users with level NONE wanting to upgrade to LEVEL_1
   */
  async submitLevel1Verification(
    userId: string,
    dto: SubmitLevel1VerificationDto,
  ): Promise<{ success: boolean; message: string; verification: VerificationResponseDto }> {
    // Check if user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Get or create verification record
    let verification = await this.verificationRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!verification) {
      verification = this.verificationRepository.create({
        userId,
        level: VerificationLevel.NONE,
        verificationStatus: VerificationStatus.NOT_STARTED,
      });
    }

    // Check if can submit Level 1
    if (verification.level !== VerificationLevel.NONE) {
      throw new BadRequestException(
        'Ya tienes verificacion Level 1 o superior. Usa el endpoint de Level 2 para aumentar tus limites.',
      );
    }

    if (
      verification.verificationStatus === VerificationStatus.PENDING ||
      verification.verificationStatus === VerificationStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException(
        'Ya tienes una solicitud de verificacion en proceso. Espera la revision.',
      );
    }

    // Update verification with Level 1 data
    verification.fullLegalName = dto.fullLegalName;
    verification.documentType = dto.documentType;
    verification.documentNumber = dto.documentNumber;
    verification.documentFrontUrl = dto.documentFrontUrl;
    verification.documentBackUrl = dto.documentBackUrl || null;
    verification.selfieUrl = dto.selfieUrl;
    verification.dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;
    verification.verificationStatus = VerificationStatus.PENDING;
    verification.level1SubmittedAt = new Date();
    verification.rejectionReason = null; // Clear previous rejection reason

    await this.verificationRepository.save(verification);

    // Reload with user relation
    verification = await this.verificationRepository.findOne({
      where: { id: verification.id },
      relations: ['user'],
    });

    this.logger.log(`Level 1 verification submitted by user ${userId}`);

    return {
      success: true,
      message: 'Solicitud de verificacion Level 1 enviada exitosamente. Sera revisada en las proximas 24-48 horas.',
      verification: this.mapToResponseDto(verification),
    };
  }

  /**
   * Submit Level 2 KYC verification (extended)
   * For users with level LEVEL_1 wanting to upgrade to LEVEL_2
   */
  async submitLevel2Verification(
    userId: string,
    dto: SubmitLevel2VerificationDto,
  ): Promise<{ success: boolean; message: string; verification: VerificationResponseDto }> {
    // Get verification record
    const verification = await this.verificationRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!verification) {
      throw new NotFoundException(
        'No tienes verificacion Level 1. Primero completa la verificacion basica.',
      );
    }

    // Check if can submit Level 2
    if (verification.level !== VerificationLevel.LEVEL_1) {
      if (verification.level === VerificationLevel.NONE) {
        throw new BadRequestException(
          'Primero debes completar la verificacion Level 1 antes de solicitar Level 2.',
        );
      }
      throw new BadRequestException('Ya tienes la verificacion Level 2 (maxima).');
    }

    if (
      verification.verificationStatus === VerificationStatus.PENDING ||
      verification.verificationStatus === VerificationStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException(
        'Ya tienes una solicitud de verificacion en proceso. Espera la revision.',
      );
    }

    // Update verification with Level 2 data
    verification.address = dto.address;
    verification.city = dto.city;
    verification.state = dto.state;
    verification.postalCode = dto.postalCode || null;
    verification.country = dto.country;
    verification.sourceOfFunds = dto.sourceOfFunds;
    verification.occupation = dto.occupation || null;
    verification.monthlyIncome = dto.monthlyIncome || null;
    verification.verificationStatus = VerificationStatus.PENDING;
    verification.level2SubmittedAt = new Date();
    verification.rejectionReason = null; // Clear previous rejection reason

    await this.verificationRepository.save(verification);

    this.logger.log(`Level 2 verification submitted by user ${userId}`);

    return {
      success: true,
      message: 'Solicitud de verificacion Level 2 enviada exitosamente. Sera revisada en las proximas 24-48 horas.',
      verification: this.mapToResponseDto(verification),
    };
  }

  /**
   * Update verification after rejection (resubmit)
   * User can update their data when status is NEEDS_UPDATE or REJECTED
   */
  async updateVerificationData(
    userId: string,
    dto: Partial<SubmitLevel1VerificationDto & SubmitLevel2VerificationDto>,
  ): Promise<{ success: boolean; message: string; verification: VerificationResponseDto }> {
    const verification = await this.verificationRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!verification) {
      throw new NotFoundException('No tienes una solicitud de verificacion activa.');
    }

    // Can only update if rejected or needs update
    if (
      verification.verificationStatus !== VerificationStatus.NEEDS_UPDATE &&
      verification.verificationStatus !== VerificationStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Solo puedes actualizar tu verificacion si fue rechazada o requiere cambios.',
      );
    }

    // Update Level 1 fields if provided
    if (dto.fullLegalName) verification.fullLegalName = dto.fullLegalName;
    if (dto.documentType) verification.documentType = dto.documentType;
    if (dto.documentNumber) verification.documentNumber = dto.documentNumber;
    if (dto.documentFrontUrl) verification.documentFrontUrl = dto.documentFrontUrl;
    if (dto.documentBackUrl !== undefined) verification.documentBackUrl = dto.documentBackUrl || null;
    if (dto.selfieUrl) verification.selfieUrl = dto.selfieUrl;
    if (dto.dateOfBirth) verification.dateOfBirth = new Date(dto.dateOfBirth);

    // Update Level 2 fields if provided
    if (dto.address) verification.address = dto.address;
    if (dto.city) verification.city = dto.city;
    if (dto.state) verification.state = dto.state;
    if (dto.postalCode !== undefined) verification.postalCode = dto.postalCode || null;
    if (dto.country) verification.country = dto.country;
    if (dto.sourceOfFunds) verification.sourceOfFunds = dto.sourceOfFunds;
    if (dto.occupation !== undefined) verification.occupation = dto.occupation || null;
    if (dto.monthlyIncome !== undefined) verification.monthlyIncome = dto.monthlyIncome || null;

    // Set back to pending
    verification.verificationStatus = VerificationStatus.PENDING;
    verification.rejectionReason = null;

    await this.verificationRepository.save(verification);

    this.logger.log(`Verification updated by user ${userId}`);

    return {
      success: true,
      message: 'Verificacion actualizada y enviada para revision.',
      verification: this.mapToResponseDto(verification),
    };
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(verification: UserVerification): VerificationResponseDto {
    return {
      id: verification.id,
      userId: verification.userId,
      level: verification.level,
      verificationStatus: verification.verificationStatus,
      fullLegalName: verification.fullLegalName,
      documentType: verification.documentType,
      documentNumber: verification.documentNumber,
      documentFrontUrl: verification.documentFrontUrl,
      documentBackUrl: verification.documentBackUrl,
      selfieUrl: verification.selfieUrl,
      selfieVerified: verification.selfieVerified,
      dateOfBirth: verification.dateOfBirth,
      address: verification.address,
      city: verification.city,
      state: verification.state,
      postalCode: verification.postalCode,
      country: verification.country,
      sourceOfFunds: verification.sourceOfFunds,
      occupation: verification.occupation,
      monthlyIncome: verification.monthlyIncome,
      rejectionReason: verification.rejectionReason,
      verifiedBy: verification.verifiedBy,
      verifiedAt: verification.verifiedAt,
      level1SubmittedAt: verification.level1SubmittedAt,
      level1ApprovedAt: verification.level1ApprovedAt,
      level2SubmittedAt: verification.level2SubmittedAt,
      level2ApprovedAt: verification.level2ApprovedAt,
      reviewAttempts: verification.reviewAttempts,
      createdAt: verification.createdAt,
      updatedAt: verification.updatedAt,
      user: verification.user
        ? {
            id: verification.user.id,
            firstName: verification.user.firstName,
            lastName: verification.user.lastName,
            email: verification.user.email,
            phone: verification.user.phone,
          }
        : undefined,
    };
  }
}
