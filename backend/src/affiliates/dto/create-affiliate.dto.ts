import { IsEmail, IsString, MinLength, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '../../sellers/entities/seller.entity';

export class CreateAffiliateDto {
  @ApiProperty({
    example: 'creator@example.com',
    description: 'Email address of the affiliate'
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Password (minimum 8 characters)',
    minLength: 8
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({
    example: 'fashioncreator',
    description: 'Unique username (minimum 3 characters)',
    minLength: 3
  })
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  username: string;

  @ApiProperty({
    example: 'María García',
    description: 'Full name of the affiliate'
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: '+57 300 123 4567',
    description: 'Phone number'
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
    example: '{"instagram": "@fashioncreator", "tiktok": "@fashionista"}',
    description: 'JSON string with social media handles'
  })
  @IsOptional()
  @IsString()
  socialMedia?: string;

  @ApiPropertyOptional({
    example: 'Creadora de contenido especializada en moda y lifestyle. Me encanta compartir las últimas tendencias.',
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
    example: 'Bancolombia',
    description: 'Bank name for commission payments'
  })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({
    example: '1234567890',
    description: 'Bank account number'
  })
  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @ApiPropertyOptional({
    example: 'AHORROS',
    description: 'Bank account type (AHORROS or CORRIENTE)',
    enum: ['AHORROS', 'CORRIENTE']
  })
  @IsOptional()
  @IsString()
  bankAccountType?: string;

  @ApiProperty({
    example: 'CC',
    description: 'Document type',
    enum: DocumentType,
    enumName: 'DocumentType'
  })
  @IsEnum(DocumentType, { message: 'Document type must be CC, CE, NIT, or PASSPORT' })
  documentType: DocumentType;

  @ApiProperty({
    example: '1234567890',
    description: 'Document number (Cédula, NIT, or Passport)'
  })
  @IsString()
  documentNumber: string;
}
