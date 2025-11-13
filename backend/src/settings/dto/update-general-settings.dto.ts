import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail } from 'class-validator';

export class UpdateGeneralSettingsDto {
  @ApiProperty({ example: 'GSHOP', description: 'Site name' })
  @IsOptional()
  @IsString()
  siteName?: string;

  @ApiProperty({ example: "Colombia's Leading Social Commerce Platform", description: 'Site description' })
  @IsOptional()
  @IsString()
  siteDescription?: string;

  @ApiProperty({ example: 'support@gshop.com', description: 'Contact email' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiProperty({ example: '+57 1 234 5678', description: 'Contact phone' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiProperty({ example: 'Bogotá, Colombia', description: 'Address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'es', description: 'Default language' })
  @IsOptional()
  @IsString()
  defaultLanguage?: string;

  @ApiProperty({ example: 'COP', description: 'Default currency' })
  @IsOptional()
  @IsString()
  defaultCurrency?: string;
}
