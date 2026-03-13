import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BillingAddressDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '123 Main St' })
  line1: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: 'Apt 4B' })
  line2?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Bogota' })
  city: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Cundinamarca' })
  state: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '110111' })
  postalCode: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'ISO country code', example: 'CO' })
  country: string;
}

export class CreateCardholderDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Full legal name', example: 'Juan Perez' })
  name: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Phone number with country code', required: false, example: '+573001234567' })
  phoneNumber?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => BillingAddressDto)
  @ApiProperty({ type: BillingAddressDto })
  billingAddress: BillingAddressDto;
}
