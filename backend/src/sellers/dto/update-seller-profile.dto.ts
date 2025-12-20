import { IsEmail, IsString, IsEnum, IsOptional, Matches } from 'class-validator'
import { BankAccountType } from '../entities/seller.entity'

export class UpdateSellerProfileDto {
  @IsOptional()
  @IsString({ message: 'El nombre del negocio debe ser texto' })
  businessName?: string

  @IsOptional()
  @IsString({ message: 'El nombre del propietario debe ser texto' })
  ownerName?: string

  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email?: string

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto' })
  @Matches(/^[0-9]{10}$/, {
    message: 'Teléfono debe tener 10 dígitos',
  })
  phone?: string

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

  @IsOptional()
  @IsString({ message: 'El nombre del banco debe ser texto' })
  bankName?: string

  @IsOptional()
  @IsEnum(BankAccountType, { message: 'El tipo de cuenta debe ser ahorros o corriente' })
  bankAccountType?: BankAccountType

  @IsOptional()
  @IsString({ message: 'El número de cuenta debe ser texto' })
  @Matches(/^[0-9]{10,20}$/, {
    message: 'Número de cuenta inválido (debe tener entre 10 y 20 dígitos)',
  })
  bankAccountNumber?: string

  @IsOptional()
  @IsString({ message: 'El titular de la cuenta debe ser texto' })
  bankAccountHolder?: string
}
