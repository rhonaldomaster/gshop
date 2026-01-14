import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SocialProvider, SocialUserData } from '../dto/social-login.dto';

@Injectable()
export class SocialAuthService {
  constructor(private httpService: HttpService) {}

  async validateGoogleToken(accessToken: string): Promise<SocialUserData> {
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );

      const { sub, email, given_name, family_name, picture } = response.data;

      if (!email) {
        throw new HttpException(
          'Email not provided by Google',
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        id: sub,
        email,
        firstName: given_name || email.split('@')[0],
        lastName: family_name || '',
        avatar: picture,
        provider: SocialProvider.GOOGLE,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Invalid Google token', HttpStatus.UNAUTHORIZED);
    }
  }

  async validateFacebookToken(accessToken: string): Promise<SocialUserData> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://graph.facebook.com/me?fields=id,email,first_name,last_name,picture.type(large)&access_token=${accessToken}`,
        ),
      );

      const { id, email, first_name, last_name, picture } = response.data;

      if (!email) {
        throw new HttpException(
          'Email not provided by Facebook. Please allow email access.',
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        id,
        email,
        firstName: first_name || email.split('@')[0],
        lastName: last_name || '',
        avatar: picture?.data?.url,
        provider: SocialProvider.FACEBOOK,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Invalid Facebook token',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  async validateSocialToken(
    accessToken: string,
    provider: SocialProvider,
  ): Promise<SocialUserData> {
    switch (provider) {
      case SocialProvider.GOOGLE:
        return this.validateGoogleToken(accessToken);
      case SocialProvider.FACEBOOK:
        return this.validateFacebookToken(accessToken);
      default:
        throw new HttpException(
          'Unsupported social provider',
          HttpStatus.BAD_REQUEST,
        );
    }
  }
}
