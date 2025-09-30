import { Router } from 'express';
import asyncHandler from '../middlewares/asyncHandler.js';
import { login as loginService, refresh as refreshService } from '../services/authService.js';
import { ApiError } from '../middlewares/errorHandlers.js';

const router = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Kullanıcı girişi yapar ve access token döner
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Başarılı giriş
 */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new ApiError(400, 'E-posta ve şifre zorunludur');
    }
    const result = await loginService(email, password);

    res
      .cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7
      })
      .json({
        accessToken: result.accessToken,
        user: {
          id: result.user.id,
          role: result.user.role,
          name: result.user.name,
          email: result.user.email
        }
      });
  })
);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh token ile yeni access token üretir
 *     tags:
 *       - Auth
 */
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken ?? req.body.refreshToken;
    if (!refreshToken) {
      throw new ApiError(401, 'Yenileme jetonu bulunamadı');
    }

    const tokens = await refreshService(refreshToken);

    res
      .cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7
      })
      .json({ accessToken: tokens.accessToken });
  })
);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Oturumu kapatır
 *     tags:
 *       - Auth
 */
router.post(
  '/logout',
  asyncHandler(async (_req, res) => {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax'
    });
    res.json({ message: 'Oturum kapatıldı' });
  })
);

export default router;
