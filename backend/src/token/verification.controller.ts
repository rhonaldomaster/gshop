import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VerificationService } from './verification.service';
import { StorageService } from '../common/storage/storage.service';
import {
  ReviewVerificationDto,
  VerificationFilterDto,
  VerificationResponseDto,
  VerificationStatsDto,
  SubmitLevel1VerificationDto,
  SubmitLevel2VerificationDto,
} from './dto/verification.dto';

@ApiTags('KYC Verifications')
@Controller('verifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VerificationController {
  constructor(
    private readonly verificationService: VerificationService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Get pending verifications for admin review
   */
  @Get('pending')
  @ApiOperation({ summary: 'Get pending KYC verifications' })
  @ApiResponse({ status: 200, description: 'List of pending verifications' })
  async getPendingVerifications(@Query() filter: VerificationFilterDto) {
    return this.verificationService.getPendingVerifications(filter);
  }

  /**
   * Get all verifications with filtering
   */
  @Get()
  @ApiOperation({ summary: 'Get all KYC verifications' })
  @ApiResponse({ status: 200, description: 'List of all verifications' })
  async getAllVerifications(@Query() filter: VerificationFilterDto) {
    return this.verificationService.getAllVerifications(filter);
  }

  /**
   * Get verification statistics
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get KYC verification statistics' })
  @ApiResponse({ status: 200, type: VerificationStatsDto })
  async getVerificationStats(): Promise<VerificationStatsDto> {
    return this.verificationService.getVerificationStats();
  }

  /**
   * Get a single verification by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get verification by ID' })
  @ApiResponse({ status: 200, type: VerificationResponseDto })
  async getVerificationById(@Param('id') id: string): Promise<VerificationResponseDto> {
    return this.verificationService.getVerificationById(id);
  }

  /**
   * Review a verification (approve, reject, or request update)
   */
  @Put(':id/review')
  @ApiOperation({ summary: 'Review a KYC verification' })
  @ApiResponse({ status: 200, description: 'Verification reviewed successfully' })
  async reviewVerification(
    @Param('id') id: string,
    @Body() reviewDto: ReviewVerificationDto,
    @Request() req,
  ) {
    return this.verificationService.reviewVerification(id, reviewDto, req.user.id);
  }

  /**
   * Get verification for current user
   */
  @Get('user/me')
  @ApiOperation({ summary: 'Get current user verification status' })
  @ApiResponse({ status: 200, type: VerificationResponseDto })
  async getMyVerification(@Request() req): Promise<VerificationResponseDto | null> {
    return this.verificationService.getVerificationByUserId(req.user.id);
  }

  // ==========================================
  // User Submission Endpoints
  // ==========================================

  /**
   * Upload document image (front, back, or selfie)
   * Returns URL to be used in submit endpoints
   */
  @Post('upload-document')
  @ApiOperation({ summary: 'Upload KYC document image (max 10MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL of uploaded document' },
        provider: { type: 'string', description: 'Storage provider used' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file or file too large' })
  @UseInterceptors(FileInterceptor('document'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No se subio ningun archivo');
    }

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp',
    ];

    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de archivo invalido: ${file.mimetype}. Solo se permiten JPEG, PNG, JPG y WEBP.`,
      );
    }

    if (file.size > maxSize) {
      throw new BadRequestException('Archivo muy grande. El tamano maximo es 10MB.');
    }

    // Upload file using the storage service
    const timestamp = Date.now();
    const safeFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const url = await this.storageService.uploadFile(
      file.buffer,
      `kyc/${req.user.id}/${timestamp}-${safeFilename}`,
      file.mimetype,
    );

    return {
      url,
      provider: this.storageService.getProviderName(),
    };
  }

  /**
   * Submit Level 1 KYC verification
   * Upload documents first, then submit with URLs
   */
  @Post('submit/level1')
  @ApiOperation({ summary: 'Submit Level 1 KYC verification (basic identity)' })
  @ApiResponse({ status: 201, description: 'Level 1 verification submitted successfully' })
  @ApiResponse({ status: 400, description: 'Already verified or pending review' })
  async submitLevel1(
    @Request() req,
    @Body() dto: SubmitLevel1VerificationDto,
  ) {
    return this.verificationService.submitLevel1Verification(req.user.id, dto);
  }

  /**
   * Submit Level 2 KYC verification
   * Requires Level 1 to be approved first
   */
  @Post('submit/level2')
  @ApiOperation({ summary: 'Submit Level 2 KYC verification (extended)' })
  @ApiResponse({ status: 201, description: 'Level 2 verification submitted successfully' })
  @ApiResponse({ status: 400, description: 'Level 1 not approved or already Level 2' })
  async submitLevel2(
    @Request() req,
    @Body() dto: SubmitLevel2VerificationDto,
  ) {
    return this.verificationService.submitLevel2Verification(req.user.id, dto);
  }

  /**
   * Update verification data after rejection
   * Can only update if status is NEEDS_UPDATE or REJECTED
   */
  @Put('update')
  @ApiOperation({ summary: 'Update verification data after rejection' })
  @ApiResponse({ status: 200, description: 'Verification updated and resubmitted' })
  @ApiResponse({ status: 400, description: 'Cannot update - not rejected' })
  async updateVerification(
    @Request() req,
    @Body() dto: Partial<SubmitLevel1VerificationDto & SubmitLevel2VerificationDto>,
  ) {
    return this.verificationService.updateVerificationData(req.user.id, dto);
  }
}
