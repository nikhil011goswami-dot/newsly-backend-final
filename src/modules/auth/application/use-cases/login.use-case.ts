import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Provider, UserStatus } from '@prisma/client';
import { addDays } from 'date-fns';

import { AuthRepository }  from '../../infrastructure/repositories/auth.repository';
import { PasswordService } from '../../infrastructure/services/password.service';
import { TokenService, AuthTokens } from '../../infrastructure/services/token.service';
import { LoginDto }        from '../dto/login.dto';

export interface LoginResult extends AuthTokens {
  user: {
    id:               string;
    email:            string;
    fullName:         string | null;
    username:         string | null;
    profileImageUrl:  string | null;
    role:             string;
    isEmailVerified:  boolean;
    preferredLanguage: string;
  };
}

@Injectable()
export class LoginUseCase {
  private readonly logger = new Logger(LoginUseCase.name);

  constructor(
    private readonly authRepository:  AuthRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService:    TokenService,
  ) {}

  async execute(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<LoginResult> {
    // 1. Resolve user
    const user = await this.authRepository.findUserByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 2. Status guard
    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenException('Your account has been suspended. Please contact support.');
    }
    if (user.status === UserStatus.DELETED) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 3. Email verification guard
    if (!user.isEmailVerified) {
      throw new ForbiddenException(
        'Please verify your email before logging in. Check your inbox for the verification link.',
      );
    }

    // 4. Retrieve the EMAIL auth-provider record (contains the password hash)
    const authProvider = await this.authRepository.findAuthProvider(user.id, Provider.EMAIL);
    if (!authProvider || !authProvider.passwordHash) {
      // Account exists but was created via social login — no password set
      throw new UnauthorizedException(
        'This account uses Google or Apple sign-in. Please use the appropriate login method.',
      );
    }

    // 5. Verify password
    const isPasswordValid = await this.passwordService.verify(
      authProvider.passwordHash,
      dto.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 6. Create a new device session
    const session = await this.authRepository.createSession({
      userId:     user.id,
      deviceId:   dto.deviceId,
      deviceName: dto.deviceName,
      platform:   dto.platform,
      ipAddress,
      userAgent,
    });

    // 7. Issue tokens
    const accessToken = this.tokenService.generateAccessToken({
      sub:       user.id,
      email:     user.email,
      role:      user.role,
      sessionId: session.id,
    });

    const rawRefreshToken = this.tokenService.generateRefreshToken();
    const tokenHash       = this.tokenService.hashToken(rawRefreshToken);

    await this.authRepository.createRefreshToken({
      sessionId: session.id,
      tokenHash,
      expiresAt: addDays(new Date(), 30),
    });

    // 8. Stamp last login
    await this.authRepository.updateLastLogin(user.id);

    this.logger.log(`Login: ${user.email} from ${ipAddress ?? 'unknown'}`);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn:    900, // 15 min in seconds
      user: {
        id:               user.id,
        email:            user.email,
        fullName:         user.fullName,
        username:         user.username,
        profileImageUrl:  user.profileImageUrl,
        role:             user.role,
        isEmailVerified:  user.isEmailVerified,
        preferredLanguage: user.preferredLanguage,
      },
    };
  }
}
