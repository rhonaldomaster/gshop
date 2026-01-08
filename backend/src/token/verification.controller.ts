import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VerificationService } from './verification.service';
import {
  ReviewVerificationDto,
  VerificationFilterDto,
  VerificationResponseDto,
  VerificationStatsDto,
} from './dto/verification.dto';

@ApiTags('KYC Verifications')
@Controller('verifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

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
}
