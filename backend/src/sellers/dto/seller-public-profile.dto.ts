import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class SellerPublicProfileDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  businessName: string

  @ApiPropertyOptional()
  logoUrl?: string

  @ApiPropertyOptional()
  profileDescription?: string

  @ApiProperty()
  isVerified: boolean

  @ApiProperty()
  followersCount: number

  @ApiProperty()
  productsCount: number

  @ApiPropertyOptional()
  rating?: number

  @ApiPropertyOptional()
  totalReviews?: number

  @ApiPropertyOptional()
  city?: string

  @ApiPropertyOptional()
  state?: string

  @ApiProperty()
  createdAt: Date

  // For authenticated users
  @ApiPropertyOptional()
  isFollowing?: boolean

  @ApiPropertyOptional()
  notificationsEnabled?: boolean
}

export class SellerPublicProfileResponseDto {
  @ApiProperty()
  success: boolean

  @ApiProperty({ type: SellerPublicProfileDto })
  profile: SellerPublicProfileDto
}
