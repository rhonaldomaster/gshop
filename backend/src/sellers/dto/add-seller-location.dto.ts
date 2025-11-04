import { IsBoolean, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddSellerLocationDto {
  @ApiProperty({
    description: 'Ciudad donde el vendedor tiene presencia',
    example: 'Bogotá',
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: 'Departamento/Estado',
    example: 'Cundinamarca',
  })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({
    description: '¿Es la ubicación principal?',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiProperty({
    description: 'Dirección completa (opcional)',
    example: 'Calle 123 #45-67',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;
}
