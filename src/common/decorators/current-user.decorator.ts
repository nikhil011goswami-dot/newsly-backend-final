import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestUser } from '../types';

/**
 * Extracts `req.user` (populated by JwtStrategy) as a typed parameter.
 *
 * Usage:
 *   @CurrentUser() user: RequestUser         → full user object
 *   @CurrentUser('id') userId: string        → single field
 *   @CurrentUser('sessionId') sid: string    → session id
 */
export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: RequestUser = request.user;
    return data ? user?.[data] : user;
  },
);
