import { ApiProperty } from '@nestjs/swagger';

export class VatCategoryDto {
  @ApiProperty()
  base: number;

  @ApiProperty()
  vat: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  orders: number;
}

export class VatBreakdownDto {
  @ApiProperty({ type: VatCategoryDto })
  excluido: VatCategoryDto;

  @ApiProperty({ type: VatCategoryDto })
  exento: VatCategoryDto;

  @ApiProperty({ type: VatCategoryDto })
  reducido: VatCategoryDto;

  @ApiProperty({ type: VatCategoryDto })
  general: VatCategoryDto;
}

export class VatReportDto {
  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty({ type: VatBreakdownDto })
  breakdown: VatBreakdownDto;

  @ApiProperty()
  totalBase: number;

  @ApiProperty()
  totalVat: number;

  @ApiProperty()
  totalWithVat: number;

  @ApiProperty()
  totalOrders: number;
}
