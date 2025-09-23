import { IsEmail, IsString, IsEnum, MinLength, IsOptional, IsDecimal } from 'class-validator'

export class CreateSellerDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  password: string

  @IsString()
  businessName: string

  @IsString()
  ownerName: string

  @IsEnum(['CC', 'NIT', 'RUT', 'Passport'])
  documentType: string

  @IsString()
  documentNumber: string

  @IsString()
  phone: string

  @IsString()
  address: string

  @IsString()
  city: string

  @IsString()
  country: string

  @IsString()
  businessCategory: string

  @IsOptional()
  @IsDecimal()
  commissionRate?: number

  @IsOptional()
  @IsString()
  mercadoPagoAccountId?: string
}