import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { Role } from "@prisma/client";

export interface JwtPayload {
  sub: string;
  role: Role;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "auth.errors.missingToken" });
  }

  const [, token] = authHeader.split(" ");
  if (!token) {
    return res.status(401).json({ message: "auth.errors.invalidToken" });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch (error) {
    return res.status(401).json({ message: "auth.errors.invalidToken" });
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "auth.errors.missingToken" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "auth.errors.unauthorized" });
    }

    return next();
  };
};
