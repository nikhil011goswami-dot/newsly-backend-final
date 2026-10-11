import { ConflictException } from '@nestjs/common';
import { Provider } from '@prisma/client';
import { RegisterUseCase } from './register.use-case';
import { AuthRepository } from '../../infrastructure/repositories/auth.repository';
import { PasswordService } from '../../infrastructure/services/password.service';
import { TokenService } from '../../infrastructure/services/token.service';
import { EmailService } from '../../infrastructure/services/email.service';
import { RegisterDto } from '../dto/register.dto';

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let authRepository: jest.Mocked<AuthRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let tokenService: jest.Mocked<TokenService>;
  let emailService: jest.Mocked<EmailService>;

  const dto: RegisterDto = {
    email: 'rahul@example.com',
    fullName: 'Rahul Sharma',
    username: 'rahul_sharma',
    password: 'NewslyTest@123',
  };

  beforeEach(() => {
    authRepository = {
      findUserByEmail: jest.fn(),
      createUser: jest.fn(),
      createAuthProvider: jest.fn(),
      createEmailVerificationToken: jest.fn(),
    } as unknown as jest.Mocked<AuthRepository>;

    passwordService = {
      hash: jest.fn(),
    } as unknown as jest.Mocked<PasswordService>;

    tokenService = {
      generateVerificationToken: jest.fn(),
      hashToken: jest.fn(),
    } as unknown as jest.Mocked<TokenService>;

    emailService = {
      sendVerificationEmail: jest.fn(),
    } as unknown as jest.Mocked<EmailService>;

    useCase = new RegisterUseCase(
      authRepository,
      passwordService,
      tokenService,
      emailService,
    );
  });

  it('should reject an already registered email', async () => {
    authRepository.findUserByEmail.mockResolvedValue({
      id: 'existing-user',
    } as any);

    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(passwordService.hash).not.toHaveBeenCalled();
    expect(authRepository.createUser).not.toHaveBeenCalled();
  });

  it('should hash the password and create an unverified user', async () => {
    authRepository.findUserByEmail.mockResolvedValue(null);
    passwordService.hash.mockResolvedValue('hashed-password');
    authRepository.createUser.mockResolvedValue({
      id: 'user-1',
      email: dto.email,
    } as any);
    authRepository.createAuthProvider.mockResolvedValue({} as any);
    tokenService.generateVerificationToken.mockReturnValue('raw-token');
    tokenService.hashToken.mockReturnValue('hashed-token');
    authRepository.createEmailVerificationToken.mockResolvedValue({} as any);
    emailService.sendVerificationEmail.mockResolvedValue(undefined);

    await useCase.execute(dto);

    expect(passwordService.hash).toHaveBeenCalledWith(dto.password);
    expect(authRepository.createUser).toHaveBeenCalledWith({
      email: dto.email,
      fullName: dto.fullName,
      username: dto.username,
      isEmailVerified: false,
    });
  });

  it('should create an email auth provider with the password hash', async () => {
    authRepository.findUserByEmail.mockResolvedValue(null);
    passwordService.hash.mockResolvedValue('hashed-password');
    authRepository.createUser.mockResolvedValue({
      id: 'user-1',
      email: dto.email,
    } as any);
    authRepository.createAuthProvider.mockResolvedValue({} as any);
    tokenService.generateVerificationToken.mockReturnValue('raw-token');
    tokenService.hashToken.mockReturnValue('hashed-token');
    authRepository.createEmailVerificationToken.mockResolvedValue({} as any);
    emailService.sendVerificationEmail.mockResolvedValue(undefined);

    await useCase.execute(dto);

    expect(authRepository.createAuthProvider).toHaveBeenCalledWith({
      userId: 'user-1',
      provider: Provider.EMAIL,
      passwordHash: 'hashed-password',
    });
  });

  it('should store a hashed verification token with a 24-hour expiry', async () => {
    authRepository.findUserByEmail.mockResolvedValue(null);
    passwordService.hash.mockResolvedValue('hashed-password');
    authRepository.createUser.mockResolvedValue({
      id: 'user-1',
      email: dto.email,
    } as any);
    authRepository.createAuthProvider.mockResolvedValue({} as any);
    tokenService.generateVerificationToken.mockReturnValue('raw-token');
    tokenService.hashToken.mockReturnValue('hashed-token');
    authRepository.createEmailVerificationToken.mockResolvedValue({} as any);
    emailService.sendVerificationEmail.mockResolvedValue(undefined);

    const before = Date.now();
    await useCase.execute(dto);
    const after = Date.now();

    expect(tokenService.hashToken).toHaveBeenCalledWith('raw-token');
    expect(authRepository.createEmailVerificationToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        tokenHash: 'hashed-token',
        expiresAt: expect.any(Date),
      }),
    );

    const tokenCall =
      authRepository.createEmailVerificationToken.mock.calls[0][0];
    const expiry = tokenCall.expiresAt.getTime();

    expect(expiry).toBeGreaterThanOrEqual(before + 24 * 60 * 60 * 1000);
    expect(expiry).toBeLessThanOrEqual(after + 24 * 60 * 60 * 1000);
  });

  it('should email the raw verification token and return a success message', async () => {
    authRepository.findUserByEmail.mockResolvedValue(null);
    passwordService.hash.mockResolvedValue('hashed-password');
    authRepository.createUser.mockResolvedValue({
      id: 'user-1',
      email: dto.email,
    } as any);
    authRepository.createAuthProvider.mockResolvedValue({} as any);
    tokenService.generateVerificationToken.mockReturnValue('raw-token');
    tokenService.hashToken.mockReturnValue('hashed-token');
    authRepository.createEmailVerificationToken.mockResolvedValue({} as any);
    emailService.sendVerificationEmail.mockResolvedValue(undefined);

    const result = await useCase.execute(dto);

    expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
      dto.email,
      'raw-token',
    );
    expect(result.message).toContain('Registration successful');
    expect(result.message).toContain('verify your account');
  });
});
