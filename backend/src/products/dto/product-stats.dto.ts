import { ApiProperty } from '@nestjs/swagger';

export class ProductStatsDto {
  @ApiProperty({
    description: 'Total number of all products',
    example: 234,
  })
  totalProducts: number;

  @ApiProperty({
    description: 'Percentage change in products from last period',
    example: 5.7,
  })
  productsChange: number;

  @ApiProperty({
    description: 'Number of active products available for sale',
    example: 198,
  })
  activeProducts: number;

  @ApiProperty({
    description: 'Number of products that are out of stock',
    example: 12,
  })
  outOfStock: number;

  @ApiProperty({
    description: 'Number of products with low inventory (less than 10 units)',
    example: 23,
  })
  lowStock: number;

  @ApiProperty({
    description: 'Number of draft products not yet published',
    example: 18,
  })
  draftProducts: number;
}
