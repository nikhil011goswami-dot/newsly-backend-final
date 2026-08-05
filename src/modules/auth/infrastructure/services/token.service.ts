import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { JwtPayload } from '@common/types';

export interface AuthTokens {
  accessToken:  string;
  refreshToken: string;
  /** Remaining lifetime of the access token in seconds. */
  expiresIn:    number;
}

/** Fixed claims that every token we issue must carry. */
const JWT_ISSUER   = 'newsly-api';
const JWT_AUDIENCE = 'newsly-app';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService:    JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret:    this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn', '15m') as any,
      issuer:    JWT_ISSUER,
      audience:  JWT_AUDIENCE,
    });
  }

  /**
   * 128 hex-char opaque token.
   * Raw value → client; SHA-256 hash → DB.
   */
  generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * 64 hex-char token for email-verification / password-reset links.
   */
  generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token, {
      secret:   this.configService.get<string>('jwt.accessSecret'),
      issuer:   JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  }
}
