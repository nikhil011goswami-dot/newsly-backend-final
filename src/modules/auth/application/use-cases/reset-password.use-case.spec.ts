import { BadRequestException } from '@nestjs/common';
import { ResetPasswordUseCase } from './reset-password.use-case';
import { AuthRepository } from '../../infrastructure/repositories/auth.repository';
import { TokenService } from '../../infrastructure/services/token.service';
import { PasswordService } from '../../infrastructure/services/password.service';

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase;
  let authRepository: jest.Mocked<AuthRepository>;
  let tokenService: jest.Mocked<TokenService>;
  let passwordService: jest.Mocked<PasswordService>;

  beforeEach(() => {
    authRepository = {
      findPasswordResetToken: jest.fn(),
      updateAuthProviderPassword: jest.fn(),
      markPasswordResetTokenUsed: jest.fn(),
      deactivateAllUserSessions: jest.fn(),
    } as unknown as jest.Mocked<AuthRepository>;

    tokenService = {
      hashToken: jest.fn().mockReturnValue('hashed-token'),
    } as unknown as jest.Mocked<TokenService>;

    passwordService = {
      hash: jest.fn().mockResolvedValue('new-password-hash'),
    } as unknown as jest.Mocked<PasswordService>;

    useCase = new ResetPasswordUseCase(
      authRepository,
      tokenService,
      passwordService,
    );
  });

  it('should reject an invalid reset token', async () => {
    authRepository.findPasswordResetToken.mockResolvedValue(null);

    await expect(
      useCase.execute('invalid-token', 'NewPassword@123'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(passwordService.hash).not.toHaveBeenCalled();
  });

  it('should reject a reset token that has already been used', async () => {
    authRepository.findPasswordResetToken.mockResolvedValue({
      id: 'reset-1',
      userId: 'user-1',
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    } as any);

    await expect(
      useCase.execute('used-token', 'NewPassword@123'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(authRepository.updateAuthProviderPassword).not.toHaveBeenCalled();
  });

  it('should reject an expired reset token', async () => {
    authRepository.findPasswordResetToken.mockResolvedValue({
      id: 'reset-1',
      userId: 'user-1',
      usedAt: null,
      expiresAt: new Date(Date.now() - 60_000),
    } as any);

    await expect(
      useCase.execute('expired-token', 'NewPassword@123'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(passwordService.hash).not.toHaveBeenCalled();
  });

  it('should hash and save the new password', async () => {
    authRepository.findPasswordResetToken.mockResolvedValue({
      id: 'reset-1',
      userId: 'user-1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    } as any);

    authRepository.updateAuthProviderPassword.mockResolvedValue({} as any);
    authRepository.markPasswordResetTokenUsed.mockResolvedValue({} as any);
    authRepository.deactivateAllUserSessions.mockResolvedValue({} as any);

    await useCase.execute('valid-token', 'NewPassword@123');

    expect(passwordService.hash).toHaveBeenCalledWith('NewPassword@123');
    expect(authRepository.updateAuthProviderPassword).toHaveBeenCalledWith(
      'user-1',
      'new-password-hash',
    );
  });

  it('should mark the reset token as used', async () => {
    authRepository.findPasswordResetToken.mockResolvedValue({
      id: 'reset-1',
      userId: 'user-1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    } as any);

    authRepository.updateAuthProviderPassword.mockResolvedValue({} as any);
    authRepository.markPasswordResetTokenUsed.mockResolvedValue({} as any);
    authRepository.deactivateAllUserSessions.mockResolvedValue({} as any);

    await useCase.execute('valid-token', 'NewPassword@123');

    expect(authRepository.markPasswordResetTokenUsed).toHaveBeenCalledWith(
      'reset-1',
    );
  });

  it('should invalidate all user sessions after resetting the password', async () => {
    authRepository.findPasswordResetToken.mockResolvedValue({
      id: 'reset-1',
      userId: 'user-1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    } as any);

    authRepository.updateAuthProviderPassword.mockResolvedValue({} as any);
    authRepository.markPasswordResetTokenUsed.mockResolvedValue({} as any);
    authRepository.deactivateAllUserSessions.mockResolvedValue({} as any);

    await useCase.execute('valid-token', 'NewPassword@123');

    expect(authRepository.deactivateAllUserSessions).toHaveBeenCalledWith(
      'user-1',
    );
  });

  it('should return a success message after a successful reset', async () => {
    authRepository.findPasswordResetToken.mockResolvedValue({
      id: 'reset-1',
      userId: 'user-1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    } as any);

    authRepository.updateAuthProviderPassword.mockResolvedValue({} as any);
    authRepository.markPasswordResetTokenUsed.mockResolvedValue({} as any);
    authRepository.deactivateAllUserSessions.mockResolvedValue({} as any);

    await expect(
      useCase.execute('valid-token', 'NewPassword@123'),
    ).resolves.toEqual({
      message: 'Password reset successful. Please log in with your new password.',
    });
  });
});
