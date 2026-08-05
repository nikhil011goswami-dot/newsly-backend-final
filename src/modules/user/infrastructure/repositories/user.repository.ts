import { Injectable, ForbiddenException } from '@nestjs/common';
import { User, UserSession, UserStatus } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { IUserRepository, UpdateUserData } from '../../domain/interfaces/user-repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  update(id: string, data: UpdateUserData): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data:  {
        ...data,
        preferredCategories: data.preferredCategories as any,
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        status:    UserStatus.DELETED,
        deletedAt: new Date(),
        email:     `deleted_${id}@newsly.deleted`,
      },
    });
  }

  findActiveSessions(userId: string): Promise<UserSession[]> {
    return this.prisma.userSession.findMany({
      where:   { userId, isActive: true },
      orderBy: { lastSeenAt: 'desc' },
    });
  }

  async revokeSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.prisma.userSession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
      throw new ForbiddenException('Session not found or does not belong to you');
    }
    await this.prisma.userSession.update({
      where: { id: sessionId },
      data:  { isActive: false },
    });
    await this.prisma.refreshToken.updateMany({
      where: { sessionId, revokedAt: null },
      data:  { revokedAt: new Date() },
    });
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: { userId, isActive: true },
      data:  { isActive: false },
    });
    const sessions = await this.prisma.userSession.findMany({ where: { userId }, select: { id: true } });
    const sessionIds = sessions.map((s) => s.id);
    if (sessionIds.length > 0) {
      await this.prisma.refreshToken.updateMany({
        where: { sessionId: { in: sessionIds }, revokedAt: null },
        data:  { revokedAt: new Date() },
      });
    }
  }
}
