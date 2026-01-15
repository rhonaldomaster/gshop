import { IsString, MinLength, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '../../sellers/entities/seller.entity';

/**
 * DTO for converting an existing authenticated user to an affiliate.
 * Does NOT require email or password since the user is already authenticated.
 */
export class ConvertToAffiliateDto {
  @ApiProperty({
    example: 'fashioncreator',
    description: 'Unique username for affiliate profile (minimum 3 characters)',
    minLength: 3
  })
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  username: string;

  @ApiPropertyOptional({
    example: '+57 300 123 4567',
    description: 'Phone number (optional if already in user profile)'
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'https://fashionblog.com',
    description: 'Personal website or blog URL'
  })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({
    example: '@fashioncreator',
    description: 'Social media handles'
  })
  @IsOptional()
  @IsString()
  socialMedia?: string;

  @ApiPropertyOptional({
    example: 'Creadora de contenido especializada en moda y lifestyle.',
    description: 'Short biography about the affiliate'
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    example: ['fashion', 'lifestyle', 'beauty'],
    description: 'Content categories/niches',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({
    example: 'CC',
    description: 'Document type',
    enum: DocumentType,
    enumName: 'DocumentType'
  })
  @IsOptional()
  @IsEnum(DocumentType, { message: 'Document type must be CC, CE, NIT, or PASSPORT' })
  documentType?: DocumentType;

  @ApiPropertyOptional({
    example: '1234567890',
    description: 'Document number (Cedula, NIT, or Passport)'
  })
  @IsOptional()
  @IsString()
  documentNumber?: string;
}
