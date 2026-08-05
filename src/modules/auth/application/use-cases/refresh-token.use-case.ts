import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { addDays } from 'date-fns';

import { AuthRepository }            from '../../infrastructure/repositories/auth.repository';
import { TokenService, AuthTokens }  from '../../infrastructure/services/token.service';

@Injectable()
export class RefreshTokenUseCase {
  private readonly logger = new Logger(RefreshTokenUseCase.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly tokenService:   TokenService,
  ) {}

  async execute(rawRefreshToken: string): Promise<AuthTokens> {
    const tokenHash = this.tokenService.hashToken(rawRefreshToken);

    // 1. Look up the hashed token
    const storedToken = await this.authRepository.findRefreshToken(tokenHash);

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 2. Reuse detection: if the token has already been revoked, a theft is likely.
    //    Invalidate the entire session to protect the account.
    if (storedToken.revokedAt) {
      this.logger.warn(
        `Refresh token reuse detected for session ${storedToken.sessionId}. Invalidating session.`,
      );
      await this.authRepository.deactivateSession(storedToken.sessionId);
      await this.authRepository.revokeAllSessionRefreshTokens(storedToken.sessionId);
      throw new UnauthorizedException(
        'Refresh token reuse detected. All sessions for this device have been invalidated for your security.',
      );
    }

    // 3. Expiry check
    if (new Date() > storedToken.expiresAt) {
      await this.authRepository.revokeRefreshToken(storedToken.id);
      throw new UnauthorizedException('Refresh token has expired. Please log in again.');
    }

    // 4. Resolve session + user
    const sessionWithUser = await this.authRepository.findSessionWithUser(storedToken.sessionId);
    if (!sessionWithUser || !sessionWithUser.isActive) {
      throw new UnauthorizedException('Session is no longer active. Please log in again.');
    }

    const { user } = sessionWithUser;

    // 5. Rotate: revoke the old token …
    await this.authRepository.revokeRefreshToken(storedToken.id);

    // … and issue a fresh pair
    const newRawRefreshToken = this.tokenService.generateRefreshToken();
    const newTokenHash       = this.tokenService.hashToken(newRawRefreshToken);

    await this.authRepository.createRefreshToken({
      sessionId: storedToken.sessionId,
      tokenHash: newTokenHash,
      expiresAt: addDays(new Date(), 30),
    });

    const newAccessToken = this.tokenService.generateAccessToken({
      sub:       user.id,
      email:     user.email,
      role:      user.role,
      sessionId: storedToken.sessionId,
    });

    this.logger.log(`Token rotated for user ${user.email}`);

    return {
      accessToken:  newAccessToken,
      refreshToken: newRawRefreshToken,
      expiresIn:    900,
    };
  }
}
