import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { createAccessToken, createRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { env } from '../config/env';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

authRouter.post('/login', async (req, res) => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'auth.errors.invalid_payload', issues: parseResult.error.flatten() });
  }

  const { email, password } = parseResult.data;
  const user = await prisma.user.findUnique({ where: { email }, include: { teacher: true } });
  if (!user || !user.isActive) {
    return res.status(401).json({ message: 'auth.errors.invalid_credentials' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: 'auth.errors.invalid_credentials' });
  }

  const accessToken = createAccessToken({ sub: user.id, role: user.role, name: user.name });
  const refreshTokenId = `${user.id}-${Date.now()}`;
  const refreshToken = createRefreshToken({ sub: user.id, tokenId: refreshTokenId });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: env.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
  });

  return res.json({
    message: 'auth.success.logged_in',
    data: {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        teacherColor: user.teacher?.displayColor ?? null,
      },
    },
  });
});

authRouter.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return res.status(401).json({ message: 'auth.errors.invalid_token' });
  }

  try {
    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, include: { teacher: true } });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'auth.errors.invalid_token' });
    }

    const accessToken = createAccessToken({ sub: user.id, role: user.role, name: user.name });
    return res.json({
      message: 'auth.success.token_refreshed',
      data: {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          teacherColor: user.teacher?.displayColor ?? null,
        },
      },
    });
  } catch (error) {
    return res.status(401).json({ message: 'auth.errors.invalid_token' });
  }
});

authRouter.post('/logout', (_req, res) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'auth.success.logged_out' });
});
