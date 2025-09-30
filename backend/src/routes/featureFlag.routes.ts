import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import prisma from '../services/prisma.js';
import auditService from '../services/auditService.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /feature-flags:
 *   get:
 *     summary: Tüm feature flag değerlerini listeler
 *     tags:
 *       - FeatureFlags
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const flags = await prisma.featureFlag.findMany();
    res.json(flags);
  })
);

/**
 * @openapi
 * /feature-flags/{key}:
 *   put:
 *     summary: Feature flag değerini günceller
 *     tags:
 *       - FeatureFlags
 */
router.put(
  '/:key',
  requireRole('supervisor'),
  asyncHandler(async (req, res) => {
    const key = req.params.key as string;
    const value = req.body ?? {};

    const flag = await prisma.featureFlag.upsert({
      where: { key },
      update: { valueJson: JSON.stringify(value) },
      create: { key, valueJson: JSON.stringify(value) }
    });

    await auditService.log({
      userId: req.user!.id,
      action: 'feature_flag_update',
      entity: 'feature_flag',
      entityId: 0,
      meta: { key, value }
    });

    res.json(flag);
  })
);

export default router;
