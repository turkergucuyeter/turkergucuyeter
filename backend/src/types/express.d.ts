import '@types/express';
import { Role } from '@prisma/client';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: number;
      role: Role;
      name: string;
      email: string;
    };
  }
}
