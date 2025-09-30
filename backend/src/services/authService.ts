import prisma from './prisma.js';
import bcrypt from 'bcryptjs';
import { ApiError } from '../middlewares/errorHandlers.js';
import { createAccessToken, createRefreshToken, verifyRefreshToken } from '../utils/token.js';
import { Role } from '@prisma/client';

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email }, include: { teacher: true, student: true } });
  if (!user || !user.isActive) {
    throw new ApiError(401, 'E-posta veya şifre hatalı');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, 'E-posta veya şifre hatalı');
  }

  const payload = {
    sub: user.id,
    role: user.role,
    name: user.name,
    email: user.email
  };

  return {
    accessToken: createAccessToken(payload),
    refreshToken: createRefreshToken(payload),
    user
  };
};

export const refresh = async (token: string) => {
  try {
    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new ApiError(401, 'Kullanıcı bulunamadı');
    }

    const newPayload = {
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email
    };

    return {
      accessToken: createAccessToken(newPayload),
      refreshToken: createRefreshToken(newPayload)
    };
  } catch (error) {
    throw new ApiError(401, 'Oturum yenileme başarısız');
  }
};

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const ensureRole = (role: Role, allowed: Role[]) => {
  if (!allowed.includes(role)) {
    throw new ApiError(403, 'Bu işlem için izniniz yok');
  }
};
