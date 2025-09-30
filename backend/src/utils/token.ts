import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import env from '../config/env.js';
import { Role } from '@prisma/client';

export const createAccessToken = (payload: { sub: number; role: Role; name: string; email: string }) => {
  const secret: Secret = env.JWT_ACCESS_SECRET;
  const options: SignOptions = {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as unknown as SignOptions['expiresIn']
  };
  return jwt.sign(payload, secret, options);
};

export const createRefreshToken = (payload: { sub: number; role: Role; name: string; email: string }) => {
  const secret: Secret = env.JWT_REFRESH_SECRET;
  const options: SignOptions = {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as unknown as SignOptions['expiresIn']
  };
  return jwt.sign(payload, secret, options);
};

export const verifyRefreshToken = (token: string) => {
  const secret: Secret = env.JWT_REFRESH_SECRET;
  const decoded = jwt.verify(token, secret) as JwtPayload;
  if (!decoded || typeof decoded !== 'object' || !decoded.sub) {
    throw new Error('Geçersiz refresh token');
  }

  return {
    sub: Number(decoded.sub),
    role: decoded.role as Role,
    name: decoded.name as string,
    email: decoded.email as string
  };
};
