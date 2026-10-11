import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Provider, UserStatus } from '@prisma/client';
import { LoginUseCase } from './login.use-case';
import { AuthRepository } from '../../infrastructure/repositories/auth.repository';
import { PasswordService } from '../../infrastructure/services/password.service';
import { TokenService } from '../../infrastructure/services/token.service';
import { LoginDto } from '../dto/login.dto';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let authRepository: jest.Mocked<AuthRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let tokenService: jest.Mocked<TokenService>;

  const dto: LoginDto = {
    email: 'rahul@example.com',
    password: 'NewslyTest@123',
    deviceId: 'device-1',
    deviceName: 'Test Device',
    platform: 'android',
  };

  const user = {
    id: 'user-1',
    email: dto.email,
    fullName: 'Rahul Test',
    username: 'rahultest',
    profileImageUrl: null,
    role: 'USER',
    status: UserStatus.ACTIVE,
    isEmailVerified: true,
    preferredLanguage: 'en',
  };

  beforeEach(() => {
    authRepository = {
      findUserByEmail: jest.fn(),
      findAuthProvider: jest.fn(),
      createSession: jest.fn(),
      createRefreshToken: jest.fn(),
      updateLastLogin: jest.fn(),
    } as unknown as jest.Mocked<AuthRepository>;

    passwordService = {
      verify: jest.fn(),
    } as unknown as jest.Mocked<PasswordService>;

    tokenService = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      hashToken: jest.fn(),
    } as unknown as jest.Mocked<TokenService>;

    useCase = new LoginUseCase(
      authRepository,
      passwordService,
      tokenService,
    );
  });

  it('should reject when the user does not exist', async () => {
    authRepository.findUserByEmail.mockResolvedValue(null);

    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(authRepository.findAuthProvider).not.toHaveBeenCalled();
  });

  it('should reject a banned user', async () => {
    authRepository.findUserByEmail.mockResolvedValue({
      ...user,
      status: UserStatus.BANNED,
    } as any);

    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(authRepository.findAuthProvider).not.toHaveBeenCalled();
  });

  it('should reject a user whose email is not verified', async () => {
    authRepository.findUserByEmail.mockResolvedValue({
      ...user,
      isEmailVerified: false,
    } as any);

    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(authRepository.findAuthProvider).not.toHaveBeenCalled();
  });

  it('should reject an incorrect password', async () => {
    authRepository.findUserByEmail.mockResolvedValue(user as any);
    authRepository.findAuthProvider.mockResolvedValue({
      passwordHash: 'stored-hash',
    } as any);
    passwordService.verify.mockResolvedValue(false);

    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(authRepository.createSession).not.toHaveBeenCalled();
  });

  it('should reject an account without an email password provider', async () => {
    authRepository.findUserByEmail.mockResolvedValue(user as any);
    authRepository.findAuthProvider.mockResolvedValue(null);

    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(passwordService.verify).not.toHaveBeenCalled();
  });

  it('should return tokens and user details on successful login', async () => {
    authRepository.findUserByEmail.mockResolvedValue(user as any);
    authRepository.findAuthProvider.mockResolvedValue({
      passwordHash: 'stored-hash',
    } as any);
    passwordService.verify.mockResolvedValue(true);
    authRepository.createSession.mockResolvedValue({
      id: 'session-1',
    } as any);
    tokenService.generateAccessToken.mockReturnValue('access-token');
    tokenService.generateRefreshToken.mockReturnValue('refresh-token');
    tokenService.hashToken.mockReturnValue('hashed-refresh-token');
    authRepository.createRefreshToken.mockResolvedValue({} as any);
    authRepository.updateLastLogin.mockResolvedValue({} as any);

    const result = await useCase.execute(dto, '127.0.0.1', 'Jest');

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.expiresIn).toBe(900);
    expect(result.user.email).toBe(dto.email);
    expect(result.user.id).toBe('user-1');
    expect(authRepository.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        deviceId: dto.deviceId,
        platform: dto.platform,
        ipAddress: '127.0.0.1',
        userAgent: 'Jest',
      }),
    );
    expect(authRepository.createRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'session-1',
        tokenHash: 'hashed-refresh-token',
      }),
    );
    expect(authRepository.updateLastLogin).toHaveBeenCalledWith('user-1');
  });
});
