import { UnauthorizedException } from '@nestjs/common';
import { RefreshTokenUseCase } from './refresh-token.use-case';
import { AuthRepository } from '../../infrastructure/repositories/auth.repository';
import { TokenService } from '../../infrastructure/services/token.service';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let authRepository: jest.Mocked<AuthRepository>;
  let tokenService: jest.Mocked<TokenService>;

  beforeEach(() => {
    authRepository = {
      findRefreshToken: jest.fn(),
      deactivateSession: jest.fn(),
      revokeAllSessionRefreshTokens: jest.fn(),
      revokeRefreshToken: jest.fn(),
      findSessionWithUser: jest.fn(),
      createRefreshToken: jest.fn(),
    } as unknown as jest.Mocked<AuthRepository>;

    tokenService = {
      hashToken: jest.fn().mockReturnValue('hashed-token'),
      generateRefreshToken: jest.fn().mockReturnValue('new-raw-token'),
      generateAccessToken: jest.fn().mockReturnValue('new-access-token'),
    } as unknown as jest.Mocked<TokenService>;

    useCase = new RefreshTokenUseCase(authRepository, tokenService);
  });

  it('should reject an unknown refresh token', async () => {
    authRepository.findRefreshToken.mockResolvedValue(null);

    await expect(useCase.execute('unknown-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(authRepository.findSessionWithUser).not.toHaveBeenCalled();
  });

  it('should invalidate the session when a revoked token is reused', async () => {
    authRepository.findRefreshToken.mockResolvedValue({
      id: 'token-1',
      sessionId: 'session-1',
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    } as any);

    authRepository.deactivateSession.mockResolvedValue({} as any);
    authRepository.revokeAllSessionRefreshTokens.mockResolvedValue({} as any);

    await expect(useCase.execute('reused-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(authRepository.deactivateSession).toHaveBeenCalledWith('session-1');
    expect(
      authRepository.revokeAllSessionRefreshTokens,
    ).toHaveBeenCalledWith('session-1');
  });

  it('should revoke an expired refresh token', async () => {
    authRepository.findRefreshToken.mockResolvedValue({
      id: 'token-1',
      sessionId: 'session-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() - 60_000),
    } as any);

    authRepository.revokeRefreshToken.mockResolvedValue({} as any);

    await expect(useCase.execute('expired-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(authRepository.revokeRefreshToken).toHaveBeenCalledWith('token-1');
    expect(authRepository.findSessionWithUser).not.toHaveBeenCalled();
  });

  it('should reject a missing or inactive session', async () => {
    authRepository.findRefreshToken.mockResolvedValue({
      id: 'token-1',
      sessionId: 'session-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    } as any);

    authRepository.findSessionWithUser.mockResolvedValue({
      isActive: false,
      user: {
        id: 'user-1',
        email: 'rahul@example.com',
        role: 'USER',
      },
    } as any);

    await expect(useCase.execute('valid-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(authRepository.revokeRefreshToken).not.toHaveBeenCalled();
    expect(authRepository.createRefreshToken).not.toHaveBeenCalled();
  });

  it('should rotate the refresh token for an active session', async () => {
    authRepository.findRefreshToken.mockResolvedValue({
      id: 'old-token-id',
      sessionId: 'session-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    } as any);

    authRepository.findSessionWithUser.mockResolvedValue({
      isActive: true,
      user: {
        id: 'user-1',
        email: 'rahul@example.com',
        role: 'USER',
      },
    } as any);

    authRepository.revokeRefreshToken.mockResolvedValue({} as any);
    authRepository.createRefreshToken.mockResolvedValue({} as any);

    const result = await useCase.execute('old-raw-token');

    expect(authRepository.revokeRefreshToken).toHaveBeenCalledWith(
      'old-token-id',
    );
    expect(authRepository.createRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'session-1',
        tokenHash: 'hashed-token',
        expiresAt: expect.any(Date),
      }),
    );
    expect(tokenService.generateAccessToken).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'rahul@example.com',
      role: 'USER',
      sessionId: 'session-1',
    });
    expect(result).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-raw-token',
      expiresIn: 900,
    });
  });
});
