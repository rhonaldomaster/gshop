import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';
import { MIN_FUND_AMOUNT_USD, MAX_FUND_AMOUNT_USD } from '../constants';

export class FundCardDto {
  @IsNumber()
  @Min(MIN_FUND_AMOUNT_USD)
  @Max(MAX_FUND_AMOUNT_USD)
  @ApiProperty({ description: 'Amount in USD', minimum: 0.5, maximum: 10000, example: 50 })
  amountUSD: number;
}
