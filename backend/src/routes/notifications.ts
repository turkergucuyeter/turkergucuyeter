import { Router } from 'express';
import { prisma } from '../config/prisma';

export const notificationRouter = Router();

notificationRouter.get('/', async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ message: 'notification.list_success', data: notifications });
});

notificationRouter.post('/mark-read/:id', async (req, res) => {
  const id = Number(req.params.id);
  const notification = await prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  }).catch(() => null);
  if (!notification || notification.userId !== req.user!.id) {
    return res.status(404).json({ message: 'notification.not_found' });
  }
  res.json({ message: 'notification.marked', data: notification });
});

notificationRouter.post('/test', async (req, res) => {
  const notification = await prisma.notification.create({
    data: {
      userId: req.user!.id,
      channel: 'inapp',
      title: 'notification.test.title',
      body: 'notification.test.body',
    },
  });
  res.json({ message: 'notification.test_created', data: notification });
});
