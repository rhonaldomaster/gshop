import { ApiProperty } from '@nestjs/swagger';

export class UserStatsDto {
  @ApiProperty({
    description: 'Total number of all registered users',
    example: 5847,
  })
  totalUsers: number;

  @ApiProperty({
    description: 'Percentage change in users from last period',
    example: 15.3,
  })
  usersChange: number;

  @ApiProperty({
    description: 'Number of active users (made orders in last 30 days)',
    example: 982,
  })
  activeUsers: number;

  @ApiProperty({
    description: 'Number of new user registrations this month',
    example: 234,
  })
  newUsersThisMonth: number;

  @ApiProperty({
    description: 'Total number of sellers',
    example: 145,
  })
  sellerCount: number;

  @ApiProperty({
    description: 'Total number of affiliates',
    example: 78,
  })
  affiliateCount: number;

  @ApiProperty({
    description: 'Total number of buyers',
    example: 5624,
  })
  buyersCount: number;

  @ApiProperty({
    description: 'Total number of admins',
    example: 5,
  })
  adminsCount: number;
}
