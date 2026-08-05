import { Injectable, Logger } from '@nestjs/common';
import { Provider } from '@prisma/client';
import { addDays } from 'date-fns';
import { AuthRepository } from '../../infrastructure/repositories/auth.repository';
import { TokenService, AuthTokens } from '../../infrastructure/services/token.service';
import { GoogleAuthService } from '../../infrastructure/services/google-auth.service';
import { GoogleAuthDto } from '../dto/google-auth.dto';

@Injectable()
export class GoogleAuthUseCase {
  private readonly logger = new Logger(GoogleAuthUseCase.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly tokenService: TokenService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  async execute(
    dto: GoogleAuthDto,
    ipAddress?: string,
  ): Promise<AuthTokens & { user: Record<string, unknown>; isNewUser: boolean }> {
    const googleUser = await this.googleAuthService.verifyIdToken(dto.idToken);

    let user      = await this.authRepository.findUserByEmail(googleUser.email);
    let isNewUser = false;

    if (!user) {
      user      = await this.authRepository.createUser({
        email: googleUser.email, fullName: googleUser.fullName,
        profileImageUrl: googleUser.profileImageUrl, isEmailVerified: true,
      });
      isNewUser = true;
    }

    const existing = await this.authRepository.findAuthProvider(user.id, Provider.GOOGLE);
    if (!existing) {
      await this.authRepository.createAuthProvider({
        userId: user.id, provider: Provider.GOOGLE, providerUserId: googleUser.googleId,
      });
    }

    if (!user.isEmailVerified) await this.authRepository.markEmailVerified(user.id);

    const session         = await this.authRepository.createSession({ userId: user.id, deviceId: dto.deviceId, platform: dto.platform, ipAddress });
    const accessToken     = this.tokenService.generateAccessToken({ sub: user.id, email: user.email, role: user.role, sessionId: session.id });
    const rawRefreshToken = this.tokenService.generateRefreshToken();

    await this.authRepository.createRefreshToken({ sessionId: session.id, tokenHash: this.tokenService.hashToken(rawRefreshToken), expiresAt: addDays(new Date(), 30) });
    await this.authRepository.updateLastLogin(user.id);

    this.logger.log(`Google login: ${user.email} (new: ${isNewUser})`);
    return {
      accessToken, refreshToken: rawRefreshToken, expiresIn: 900, isNewUser,
      user: { id: user.id, email: user.email, fullName: user.fullName, username: user.username, profileImageUrl: user.profileImageUrl, role: user.role, isEmailVerified: true, preferredLanguage: user.preferredLanguage },
    };
  }
}
