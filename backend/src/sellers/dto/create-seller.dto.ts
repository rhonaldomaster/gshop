import { IsEmail, IsString, IsEnum, MinLength, IsOptional, IsDecimal, IsNotEmpty, Matches } from 'class-validator'
import { SellerType, DocumentType, BankAccountType } from '../entities/seller.entity'

export class CreateSellerDto {
  @IsEnum(SellerType)
  @IsNotEmpty()
  sellerType: SellerType

  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string

  @IsString()
  @IsNotEmpty()
  businessName: string

  @IsString()
  @IsNotEmpty()
  ownerName: string

  @IsEnum(DocumentType)
  @IsNotEmpty()
  documentType: DocumentType

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{6,15}$/, {
    message: 'Número de documento inválido',
  })
  documentNumber: string

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{10}$/, {
    message: 'Teléfono debe tener 10 dígitos',
  })
  phone: string

  @IsOptional()
  @IsString()
  address?: string

  @IsOptional()
  @IsString()
  city?: string

  @IsOptional()
  @IsString()
  country?: string

  @IsOptional()
  @IsString()
  businessCategory?: string

  // Datos bancarios para pagos
  @IsString()
  @IsNotEmpty()
  bankName: string

  @IsEnum(BankAccountType)
  @IsNotEmpty()
  bankAccountType: BankAccountType

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{10,20}$/, {
    message: 'Número de cuenta inválido',
  })
  bankAccountNumber: string

  @IsString()
  @IsNotEmpty()
  bankAccountHolder: string

  @IsOptional()
  @IsDecimal()
  commissionRate?: number

  @IsOptional()
  @IsString()
  mercadoPagoAccountId?: string
}