import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsObject } from 'class-validator';
import { CardType } from '../entities/virtual-card.entity';

export class CreateCardDto {
  @IsOptional()
  @IsEnum(CardType)
  @ApiProperty({ enum: CardType, default: CardType.VIRTUAL, required: false })
  type?: CardType;

  @IsOptional()
  @IsObject()
  @ApiProperty({
    description: 'Optional spending controls',
    required: false,
    example: {
      spendingLimits: [{ amount: 50000, interval: 'monthly' }],
    },
  })
  spendingControls?: {
    spendingLimits?: Array<{
      amount: number;
      interval: string;
    }>;
  };
}
