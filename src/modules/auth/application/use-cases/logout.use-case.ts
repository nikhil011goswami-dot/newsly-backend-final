import { Injectable, Logger } from '@nestjs/common';
import { AuthRepository } from '../../infrastructure/repositories/auth.repository';

@Injectable()
export class LogoutUseCase {
  private readonly logger = new Logger(LogoutUseCase.name);

  constructor(private readonly authRepository: AuthRepository) {}

  /**
   * Logout the current device only:
   * - Deactivate the session
   * - Revoke all refresh tokens belonging to that session
   */
  async executeCurrentDevice(sessionId: string, userId: string): Promise<{ message: string }> {
    await this.authRepository.revokeAllSessionRefreshTokens(sessionId);
    await this.authRepository.deactivateSession(sessionId);

    this.logger.log(`User ${userId} logged out (session ${sessionId})`);
    return { message: 'Logged out successfully.' };
  }

  /**
   * Logout all devices:
   * - Deactivate every active session for the user
   * - Revoke all their refresh tokens
   */
  async executeAllDevices(userId: string): Promise<{ message: string }> {
    // First revoke all tokens across all sessions, then deactivate sessions
    await this.authRepository.deactivateAllUserSessions(userId);

    this.logger.log(`User ${userId} logged out from all devices`);
    return { message: 'Logged out from all devices successfully.' };
  }
}
