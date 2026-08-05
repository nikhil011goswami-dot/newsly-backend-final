import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

export interface GoogleUserInfo {
  googleId:         string;
  email:            string;
  fullName:         string;
  profileImageUrl?: string;
  isEmailVerified:  boolean;
}

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);
  private readonly client: OAuth2Client;

  constructor(private readonly configService: ConfigService) {
    this.client = new OAuth2Client(this.configService.get<string>('google.clientId'));
  }

  async verifyIdToken(idToken: string): Promise<GoogleUserInfo> {
    try {
      const ticket  = await this.client.verifyIdToken({
        idToken,
        audience: this.configService.get<string>('google.clientId'),
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) throw new UnauthorizedException('Invalid Google token');

      return {
        googleId:        payload.sub,
        email:           payload.email,
        fullName:        payload.name || payload.email.split('@')[0],
        profileImageUrl: payload.picture,
        isEmailVerified: payload.email_verified || false,
      };
    } catch (error) {
      this.logger.error('Google token verification failed', error);
      throw new UnauthorizedException('Invalid Google token');
    }
  }
}
