import { Injectable, ExecutionContext } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

/**
 * Optional JWT Auth Guard
 * Attempts to authenticate but allows request to proceed even if no/invalid token
 * Use this for endpoints that work for both authenticated and anonymous users
 * The user object will be attached to request if authenticated, otherwise undefined
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Attempt to validate JWT token and attach user to request
      await super.canActivate(context)
    } catch {
      // Silently ignore authentication errors
      // Request proceeds without user attached
    }
    // Always allow the request to proceed
    return true
  }

  // Don't throw an error if no user is found
  handleRequest(err: any, user: any) {
    // Return user if found, otherwise return undefined (not null)
    return user || undefined
  }
}
