import { IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator'

export class UploadDocumentsDto {
  @IsString()
  @IsNotEmpty()
  rutFileUrl: string

  @IsString()
  @IsOptional()
  comercioFileUrl?: string

  @IsDateString()
  @IsOptional()
  comercioExpirationDate?: string
}
