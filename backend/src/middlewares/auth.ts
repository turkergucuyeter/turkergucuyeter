import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload as DefaultJwtPayload, Secret } from 'jsonwebtoken';
import env from '../config/env.js';
import { ApiError } from './errorHandlers.js';
import { Role } from '@prisma/client';

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Yetkilendirme gerekiyor'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret: Secret = env.JWT_ACCESS_SECRET;
    const decoded = jwt.verify(token, secret) as DefaultJwtPayload;
    if (!decoded || typeof decoded !== 'object' || !decoded.sub) {
      throw new Error('Kimlik doğrulama başarısız');
    }
    const payload = decoded as DefaultJwtPayload & {
      sub: number;
      role: Role;
      name: string;
      email: string;
    };
    req.user = {
      id: payload.sub,
      role: payload.role,
      name: payload.name,
      email: payload.email
    };
    return next();
  } catch (error) {
    return next(new ApiError(401, 'Oturum geçersiz veya süresi dolmuş'));
  }
};

export const requireRole = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Yetkilendirme gerekiyor'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Bu işlemi yapmak için izniniz yok'));
    }
    return next();
  };
};
