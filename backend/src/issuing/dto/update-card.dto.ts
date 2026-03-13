import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsObject } from 'class-validator';
import { CardStatus } from '../entities/virtual-card.entity';

export class UpdateCardDto {
  @IsOptional()
  @IsEnum(CardStatus)
  @ApiProperty({ enum: [CardStatus.ACTIVE, CardStatus.INACTIVE], required: false })
  status?: CardStatus;

  @IsOptional()
  @IsObject()
  @ApiProperty({
    description: 'Update spending controls',
    required: false,
    example: {
      spendingLimits: [{ amount: 100000, interval: 'monthly' }],
    },
  })
  spendingControls?: {
    spendingLimits?: Array<{
      amount: number;
      interval: string;
    }>;
  };
}
