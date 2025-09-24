import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessReturnDto {
  @ApiProperty()
  @IsBoolean()
  approved: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  sellerNotes?: string;
}