
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsOptional,
  IsBoolean,
  Equals,
} from 'class-validator';
import { UserRole } from '../../database/entities/user.entity';

export class RegisterDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!', minLength: 6 })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.BUYER, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({
    example: true,
    description: 'User must accept terms and conditions',
  })
  @IsBoolean({ message: 'Debes aceptar los términos y condiciones' })
  @Equals(true, { message: 'Debes aceptar los términos y condiciones para registrarte' })
  acceptTerms: boolean;

  @ApiProperty({
    example: true,
    description: 'User must accept privacy policy',
  })
  @IsBoolean({ message: 'Debes aceptar la política de privacidad' })
  @Equals(true, { message: 'Debes aceptar la política de privacidad para registrarte' })
  acceptPrivacy: boolean;
}
