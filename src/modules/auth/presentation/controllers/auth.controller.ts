import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Ip, Post, Query, Headers, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { Public }       from '@common/decorators/public.decorator';
import { CurrentUser }  from '@common/decorators/current-user.decorator';
import { RequestUser }  from '@common/types';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

import { LoginDto }          from '../../application/dto/login.dto';
import { RegisterDto }       from '../../application/dto/register.dto';
import { RefreshTokenDto }   from '../../application/dto/refresh-token.dto';
import { GoogleAuthDto }     from '../../application/dto/google-auth.dto';
import { AppleAuthDto }      from '../../application/dto/apple-auth.dto';
import { ForgotPasswordDto } from '../../application/dto/forgot-password.dto';
import { ResetPasswordDto }  from '../../application/dto/reset-password.dto';

import { LoginUseCase }          from '../../application/use-cases/login.use-case';
import { RegisterUseCase }       from '../../application/use-cases/register.use-case';
import { VerifyEmailUseCase }    from '../../application/use-cases/verify-email.use-case';
import { GoogleAuthUseCase }     from '../../application/use-cases/google-auth.use-case';
import { AppleAuthUseCase }      from '../../application/use-cases/apple-auth.use-case';
import { RefreshTokenUseCase }   from '../../application/use-cases/refresh-token.use-case';
import { ForgotPasswordUseCase } from '../../application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase }  from '../../application/use-cases/reset-password.use-case';
import { LogoutUseCase }         from '../../application/use-cases/logout.use-case';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly loginUseCase:          LoginUseCase,
    private readonly registerUseCase:       RegisterUseCase,
    private readonly verifyEmailUseCase:    VerifyEmailUseCase,
    private readonly googleAuthUseCase:     GoogleAuthUseCase,
    private readonly appleAuthUseCase:      AppleAuthUseCase,
    private readonly refreshTokenUseCase:   RefreshTokenUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase:  ResetPasswordUseCase,
    private readonly logoutUseCase:         LogoutUseCase,
  ) {}

  // ── Registration & email verification ──────────────────────────────────────

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Register with email and password' })
  @ApiResponse({ status: 201, description: 'Verification email sent' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  register(@Body() dto: RegisterDto) {
    return this.registerUseCase.execute(dto);
  }

  @Get('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email via token from link' })
  verifyEmail(@Query('token') token: string) {
    return this.verifyEmailUseCase.execute(token);
  }

  // ── Email / password login ─────────────────────────────────────────────────

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Tokens + user profile' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Email not verified or account suspended' })
  login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.loginUseCase.execute(dto, ip, userAgent);
  }

  // ── Social login ───────────────────────────────────────────────────────────

  @Post('google')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login or register with Google ID token' })
  googleAuth(@Body() dto: GoogleAuthDto, @Ip() ip: string) {
    return this.googleAuthUseCase.execute(dto, ip);
  }

  @Post('apple')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login or register with Apple identity token' })
  appleAuth(@Body() dto: AppleAuthDto, @Ip() ip: string) {
    return this.appleAuthUseCase.execute(dto, ip);
  }

  // ── Token management ───────────────────────────────────────────────────────

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Rotate refresh token → new access token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.refreshTokenUseCase.execute(dto.refreshToken);
  }

  // ── Password management ────────────────────────────────────────────────────

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 3, ttl: 300000 } })
  @ApiOperation({ summary: 'Request password reset link (sent by email)' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.forgotPasswordUseCase.execute(dto.email);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Reset password using token from email link' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.resetPasswordUseCase.execute(dto.token, dto.newPassword);
  }

  // ── Logout ─────────────────────────────────────────────────────────────────

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout current device' })
  logout(@CurrentUser() user: RequestUser) {
    return this.logoutUseCase.executeCurrentDevice(user.sessionId, user.id);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout all devices' })
  logoutAll(@CurrentUser() user: RequestUser) {
    return this.logoutUseCase.executeAllDevices(user.id);
  }
}
