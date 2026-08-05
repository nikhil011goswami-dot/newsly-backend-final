import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { AuthRepository } from '../../infrastructure/repositories/auth.repository';
import { TokenService } from '../../infrastructure/services/token.service';
import { PasswordService } from '../../infrastructure/services/password.service';

@Injectable()
export class ResetPasswordUseCase {
  private readonly logger = new Logger(ResetPasswordUseCase.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly tokenService: TokenService,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(token: string, newPassword: string): Promise<{ message: string }> {
    const tokenHash = this.tokenService.hashToken(token);
    const record    = await this.authRepository.findPasswordResetToken(tokenHash);

    if (!record)       throw new BadRequestException('Invalid password reset link');
    if (record.usedAt) throw new BadRequestException('Password reset link already used');
    if (new Date() > record.expiresAt) throw new BadRequestException('Password reset link has expired');

    const newPasswordHash = await this.passwordService.hash(newPassword);
    await this.authRepository.updateAuthProviderPassword(record.userId, newPasswordHash);
    await this.authRepository.markPasswordResetTokenUsed(record.id);

    // Invalidate all sessions after a password change.
    await this.authRepository.deactivateAllUserSessions(record.userId);

    this.logger.log(`Password reset completed for user: ${record.userId}`);
    return { message: 'Password reset successful. Please log in with your new password.' };
  }
}
