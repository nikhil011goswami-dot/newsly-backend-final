import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as appleSignin from 'apple-signin-auth';

export interface AppleUserInfo {
  appleId:         string;
  email:           string;
  fullName?:       string;
  isEmailVerified: boolean;
}

@Injectable()
export class AppleAuthService {
  private readonly logger = new Logger(AppleAuthService.name);

  constructor(private readonly configService: ConfigService) {}

  async verifyIdentityToken(identityToken: string, fullName?: string): Promise<AppleUserInfo> {
    try {
      const payload = await appleSignin.verifyIdToken(identityToken, {
        audience:         this.configService.get<string>('apple.clientId', 'com.newsly.app'),
        ignoreExpiration: false,
      });

      if (!payload.sub) throw new UnauthorizedException('Invalid Apple token');

      const email = payload.email || `${payload.sub}@privaterelay.appleid.com`;

      return {
        appleId:         payload.sub,
        email,
        fullName:        fullName || email.split('@')[0],
        isEmailVerified: payload.email_verified === 'true' || payload.email_verified === true,
      };
    } catch (error) {
      this.logger.error('Apple token verification failed', error);
      throw new UnauthorizedException('Invalid Apple token');
    }
  }
}
