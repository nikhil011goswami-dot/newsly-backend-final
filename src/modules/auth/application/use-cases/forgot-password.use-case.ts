import { Injectable, Logger } from '@nestjs/common';
import { addHours } from 'date-fns';
import { AuthRepository } from '../../infrastructure/repositories/auth.repository';
import { TokenService } from '../../infrastructure/services/token.service';
import { EmailService } from '../../infrastructure/services/email.service';

@Injectable()
export class ForgotPasswordUseCase {
  private readonly logger = new Logger(ForgotPasswordUseCase.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Always returns the same message whether the email exists or not.
   * This prevents user-enumeration attacks.
   */
  async execute(email: string): Promise<{ message: string }> {
    const GENERIC = 'If an account with that email exists, a password reset link has been sent.';

    const user = await this.authRepository.findUserByEmail(email);
    if (!user || !user.isEmailVerified) return { message: GENERIC };

    const rawToken  = this.tokenService.generateVerificationToken();
    const tokenHash = this.tokenService.hashToken(rawToken);

    await this.authRepository.createPasswordResetToken({
      userId: user.id, tokenHash, expiresAt: addHours(new Date(), 1),
    });

    await this.emailService.sendPasswordResetEmail(user.email, rawToken);
    this.logger.log(`Password reset email sent to: ${user.email}`);

    return { message: GENERIC };
  }
}
