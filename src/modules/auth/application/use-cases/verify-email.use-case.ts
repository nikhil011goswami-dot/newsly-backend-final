import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { AuthRepository } from '../../infrastructure/repositories/auth.repository';
import { TokenService } from '../../infrastructure/services/token.service';

@Injectable()
export class VerifyEmailUseCase {
  private readonly logger = new Logger(VerifyEmailUseCase.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(token: string): Promise<{ message: string }> {
    const tokenHash = this.tokenService.hashToken(token);
    const record    = await this.authRepository.findEmailVerificationToken(tokenHash);

    if (!record)       throw new BadRequestException('Invalid verification link');
    if (record.usedAt) throw new BadRequestException('Verification link already used');
    if (new Date() > record.expiresAt) {
      throw new BadRequestException('Verification link has expired. Please register again.');
    }

    await this.authRepository.markEmailVerificationTokenUsed(record.id);
    await this.authRepository.markEmailVerified(record.userId);

    this.logger.log(`Email verified for user: ${record.userId}`);
    return { message: 'Email verified successfully. You can now log in.' };
  }
}
