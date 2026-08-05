import { Injectable } from '@nestjs/common';
import {
  Provider,
  User,
  AuthProvider,
  UserSession,
  RefreshToken,
  EmailVerificationToken,
  PasswordResetToken,
} from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import {
  IAuthRepository,
  CreateUserData,
  CreateAuthProviderData,
  CreateSessionData,
  CreateRefreshTokenData,
  CreateEmailVerificationTokenData,
  CreatePasswordResetTokenData,
  SessionWithUser,
} from '../../domain/interfaces/auth-repository.interface';

@Injectable()
export class AuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── USERS ──────────────────────────────────────────────────────────────────

  findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  createUser(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { isEmailVerified: true } });
  }

  // ── AUTH PROVIDERS ─────────────────────────────────────────────────────────

  findAuthProvider(userId: string, provider: Provider): Promise<AuthProvider | null> {
    return this.prisma.authProvider.findUnique({
      where: { userId_provider: { userId, provider } },
    });
  }

  findAuthProviderByProviderUserId(provider: Provider, providerUserId: string): Promise<AuthProvider | null> {
    return this.prisma.authProvider.findUnique({
      where: { provider_providerUserId: { provider, providerUserId } },
    });
  }

  createAuthProvider(data: CreateAuthProviderData): Promise<AuthProvider> {
    return this.prisma.authProvider.create({ data });
  }

  async updateAuthProviderPassword(userId: string, newPasswordHash: string): Promise<void> {
    await this.prisma.authProvider.update({
      where: { userId_provider: { userId, provider: Provider.EMAIL } },
      data:  { passwordHash: newPasswordHash },
    });
  }

  // ── SESSIONS ───────────────────────────────────────────────────────────────

  createSession(data: CreateSessionData): Promise<UserSession> {
    return this.prisma.userSession.create({ data });
  }

  findSessionWithUser(sessionId: string): Promise<SessionWithUser | null> {
    return this.prisma.userSession.findUnique({
      where:   { id: sessionId },
      include: { user: true },
    });
  }

  async deactivateSession(sessionId: string): Promise<void> {
    await this.prisma.userSession.update({ where: { id: sessionId }, data: { isActive: false } });
  }

  async deactivateAllUserSessions(userId: string): Promise<void> {
    await this.prisma.userSession.updateMany({ where: { userId, isActive: true }, data: { isActive: false } });
  }

  // ── REFRESH TOKENS ─────────────────────────────────────────────────────────

  createRefreshToken(data: CreateRefreshTokenData): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({ data });
  }

  findRefreshToken(tokenHash: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  async revokeRefreshToken(id: string): Promise<void> {
    await this.prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
  }

  async revokeAllSessionRefreshTokens(sessionId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({ where: { sessionId, revokedAt: null }, data: { revokedAt: new Date() } });
  }

  // ── EMAIL VERIFICATION TOKENS ──────────────────────────────────────────────

  createEmailVerificationToken(data: CreateEmailVerificationTokenData): Promise<EmailVerificationToken> {
    return this.prisma.emailVerificationToken.create({ data });
  }

  findEmailVerificationToken(tokenHash: string): Promise<EmailVerificationToken | null> {
    return this.prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
  }

  async markEmailVerificationTokenUsed(id: string): Promise<void> {
    await this.prisma.emailVerificationToken.update({ where: { id }, data: { usedAt: new Date() } });
  }

  // ── PASSWORD RESET TOKENS ──────────────────────────────────────────────────

  createPasswordResetToken(data: CreatePasswordResetTokenData): Promise<PasswordResetToken> {
    return this.prisma.passwordResetToken.create({ data });
  }

  findPasswordResetToken(tokenHash: string): Promise<PasswordResetToken | null> {
    return this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  }

  async markPasswordResetTokenUsed(id: string): Promise<void> {
    await this.prisma.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } });
  }
}
