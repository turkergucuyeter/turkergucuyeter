import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'auth.errors.unauthorized' });
  }

  const [, token] = authHeader.split(' ');
  if (!token) {
    return res.status(401).json({ message: 'auth.errors.invalid_token' });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      role: payload.role as any,
      name: payload.name,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'auth.errors.invalid_token' });
  }
};

export const authorize = (roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'auth.errors.forbidden' });
    }
    return next();
  };
