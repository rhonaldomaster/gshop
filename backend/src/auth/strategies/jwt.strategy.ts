import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Handle both seller tokens and user tokens
    if (payload.type === 'seller') {
      // Seller token format: { sellerId, email, type: 'seller' }
      return {
        id: payload.sellerId,
        sellerId: payload.sellerId,
        email: payload.email,
        role: 'seller',
        type: 'seller'
      };
    }

    // Regular user token format: { sub, email, role }
    const user = await this.authService.findUserById(payload.sub);
    return { id: payload.sub, email: payload.email, role: payload.role, user };
  }
}
