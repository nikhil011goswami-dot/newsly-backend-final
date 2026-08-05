import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { Provider } from '@prisma/client';
import { addHours } from 'date-fns';
import { AuthRepository } from '../../infrastructure/repositories/auth.repository';
import { PasswordService } from '../../infrastructure/services/password.service';
import { TokenService } from '../../infrastructure/services/token.service';
import { EmailService } from '../../infrastructure/services/email.service';
import { RegisterDto } from '../dto/register.dto';

@Injectable()
export class RegisterUseCase {
  private readonly logger = new Logger(RegisterUseCase.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
  ) {}

  async execute(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.authRepository.findUserByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await this.passwordService.hash(dto.password);

    const user = await this.authRepository.createUser({
      email: dto.email,
      fullName: dto.fullName,
      username: dto.username,
      isEmailVerified: false,
    });

    await this.authRepository.createAuthProvider({
      userId: user.id,
      provider: Provider.EMAIL,
      passwordHash,
    });

    const rawToken  = this.tokenService.generateVerificationToken();
    const tokenHash = this.tokenService.hashToken(rawToken);

    await this.authRepository.createEmailVerificationToken({
      userId: user.id,
      tokenHash,
      expiresAt: addHours(new Date(), 24),
    });

    await this.emailService.sendVerificationEmail(user.email, rawToken);

    this.logger.log(`New user registered: ${user.email}`);
    return { message: 'Registration successful. Please check your email to verify your account.' };
  }
}
