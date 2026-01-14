import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export enum SocialProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
}

export class SocialLoginDto {
  @ApiProperty({
    description: 'OAuth access token from the social provider',
    example: 'ya29.a0AfH6SMB...',
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiProperty({
    enum: SocialProvider,
    description: 'Social provider name',
    example: 'google',
  })
  @IsEnum(SocialProvider)
  provider: SocialProvider;

  @ApiProperty({
    description: 'ID token (for Google)',
    required: false,
  })
  @IsString()
  @IsOptional()
  idToken?: string;
}

export interface SocialUserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  provider: SocialProvider;
}
