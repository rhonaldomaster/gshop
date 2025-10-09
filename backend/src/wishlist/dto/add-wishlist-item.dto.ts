import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddWishlistItemDto {
  @ApiProperty({ description: 'Product ID to add to wishlist' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;
}
