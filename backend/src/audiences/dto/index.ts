import { IsString, IsEnum, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { AudienceType } from '../audience.entity';

export class CreateAudienceDto {
  @IsString()
  name: string;

  @IsEnum(AudienceType)
  type: AudienceType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsObject()
  rules: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAudienceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  rules?: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}