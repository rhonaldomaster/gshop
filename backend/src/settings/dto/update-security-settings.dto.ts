import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';

export class UpdateSecuritySettingsDto {
  @ApiProperty({ example: false, description: 'Enable two-factor authentication' })
  @IsOptional()
  @IsBoolean()
  twoFactorEnabled?: boolean;

  @ApiProperty({ example: 60, description: 'Session timeout in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(1440)
  sessionTimeout?: number;

  @ApiProperty({ example: 8, description: 'Minimum password length' })
  @IsOptional()
  @IsNumber()
  @Min(6)
  @Max(32)
  passwordMinLength?: number;

  @ApiProperty({ example: true, description: 'Require uppercase letters' })
  @IsOptional()
  @IsBoolean()
  passwordRequireUppercase?: boolean;

  @ApiProperty({ example: true, description: 'Require numbers' })
  @IsOptional()
  @IsBoolean()
  passwordRequireNumbers?: boolean;

  @ApiProperty({ example: true, description: 'Require symbols' })
  @IsOptional()
  @IsBoolean()
  passwordRequireSymbols?: boolean;

  @ApiProperty({ example: 5, description: 'Maximum login attempts before lockout' })
  @IsOptional()
  @IsNumber()
  @Min(3)
  @Max(10)
  maxLoginAttempts?: number;

  @ApiProperty({ example: 30, description: 'Lockout duration in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(1440)
  lockoutDuration?: number;
}
