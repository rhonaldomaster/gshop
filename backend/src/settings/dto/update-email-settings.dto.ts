import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEmail, Min, Max } from 'class-validator';

export class UpdateEmailSettingsDto {
  @ApiProperty({ example: 'smtp.gmail.com', description: 'SMTP host' })
  @IsOptional()
  @IsString()
  smtpHost?: string;

  @ApiProperty({ example: 587, description: 'SMTP port' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  smtpPort?: number;

  @ApiProperty({ example: 'noreply@gshop.com', description: 'SMTP username' })
  @IsOptional()
  @IsString()
  smtpUser?: string;

  @ApiProperty({ example: 'password', description: 'SMTP password' })
  @IsOptional()
  @IsString()
  smtpPassword?: string;

  @ApiProperty({ example: 'GSHOP', description: 'From name' })
  @IsOptional()
  @IsString()
  fromName?: string;

  @ApiProperty({ example: 'noreply@gshop.com', description: 'From email' })
  @IsOptional()
  @IsEmail()
  fromEmail?: string;
}
