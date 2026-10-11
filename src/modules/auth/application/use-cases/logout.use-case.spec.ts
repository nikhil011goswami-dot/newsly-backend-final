import { LogoutUseCase } from './logout.use-case';
import { AuthRepository } from '../../infrastructure/repositories/auth.repository';

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;
  let authRepository: jest.Mocked<AuthRepository>;

  beforeEach(() => {
    authRepository = {
      revokeAllSessionRefreshTokens: jest.fn(),
      deactivateSession: jest.fn(),
      deactivateAllUserSessions: jest.fn(),
    } as unknown as jest.Mocked<AuthRepository>;

    useCase = new LogoutUseCase(authRepository);
  });

  it('should revoke refresh tokens for the current session', async () => {
    authRepository.revokeAllSessionRefreshTokens.mockResolvedValue({} as any);
    authRepository.deactivateSession.mockResolvedValue({} as any);

    await useCase.executeCurrentDevice('session-1', 'user-1');

    expect(
      authRepository.revokeAllSessionRefreshTokens,
    ).toHaveBeenCalledWith('session-1');
  });

  it('should deactivate the current session', async () => {
    authRepository.revokeAllSessionRefreshTokens.mockResolvedValue({} as any);
    authRepository.deactivateSession.mockResolvedValue({} as any);

    await useCase.executeCurrentDevice('session-1', 'user-1');

    expect(authRepository.deactivateSession).toHaveBeenCalledWith('session-1');
  });

  it('should return a success message for current-device logout', async () => {
    authRepository.revokeAllSessionRefreshTokens.mockResolvedValue({} as any);
    authRepository.deactivateSession.mockResolvedValue({} as any);

    await expect(
      useCase.executeCurrentDevice('session-1', 'user-1'),
    ).resolves.toEqual({ message: 'Logged out successfully.' });
  });

  it('should deactivate all sessions for the user', async () => {
    authRepository.deactivateAllUserSessions.mockResolvedValue({} as any);

    await useCase.executeAllDevices('user-1');

    expect(authRepository.deactivateAllUserSessions).toHaveBeenCalledWith(
      'user-1',
    );
  });

  it('should return a success message for all-device logout', async () => {
    authRepository.deactivateAllUserSessions.mockResolvedValue({} as any);

    await expect(useCase.executeAllDevices('user-1')).resolves.toEqual({
      message: 'Logged out from all devices successfully.',
    });
  });
});
