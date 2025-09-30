import prisma from './prisma.js';
import { NotificationChannel } from '@prisma/client';

class NotificationService {
  async createNotification(userId: number, channel: NotificationChannel, title: string, body: string) {
    return prisma.notification.create({
      data: {
        userId,
        channel,
        title,
        body
      }
    });
  }

  async markAsRead(id: number, userId: number) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() }
    });
  }

  async listForUser(userId: number) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }
}

const notificationService = new NotificationService();

export default notificationService;
