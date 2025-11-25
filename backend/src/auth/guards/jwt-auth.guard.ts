
import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // For public endpoints, try to validate token if present but don't fail if missing
    if (isPublic) {
      try {
        // Attempt to validate JWT token and attach user to request
        await super.canActivate(context);
      } catch (error) {
        // Silently ignore authentication errors for public endpoints
        // This allows the endpoint to work with or without authentication
      }
      // Always allow access to public endpoints
      return true;
    }

    // For protected endpoints, require valid authentication
    return super.canActivate(context) as Promise<boolean>;
  }
}
