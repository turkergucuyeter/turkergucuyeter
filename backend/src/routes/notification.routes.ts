import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import notificationService from '../services/notificationService.js';
import { ApiError } from '../middlewares/errorHandlers.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /notifications:
 *   get:
 *     summary: Kullanıcı bildirimlerini listeler
 *     tags:
 *       - Notifications
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const notifications = await notificationService.listForUser(req.user!.id);
    res.json(notifications);
  })
);

/**
 * @openapi
 * /notifications/{id}/read:
 *   post:
 *     summary: Bildirimi okundu olarak işaretler
 *     tags:
 *       - Notifications
 */
router.post(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!id) {
      throw new ApiError(400, 'Geçersiz bildirim');
    }

    await notificationService.markAsRead(id, req.user!.id);
    res.json({ message: 'Bildirim okundu' });
  })
);

export default router;
