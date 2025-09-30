import jwt from 'jsonwebtoken';
import { env } from '../config/env';

type AccessPayload = {
  sub: number;
  role: string;
  name: string;
};

type RefreshPayload = {
  sub: number;
  tokenId: string;
};

export const createAccessToken = (payload: AccessPayload) =>
  jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: `${env.accessTokenTtlMinutes}m`,
  });

export const createRefreshToken = (payload: RefreshPayload) =>
  jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: `${env.refreshTokenTtlDays}d`,
  });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.jwtAccessSecret) as unknown as AccessPayload & {
    iat: number;
    exp: number;
  };

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.jwtRefreshSecret) as unknown as RefreshPayload & {
    iat: number;
    exp: number;
  };
