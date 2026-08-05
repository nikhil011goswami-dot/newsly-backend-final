import { User, UserSession } from '@prisma/client';

export interface UpdateUserData {
  fullName?:         string;
  username?:         string;
  bio?:              string;
  preferredLanguage?: string;
  preferredCategories?: string[];
  profileImageUrl?:  string;
  profileImageKey?:  string;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  update(id: string, data: UpdateUserData): Promise<User>;
  softDelete(id: string): Promise<void>;
  findActiveSessions(userId: string): Promise<UserSession[]>;
  revokeSession(sessionId: string, userId: string): Promise<void>;
  revokeAllSessions(userId: string): Promise<void>;
}
