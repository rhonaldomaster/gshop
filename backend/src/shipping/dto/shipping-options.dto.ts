import { ApiProperty } from '@nestjs/swagger';

export class ShippingOptionDto {
  @ApiProperty()
  carrier: string;

  @ApiProperty()
  service: string;

  @ApiProperty()
  rate: number;

  @ApiProperty()
  deliveryTime: string;

  @ApiProperty({ required: false })
  easypostRateId?: string;
}