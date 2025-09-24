import { IsNotEmpty, IsString, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CustomerDocumentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  number: string;
}

export class ConfirmShippingDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  selectedCarrier: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  selectedService: string;

  @ApiProperty()
  @IsNumber()
  selectedRate: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  easypostRateId?: string;

  @ApiProperty({ type: CustomerDocumentDto })
  @ValidateNested()
  @Type(() => CustomerDocumentDto)
  customerDocument: CustomerDocumentDto;
}