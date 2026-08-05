import {
  User,
  AuthProvider,
  UserSession,
  RefreshToken,
  EmailVerificationToken,
  PasswordResetToken,
  Provider,
} from '@prisma/client';

// ── Data-transfer types ───────────────────────────────────────────────────────

export interface CreateUserData {
  email: string;
  fullName?: string;
  username?: string;
  profileImageUrl?: string;
  isEmailVerified?: boolean;
  preferredLanguage?: string;
}

export interface CreateAuthProviderData {
  userId: string;
  provider: Provider;
  providerUserId?: string;
  passwordHash?: string;
}

export interface CreateSessionData {
  userId: string;
  deviceId?: string;
  deviceName?: string;
  platform?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface CreateRefreshTokenData {
  sessionId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface CreateEmailVerificationTokenData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface CreatePasswordResetTokenData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

/** UserSession joined with its User — returned by findSessionWithUser(). */
export interface SessionWithUser extends UserSession {
  user: User;
}

// ── Repository contract ───────────────────────────────────────────────────────

export interface IAuthRepository {
  // Users
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  createUser(data: CreateUserData): Promise<User>;
  updateLastLogin(userId: string): Promise<void>;
  markEmailVerified(userId: string): Promise<void>;

  // Auth providers
  findAuthProvider(userId: string, provider: Provider): Promise<AuthProvider | null>;
  findAuthProviderByProviderUserId(provider: Provider, providerUserId: string): Promise<AuthProvider | null>;
  createAuthProvider(data: CreateAuthProviderData): Promise<AuthProvider>;
  updateAuthProviderPassword(userId: string, newPasswordHash: string): Promise<void>;

  // Sessions
  createSession(data: CreateSessionData): Promise<UserSession>;
  findSessionWithUser(sessionId: string): Promise<SessionWithUser | null>;
  deactivateSession(sessionId: string): Promise<void>;
  deactivateAllUserSessions(userId: string): Promise<void>;

  // Refresh tokens
  createRefreshToken(data: CreateRefreshTokenData): Promise<RefreshToken>;
  findRefreshToken(tokenHash: string): Promise<RefreshToken | null>;
  revokeRefreshToken(id: string): Promise<void>;
  revokeAllSessionRefreshTokens(sessionId: string): Promise<void>;

  // Email verification tokens
  createEmailVerificationToken(data: CreateEmailVerificationTokenData): Promise<EmailVerificationToken>;
  findEmailVerificationToken(tokenHash: string): Promise<EmailVerificationToken | null>;
  markEmailVerificationTokenUsed(id: string): Promise<void>;

  // Password reset tokens
  createPasswordResetToken(data: CreatePasswordResetTokenData): Promise<PasswordResetToken>;
  findPasswordResetToken(tokenHash: string): Promise<PasswordResetToken | null>;
  markPasswordResetTokenUsed(id: string): Promise<void>;
}

export const AUTH_REPOSITORY = Symbol('IAuthRepository');
