import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(
    userId: string,
    limit = 20,
    offset = 0,
  ) {
    return this.prisma.userNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.userNotification.count({
      where: {
        userId,
        readAt: null,
      },
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.userNotification.updateMany({
      where: {
        id,
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.userNotification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return result.count;
  }
}
