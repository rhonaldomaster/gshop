import { IsEmail, IsString, IsEnum, MinLength, IsOptional, IsDecimal, IsNotEmpty, Matches } from 'class-validator'
import { SellerType, DocumentType, BankAccountType } from '../entities/seller.entity'

export class CreateSellerDto {
  @IsEnum(SellerType, { message: 'El tipo de vendedor debe ser natural o juridica' })
  @IsNotEmpty({ message: 'El tipo de vendedor es requerido' })
  sellerType: SellerType

  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email: string

  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(8, { message: 'La contraseña debe tener mínimo 8 caracteres' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string

  @IsString({ message: 'El nombre del negocio debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del negocio es requerido' })
  businessName: string

  @IsString({ message: 'El nombre del propietario debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del propietario es requerido' })
  ownerName: string

  @IsEnum(DocumentType, { message: 'El tipo de documento debe ser CC, CE, NIT o PASSPORT' })
  @IsNotEmpty({ message: 'El tipo de documento es requerido' })
  documentType: DocumentType

  @IsString({ message: 'El número de documento debe ser texto' })
  @IsNotEmpty({ message: 'El número de documento es requerido' })
  @Matches(/^[0-9]{6,15}$/, {
    message: 'Número de documento inválido (debe tener entre 6 y 15 dígitos)',
  })
  documentNumber: string

  @IsString({ message: 'El teléfono debe ser texto' })
  @IsNotEmpty({ message: 'El teléfono es requerido' })
  @Matches(/^[0-9]{10}$/, {
    message: 'Teléfono debe tener 10 dígitos',
  })
  phone: string

  @IsOptional()
  @IsString({ message: 'La dirección debe ser texto' })
  address?: string

  @IsOptional()
  @IsString({ message: 'La ciudad debe ser texto' })
  city?: string

  @IsOptional()
  @IsString({ message: 'El departamento debe ser texto' })
  state?: string

  @IsOptional()
  @IsString({ message: 'El país debe ser texto' })
  country?: string

  @IsOptional()
  @IsString({ message: 'La categoría del negocio debe ser texto' })
  businessCategory?: string

  // Datos bancarios para pagos
  @IsString({ message: 'El nombre del banco debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del banco es requerido' })
  bankName: string

  @IsEnum(BankAccountType, { message: 'El tipo de cuenta debe ser ahorros o corriente' })
  @IsNotEmpty({ message: 'El tipo de cuenta es requerido' })
  bankAccountType: BankAccountType

  @IsString({ message: 'El número de cuenta debe ser texto' })
  @IsNotEmpty({ message: 'El número de cuenta es requerido' })
  @Matches(/^[0-9]{10,20}$/, {
    message: 'Número de cuenta inválido (debe tener entre 10 y 20 dígitos)',
  })
  bankAccountNumber: string

  @IsString({ message: 'El titular de la cuenta debe ser texto' })
  @IsNotEmpty({ message: 'El titular de la cuenta es requerido' })
  bankAccountHolder: string

  @IsOptional()
  @IsDecimal()
  commissionRate?: number

  @IsOptional()
  @IsString()
  mercadoPagoAccountId?: string
}