import { User, UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: UserRole;
        name: string;
      };
      refreshTokenId?: string;
    }
  }
}

export {};
