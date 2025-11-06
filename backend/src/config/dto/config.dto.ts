import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsObject, IsEnum, IsOptional } from 'class-validator';
import { ConfigCategory } from '../../database/entities/platform-config.entity';

export class UpdateConfigDto {
  @ApiProperty({
    description: 'Configuration value (must be valid JSON object)',
    example: { rate: 7, type: 'percentage' },
  })
  @IsNotEmpty()
  @IsObject()
  value: any;
}

export class CreateConfigDto {
  @ApiProperty({
    description: 'Configuration key (unique identifier)',
    example: 'new_feature_enabled',
  })
  @IsNotEmpty()
  @IsString()
  key: string;

  @ApiProperty({
    description: 'Configuration value (must be valid JSON object)',
    example: { enabled: true, threshold: 100 },
  })
  @IsNotEmpty()
  @IsObject()
  value: any;

  @ApiProperty({
    description: 'Configuration description',
    example: 'Enable/disable new feature X',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Configuration category',
    enum: ConfigCategory,
    example: ConfigCategory.GENERAL,
  })
  @IsNotEmpty()
  @IsEnum(ConfigCategory)
  category: ConfigCategory;
}
