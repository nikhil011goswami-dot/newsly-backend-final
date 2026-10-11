import { BadRequestException } from '@nestjs/common';
import { VerifyEmailUseCase } from './verify-email.use-case';
import { AuthRepository } from '../../infrastructure/repositories/auth.repository';
import { TokenService } from '../../infrastructure/services/token.service';

describe('VerifyEmailUseCase', () => {
  let useCase: VerifyEmailUseCase;
  let authRepository: jest.Mocked<AuthRepository>;
  let tokenService: jest.Mocked<TokenService>;

  beforeEach(() => {
    authRepository = {
      findEmailVerificationToken: jest.fn(),
      markEmailVerificationTokenUsed: jest.fn(),
      markEmailVerified: jest.fn(),
    } as unknown as jest.Mocked<AuthRepository>;

    tokenService = {
      hashToken: jest.fn().mockReturnValue('hashed-token'),
    } as unknown as jest.Mocked<TokenService>;

    useCase = new VerifyEmailUseCase(authRepository, tokenService);
  });

  it('should reject an invalid token', async () => {
    authRepository.findEmailVerificationToken.mockResolvedValue(null);

    await expect(useCase.execute('invalid-token')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(authRepository.markEmailVerified).not.toHaveBeenCalled();
  });

  it('should reject a token that has already been used', async () => {
    authRepository.findEmailVerificationToken.mockResolvedValue({
      id: 'token-1',
      userId: 'user-1',
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    } as any);

    await expect(useCase.execute('raw-token')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(authRepository.markEmailVerificationTokenUsed).not.toHaveBeenCalled();
    expect(authRepository.markEmailVerified).not.toHaveBeenCalled();
  });

  it('should reject an expired token', async () => {
    authRepository.findEmailVerificationToken.mockResolvedValue({
      id: 'token-1',
      userId: 'user-1',
      usedAt: null,
      expiresAt: new Date(Date.now() - 60_000),
    } as any);

    await expect(useCase.execute('raw-token')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(authRepository.markEmailVerificationTokenUsed).not.toHaveBeenCalled();
    expect(authRepository.markEmailVerified).not.toHaveBeenCalled();
  });

  it('should verify the user and mark the token as used', async () => {
    authRepository.findEmailVerificationToken.mockResolvedValue({
      id: 'token-1',
      userId: 'user-1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    } as any);

    authRepository.markEmailVerificationTokenUsed.mockResolvedValue({} as any);
    authRepository.markEmailVerified.mockResolvedValue({} as any);

    const result = await useCase.execute('raw-token');

    expect(tokenService.hashToken).toHaveBeenCalledWith('raw-token');
    expect(authRepository.findEmailVerificationToken).toHaveBeenCalledWith(
      'hashed-token',
    );
    expect(authRepository.markEmailVerificationTokenUsed).toHaveBeenCalledWith(
      'token-1',
    );
    expect(authRepository.markEmailVerified).toHaveBeenCalledWith('user-1');
    expect(result.message).toContain('Email verified successfully');
  });
});
