import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import prisma from '../services/prisma.js';
import env from '../config/env.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /push/public-key:
 *   get:
 *     summary: Web push için VAPID public key döndürür
 *     tags:
 *       - Push
 */
router.get(
  '/public-key',
  asyncHandler(async (_req, res) => {
    res.json({ publicKey: env.VAPID_PUBLIC_KEY ?? null });
  })
);

/**
 * @openapi
 * /push/subscribe:
 *   post:
 *     summary: Web push aboneliğini kaydeder
 *     tags:
 *       - Push
 */
router.post(
  '/subscribe',
  asyncHandler(async (req, res) => {
    const subscription = req.body;
    if (!subscription?.endpoint || !subscription?.keys) {
      return res.status(400).json({ message: 'Geçersiz abonelik' });
    }

    await prisma.webPushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userId: req.user!.id
      },
      create: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userId: req.user!.id
      }
    });

    res.json({ message: 'Abonelik kaydedildi' });
  })
);

export default router;
