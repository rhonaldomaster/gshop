import { IsBoolean, IsOptional, IsInt, Min, Max, IsIn } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export class ToggleNotificationsDto {
  @ApiProperty({ description: 'Enable or disable notifications' })
  @IsBoolean()
  enabled: boolean
}

export class PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20
}

export class StreamsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by stream status',
    enum: ['live', 'ended', 'all']
  })
  @IsOptional()
  @IsIn(['live', 'ended', 'all'])
  status?: 'live' | 'ended' | 'all'
}

export class FollowResponseDto {
  @ApiProperty()
  success: boolean

  @ApiProperty()
  message: string

  @ApiPropertyOptional()
  isFollowing?: boolean

  @ApiPropertyOptional()
  notificationsEnabled?: boolean
}

export class FollowerDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  firstName: string

  @ApiProperty()
  lastName: string

  @ApiPropertyOptional()
  avatar?: string

  @ApiProperty()
  followedAt: Date
}

export class FollowersListResponseDto {
  @ApiProperty({ type: [FollowerDto] })
  followers: FollowerDto[]

  @ApiProperty()
  total: number

  @ApiProperty()
  page: number

  @ApiProperty()
  totalPages: number
}

export class IsFollowingResponseDto {
  @ApiProperty()
  isFollowing: boolean

  @ApiPropertyOptional()
  notificationsEnabled?: boolean

  @ApiPropertyOptional()
  followedAt?: Date
}
