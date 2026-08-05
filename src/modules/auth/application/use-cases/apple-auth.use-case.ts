import { Injectable, Logger } from '@nestjs/common';
import { Provider } from '@prisma/client';
import { addDays } from 'date-fns';
import { AuthRepository } from '../../infrastructure/repositories/auth.repository';
import { TokenService, AuthTokens } from '../../infrastructure/services/token.service';
import { AppleAuthService } from '../../infrastructure/services/apple-auth.service';
import { AppleAuthDto } from '../dto/apple-auth.dto';

@Injectable()
export class AppleAuthUseCase {
  private readonly logger = new Logger(AppleAuthUseCase.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly tokenService: TokenService,
    private readonly appleAuthService: AppleAuthService,
  ) {}

  async execute(
    dto: AppleAuthDto,
    ipAddress?: string,
  ): Promise<AuthTokens & { user: Record<string, unknown>; isNewUser: boolean }> {
    const appleUser = await this.appleAuthService.verifyIdentityToken(dto.identityToken, dto.fullName);

    let user      = await this.authRepository.findUserByEmail(appleUser.email);
    let isNewUser = false;

    if (!user) {
      user      = await this.authRepository.createUser({ email: appleUser.email, fullName: appleUser.fullName, isEmailVerified: true });
      isNewUser = true;
    }

    const existing = await this.authRepository.findAuthProvider(user.id, Provider.APPLE);
    if (!existing) {
      await this.authRepository.createAuthProvider({ userId: user.id, provider: Provider.APPLE, providerUserId: appleUser.appleId });
    }

    if (!user.isEmailVerified) await this.authRepository.markEmailVerified(user.id);

    const session         = await this.authRepository.createSession({ userId: user.id, deviceId: dto.deviceId, platform: dto.platform, ipAddress });
    const accessToken     = this.tokenService.generateAccessToken({ sub: user.id, email: user.email, role: user.role, sessionId: session.id });
    const rawRefreshToken = this.tokenService.generateRefreshToken();

    await this.authRepository.createRefreshToken({ sessionId: session.id, tokenHash: this.tokenService.hashToken(rawRefreshToken), expiresAt: addDays(new Date(), 30) });
    await this.authRepository.updateLastLogin(user.id);

    this.logger.log(`Apple login: ${user.email} (new: ${isNewUser})`);
    return {
      accessToken, refreshToken: rawRefreshToken, expiresIn: 900, isNewUser,
      user: { id: user.id, email: user.email, fullName: user.fullName, username: user.username, profileImageUrl: user.profileImageUrl, role: user.role, isEmailVerified: true, preferredLanguage: user.preferredLanguage },
    };
  }
}
