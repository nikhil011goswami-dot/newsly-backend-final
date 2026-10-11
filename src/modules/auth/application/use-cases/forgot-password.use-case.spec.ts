import { ForgotPasswordUseCase } from './forgot-password.use-case';
import { AuthRepository } from '../../infrastructure/repositories/auth.repository';
import { TokenService } from '../../infrastructure/services/token.service';
import { EmailService } from '../../infrastructure/services/email.service';

describe('ForgotPasswordUseCase', () => {
  let useCase: ForgotPasswordUseCase;
  let authRepository: jest.Mocked<AuthRepository>;
  let tokenService: jest.Mocked<TokenService>;
  let emailService: jest.Mocked<EmailService>;

  const genericMessage = {
    message:
      'If an account with that email exists, a password reset link has been sent.',
  };

  beforeEach(() => {
    authRepository = {
      findUserByEmail: jest.fn(),
      createPasswordResetToken: jest.fn(),
    } as any;

    tokenService = {
      generateVerificationToken: jest.fn().mockReturnValue('raw-reset-token'),
      hashToken: jest.fn().mockReturnValue('hashed-reset-token'),
    } as any;

    emailService = {
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    } as any;

    useCase = new ForgotPasswordUseCase(
      authRepository,
      tokenService,
      emailService,
    );
  });

  it('should return the generic response when the email does not exist', async () => {
    authRepository.findUserByEmail.mockResolvedValue(null as any);

    await expect(useCase.execute('unknown@example.com')).resolves.toEqual(
      genericMessage,
    );

    expect(authRepository.createPasswordResetToken).not.toHaveBeenCalled();
    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('should not create a token or send email for an unverified user', async () => {
    authRepository.findUserByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'unverified@example.com',
      isEmailVerified: false,
    } as any);

    await expect(
      useCase.execute('unverified@example.com'),
    ).resolves.toEqual(genericMessage);

    expect(tokenService.generateVerificationToken).not.toHaveBeenCalled();
    expect(authRepository.createPasswordResetToken).not.toHaveBeenCalled();
    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('should generate a reset token for a verified user', async () => {
    authRepository.findUserByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'verified@example.com',
      isEmailVerified: true,
    } as any);

    await useCase.execute('verified@example.com');

    expect(tokenService.generateVerificationToken).toHaveBeenCalledTimes(1);
    expect(tokenService.hashToken).toHaveBeenCalledWith('raw-reset-token');
  });

  it('should save the hashed token with a one-hour expiry', async () => {
    authRepository.findUserByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'verified@example.com',
      isEmailVerified: true,
    } as any);

    const before = Date.now();
    await useCase.execute('verified@example.com');
    const after = Date.now();

    expect(authRepository.createPasswordResetToken).toHaveBeenCalledTimes(1);

    const savedToken =
      authRepository.createPasswordResetToken.mock.calls[0][0];

    expect(savedToken.userId).toBe('user-1');
    expect(savedToken.tokenHash).toBe('hashed-reset-token');
    expect(savedToken.expiresAt.getTime()).toBeGreaterThanOrEqual(
      before + 60 * 60 * 1000,
    );
    expect(savedToken.expiresAt.getTime()).toBeLessThanOrEqual(
      after + 60 * 60 * 1000,
    );
  });

  it('should send the reset email with the raw token', async () => {
    authRepository.findUserByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'verified@example.com',
      isEmailVerified: true,
    } as any);

    await useCase.execute('verified@example.com');

    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      'verified@example.com',
      'raw-reset-token',
    );
  });

  it('should return the same generic response after a successful request', async () => {
    authRepository.findUserByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'verified@example.com',
      isEmailVerified: true,
    } as any);

    await expect(useCase.execute('verified@example.com')).resolves.toEqual(
      genericMessage,
    );
  });
});
