import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { JwtPayload, RequestUser } from '@common/types';

const JWT_ISSUER   = 'newsly-api';
const JWT_AUDIENCE = 'newsly-app';

/**
 * Validates the access token on every guarded request.
 *
 * After Passport verifies the JWT signature, expiry, issuer, and audience:
 * 1. Load the user — must be ACTIVE and not soft-deleted.
 * 2. Load the session — must be active (not logged out / invalidated).
 *
 * The returned object becomes `req.user` in all controllers.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma:        PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:      configService.get<string>('jwt.accessSecret', 'fallback-secret'),
      // passport-jwt validates these claims before calling validate()
      issuer:   JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    const user = await this.prisma.user.findUnique({
      where:  { id: payload.sub },
      select: { id: true, email: true, role: true, status: true, deletedAt: true },
    });

    if (!user || user.status !== UserStatus.ACTIVE || user.deletedAt !== null) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const session = await this.prisma.userSession.findUnique({
      where:  { id: payload.sessionId },
      select: { isActive: true },
    });

    if (!session || !session.isActive) {
      throw new UnauthorizedException('Session expired or revoked');
    }

    return { id: user.id, email: user.email, role: user.role, sessionId: payload.sessionId };
  }
}
