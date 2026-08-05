import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Infrastructure
import { PrismaModule }    from '@infrastructure/database/prisma/prisma.module';
import { RedisModule }     from '@infrastructure/cache/redis.module';

// Repository
import { AuthRepository }  from './infrastructure/repositories/auth.repository';

// Infrastructure services
import { PasswordService }    from './infrastructure/services/password.service';
import { TokenService }       from './infrastructure/services/token.service';
import { EmailService }       from './infrastructure/services/email.service';
import { GoogleAuthService }  from './infrastructure/services/google-auth.service';
import { AppleAuthService }   from './infrastructure/services/apple-auth.service';
import { JwtStrategy }        from './infrastructure/services/jwt-strategy';

// Presentation
import { JwtAuthGuard }   from './presentation/guards/jwt-auth.guard';
import { RolesGuard }     from './presentation/guards/roles.guard';
import { AuthController } from './presentation/controllers/auth.controller';

// Use-cases
import { RegisterUseCase }       from './application/use-cases/register.use-case';
import { VerifyEmailUseCase }    from './application/use-cases/verify-email.use-case';
import { LoginUseCase }          from './application/use-cases/login.use-case';
import { GoogleAuthUseCase }     from './application/use-cases/google-auth.use-case';
import { AppleAuthUseCase }      from './application/use-cases/apple-auth.use-case';
import { RefreshTokenUseCase }   from './application/use-cases/refresh-token.use-case';
import { ForgotPasswordUseCase } from './application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase }  from './application/use-cases/reset-password.use-case';
import { LogoutUseCase }         from './application/use-cases/logout.use-case';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports:    [ConfigModule],
      inject:     [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:     config.get<string>('jwt.accessSecret'),
        signOptions: {
          expiresIn: config.get<string>('jwt.accessExpiresIn', '15m'),
          issuer:    'newsly-api',
          audience:  'newsly-app',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Repository
    AuthRepository,

    // Infrastructure services
    PasswordService,
    TokenService,
    EmailService,
    GoogleAuthService,
    AppleAuthService,
    JwtStrategy,

    // Guards (exported so other modules can apply them)
    JwtAuthGuard,
    RolesGuard,

    // Use-cases
    RegisterUseCase,
    VerifyEmailUseCase,
    LoginUseCase,
    GoogleAuthUseCase,
    AppleAuthUseCase,
    RefreshTokenUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    LogoutUseCase,
  ],
  exports: [
    JwtAuthGuard,
    RolesGuard,
    JwtModule,
    TokenService,
    PasswordService,
  ],
})
export class AuthModule {}
