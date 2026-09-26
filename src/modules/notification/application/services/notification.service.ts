import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationRepository } from '../../infrastructure/repositories/notification.repository';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async getNotifications(
    userId: string,
    limit = 20,
    offset = 0,
  ) {
    const [notifications, unreadCount] = await Promise.all([
      this.notificationRepository.findByUser(userId, limit, offset),
      this.notificationRepository.countUnread(userId),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        limit,
        offset,
        count: notifications.length,
      },
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationRepository.countUnread(userId);

    return { unreadCount: count };
  }

  async markAsRead(id: string, userId: string) {
    const result = await this.notificationRepository.markAsRead(id, userId);

    if (result.count === 0) {
      throw new NotFoundException('Notification not found');
    }

    return {
      message: 'Notification marked as read.',
    };
  }

  async markAllAsRead(userId: string) {
    const count = await this.notificationRepository.markAllAsRead(userId);

    return {
      message: 'All notifications marked as read.',
      updatedCount: count,
    };
  }
}
